import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Users table for authentication and user management
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  passwordHash: text('password_hash'), // Hashed password, nullable for OAuth users
  role: text('role').notNull().default('viewer'), // 'admin', 'editor', 'author', 'viewer'
  avatar: text('avatar'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  language: text('language').notNull().default('en'), // 'en', 'pt', 'es'
  lastLoginAt: integer('last_login_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Content collections - dynamic schema definitions
export const collections = sqliteTable('collections', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  schema: text('schema', { mode: 'json' }).notNull(), // JSON schema definition
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  managed: integer('managed', { mode: 'boolean' }).notNull().default(false), // Config-managed collections cannot be edited in UI
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Content items - actual content data
export const content = sqliteTable('content', {
  id: text('id').primaryKey(),
  collectionId: text('collection_id').notNull(), // content type name (image, text, file)
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  data: text('data', { mode: 'json' }).notNull(), // JSON content data
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Content versions for versioning system
export const contentVersions = sqliteTable('content_versions', {
  id: text('id').primaryKey(),
  contentId: text('content_id').notNull().references(() => content.id),
  version: integer('version').notNull(),
  data: text('data', { mode: 'json' }).notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Media/Files table
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  folder: text('folder').notNull().default('uploads'),
  r2Key: text('r2_key').notNull(), // R2 storage key
  publicUrl: text('public_url').notNull(), // CDN URL
  thumbnailUrl: text('thumbnail_url'),
  alt: text('alt'),
  caption: text('caption'),
  tags: text('tags', { mode: 'json' }), // JSON array of tags
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  uploadedAt: integer('uploaded_at').notNull(),
  updatedAt: integer('updated_at'),
  publishedAt: integer('published_at'),
  scheduledAt: integer('scheduled_at'),
  archivedAt: integer('archived_at'),
  deletedAt: integer('deleted_at'),
});

// API tokens for programmatic access
export const apiTokens = sqliteTable('api_tokens', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  permissions: text('permissions', { mode: 'json' }).notNull(), // Array of permissions
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});


// Plugin system tables
export const plugins = sqliteTable('plugins', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  version: text('version').notNull(),
  author: text('author').notNull(),
  category: text('category').notNull(),
  icon: text('icon'),
  status: text('status').notNull().default('inactive'), // 'active', 'inactive', 'error'
  isCore: integer('is_core', { mode: 'boolean' }).notNull().default(false),
  settings: text('settings', { mode: 'json' }),
  permissions: text('permissions', { mode: 'json' }),
  dependencies: text('dependencies', { mode: 'json' }),
  downloadCount: integer('download_count').notNull().default(0),
  rating: integer('rating').notNull().default(0),
  installedAt: integer('installed_at').notNull(),
  activatedAt: integer('activated_at'),
  lastUpdated: integer('last_updated').notNull(),
  errorMessage: text('error_message'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const pluginHooks = sqliteTable('plugin_hooks', {
  id: text('id').primaryKey(),
  pluginId: text('plugin_id').notNull().references(() => plugins.id),
  hookName: text('hook_name').notNull(),
  handlerName: text('handler_name').notNull(),
  priority: integer('priority').notNull().default(10),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const pluginRoutes = sqliteTable('plugin_routes', {
  id: text('id').primaryKey(),
  pluginId: text('plugin_id').notNull().references(() => plugins.id),
  path: text('path').notNull(),
  method: text('method').notNull(),
  handlerName: text('handler_name').notNull(),
  middleware: text('middleware', { mode: 'json' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

export const pluginActivityLog = sqliteTable('plugin_activity_log', {
  id: text('id').primaryKey(),
  pluginId: text('plugin_id').notNull().references(() => plugins.id),
  action: text('action').notNull(),
  userId: text('user_id'),
  details: text('details', { mode: 'json' }),
  timestamp: integer('timestamp').notNull().$defaultFn(() => Math.floor(Date.now() / 1000)),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: (schema: any) => schema.email(),
  firstName: (schema: any) => schema.min(1),
  lastName: (schema: any) => schema.min(1),
  username: (schema: any) => schema.min(3),
});

export const selectUserSchema = createSelectSchema(users);

export const insertCollectionSchema = createInsertSchema(collections, {
  name: (schema: any) => schema.min(1).regex(/^[a-z0-9_]+$/, 'Collection name must be lowercase with underscores'),
  displayName: (schema: any) => schema.min(1),
});

export const selectCollectionSchema = createSelectSchema(collections);

export const insertContentSchema = createInsertSchema(content, {
  slug: (schema: any) => schema.min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Slug must contain only letters, numbers, underscores, and hyphens'),
  title: (schema: any) => schema.min(1),
});

export const selectContentSchema = createSelectSchema(content);

export const insertMediaSchema = createInsertSchema(media, {
  filename: (schema: any) => schema.min(1),
  originalName: (schema: any) => schema.min(1),
  mimeType: (schema: any) => schema.min(1),
  size: (schema: any) => schema.positive(),
  r2Key: (schema: any) => schema.min(1),
  publicUrl: (schema: any) => schema.url(),
  folder: (schema: any) => schema.min(1),
});

export const selectMediaSchema = createSelectSchema(media);


export const insertPluginSchema = createInsertSchema(plugins, {
  name: (schema: any) => schema.min(1),
  displayName: (schema: any) => schema.min(1),
  version: (schema: any) => schema.min(1),
  author: (schema: any) => schema.min(1),
  category: (schema: any) => schema.min(1),
});

export const selectPluginSchema = createSelectSchema(plugins);

export const insertPluginHookSchema = createInsertSchema(pluginHooks, {
  hookName: (schema: any) => schema.min(1),
  handlerName: (schema: any) => schema.min(1),
});

export const selectPluginHookSchema = createSelectSchema(pluginHooks);

export const insertPluginRouteSchema = createInsertSchema(pluginRoutes, {
  path: (schema: any) => schema.min(1),
  method: (schema: any) => schema.min(1),
  handlerName: (schema: any) => schema.min(1),
});

export const selectPluginRouteSchema = createSelectSchema(pluginRoutes);

export const insertPluginActivityLogSchema = createInsertSchema(pluginActivityLog, {
  action: (schema: any) => schema.min(1),
});

export const selectPluginActivityLogSchema = createSelectSchema(pluginActivityLog);

// System logs table for comprehensive logging
export const systemLogs = sqliteTable('system_logs', {
  id: text('id').primaryKey(),
  level: text('level').notNull(), // 'debug', 'info', 'warn', 'error', 'fatal'
  category: text('category').notNull(), // 'auth', 'api', 'workflow', 'plugin', 'media', 'system', etc.
  message: text('message').notNull(),
  data: text('data', { mode: 'json' }), // Additional structured data
  userId: text('user_id').references(() => users.id),
  sessionId: text('session_id'),
  requestId: text('request_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  method: text('method'), // HTTP method for API logs
  url: text('url'), // Request URL for API logs
  statusCode: integer('status_code'), // HTTP status code for API logs
  duration: integer('duration'), // Request duration in milliseconds
  stackTrace: text('stack_trace'), // Error stack trace for error logs
  tags: text('tags', { mode: 'json' }), // Array of tags for categorization
  source: text('source'), // Source component/module that generated the log
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});


// Insert and select schemas for system logs
export const insertSystemLogSchema = createInsertSchema(systemLogs, {
  level: (schema: any) => schema.min(1),
  category: (schema: any) => schema.min(1),
  message: (schema: any) => schema.min(1),
});

export const selectSystemLogSchema = createSelectSchema(systemLogs);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Plugin = typeof plugins.$inferSelect;
export type NewPlugin = typeof plugins.$inferInsert;
export type PluginHook = typeof pluginHooks.$inferSelect;
export type NewPluginHook = typeof pluginHooks.$inferInsert;
export type PluginRoute = typeof pluginRoutes.$inferSelect;
export type NewPluginRoute = typeof pluginRoutes.$inferInsert;
export type PluginActivityLog = typeof pluginActivityLog.$inferSelect;
export type NewPluginActivityLog = typeof pluginActivityLog.$inferInsert;
export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;

