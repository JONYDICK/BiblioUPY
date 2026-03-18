import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { z } from "zod";
import { db } from "./db";
import {
  users, resources, files, categories, careers, favorites, downloads,
  ratings, forumCategories, forumThreads, forumPosts, forumVotes,
  notifications, searchIndex, resourceViews, roles, userRoles
} from "../../shared/schema";
import { 
  loginSchema, insertUserSchema, insertResourceSchema, 
  insertThreadSchema, insertPostSchema, searchSchema 
} from "../../shared/schema";
import { eq, and, or, like, desc, asc, sql, ilike } from "drizzle-orm";
import {
  passport, configureSession, isAuthenticated, hasRole, hasPermission,
  createUser, getUserByEmail, updateLastLogin, logAudit,
  generateMfaSecret, generateMfaQrCode, verifyMfaToken,
  enableMfa, disableMfa, seedDefaultRoles
} from "./auth";
import type { UserWithRoles } from "./types/user";
import { 
  upload, saveFileRecord, serveSecureFile, handleUploadError, 
  getFileById, deleteFile, ensureUploadDir 
} from "./upload";
import { 
  authLimiter, registerLimiter, uploadLimiter, forumLimiter, 
  searchLimiter, passwordResetLimiter 
} from "./middleware/rateLimit";
import { sanitizeHtml, sanitizeText, sanitizeTextWithLimit, sanitizeEmail } from "./utils/sanitize";

// Slug generator
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200) + "-" + Date.now().toString(36);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Configure session and passport
  configureSession(app);

  // Ensure upload directory exists
  await ensureUploadDir();

  // Seed default roles (non-fatal if DB tables don't exist yet)
  try {
    await seedDefaultRoles();
  } catch (err) {
    console.warn("[startup] Warning: No se pudieron inicializar roles:", err instanceof Error ? err.message : String(err));
    console.warn("[startup] La app continuará sin roles predeterminados. Ejecute las migraciones de BD.");
  }

  // Auto-cleanup: delete unverified accounts older than 5 minutes
  const CLEANUP_INTERVAL = 60 * 1000; // check every minute
  const MAX_UNVERIFIED_AGE = 5 * 60 * 1000; // 5 minutes
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - MAX_UNVERIFIED_AGE);
      const expired = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(and(eq(users.isVerified, false), sql`${users.createdAt} < ${cutoff}`));
      
      for (const user of expired) {
        // Delete related records first, then the user
        await db.delete(userRoles).where(eq(userRoles.userId, user.id));
        await db.delete(users).where(eq(users.id, user.id));
        console.log(`[cleanup] Cuenta no verificada eliminada: ${user.email} (>5 min sin MFA)`);
      }
    } catch (err) {
      // Silent fail — don't crash the server for cleanup
    }
  }, CLEANUP_INTERVAL);

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================

  // Register
  app.post("/api/auth/register", registerLimiter, async (req, res) => {
    try {
      console.log("[auth] Procesando registro...");
      const input = insertUserSchema.parse(req.body);
      console.log("[auth] Entrada válida:", { email: input.email, username: input.username });

      // Check if user already exists
      const existing = await getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Check if username already exists
      const existingUsername = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username.toLowerCase()))
        .limit(1);

      if (existingUsername.length > 0) {
        return res.status(400).json({ message: "El nombre de usuario ya está registrado" });
      }

      // Validate student role exists, create if missing (self-healing)
      let studentRoleResult = await db
        .select()
        .from(roles)
        .where(eq(roles.name, "student"))
        .limit(1);

      if (studentRoleResult.length === 0) {
        console.warn("[auth] Rol 'student' no existe, creándolo automáticamente...");
        try {
          await seedDefaultRoles();
          studentRoleResult = await db.select().from(roles).where(eq(roles.name, "student")).limit(1);
        } catch (seedErr) {
          console.error("[auth] Error creando roles:", seedErr);
        }
        if (studentRoleResult.length === 0) {
          // Last resort: create just the student role
          await db.insert(roles).values({
            name: "student",
            description: "Estudiante",
            permissions: ["upload_resources", "download_resources", "create_forum_threads", "comment_forum"],
          });
          console.log("[auth] Rol 'student' creado directamente");
        }
      }

      const user = await createUser({
        email: input.email,
        username: input.username,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        studentId: input.studentId,
        career: input.career,
        avatarUrl: input.avatarUrl,
        bio: input.bio,
      });

      // Generate MFA secret and QR code (mandatory setup)
      console.log("[auth] Generando MFA para usuario:", user.id);
      const mfaSecret = generateMfaSecret();
      const mfaQrCode = await generateMfaQrCode(user.email, mfaSecret);

      // Store temporary MFA secret in session
      (req.session as any).pendingMfaSecret = mfaSecret;
      (req.session as any).pendingMfaUserId = user.id;

      // Explicitly save session to ensure cookie is sent before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("[auth] Error guardando sesión:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      await logAudit(user.id, "register", "user", user.id, null, null, req);

      console.log("[auth] ✓ Usuario registrado. Esperando confirmación de MFA...");
      res.status(201).json({
        message: "Cuenta creada. Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, etc.)",
        user: { id: user.id, email: user.email, username: user.username },
        mfaQrCode: mfaQrCode,
        mfaSecret: mfaSecret
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.errors?.[0]?.message || err.message || "Datos de registro inválidos";
        console.error("[auth] Error de validación:", firstError);
        return res.status(400).json({ message: firstError });
      }
      console.error("[auth] Error en registro:", err instanceof Error ? err.message : String(err));
      if (err instanceof Error) {
        console.error("[auth] Stack trace:", err.stack);
      }
      res.status(500).json({ message: "Error al crear la cuenta" });
    }
  });

  // Login
  app.post("/api/auth/login", authLimiter, (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.errors?.[0]?.message || err.message || "Datos de login inválidos";
        return res.status(400).json({ message: firstError });
      }
      return res.status(400).json({ message: "Error de validación" });
    }

    passport.authenticate(
      "local",
      async (err: Error | null, user: UserWithRoles | false, info: { message?: string } | undefined) => {
        if (err) {
          return res.status(500).json({ message: "Error de autenticación" });
        }
        if (!user) {
          return res.status(401).json({ message: info?.message || "Credenciales inválidas" });
        }

        // Check if MFA is required
        if (user.requiresMfa) {
          const { mfaToken } = req.body;
          if (!mfaToken) {
            return res.status(200).json({ requiresMfa: true, message: "Se requiere código MFA" });
          }

          if (!verifyMfaToken(mfaToken, user.mfaSecret || "")) {
            return res.status(401).json({ message: "Código MFA inválido" });
          }
        }

        req.logIn(user, async (loginErr) => {
          if (loginErr) {
            return res.status(500).json({ message: "Error al iniciar sesión" });
          }

          await updateLastLogin(user.id);
          await logAudit(user.id, "login", "user", user.id, null, null, req);

          res.json({
            message: "Sesión iniciada",
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              avatarUrl: user.avatarUrl,
              mfaEnabled: user.mfaEnabled,
            },
          });
        });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.id;
    
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      
      logAudit(userId, "logout", "user", userId, null, null, req);
      res.json({ message: "Sesión cerrada" });
    });
  });

  // Confirm MFA setup (required after registration)
  app.post("/api/auth/confirm-mfa", async (req, res) => {
    try {
      const { mfaToken } = req.body;

      if (!mfaToken) {
        return res.status(400).json({ message: "Código MFA requerido" });
      }

      // Get pending MFA data from session
      const pendingSecret = (req.session as any).pendingMfaSecret;
      const pendingUserId = (req.session as any).pendingMfaUserId;

      if (!pendingSecret || !pendingUserId) {
        return res.status(401).json({ message: "No hay configuración de MFA pendiente. Intenta registrarte de nuevo." });
      }

      // Verify the MFA token
      console.log("[auth] Verificando código MFA para usuario:", pendingUserId);
      const isValidToken = await verifyMfaToken(mfaToken, pendingSecret);

      if (!isValidToken) {
        console.error("[auth] Código MFA inválido para usuario:", pendingUserId);
        return res.status(401).json({ message: "Código OTP inválido. Intenta de nuevo." });
      }

      // Enable MFA in database and mark user as verified
      console.log("[auth] Habilitando MFA para usuario:", pendingUserId);
      await enableMfa(pendingUserId, pendingSecret);

      // Mark user as verified
      await db.update(users).set({ isVerified: true }).where(eq(users.id, pendingUserId));

      // Get user to log
      const [verifiedUser] = await db.select().from(users).where(eq(users.id, pendingUserId)).limit(1);

      // Log the action
      await logAudit(pendingUserId, "mfa_confirmed", "user", pendingUserId, null, null, req);

      // Clear session
      delete (req.session as any).pendingMfaSecret;
      delete (req.session as any).pendingMfaUserId;

      console.log("[auth] ✓ MFA confirmado para usuario:", verifiedUser.email);
      res.status(200).json({
        message: "¡MFA confirmado correctamente! Ya puedes iniciar sesión.",
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          username: verifiedUser.username
        }
      });
    } catch (err) {
      console.error("[auth] Error confirmando MFA:", err instanceof Error ? err.message : String(err));
      res.status(500).json({ message: "Error confirmando MFA" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", async (err: any, user: any, info: any) => {
      try {
        if (err) {
          console.error("[auth] Google OAuth error:", err);
          return res.redirect("/login?error=google_auth_failed");
        }

        if (!user) {
          console.log("[auth] Google OAuth: no user returned.", info?.message || info);
          return res.redirect("/login?error=google_auth_failed");
        }

        console.log("[auth] Usuario autenticado vía Google:", user.email);

        // Check if this is a new user requiring MFA setup
        if (user.requiresMfaSetup) {
          console.log("[auth] Nuevo usuario de Google, generando QR de MFA:", user.id);

          // Generate QR code for MFA
          const mfaQrCode = await generateMfaQrCode(user.email, user.mfaSecret);

          // Store in session for confirm-mfa endpoint
          (req.session as any).pendingMfaSecret = user.mfaSecret;
          (req.session as any).pendingMfaUserId = user.id;

          req.session.save((saveErr) => {
            if (saveErr) console.error("[auth] Error saving session:", saveErr);
            const qrEncoded = encodeURIComponent(mfaQrCode);
            const secretEncoded = encodeURIComponent(user.mfaSecret);
            res.redirect(`/?google_auth=mfa_required&userId=${user.id}&qrCode=${qrEncoded}&secret=${secretEncoded}`);
          });
        } else {
          // Existing user with MFA already set up - check if MFA is enabled
          if (user.mfaEnabled) {
            // Store userId in session for MFA verification step
            (req.session as any).pendingMfaUserId = user.id;
            (req.session as any).pendingOAuthLogin = true;
            req.session.save((saveErr) => {
              if (saveErr) console.error("[auth] Error saving session:", saveErr);
              res.redirect(`/login?google_auth=mfa_required&userId=${user.id}`);
            });
          } else {
            // No MFA, log them in directly
            req.logIn(user, async (loginErr) => {
              if (loginErr) {
                console.error("[auth] Error logging in Google user:", loginErr);
                return res.redirect("/login?error=login_failed");
              }

              await updateLastLogin(user.id);
              await logAudit(user.id, "login_oauth", "user", user.id, null, null, req);

              res.redirect("/");
            });
          }
        }
      } catch (error) {
        console.error("[auth] Error en callback de Google:", error);
        res.redirect("/login?error=callback_error");
      }
    })(req, res, next);
  });

  // Get current user
  app.get("/api/auth/me", isAuthenticated, (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bannerUrl: user.bannerUrl,
      bio: user.bio,
      studentId: user.studentId,
      career: user.career,
      mfaEnabled: user.mfaEnabled,
      roles: user.roles || [],
      permissions: user.permissions || [],
    });
  });

  // Update user profile
  app.patch("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      console.log("[auth] Actualizando perfil de usuario:", user.id);

      // Validate input
      const { updateUserProfileSchema } = await import("../../shared/schema");
      const input = updateUserProfileSchema.parse(req.body);
      console.log("[auth] Datos de perfil válidos");

      // Build update object - only include provided fields
      const updateData: any = {};
      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;
      if (input.bio !== undefined) updateData.bio = input.bio;
      if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
      if (input.bannerUrl !== undefined) updateData.bannerUrl = input.bannerUrl;
      if (input.studentId !== undefined) updateData.studentId = input.studentId;
      if (input.career !== undefined) updateData.career = input.career;
      updateData.updatedAt = new Date();

      // Update in database
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();

      // Log audit
      await logAudit(user.id, "profile_update", "user", user.id, null, updateData, req);

      console.log("[auth] ✓ Perfil actualizado para usuario:", user.id);
      res.json({
        message: "Perfil actualizado exitosamente",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          bio: updatedUser.bio,
          avatarUrl: updatedUser.avatarUrl,
          bannerUrl: updatedUser.bannerUrl,
          studentId: updatedUser.studentId,
          career: updatedUser.career,
        }
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.errors?.[0]?.message || "Datos inválidos";
        console.error("[auth] Error de validación:", firstError);
        return res.status(400).json({ message: firstError });
      }
      console.error("[auth] Error actualizando perfil:", err instanceof Error ? err.message : String(err));
      res.status(500).json({ message: "Error actualizando el perfil" });
    }
  });

  // Get user statistics
  app.get("/api/users/me/stats", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Count user's resources, views and downloads
    const [resourceStats] = await db
      .select({
        totalResources: sql<number>`count(*)::int`,
        totalViews: sql<number>`COALESCE(sum(view_count), 0)::int`,
        totalDownloads: sql<number>`COALESCE(sum(download_count), 0)::int`,
      })
      .from(resources)
      .where(eq(resources.uploadedBy, user.id));

    // Count user's favorites
    const [favoriteStats] = await db
      .select({ totalFavorites: sql<number>`count(*)::int` })
      .from(favorites)
      .where(eq(favorites.userId, user.id));

    // Get user's recent resources
    const recentResources = await db
      .select({
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        type: resources.type,
        viewCount: resources.viewCount,
        downloadCount: resources.downloadCount,
        isApproved: resources.isApproved,
        createdAt: resources.createdAt,
      })
      .from(resources)
      .where(eq(resources.uploadedBy, user.id))
      .orderBy(desc(resources.createdAt))
      .limit(5);

    res.json({
      stats: {
        totalResources: resourceStats?.totalResources || 0,
        totalViews: resourceStats?.totalViews || 0,
        totalDownloads: resourceStats?.totalDownloads || 0,
        totalFavorites: favoriteStats?.totalFavorites || 0,
      },
      recentResources,
    });
  });

  // Get user's resources (my uploads)
  app.get("/api/users/me/resources", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { page = 1, limit = 20 } = req.query;

    const userResources = await db
      .select({
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        type: resources.type,
        viewCount: resources.viewCount,
        downloadCount: resources.downloadCount,
        isApproved: resources.isApproved,
        createdAt: resources.createdAt,
        categoryName: categories.name,
        careerName: careers.name,
      })
      .from(resources)
      .leftJoin(categories, eq(resources.categoryId, categories.id))
      .leftJoin(careers, eq(resources.careerId, careers.id))
      .where(eq(resources.uploadedBy, user.id))
      .orderBy(desc(resources.createdAt))
      .limit(parseInt(limit as string))
      .offset((parseInt(page as string) - 1) * parseInt(limit as string));

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resources)
      .where(eq(resources.uploadedBy, user.id));

    res.json({ resources: userResources, total: count });
  });

  // Setup MFA
  app.post("/api/auth/mfa/setup", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    if (user.mfaEnabled) {
      return res.status(400).json({ message: "MFA ya está habilitado" });
    }

    const secret = generateMfaSecret();
    const qrCode = await generateMfaQrCode(user.email, secret);

    // Store secret temporarily (in session) until verified
    (req.session as any).mfaSecret = secret;

    res.json({ qrCode, secret });
  });

  // Verify MFA setup
  app.post("/api/auth/mfa/verify", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { token } = req.body;
    const secret = (req.session as any).mfaSecret;

    if (!secret) {
      return res.status(400).json({ message: "Primero inicia la configuración de MFA" });
    }

    if (!verifyMfaToken(token, secret)) {
      return res.status(400).json({ message: "Código inválido" });
    }

    await enableMfa(user.id, secret);
    delete (req.session as any).mfaSecret;

    await logAudit(user.id, "mfa_enabled", "user", user.id, null, null, req);

    res.json({ message: "MFA habilitado exitosamente" });
  });

  // Disable MFA
  app.post("/api/auth/mfa/disable", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { token } = req.body;

    if (!user.mfaEnabled) {
      return res.status(400).json({ message: "MFA no está habilitado" });
    }

    // Verify current token before disabling
    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!dbUser?.mfaSecret || !verifyMfaToken(token, dbUser.mfaSecret)) {
      return res.status(400).json({ message: "Código inválido" });
    }

    await disableMfa(user.id);
    await logAudit(user.id, "mfa_disabled", "user", user.id, null, null, req);

    res.json({ message: "MFA deshabilitado" });
  });

  // ============================================================================
  // RESOURCES ROUTES
  // ============================================================================

  // List resources (public) with full relations
  app.get("/api/resources", async (req, res) => {
    const { type, categoryId, careerId, page = 1, limit = 50, search } = req.query;
    
    // Build conditions
    const conditions = [eq(resources.isApproved, true)];
    if (type && type !== "all") conditions.push(eq(resources.type, type as string));
    if (categoryId) conditions.push(eq(resources.categoryId, parseInt(categoryId as string)));
    if (careerId) conditions.push(eq(resources.careerId, parseInt(careerId as string)));
    if (search) {
      conditions.push(
        or(
          ilike(resources.title, `%${search}%`),
          ilike(resources.description, `%${search}%`),
          ilike(resources.author, `%${search}%`),
          ilike(resources.isbn, `%${search}%`),
          ilike(resources.publisher, `%${search}%`)
        ) as any
      );
    }

    // Get resources with category, career, file and uploader info
    const results = await db
      .select({
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        description: resources.description,
        type: resources.type,
        author: resources.author,
        publicationYear: resources.publicationYear,
        viewCount: resources.viewCount,
        downloadCount: resources.downloadCount,
        createdAt: resources.createdAt,
        fileId: resources.fileId,
        categoryId: resources.categoryId,
        careerId: resources.careerId,
        uploadedBy: resources.uploadedBy,
        // Category info
        categoryName: categories.name,
        categorySlug: categories.slug,
        // Career info
        careerName: careers.name,
        careerCode: careers.code,
        // File info
        fileName: files.originalName,
        fileSize: files.size,
        fileMimeType: files.mimeType,
        // Uploader info
        uploaderUsername: users.username,
        uploaderFirstName: users.firstName,
      })
      .from(resources)
      .leftJoin(categories, eq(resources.categoryId, categories.id))
      .leftJoin(careers, eq(resources.careerId, careers.id))
      .leftJoin(files, eq(resources.fileId, files.id))
      .leftJoin(users, eq(resources.uploadedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(resources.createdAt))
      .limit(parseInt(limit as string))
      .offset((parseInt(page as string) - 1) * parseInt(limit as string));

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(resources)
      .where(and(...conditions));

    res.json({ resources: results, total: count, page: parseInt(page as string), limit: parseInt(limit as string) });
  });

  // Get single resource with full details
  app.get("/api/resources/:id", async (req, res) => {
    const { id } = req.params;
    
    const [resource] = await db
      .select({
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        description: resources.description,
        abstract: resources.abstract,
        type: resources.type,
        author: resources.author,
        publisher: resources.publisher,
        isbn: resources.isbn,
        publicationYear: resources.publicationYear,
        language: resources.language,
        pages: resources.pages,
        keywords: resources.keywords,
        viewCount: resources.viewCount,
        downloadCount: resources.downloadCount,
        isApproved: resources.isApproved,
        createdAt: resources.createdAt,
        fileId: resources.fileId,
        categoryId: resources.categoryId,
        careerId: resources.careerId,
        uploadedBy: resources.uploadedBy,
        // Category info
        categoryName: categories.name,
        categorySlug: categories.slug,
        // Career info
        careerName: careers.name,
        careerCode: careers.code,
        // File info
        fileName: files.originalName,
        fileSize: files.size,
        fileMimeType: files.mimeType,
        filePath: files.path,
        fileStorageType: files.storageType,
        // Uploader info
        uploaderUsername: users.username,
        uploaderFirstName: users.firstName,
        uploaderLastName: users.lastName,
      })
      .from(resources)
      .leftJoin(categories, eq(resources.categoryId, categories.id))
      .leftJoin(careers, eq(resources.careerId, careers.id))
      .leftJoin(files, eq(resources.fileId, files.id))
      .leftJoin(users, eq(resources.uploadedBy, users.id))
      .where(eq(resources.id, parseInt(id)))
      .limit(1);

    if (!resource) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    // Track view
    const userId = (req.user as any)?.id;
    await db.insert(resourceViews).values({
      userId: userId || null,
      resourceId: resource.id,
      ipAddress: req.ip,
    });

    // Increment view count
    await db
      .update(resources)
      .set({ viewCount: resource.viewCount + 1 })
      .where(eq(resources.id, resource.id));

    res.json(resource);
  });

  // View resource file inline (proxy to avoid CORS issues with S3)
  app.get("/api/resources/:id/view", async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      
      const [resource] = await db
        .select({
          filePath: files.path,
          fileName: files.originalName,
          mimeType: files.mimeType,
          storageType: files.storageType,
        })
        .from(resources)
        .innerJoin(files, eq(resources.fileId, files.id))
        .where(eq(resources.id, resourceId))
        .limit(1);

      if (!resource || !resource.filePath) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }

      // IMPORTANTE: Sobrescribir headers de seguridad para permitir iframe
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
      
      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      
      if (resource.storageType === "s3") {
        const { getFileStreamFromS3 } = await import("./s3");
        const { stream, contentType, contentLength } = await getFileStreamFromS3(resource.filePath);
        
        res.setHeader("Content-Type", contentType || "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(resource.fileName || 'document')}"`);  
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.setHeader("Accept-Ranges", "bytes");
        if (contentLength) {
          res.setHeader("Content-Length", contentLength);
        }
        
        // Use pipe with error handling
        const nodeStream = stream as any;
        nodeStream.on('error', (err: any) => {
          console.error("[view] Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({ message: "Error al transmitir archivo" });
          }
        });
        nodeStream.pipe(res);
      } else {
        // Archivo local
        const pathModule = await import("path");
        const filePath = pathModule.join(process.cwd(), resource.filePath);
        res.setHeader("Content-Type", resource.mimeType || "application/octet-stream");
        res.setHeader("Content-Disposition", `inline; filename="${resource.fileName}"`);  
        res.sendFile(filePath);
      }
    } catch (err) {
      console.error("[view] Error:", err);
      res.status(500).json({ message: "Error al cargar archivo" });
    }
  });

  // Download resource file
  app.get("/api/resources/:id/download", async (req, res) => {
    const { id } = req.params;
    const userId = (req.user as any)?.id;

    const [resource] = await db
      .select({
        id: resources.id,
        title: resources.title,
        downloadCount: resources.downloadCount,
        fileId: resources.fileId,
        filePath: files.path,
        fileStorageType: files.storageType,
        fileName: files.originalName,
        fileMimeType: files.mimeType,
      })
      .from(resources)
      .leftJoin(files, eq(resources.fileId, files.id))
      .where(eq(resources.id, parseInt(id)))
      .limit(1);

    if (!resource || !resource.fileId) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    // Track download
    await db.insert(downloads).values({
      userId: userId || null,
      resourceId: resource.id,
      ipAddress: req.ip,
    });

    // Increment download count
    await db
      .update(resources)
      .set({ downloadCount: resource.downloadCount + 1 })
      .where(eq(resources.id, resource.id));

    // Generate download URL based on storage type
    if (resource.fileStorageType === "s3") {
      const { generateDownloadPresignedUrl } = await import("./s3");
      const downloadUrl = await generateDownloadPresignedUrl(resource.filePath!, 3600);
      res.json({ downloadUrl, filename: resource.fileName });
    } else {
      // Local file - serve directly
      const path = await import("path");
      const filePath = path.join(process.cwd(), resource.filePath!);
      res.download(filePath, resource.fileName || "download");
    }
  });

  // Create resource (authenticated)
  app.post("/api/resources", isAuthenticated, uploadLimiter, upload.single("file"), handleUploadError, async (req, res) => {
    try {
      const user = req.user as any;
      const data = JSON.parse(req.body.data || "{}");
      
      // Sanitizar inputs
      const sanitizedData = {
        ...data,
        title: sanitizeTextWithLimit(data.title, 500),
        description: sanitizeHtml(data.description),
        abstract: data.abstract ? sanitizeHtml(data.abstract) : null,
        author: data.author ? sanitizeTextWithLimit(data.author, 255) : null,
        publisher: data.publisher ? sanitizeTextWithLimit(data.publisher, 255) : null,
      };

      let fileId: number | null = null;

      // If file was uploaded, save it
      if (req.file) {
        const fileRecord = await saveFileRecord(req.file, user.id);
        fileId = fileRecord.id;
      }

      const [resource] = await db
        .insert(resources)
        .values({
          title: sanitizedData.title,
          slug: generateSlug(sanitizedData.title),
          description: sanitizedData.description,
          abstract: sanitizedData.abstract,
          type: data.type || "document",
          categoryId: data.categoryId,
          careerId: data.careerId,
          author: sanitizedData.author,
          isbn: data.isbn,
          publicationYear: data.publicationYear,
          publisher: sanitizedData.publisher,
          language: data.language || "es",
          pages: data.pages,
          keywords: data.keywords,
          fileId,
          externalUrl: data.externalUrl,
          uploadedBy: user.id,
          isPublic: true,
          isApproved: false, // Requires approval
        })
        .returning();

      await logAudit(user.id, "create_resource", "resource", resource.id, null, resource, req);

      res.status(201).json(resource);
    } catch (err) {
      console.error("[resources] Create error:", err);
      res.status(500).json({ message: "Error al crear el recurso" });
    }
  });

  // Update resource (owner or admin)
  app.put("/api/resources/:id", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    // Check ownership or admin role
    if (existing.uploadedBy !== user.id && !user.roles?.includes("admin")) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const [updated] = await db
      .update(resources)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(resources.id, parseInt(id)))
      .returning();

    await logAudit(user.id, "update_resource", "resource", updated.id, existing, updated, req);

    res.json(updated);
  });

  // Delete resource (owner or admin)
  app.delete("/api/resources/:id", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    if (existing.uploadedBy !== user.id && !user.roles?.includes("admin")) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // Delete associated file if exists
    if (existing.fileId) {
      await deleteFile(existing.fileId);
    }

    await db.delete(resources).where(eq(resources.id, parseInt(id)));
    await logAudit(user.id, "delete_resource", "resource", parseInt(id), existing, null, req);

    res.json({ message: "Recurso eliminado" });
  });

  // Approve resource (admin/librarian)
  app.post("/api/resources/:id/approve", isAuthenticated, hasRole("admin", "librarian"), async (req, res) => {
    const user = req.user as any;
    const { id } = req.params;

    const [updated] = await db
      .update(resources)
      .set({
        isApproved: true,
        approvedBy: user.id,
        approvedAt: new Date(),
      })
      .where(eq(resources.id, parseInt(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    await logAudit(user.id, "approve_resource", "resource", updated.id, null, null, req);

    res.json(updated);
  });

  // ============================================================================
  // FILE ROUTES
  // ============================================================================

  // Download/view file
  app.get("/api/files/:id", async (req, res) => {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    
    await serveSecureFile(req, res, parseInt(id), userId);
  });

  // ============================================================================
  // S3 UPLOAD ROUTES
  // ============================================================================

  // Upload file through server to S3 (avoids CORS issues)
  app.post("/api/uploads/s3", isAuthenticated, uploadLimiter, upload.single("file"), async (req, res) => {
    try {
      const { uploadToS3, isS3Configured } = await import("./s3");
      
      if (!isS3Configured()) {
        return res.status(503).json({ message: "Servicio de almacenamiento no configurado" });
      }

      const file = req.file;
      const user = req.user as any;

      if (!file) {
        return res.status(400).json({ message: "No se recibió ningún archivo" });
      }

      // Read file from disk
      const fs = await import("fs/promises");
      const buffer = await fs.readFile(file.path);

      // Upload to S3
      const result = await uploadToS3({
        buffer,
        filename: file.originalname,
        contentType: file.mimetype,
        userId: user.id,
      });

      // Delete local file after upload to S3
      await fs.unlink(file.path);

      res.json({
        key: result.key,
        filename: file.originalname,
        contentType: file.mimetype,
        size: file.size,
      });
    } catch (err: any) {
      console.error("[s3] Upload error:", err);
      res.status(400).json({ message: err.message || "Error al subir archivo" });
    }
  });

  // Get presigned URL for direct upload to S3
  app.post("/api/uploads/presign", isAuthenticated, uploadLimiter, async (req, res) => {
    try {
      const { generateUploadPresignedUrl, isS3Configured } = await import("./s3");
      
      if (!isS3Configured()) {
        return res.status(503).json({ message: "Servicio de almacenamiento no configurado" });
      }

      const { filename, contentType, size } = req.body;
      const user = req.user as any;

      if (!filename || !contentType || !size) {
        return res.status(400).json({ message: "Faltan parámetros: filename, contentType, size" });
      }

      const result = await generateUploadPresignedUrl({
        filename,
        contentType,
        size,
        userId: user.id,
      });

      res.json(result);
    } catch (err: any) {
      console.error("[s3] Presign error:", err);
      res.status(400).json({ message: err.message || "Error al generar URL de subida" });
    }
  });

  // Confirm upload and create resource record
  app.post("/api/uploads/confirm", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { key, filename, contentType, size, metadata } = req.body;

      if (!key || !filename || !metadata) {
        return res.status(400).json({ message: "Faltan parámetros requeridos" });
      }

      // Sanitize metadata
      const sanitizedMetadata = {
        title: sanitizeTextWithLimit(metadata.title, 500),
        description: sanitizeHtml(metadata.description),
        abstract: metadata.abstract ? sanitizeHtml(metadata.abstract) : null,
        author: metadata.author ? sanitizeTextWithLimit(metadata.author, 255) : null,
        publisher: metadata.publisher ? sanitizeTextWithLimit(metadata.publisher, 255) : null,
        type: metadata.type || "document",
        categoryId: metadata.categoryId || null,
        careerId: metadata.careerId || null,
        isbn: metadata.isbn || null,
        publicationYear: metadata.publicationYear || null,
        language: metadata.language || "es",
        pages: metadata.pages || null,
        keywords: metadata.keywords || null,
      };

      // Create file record with S3 storage type
      const [fileRecord] = await db
        .insert(files)
        .values({
          filename: key.split("/").pop() || filename,
          originalName: filename,
          mimeType: contentType,
          size: size,
          path: key, // S3 key
          storageType: "s3",
          uploadedBy: user.id,
          isPublic: false,
        })
        .returning();

      // Create resource record
      const [resource] = await db
        .insert(resources)
        .values({
          title: sanitizedMetadata.title,
          slug: generateSlug(sanitizedMetadata.title),
          description: sanitizedMetadata.description,
          abstract: sanitizedMetadata.abstract,
          type: sanitizedMetadata.type,
          categoryId: sanitizedMetadata.categoryId,
          careerId: sanitizedMetadata.careerId,
          author: sanitizedMetadata.author,
          isbn: sanitizedMetadata.isbn,
          publicationYear: sanitizedMetadata.publicationYear,
          publisher: sanitizedMetadata.publisher,
          language: sanitizedMetadata.language,
          pages: sanitizedMetadata.pages,
          keywords: sanitizedMetadata.keywords,
          fileId: fileRecord.id,
          uploadedBy: user.id,
          isPublic: true,
          isApproved: true, // Auto-approved for prototype
        })
        .returning();

      await logAudit(user.id, "create_resource_s3", "resource", resource.id, null, resource, req);

      res.status(201).json({ resource, file: fileRecord });
    } catch (err) {
      console.error("[s3] Confirm upload error:", err);
      res.status(500).json({ message: "Error al confirmar la subida" });
    }
  });

  // Get download URL for S3 file
  app.get("/api/files/:id/download-url", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;

      const [file] = await db
        .select()
        .from(files)
        .where(eq(files.id, parseInt(id)))
        .limit(1);

      if (!file) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }

      // For S3 files, generate presigned download URL
      if (file.storageType === "s3") {
        const { generateDownloadPresignedUrl } = await import("./s3");
        const downloadUrl = await generateDownloadPresignedUrl(file.path, 3600); // 1 hour
        
        // Track download
        await db.insert(downloads).values({
          userId: userId || null,
          resourceId: null, // Will be null for direct file access
          fileId: file.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });

        return res.json({ downloadUrl, filename: file.originalName });
      }

      // For local files, redirect to existing endpoint
      res.json({ downloadUrl: `/api/files/${id}`, filename: file.originalName });
    } catch (err) {
      console.error("[files] Download URL error:", err);
      res.status(500).json({ message: "Error al obtener URL de descarga" });
    }
  });

  // ============================================================================
  // SEARCH ROUTES
  // ============================================================================

  app.get("/api/search", searchLimiter, async (req, res) => {
    try {
      const input = searchSchema.parse({
        query: req.query.q,
        type: req.query.type,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        careerId: req.query.careerId ? parseInt(req.query.careerId as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        language: req.query.language,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      });

      const conditions = [eq(resources.isApproved, true)];
      
      // Text search using ILIKE for now (can upgrade to FTS later)
      conditions.push(
        or(
          ilike(resources.title, `%${input.query}%`),
          ilike(resources.description, `%${input.query}%`),
          ilike(resources.author, `%${input.query}%`),
          ilike(resources.isbn, `%${input.query}%`),
          ilike(resources.publisher, `%${input.query}%`)
        )!
      );

      if (input.type && input.type !== "all") {
        conditions.push(eq(resources.type, input.type));
      }
      if (input.categoryId) {
        conditions.push(eq(resources.categoryId, input.categoryId));
      }
      if (input.careerId) {
        conditions.push(eq(resources.careerId, input.careerId));
      }
      if (input.year) {
        conditions.push(eq(resources.publicationYear, input.year));
      }
      if (input.language) {
        conditions.push(eq(resources.language, input.language));
      }

      const results = await db
        .select()
        .from(resources)
        .where(and(...conditions))
        .orderBy(desc(resources.viewCount))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(resources)
        .where(and(...conditions));

      res.json({
        results,
        pagination: {
          page: input.page,
          limit: input.limit,
          total: count,
          pages: Math.ceil(count / input.limit),
        },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("[search] Error:", err);
      res.status(500).json({ message: "Error en la búsqueda" });
    }
  });

  // ============================================================================
  // FAVORITES ROUTES
  // ============================================================================

  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    const userFavorites = await db
      .select({ resource: resources })
      .from(favorites)
      .innerJoin(resources, eq(favorites.resourceId, resources.id))
      .where(eq(favorites.userId, user.id))
      .orderBy(desc(favorites.createdAt));

    res.json(userFavorites.map(f => f.resource));
  });

  app.post("/api/favorites/:resourceId", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { resourceId } = req.params;

    try {
      await db.insert(favorites).values({
        userId: user.id,
        resourceId: parseInt(resourceId),
      });
      res.json({ message: "Añadido a favoritos" });
    } catch (err) {
      res.status(400).json({ message: "Ya está en favoritos" });
    }
  });

  app.delete("/api/favorites/:resourceId", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { resourceId } = req.params;

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, user.id),
          eq(favorites.resourceId, parseInt(resourceId))
        )
      );

    res.json({ message: "Eliminado de favoritos" });
  });

  // ============================================================================
  // CATEGORIES & CAREERS ROUTES
  // ============================================================================

  // Get categories with resource counts
  app.get("/api/categories/with-counts", async (_req, res) => {
    const cats = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        iconName: categories.iconName,
        color: categories.color,
        sortOrder: categories.sortOrder,
        resourceCount: sql<number>`COALESCE((
          SELECT COUNT(*) FROM resources 
          WHERE resources.category_id = categories.id 
          AND resources.is_approved = true
        ), 0)::int`,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
    res.json(cats);
  });

  // Get careers with resource counts  
  app.get("/api/careers/with-counts", async (_req, res) => {
    const careersList = await db
      .select({
        id: careers.id,
        name: careers.name,
        code: careers.code,
        description: careers.description,
        resourceCount: sql<number>`COALESCE((
          SELECT COUNT(*) FROM resources 
          WHERE resources.career_id = careers.id 
          AND resources.is_approved = true
        ), 0)::int`,
      })
      .from(careers)
      .where(eq(careers.isActive, true))
      .orderBy(asc(careers.name));
    res.json(careersList);
  });

  // Get resource types with counts
  app.get("/api/resource-types/with-counts", async (_req, res) => {
    const types = await db
      .select({
        type: resources.type,
        count: sql<number>`count(*)::int`,
      })
      .from(resources)
      .where(eq(resources.isApproved, true))
      .groupBy(resources.type);
    res.json(types);
  });

  app.get("/api/categories", async (_req, res) => {
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
    res.json(cats);
  });

  app.get("/api/careers", async (_req, res) => {
    const careersList = await db
      .select()
      .from(careers)
      .where(eq(careers.isActive, true))
      .orderBy(asc(careers.name));
    res.json(careersList);
  });

  // ============================================================================
  // FORUM ROUTES
  // ============================================================================

  // List forum categories
  app.get("/api/forum/categories", async (_req, res) => {
    const cats = await db
      .select()
      .from(forumCategories)
      .where(eq(forumCategories.isActive, true))
      .orderBy(asc(forumCategories.sortOrder));
    res.json(cats);
  });

  // List threads in a category
  app.get("/api/forum/categories/:categoryId/threads", async (req, res) => {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const threads = await db
      .select({
        thread: forumThreads,
        author: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(forumThreads)
      .innerJoin(users, eq(forumThreads.authorId, users.id))
      .where(eq(forumThreads.categoryId, parseInt(categoryId)))
      .orderBy(desc(forumThreads.isPinned), desc(forumThreads.lastReplyAt))
      .limit(parseInt(limit as string))
      .offset((parseInt(page as string) - 1) * parseInt(limit as string));

    res.json(threads);
  });

  // Get single thread with posts
  app.get("/api/forum/threads/:id", async (req, res) => {
    const { id } = req.params;

    const [thread] = await db
      .select()
      .from(forumThreads)
      .where(eq(forumThreads.id, parseInt(id)))
      .limit(1);

    if (!thread) {
      return res.status(404).json({ message: "Tema no encontrado" });
    }

    // Increment view count
    await db
      .update(forumThreads)
      .set({ viewCount: thread.viewCount + 1 })
      .where(eq(forumThreads.id, thread.id));

    // Get posts
    const posts = await db
      .select({
        post: forumPosts,
        author: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(forumPosts)
      .innerJoin(users, eq(forumPosts.authorId, users.id))
      .where(eq(forumPosts.threadId, thread.id))
      .orderBy(asc(forumPosts.createdAt));

    res.json({ thread, posts });
  });

  // Create thread
  app.post("/api/forum/threads", isAuthenticated, forumLimiter, async (req, res) => {
    const user = req.user as any;
    
    try {
      // Sanitizar inputs
      const sanitizedBody = {
        ...req.body,
        title: sanitizeTextWithLimit(req.body.title, 255),
        content: sanitizeHtml(req.body.content),
        authorId: user.id,
      };
      
      const input = insertThreadSchema.parse(sanitizedBody);

      const [thread] = await db
        .insert(forumThreads)
        .values({
          ...input,
          slug: generateSlug(input.title),
        })
        .returning();

      await logAudit(user.id, "create_thread", "forum_thread", thread.id, null, thread, req);

      res.status(201).json(thread);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Error al crear el tema" });
    }
  });

  // Create post (reply)
  app.post("/api/forum/threads/:threadId/posts", isAuthenticated, forumLimiter, async (req, res) => {
    const user = req.user as any;
    const { threadId } = req.params;

    try {
      // Sanitizar inputs
      const sanitizedBody = {
        ...req.body,
        content: sanitizeHtml(req.body.content),
        threadId: parseInt(threadId),
        authorId: user.id,
      };
      
      const input = insertPostSchema.parse(sanitizedBody);

      const [post] = await db
        .insert(forumPosts)
        .values(input)
        .returning();

      // Update thread reply count and last reply info
      await db
        .update(forumThreads)
        .set({
          replyCount: sql`${forumThreads.replyCount} + 1`,
          lastReplyAt: new Date(),
          lastReplyBy: user.id,
        })
        .where(eq(forumThreads.id, parseInt(threadId)));

      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Error al crear la respuesta" });
    }
  });

  // Vote on post
  app.post("/api/forum/posts/:postId/vote", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { postId } = req.params;
    const { voteType } = req.body; // 'up' or 'down'

    if (!["up", "down"].includes(voteType)) {
      return res.status(400).json({ message: "Tipo de voto inválido" });
    }

    // Check existing vote
    const [existingVote] = await db
      .select()
      .from(forumVotes)
      .where(
        and(
          eq(forumVotes.userId, user.id),
          eq(forumVotes.postId, parseInt(postId))
        )
      )
      .limit(1);

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote
        await db.delete(forumVotes).where(eq(forumVotes.id, existingVote.id));
        
        const field = voteType === "up" ? "upvotes" : "downvotes";
        await db
          .update(forumPosts)
          .set({ [field]: sql`${forumPosts[field]} - 1` })
          .where(eq(forumPosts.id, parseInt(postId)));
        
        return res.json({ message: "Voto eliminado" });
      } else {
        // Change vote
        await db
          .update(forumVotes)
          .set({ voteType })
          .where(eq(forumVotes.id, existingVote.id));
        
        const addField = voteType === "up" ? "upvotes" : "downvotes";
        const removeField = voteType === "up" ? "downvotes" : "upvotes";
        await db
          .update(forumPosts)
          .set({
            [addField]: sql`${forumPosts[addField]} + 1`,
            [removeField]: sql`${forumPosts[removeField]} - 1`,
          })
          .where(eq(forumPosts.id, parseInt(postId)));
        
        return res.json({ message: "Voto actualizado" });
      }
    }

    // New vote
    await db.insert(forumVotes).values({
      userId: user.id,
      postId: parseInt(postId),
      voteType,
    });

    const field = voteType === "up" ? "upvotes" : "downvotes";
    await db
      .update(forumPosts)
      .set({ [field]: sql`${forumPosts[field]} + 1` })
      .where(eq(forumPosts.id, parseInt(postId)));

    res.json({ message: "Voto registrado" });
  });

  // ============================================================================
  // NOTIFICATIONS ROUTES
  // ============================================================================

  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { unreadOnly } = req.query;

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    if (unreadOnly === "true") {
      query = db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }

    const notifs = await query;
    res.json(notifs);
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { id } = req.params;

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, parseInt(id)), eq(notifications.userId, user.id)));

    res.json({ message: "Marcada como leída" });
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    const user = req.user as any;

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.userId, user.id));

    res.json({ message: "Todas marcadas como leídas" });
  });

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================

  // List pending resources
  app.get("/api/admin/resources/pending", isAuthenticated, hasRole("admin", "librarian"), async (_req, res) => {
    const pending = await db
      .select()
      .from(resources)
      .where(eq(resources.isApproved, false))
      .orderBy(desc(resources.createdAt));

    res.json(pending);
  });

  // List all users
  app.get("/api/admin/users", isAuthenticated, hasRole("admin"), async (_req, res) => {
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    res.json(usersList);
  });

  console.log("[routes] Todas las rutas registradas");

  return httpServer;
}
