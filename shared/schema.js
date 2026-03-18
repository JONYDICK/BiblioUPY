"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSchema = exports.insertPostSchema = exports.insertThreadSchema = exports.updateResourceSchema = exports.insertResourceSchema = exports.updateUserProfileSchema = exports.updateUserSchema = exports.loginSchema = exports.insertUserSchema = exports.forumPostsRelations = exports.forumThreadsRelations = exports.resourcesRelations = exports.usersRelations = exports.searchIndex = exports.auditLogs = exports.notifications = exports.forumVotes = exports.forumPosts = exports.forumThreads = exports.forumCategories = exports.ratings = exports.resourceViews = exports.downloads = exports.favorites = exports.resources = exports.files = exports.careers = exports.categories = exports.passwordResets = exports.mfaTokens = exports.sessions = exports.userRoles = exports.roles = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    username: (0, pg_core_1.varchar)("username", { length: 50 }).notNull().unique(),
    passwordHash: (0, pg_core_1.text)("password_hash").notNull(),
    firstName: (0, pg_core_1.varchar)("first_name", { length: 100 }).notNull(),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 100 }).notNull(),
    studentId: (0, pg_core_1.varchar)("student_id", { length: 20 }),
    career: (0, pg_core_1.varchar)("career", { length: 100 }),
    avatarUrl: (0, pg_core_1.text)("avatar_url"),
    bannerUrl: (0, pg_core_1.text)("banner_url"),
    bio: (0, pg_core_1.text)("bio"),
    googleId: (0, pg_core_1.varchar)("google_id", { length: 255 }),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false).notNull(),
    mfaEnabled: (0, pg_core_1.boolean)("mfa_enabled").default(false).notNull(),
    mfaSecret: (0, pg_core_1.text)("mfa_secret"),
    lastLoginAt: (0, pg_core_1.timestamp)("last_login_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("users_email_idx").on(table.email),
    (0, pg_core_1.index)("users_username_idx").on(table.username),
]);
exports.roles = (0, pg_core_1.pgTable)("roles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 50 }).notNull().unique(),
    description: (0, pg_core_1.text)("description"),
    permissions: (0, pg_core_1.text)("permissions").array(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.userRoles = (0, pg_core_1.pgTable)("user_roles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    roleId: (0, pg_core_1.integer)("role_id").references(() => exports.roles.id, { onDelete: "cascade" }).notNull(),
    assignedAt: (0, pg_core_1.timestamp)("assigned_at").defaultNow().notNull(),
    assignedBy: (0, pg_core_1.integer)("assigned_by").references(() => exports.users.id),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("user_roles_unique").on(table.userId, table.roleId),
]);
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    sid: (0, pg_core_1.varchar)("sid", { length: 255 }).primaryKey(),
    sess: (0, pg_core_1.text)("sess").notNull(),
    expire: (0, pg_core_1.timestamp)("expire").notNull(),
}, (table) => [
    (0, pg_core_1.index)("sessions_expire_idx").on(table.expire),
]);
exports.mfaTokens = (0, pg_core_1.pgTable)("mfa_tokens", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    token: (0, pg_core_1.varchar)("token", { length: 6 }).notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 20 }).notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    usedAt: (0, pg_core_1.timestamp)("used_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.passwordResets = (0, pg_core_1.pgTable)("password_resets", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    token: (0, pg_core_1.varchar)("token", { length: 255 }).notNull().unique(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    usedAt: (0, pg_core_1.timestamp)("used_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ============================================================================
// CATEGORIES & ORGANIZATION
// ============================================================================
exports.categories = (0, pg_core_1.pgTable)("categories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 100 }).notNull().unique(),
    description: (0, pg_core_1.text)("description"),
    parentId: (0, pg_core_1.integer)("parent_id"),
    iconName: (0, pg_core_1.varchar)("icon_name", { length: 50 }),
    color: (0, pg_core_1.varchar)("color", { length: 7 }),
    sortOrder: (0, pg_core_1.integer)("sort_order").default(0),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.careers = (0, pg_core_1.pgTable)("careers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 150 }).notNull(),
    code: (0, pg_core_1.varchar)("code", { length: 20 }).notNull().unique(),
    description: (0, pg_core_1.text)("description"),
    facultyName: (0, pg_core_1.varchar)("faculty_name", { length: 150 }),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// ============================================================================
// RESOURCES & FILES
// ============================================================================
exports.files = (0, pg_core_1.pgTable)("files", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    filename: (0, pg_core_1.varchar)("filename", { length: 255 }).notNull(),
    originalName: (0, pg_core_1.varchar)("original_name", { length: 255 }).notNull(),
    mimeType: (0, pg_core_1.varchar)("mime_type", { length: 100 }).notNull(),
    size: (0, pg_core_1.integer)("size").notNull(),
    path: (0, pg_core_1.text)("path").notNull(),
    storageType: (0, pg_core_1.varchar)("storage_type", { length: 20 }).default("local").notNull(),
    checksum: (0, pg_core_1.varchar)("checksum", { length: 64 }),
    uploadedBy: (0, pg_core_1.integer)("uploaded_by").references(() => exports.users.id).notNull(),
    isPublic: (0, pg_core_1.boolean)("is_public").default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("files_uploaded_by_idx").on(table.uploadedBy),
]);
exports.resources = (0, pg_core_1.pgTable)("resources", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.varchar)("title", { length: 500 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 550 }).notNull().unique(),
    description: (0, pg_core_1.text)("description").notNull(),
    abstract: (0, pg_core_1.text)("abstract"),
    type: (0, pg_core_1.varchar)("type", { length: 50 }).notNull(),
    categoryId: (0, pg_core_1.integer)("category_id").references(() => exports.categories.id),
    careerId: (0, pg_core_1.integer)("career_id").references(() => exports.careers.id),
    author: (0, pg_core_1.varchar)("author", { length: 255 }),
    isbn: (0, pg_core_1.varchar)("isbn", { length: 20 }),
    publicationYear: (0, pg_core_1.integer)("publication_year"),
    publisher: (0, pg_core_1.varchar)("publisher", { length: 255 }),
    language: (0, pg_core_1.varchar)("language", { length: 10 }).default("es"),
    pages: (0, pg_core_1.integer)("pages"),
    keywords: (0, pg_core_1.text)("keywords").array(),
    fileId: (0, pg_core_1.integer)("file_id").references(() => exports.files.id),
    externalUrl: (0, pg_core_1.text)("external_url"),
    thumbnailUrl: (0, pg_core_1.text)("thumbnail_url"),
    uploadedBy: (0, pg_core_1.integer)("uploaded_by").references(() => exports.users.id).notNull(),
    isPublic: (0, pg_core_1.boolean)("is_public").default(true).notNull(),
    isApproved: (0, pg_core_1.boolean)("is_approved").default(false).notNull(),
    approvedBy: (0, pg_core_1.integer)("approved_by").references(() => exports.users.id),
    approvedAt: (0, pg_core_1.timestamp)("approved_at"),
    viewCount: (0, pg_core_1.integer)("view_count").default(0).notNull(),
    downloadCount: (0, pg_core_1.integer)("download_count").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("resources_title_idx").on(table.title),
    (0, pg_core_1.index)("resources_type_idx").on(table.type),
    (0, pg_core_1.index)("resources_category_idx").on(table.categoryId),
    (0, pg_core_1.index)("resources_career_idx").on(table.careerId),
    (0, pg_core_1.index)("resources_uploaded_by_idx").on(table.uploadedBy),
    (0, pg_core_1.index)("resources_approved_idx").on(table.isApproved),
]);
// ============================================================================
// USER INTERACTIONS
// ============================================================================
exports.favorites = (0, pg_core_1.pgTable)("favorites", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    resourceId: (0, pg_core_1.integer)("resource_id").references(() => exports.resources.id, { onDelete: "cascade" }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("favorites_unique").on(table.userId, table.resourceId),
]);
exports.downloads = (0, pg_core_1.pgTable)("downloads", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "set null" }),
    resourceId: (0, pg_core_1.integer)("resource_id").references(() => exports.resources.id, { onDelete: "cascade" }).notNull(),
    fileId: (0, pg_core_1.integer)("file_id").references(() => exports.files.id, { onDelete: "set null" }),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    downloadedAt: (0, pg_core_1.timestamp)("downloaded_at").defaultNow().notNull(),
});
exports.resourceViews = (0, pg_core_1.pgTable)("resource_views", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "set null" }),
    resourceId: (0, pg_core_1.integer)("resource_id").references(() => exports.resources.id, { onDelete: "cascade" }).notNull(),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    viewedAt: (0, pg_core_1.timestamp)("viewed_at").defaultNow().notNull(),
});
exports.ratings = (0, pg_core_1.pgTable)("ratings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    resourceId: (0, pg_core_1.integer)("resource_id").references(() => exports.resources.id, { onDelete: "cascade" }).notNull(),
    rating: (0, pg_core_1.integer)("rating").notNull(),
    review: (0, pg_core_1.text)("review"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("ratings_unique").on(table.userId, table.resourceId),
]);
// ============================================================================
// FORUM SYSTEM
// ============================================================================
exports.forumCategories = (0, pg_core_1.pgTable)("forum_categories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 100 }).notNull().unique(),
    description: (0, pg_core_1.text)("description"),
    iconName: (0, pg_core_1.varchar)("icon_name", { length: 50 }),
    color: (0, pg_core_1.varchar)("color", { length: 7 }),
    sortOrder: (0, pg_core_1.integer)("sort_order").default(0),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.forumThreads = (0, pg_core_1.pgTable)("forum_threads", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    categoryId: (0, pg_core_1.integer)("category_id").references(() => exports.forumCategories.id, { onDelete: "cascade" }).notNull(),
    authorId: (0, pg_core_1.integer)("author_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    slug: (0, pg_core_1.varchar)("slug", { length: 280 }).notNull().unique(),
    content: (0, pg_core_1.text)("content").notNull(),
    isPinned: (0, pg_core_1.boolean)("is_pinned").default(false).notNull(),
    isLocked: (0, pg_core_1.boolean)("is_locked").default(false).notNull(),
    viewCount: (0, pg_core_1.integer)("view_count").default(0).notNull(),
    replyCount: (0, pg_core_1.integer)("reply_count").default(0).notNull(),
    lastReplyAt: (0, pg_core_1.timestamp)("last_reply_at"),
    lastReplyBy: (0, pg_core_1.integer)("last_reply_by").references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("forum_threads_category_idx").on(table.categoryId),
    (0, pg_core_1.index)("forum_threads_author_idx").on(table.authorId),
]);
exports.forumPosts = (0, pg_core_1.pgTable)("forum_posts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    threadId: (0, pg_core_1.integer)("thread_id").references(() => exports.forumThreads.id, { onDelete: "cascade" }).notNull(),
    authorId: (0, pg_core_1.integer)("author_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    parentId: (0, pg_core_1.integer)("parent_id"),
    content: (0, pg_core_1.text)("content").notNull(),
    isEdited: (0, pg_core_1.boolean)("is_edited").default(false).notNull(),
    editedAt: (0, pg_core_1.timestamp)("edited_at"),
    upvotes: (0, pg_core_1.integer)("upvotes").default(0).notNull(),
    downvotes: (0, pg_core_1.integer)("downvotes").default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("forum_posts_thread_idx").on(table.threadId),
    (0, pg_core_1.index)("forum_posts_author_idx").on(table.authorId),
]);
exports.forumVotes = (0, pg_core_1.pgTable)("forum_votes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    postId: (0, pg_core_1.integer)("post_id").references(() => exports.forumPosts.id, { onDelete: "cascade" }).notNull(),
    voteType: (0, pg_core_1.varchar)("vote_type", { length: 10 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)("forum_votes_unique").on(table.userId, table.postId),
]);
// ============================================================================
// NOTIFICATIONS
// ============================================================================
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "cascade" }).notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 50 }).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    link: (0, pg_core_1.text)("link"),
    isRead: (0, pg_core_1.boolean)("is_read").default(false).notNull(),
    readAt: (0, pg_core_1.timestamp)("read_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("notifications_user_idx").on(table.userId),
    (0, pg_core_1.index)("notifications_read_idx").on(table.isRead),
]);
// ============================================================================
// AUDIT & SECURITY
// ============================================================================
exports.auditLogs = (0, pg_core_1.pgTable)("audit_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id, { onDelete: "set null" }),
    action: (0, pg_core_1.varchar)("action", { length: 100 }).notNull(),
    entityType: (0, pg_core_1.varchar)("entity_type", { length: 50 }),
    entityId: (0, pg_core_1.integer)("entity_id"),
    oldValues: (0, pg_core_1.text)("old_values"),
    newValues: (0, pg_core_1.text)("new_values"),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.index)("audit_logs_user_idx").on(table.userId),
    (0, pg_core_1.index)("audit_logs_action_idx").on(table.action),
    (0, pg_core_1.index)("audit_logs_created_idx").on(table.createdAt),
]);
// ============================================================================
// SEARCH INDEX
// ============================================================================
exports.searchIndex = (0, pg_core_1.pgTable)("search_index", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    resourceId: (0, pg_core_1.integer)("resource_id").references(() => exports.resources.id, { onDelete: "cascade" }).notNull().unique(),
    searchVector: (0, pg_core_1.text)("search_vector"),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// ============================================================================
// RELATIONS
// ============================================================================
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    roles: many(exports.userRoles),
    resources: many(exports.resources),
    favorites: many(exports.favorites),
    downloads: many(exports.downloads),
    ratings: many(exports.ratings),
    forumThreads: many(exports.forumThreads),
    forumPosts: many(exports.forumPosts),
    notifications: many(exports.notifications),
}));
exports.resourcesRelations = (0, drizzle_orm_1.relations)(exports.resources, ({ one, many }) => ({
    category: one(exports.categories, { fields: [exports.resources.categoryId], references: [exports.categories.id] }),
    career: one(exports.careers, { fields: [exports.resources.careerId], references: [exports.careers.id] }),
    uploader: one(exports.users, { fields: [exports.resources.uploadedBy], references: [exports.users.id] }),
    file: one(exports.files, { fields: [exports.resources.fileId], references: [exports.files.id] }),
    favorites: many(exports.favorites),
    downloads: many(exports.downloads),
    ratings: many(exports.ratings),
}));
exports.forumThreadsRelations = (0, drizzle_orm_1.relations)(exports.forumThreads, ({ one, many }) => ({
    category: one(exports.forumCategories, { fields: [exports.forumThreads.categoryId], references: [exports.forumCategories.id] }),
    author: one(exports.users, { fields: [exports.forumThreads.authorId], references: [exports.users.id] }),
    posts: many(exports.forumPosts),
}));
exports.forumPostsRelations = (0, drizzle_orm_1.relations)(exports.forumPosts, ({ one, many }) => ({
    thread: one(exports.forumThreads, { fields: [exports.forumPosts.threadId], references: [exports.forumThreads.id] }),
    author: one(exports.users, { fields: [exports.forumPosts.authorId], references: [exports.users.id] }),
    votes: many(exports.forumVotes),
}));
// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================
exports.insertUserSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email debe ser válido"),
    username: zod_1.z.string().min(3, "Username mínimo 3 caracteres").max(50),
    firstName: zod_1.z.string().min(1, "Nombre requerido"),
    lastName: zod_1.z.string().min(1, "Apellido requerido"),
    password: zod_1.z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: zod_1.z.string().min(1, "Debe confirmar la contraseña"),
    studentId: zod_1.z.string().optional(),
    career: zod_1.z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email inválido"),
    password: zod_1.z.string().min(1, "Contraseña requerida"),
    mfaToken: zod_1.z.string().optional().transform(val => val === "" ? undefined : val),
    rememberMe: zod_1.z.boolean().optional(),
});
exports.updateUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({
    id: true,
    passwordHash: true,
    email: true,
    createdAt: true,
    mfaSecret: true,
}).partial();
exports.updateUserProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "Nombre requerido").max(100).optional(),
    lastName: zod_1.z.string().min(1, "Apellido requerido").max(100).optional(),
    bio: zod_1.z.string().max(500, "Bio no puede exceder 500 caracteres").transform(val => val === "" ? null : val).nullable().optional(),
    avatarUrl: zod_1.z.string().url("Avatar URL debe ser válida").optional().or(zod_1.z.literal(null)).nullable(),
    bannerUrl: zod_1.z.string().url("Banner URL debe ser válida").optional().or(zod_1.z.literal(null)).nullable(),
    studentId: zod_1.z.string().max(20).optional().or(zod_1.z.literal(null)).nullable(),
    career: zod_1.z.string().max(100).optional().or(zod_1.z.literal(null)).nullable(),
});
exports.insertResourceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.resources).omit({
    id: true,
    slug: true,
    viewCount: true,
    downloadCount: true,
    createdAt: true,
    updatedAt: true,
});
exports.updateResourceSchema = exports.insertResourceSchema.partial();
exports.insertThreadSchema = (0, drizzle_zod_1.createInsertSchema)(exports.forumThreads).omit({
    id: true,
    slug: true,
    viewCount: true,
    replyCount: true,
    lastReplyAt: true,
    lastReplyBy: true,
    createdAt: true,
    updatedAt: true,
});
exports.insertPostSchema = (0, drizzle_zod_1.createInsertSchema)(exports.forumPosts).omit({
    id: true,
    isEdited: true,
    editedAt: true,
    upvotes: true,
    downvotes: true,
    createdAt: true,
    updatedAt: true,
});
exports.searchSchema = zod_1.z.object({
    query: zod_1.z.string().min(2, "La búsqueda debe tener al menos 2 caracteres"),
    type: zod_1.z.enum(["all", "pdf", "book", "thesis", "article", "document"]).optional(),
    categoryId: zod_1.z.number().optional(),
    careerId: zod_1.z.number().optional(),
    year: zod_1.z.number().optional(),
    language: zod_1.z.string().optional(),
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(50).default(20),
});
