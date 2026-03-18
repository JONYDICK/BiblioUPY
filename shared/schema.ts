import { pgTable, text, serial, integer, boolean, timestamp, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  studentId: varchar("student_id", { length: 20 }),
  career: varchar("career", { length: 100 }),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  bio: text("bio"),
  googleId: varchar("google_id", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  mfaEnabled: boolean("mfa_enabled").default(false).notNull(),
  mfaSecret: text("mfa_secret"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_username_idx").on(table.username),
]);

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  permissions: text("permissions").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roleId: integer("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: integer("assigned_by").references(() => users.id),
}, (table) => [
  uniqueIndex("user_roles_unique").on(table.userId, table.roleId),
]);

export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => [
  index("sessions_expire_idx").on(table.expire),
]);

export const mfaTokens = pgTable("mfa_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 6 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// CATEGORIES & ORGANIZATION
// ============================================================================

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id"),
  iconName: varchar("icon_name", { length: 50 }),
  color: varchar("color", { length: 7 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careers = pgTable("careers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: text("description"),
  facultyName: varchar("faculty_name", { length: 150 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RESOURCES & FILES
// ============================================================================

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  storageType: varchar("storage_type", { length: 20 }).default("local").notNull(),
  checksum: varchar("checksum", { length: 64 }),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("files_uploaded_by_idx").on(table.uploadedBy),
]);

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 550 }).notNull().unique(),
  description: text("description").notNull(),
  abstract: text("abstract"),
  type: varchar("type", { length: 50 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  careerId: integer("career_id").references(() => careers.id),
  author: varchar("author", { length: 255 }),
  isbn: varchar("isbn", { length: 20 }),
  publicationYear: integer("publication_year"),
  publisher: varchar("publisher", { length: 255 }),
  language: varchar("language", { length: 10 }).default("es"),
  pages: integer("pages"),
  keywords: text("keywords").array(),
  fileId: integer("file_id").references(() => files.id),
  externalUrl: text("external_url"),
  thumbnailUrl: text("thumbnail_url"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  viewCount: integer("view_count").default(0).notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("resources_title_idx").on(table.title),
  index("resources_type_idx").on(table.type),
  index("resources_category_idx").on(table.categoryId),
  index("resources_career_idx").on(table.careerId),
  index("resources_uploaded_by_idx").on(table.uploadedBy),
  index("resources_approved_idx").on(table.isApproved),
]);

// ============================================================================
// USER INTERACTIONS
// ============================================================================

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  resourceId: integer("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("favorites_unique").on(table.userId, table.resourceId),
]);

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  resourceId: integer("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull(),
  fileId: integer("file_id").references(() => files.id, { onDelete: "set null" }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
});

export const resourceViews = pgTable("resource_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  resourceId: integer("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  resourceId: integer("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("ratings_unique").on(table.userId, table.resourceId),
]);

// ============================================================================
// FORUM SYSTEM
// ============================================================================

export const forumCategories = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  iconName: varchar("icon_name", { length: 50 }),
  color: varchar("color", { length: 7 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumThreads = pgTable("forum_threads", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => forumCategories.id, { onDelete: "cascade" }).notNull(),
  authorId: integer("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  replyCount: integer("reply_count").default(0).notNull(),
  lastReplyAt: timestamp("last_reply_at"),
  lastReplyBy: integer("last_reply_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("forum_threads_category_idx").on(table.categoryId),
  index("forum_threads_author_idx").on(table.authorId),
]);

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => forumThreads.id, { onDelete: "cascade" }).notNull(),
  authorId: integer("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  parentId: integer("parent_id"),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false).notNull(),
  editedAt: timestamp("edited_at"),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("forum_posts_thread_idx").on(table.threadId),
  index("forum_posts_author_idx").on(table.authorId),
]);

export const forumVotes = pgTable("forum_votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  postId: integer("post_id").references(() => forumPosts.id, { onDelete: "cascade" }).notNull(),
  voteType: varchar("vote_type", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("forum_votes_unique").on(table.userId, table.postId),
]);

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("notifications_user_idx").on(table.userId),
  index("notifications_read_idx").on(table.isRead),
]);

// ============================================================================
// AUDIT & SECURITY
// ============================================================================

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: integer("entity_id"),
  oldValues: text("old_values"),
  newValues: text("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("audit_logs_user_idx").on(table.userId),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_created_idx").on(table.createdAt),
]);

// ============================================================================
// SEARCH INDEX
// ============================================================================

export const searchIndex = pgTable("search_index", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull().unique(),
  searchVector: text("search_vector"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  resources: many(resources),
  favorites: many(favorites),
  downloads: many(downloads),
  ratings: many(ratings),
  forumThreads: many(forumThreads),
  forumPosts: many(forumPosts),
  notifications: many(notifications),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  category: one(categories, { fields: [resources.categoryId], references: [categories.id] }),
  career: one(careers, { fields: [resources.careerId], references: [careers.id] }),
  uploader: one(users, { fields: [resources.uploadedBy], references: [users.id] }),
  file: one(files, { fields: [resources.fileId], references: [files.id] }),
  favorites: many(favorites),
  downloads: many(downloads),
  ratings: many(ratings),
}));

export const forumThreadsRelations = relations(forumThreads, ({ one, many }) => ({
  category: one(forumCategories, { fields: [forumThreads.categoryId], references: [forumCategories.id] }),
  author: one(users, { fields: [forumThreads.authorId], references: [users.id] }),
  posts: many(forumPosts),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  thread: one(forumThreads, { fields: [forumPosts.threadId], references: [forumThreads.id] }),
  author: one(users, { fields: [forumPosts.authorId], references: [users.id] }),
  votes: many(forumVotes),
}));

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const insertUserSchema = z.object({
  email: z.string().email("Email debe ser válido"),
  username: z.string().min(3, "Username mínimo 3 caracteres").max(50),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string().min(1, "Debe confirmar la contraseña"),
  studentId: z.string().optional(),
  career: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
  mfaToken: z.string().optional().transform(val => val === "" ? undefined : val),
  rememberMe: z.boolean().optional(),
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  email: true,
  createdAt: true,
  mfaSecret: true,
}).partial();

export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido").max(100).optional(),
  lastName: z.string().min(1, "Apellido requerido").max(100).optional(),
  bio: z.string().max(500, "Bio no puede exceder 500 caracteres").transform(val => val === "" ? null : val).nullable().optional(),
  avatarUrl: z.string().url("Avatar URL debe ser válida").optional().or(z.literal(null)).nullable(),
  bannerUrl: z.string().url("Banner URL debe ser válida").optional().or(z.literal(null)).nullable(),
  studentId: z.string().max(20).optional().or(z.literal(null)).nullable(),
  career: z.string().max(100).optional().or(z.literal(null)).nullable(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  slug: true,
  viewCount: true,
  downloadCount: true,
  createdAt: true,
  updatedAt: true,
});

export const updateResourceSchema = insertResourceSchema.partial();

export const insertThreadSchema = createInsertSchema(forumThreads).omit({
  id: true,
  slug: true,
  viewCount: true,
  replyCount: true,
  lastReplyAt: true,
  lastReplyBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  isEdited: true,
  editedAt: true,
  upvotes: true,
  downvotes: true,
  createdAt: true,
  updatedAt: true,
});

export const searchSchema = z.object({
  query: z.string().min(2, "La búsqueda debe tener al menos 2 caracteres").max(500, "La búsqueda es demasiado larga"),
  type: z.enum(["all", "pdf", "book", "thesis", "article", "document"]).optional(),
  categoryId: z.number().optional(),
  careerId: z.number().optional(),
  year: z.number().optional(),
  language: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

type InferSchemaOutput<T> = T extends { _output: infer O } ? O : never;

export type User = typeof users.$inferSelect;
export type InsertUser = InferSchemaOutput<typeof insertUserSchema>;
export type UpdateUser = InferSchemaOutput<typeof updateUserSchema>;
export type LoginInput = InferSchemaOutput<typeof loginSchema>;

export type Role = typeof roles.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = InferSchemaOutput<typeof insertResourceSchema>;
export type UpdateResource = InferSchemaOutput<typeof updateResourceSchema>;

export type File = typeof files.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Career = typeof careers.$inferSelect;

export type ForumCategory = typeof forumCategories.$inferSelect;
export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertThread = InferSchemaOutput<typeof insertThreadSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertPost = InferSchemaOutput<typeof insertPostSchema>;

export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Download = typeof downloads.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type SearchInput = InferSchemaOutput<typeof searchSchema>;
