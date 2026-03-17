import { Request, Response, NextFunction, Express } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { generateSecret as otpGenerateSecret, verify as otpVerify, generateURI } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import { db } from "./db";
import { users, sessions, auditLogs, roles, userRoles, mfaTokens, passwordResets } from "../../shared/schema";
import { eq, and, isNull } from "drizzle-orm";
import { pool } from "./db";
import type { UserWithRoles, AuthInfo } from "./types/user";

const PgSession = connectPgSimple(session);

// ============================================================================
// PASSWORD HASHING
// ============================================================================

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// MFA (TOTP) FUNCTIONS
// ============================================================================

export function generateMfaSecret(): string {
  return otpGenerateSecret();
}

export async function generateMfaQrCode(email: string, secret: string): Promise<string> {
  const otpauth = generateURI({
    label: email,
    issuer: "BiblioUPY",
    secret: secret,
  });
  return QRCode.toDataURL(otpauth);
}

export async function verifyMfaToken(token: string, secret: string): Promise<boolean> {
  const result = await otpVerify({ token, secret });
  return result.valid;
}

// ============================================================================
// TOKEN GENERATION
// ============================================================================

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

// ============================================================================
// PASSPORT CONFIGURATION
// ============================================================================

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Email o contraseña incorrectos" });
        }

        if (!user.isActive) {
          return done(null, false, { message: "Cuenta desactivada" });
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: "Email o contraseña incorrectos" });
        }

        // If MFA is enabled, we need to verify the token in a separate step
        if (user.mfaEnabled) {
          return done(null, { ...user, requiresMfa: true });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          if (!profile.emails || profile.emails.length === 0) {
            return done(null, false, { message: "Google profile sin email" });
          }

          const email = profile.emails[0].value.toLowerCase();

          // Try to find existing user by email
          let [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (user) {
            // User exists, update Google ID if not set
            if (!user.googleId) {
              await db.update(users).set({ googleId: profile.id }).where(eq(users.id, user.id));
            }
            // Load user with roles
            const userRolesList = await db
              .select({
                roleName: roles.name,
                permissions: roles.permissions,
              })
              .from(userRoles)
              .innerJoin(roles, eq(userRoles.roleId, roles.id))
              .where(eq(userRoles.userId, user.id));

            const userWithRoles: UserWithRoles = {
              ...user,
              roles: userRolesList.map((r) => r.roleName),
              permissions: userRolesList.flatMap((r) => r.permissions || []),
            };

            return done(null, userWithRoles);
          }

          // User doesn't exist, create a new one
          const studentRole = await db
            .select()
            .from(roles)
            .where(eq(roles.name, "student"))
            .limit(1);

          if (!studentRole || studentRole.length === 0) {
            return done(null, false, { message: "Rol 'student' no configurado" });
          }

          // Create new user from Google profile
          const username = profile.displayName?.toLowerCase().replace(/\s+/g, "") || email.split("@")[0];
          const [firstName, ...lastNameParts] = (profile.displayName || "").split(" ");
          const lastName = lastNameParts.join(" ") || "OAuth";

          const [newUser] = await db
            .insert(users)
            .values({
              email,
              username: `${username}_${Date.now().toString(36)}`, // Ensure unique username
              passwordHash: "", // No password for OAuth users
              firstName: firstName || "",
              lastName: lastName,
              googleId: profile.id,
              avatarUrl: profile.photos?.[0]?.value,
              isActive: true,
            })
            .returning();

          // Assign student role
          await db.insert(userRoles).values({
            userId: newUser.id,
            roleId: studentRole[0].id,
          });

          console.log(`[auth] Usuario creado desde Google: ${email} (ID: ${newUser.id})`);

          const userWithRoles: UserWithRoles = {
            ...newUser,
            roles: ["student"],
            permissions: studentRole[0].permissions || [],
          };

          done(null, userWithRoles);
        } catch (error) {
          console.error("[auth] Error en Google OAuth:", error);
          done(error);
        }
      }
    )
  );
}

passport.serializeUser((user: UserWithRoles | Express.User, done) => {
  if (typeof user === "object" && "id" in user) {
    done(null, (user as any).id);
  } else {
    done(new Error("Invalid user object"));
  }
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return done(null, false);
    }

    // Get user roles
    const userRolesList = await db
      .select({
        roleName: roles.name,
        permissions: roles.permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, id));

    const userWithRoles: UserWithRoles = {
      ...user,
      roles: userRolesList.map((r) => r.roleName),
      permissions: userRolesList.flatMap((r) => r.permissions || []),
    };

    done(null, userWithRoles);
  } catch (error) {
    done(error);
  }
});

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

export function configureSession(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }

  const sessionConfig: session.SessionOptions = {
    store: new PgSession({
      pool: pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  };

  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "No autenticado" });
}

export function hasRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const user = req.user as any;
    const userRoles = user.roles || [];

    if (allowedRoles.some((role) => userRoles.includes(role))) {
      return next();
    }

    res.status(403).json({ message: "Acceso denegado" });
  };
}

export function hasPermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const user = req.user as any;
    const userPermissions = user.permissions || [];

    if (requiredPermissions.every((perm) => userPermissions.includes(perm))) {
      return next();
    }

    res.status(403).json({ message: "Permisos insuficientes" });
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export async function logAudit(
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  oldValues?: any,
  newValues?: any,
  req?: Request
) {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress: req?.ip || null,
      userAgent: req?.get("user-agent") || null,
    });
  } catch (error) {
    console.error("Error logging audit:", error);
  }
}

// ============================================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================================

export async function createUser(userData: {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  studentId?: string;
  career?: string;
  avatarUrl?: string;
  bio?: string;
}) {
  console.log("[auth] Creando usuario:", userData.email);
  const passwordHash = await hashPassword(userData.password);
  console.log("[auth] Contraseña hasheada");

  const [user] = await db
    .insert(users)
    .values({
      email: userData.email.toLowerCase(),
      username: userData.username.toLowerCase(),
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      studentId: userData.studentId,
      career: userData.career,
      avatarUrl: userData.avatarUrl,
      bio: userData.bio,
    })
    .returning();

  console.log("[auth] Usuario insertado con ID:", user.id);

  // Assign default "student" role
  const [studentRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, "student"))
    .limit(1);

  if (studentRole) {
    await db.insert(userRoles).values({
      userId: user.id,
      roleId: studentRole.id,
    });
    console.log("[auth] Rol asignado al usuario");
  }

  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return user;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

export async function updateLastLogin(userId: number) {
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

export async function enableMfa(userId: number, secret: string) {
  await db
    .update(users)
    .set({ mfaEnabled: true, mfaSecret: secret })
    .where(eq(users.id, userId));
}

export async function disableMfa(userId: number) {
  await db
    .update(users)
    .set({ mfaEnabled: false, mfaSecret: null })
    .where(eq(users.id, userId));
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

export async function createPasswordResetToken(userId: number): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResets).values({
    userId,
    token,
    expiresAt,
  });

  return token;
}

export async function verifyPasswordResetToken(token: string) {
  const [reset] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.token, token), isNull(passwordResets.usedAt)))
    .limit(1);

  if (!reset || new Date() > reset.expiresAt) {
    return null;
  }

  return reset;
}

export async function usePasswordResetToken(token: string, newPassword: string) {
  const reset = await verifyPasswordResetToken(token);
  if (!reset) {
    throw new Error("Token inválido o expirado");
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, reset.userId));

  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.id, reset.id));
}

// ============================================================================
// SEED DEFAULT ROLES
// ============================================================================

export async function seedDefaultRoles() {
  try {
    console.log("[auth] Inicializando roles por defecto...");

    const defaultRoles = [
      {
        name: "admin",
        description: "Administrador del sistema",
        permissions: [
          "manage_users",
          "manage_roles",
          "manage_resources",
          "approve_resources",
          "delete_resources",
          "manage_forum",
          "view_audit_logs",
          "manage_categories",
        ],
      },
      {
        name: "librarian",
        description: "Bibliotecario",
        permissions: [
          "manage_resources",
          "approve_resources",
          "manage_categories",
          "view_statistics",
        ],
      },
      {
        name: "professor",
        description: "Profesor",
        permissions: [
          "upload_resources",
          "manage_own_resources",
          "create_forum_threads",
          "moderate_own_threads",
        ],
      },
      {
        name: "student",
        description: "Estudiante",
        permissions: [
          "upload_resources",
          "download_resources",
          "create_forum_threads",
          "comment_forum",
        ],
      },
      {
        name: "guest",
        description: "Invitado",
        permissions: ["view_resources"],
      },
    ];

    let createdCount = 0;
    for (const role of defaultRoles) {
      const existing = await db
        .select()
        .from(roles)
        .where(eq(roles.name, role.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(roles).values(role);
        console.log(`[auth] Rol "${role.name}" creado`);
        createdCount++;
      }
    }

    console.log(`[auth] ✓ Roles inicializados (${createdCount} nuevos roles creados)`);
  } catch (err) {
    console.error("[auth] Error inicializando roles:", err instanceof Error ? err.message : String(err));
    throw err;
  }
}

export { passport };
