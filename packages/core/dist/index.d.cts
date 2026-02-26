export { B as Bindings, V as Variables, W as WarpCMSApp, a as WarpCMSConfig, c as createWarpCMSApp } from './app-DIYd-vU0.cjs';
import { s as schema } from './plugin-bootstrap-FCLFArwJ.cjs';
export { C as Collection, a as Content, b as CorePlugin, P as DbPlugin, c as DbPluginHook, L as LogCategory, d as LogConfig, e as LogEntry, f as LogFilter, g as LogLevel, h as Logger, M as Media, i as Migration, j as MigrationService, k as MigrationStatus, N as NewCollection, l as NewContent, m as NewLogConfig, n as NewMedia, o as NewPlugin, p as NewPluginActivityLog, q as NewPluginAsset, r as NewPluginHook, t as NewPluginRoute, u as NewSystemLog, v as NewUser, w as PluginActivityLog, x as PluginAsset, y as PluginBootstrapService, z as PluginRoute, A as PluginServiceClass, S as SystemLog, U as User, B as apiTokens, D as collections, E as content, F as contentVersions, G as getLogger, H as initLogger, I as insertCollectionSchema, J as insertContentSchema, K as insertLogConfigSchema, O as insertMediaSchema, Q as insertPluginActivityLogSchema, R as insertPluginAssetSchema, T as insertPluginHookSchema, V as insertPluginRouteSchema, W as insertPluginSchema, X as insertSystemLogSchema, Y as insertUserSchema, Z as logConfig, _ as media, $ as pluginActivityLog, a0 as pluginAssets, a1 as pluginHooks, a2 as pluginRoutes, a3 as plugins, a4 as selectCollectionSchema, a5 as selectContentSchema, a6 as selectLogConfigSchema, a7 as selectMediaSchema, a8 as selectPluginActivityLogSchema, a9 as selectPluginAssetSchema, aa as selectPluginHookSchema, ab as selectPluginRouteSchema, ac as selectPluginSchema, ad as selectSystemLogSchema, ae as selectUserSchema, af as systemLogs, ag as users } from './plugin-bootstrap-FCLFArwJ.cjs';
export { AuthManager, Permission, PermissionManager, UserPermissions, bootstrapMiddleware, cacheHeaders, compressionMiddleware, detailedLoggingMiddleware, getActivePlugins, isPluginActive, logActivity, loggingMiddleware, optionalAuth, performanceLoggingMiddleware, requireActivePlugin, requireActivePlugins, requireAnyPermission, requireAuth, requirePermission, requireRole, securityHeaders, securityLoggingMiddleware } from './middleware.cjs';
export { H as HookSystemImpl, a as HookUtils, P as PluginManagerClass, b as PluginRegistryImpl, c as PluginValidatorClass, S as ScopedHookSystemClass } from './plugin-manager-COxzL2R_.cjs';
export { ROUTES_INFO, adminApiRoutes, adminContentRoutes, adminDashboardRoutes, adminLogsRoutes, adminSettingsRoutes, adminUsersRoutes, apiContentCrudRoutes, apiMediaRoutes, apiRoutes, apiSystemRoutes, authRoutes } from './routes.cjs';
export { AdminLayoutCatalystData, AdminLayoutData, AlertData, ConfirmationDialogOptions, Filter, FilterBarData, FilterOption, PaginationData, TableColumn, TableData, getConfirmationDialogScript, renderAdminLayout, renderAdminLayoutCatalyst, renderAlert, renderConfirmationDialog, renderFilterBar, renderLogo, renderPagination, renderTable } from './templates.cjs';
export { C as CollectionConfig, b as CollectionConfigModule, c as CollectionSchema, d as CollectionSyncResult, F as FieldConfig, e as FieldType } from './collection-config-D_PFMBug.cjs';
export { A as AuthService, C as ContentService, H as HOOKS, a as HookContext, b as HookHandler, c as HookName, d as HookSystem, M as MediaService, P as Plugin, f as PluginAdminPage, g as PluginBuilderOptions, h as PluginComponent, i as PluginConfig, j as PluginContext, k as PluginHook, l as PluginLogger, m as PluginManager, n as PluginMenuItem, o as PluginMiddleware, p as PluginModel, q as PluginRegistry, r as PluginRoutes, s as PluginService, t as PluginStatus, u as PluginValidationResult, v as PluginValidator, S as ScopedHookSystem } from './plugin-s6JZLdGa.cjs';
export { P as PluginManifest } from './plugin-manifest-Dpy8wxIB.cjs';
export { F as FilterCondition, a as FilterGroup, b as FilterOperator, Q as QueryFilter, c as QueryFilterBuilder, d as QueryResult, S as SONICJS_VERSION, T as TemplateRenderer, W as WARPJS_VERSION, e as buildQuery, f as escapeHtml, g as getCoreVersion, h as getWarpCMSVersion, m as metricsTracker, r as renderTemplate, s as sanitizeInput, i as sanitizeObject, t as templateRenderer } from './version-LCm7EO5h.cjs';
import * as drizzle_orm_d1 from 'drizzle-orm/d1';
import 'hono';
import '@cloudflare/workers-types';
import 'drizzle-zod';
import 'drizzle-orm/sqlite-core';
import 'hono/types';
import 'hono/utils/html';
import 'zod';

declare function createDb(d1: D1Database): drizzle_orm_d1.DrizzleD1Database<typeof schema> & {
    $client: D1Database;
};

/**
 * @warpcms/core - Main Entry Point
 *
 * Core framework for WarpCMS headless CMS
 * Built for Cloudflare's edge platform with TypeScript
 *
 * Phase 2 Migration Status:
 * - Week 1: Types, Utils, Database (COMPLETED ✓)
 * - Week 2: Services, Middleware, Plugins (COMPLETED ✓)
 * - Week 3: Routes, Templates (COMPLETED ✓)
 * - Week 4: Integration & Testing (COMPLETED ✓)
 *
 * Test Coverage:
 * - Utilities: 48 tests (sanitize, query-filter, metrics)
 * - Middleware: 51 tests (auth, logging, security, performance)
 * - Total: 99 tests passing
 */

declare const VERSION: string;

export { VERSION, createDb };
