export { B as Bindings, S as SonicJSApp, a as SonicJSConfig, V as Variables, W as WarpCMSApp, b as WarpCMSConfig, c as createSonicJSApp, d as createWarpCMSApp, s as setupCoreMiddleware, e as setupCoreRoutes } from './app-CrLkcj7q.cjs';
import { s as schema } from './plugin-bootstrap-Bb4lM9Qt.cjs';
export { C as Collection, a as Content, b as CorePlugin, P as DbPlugin, c as DbPluginHook, L as LogCategory, d as LogConfig, e as LogEntry, f as LogFilter, g as LogLevel, h as Logger, M as Media, i as Migration, j as MigrationService, k as MigrationStatus, N as NewCollection, l as NewContent, m as NewLogConfig, n as NewMedia, o as NewPlugin, p as NewPluginActivityLog, q as NewPluginAsset, r as NewPluginHook, t as NewPluginRoute, u as NewSystemLog, v as NewUser, w as NewWorkflowHistory, x as PluginActivityLog, y as PluginAsset, z as PluginBootstrapService, A as PluginRoute, B as PluginServiceClass, S as SystemLog, U as User, W as WorkflowHistory, D as apiTokens, E as cleanupRemovedCollections, F as collections, G as content, H as contentVersions, I as fullCollectionSync, J as getAvailableCollectionNames, K as getLogger, O as getManagedCollections, Q as initLogger, R as insertCollectionSchema, T as insertContentSchema, V as insertLogConfigSchema, X as insertMediaSchema, Y as insertPluginActivityLogSchema, Z as insertPluginAssetSchema, _ as insertPluginHookSchema, $ as insertPluginRouteSchema, a0 as insertPluginSchema, a1 as insertSystemLogSchema, a2 as insertUserSchema, a3 as insertWorkflowHistorySchema, a4 as isCollectionManaged, a5 as loadCollectionConfig, a6 as loadCollectionConfigs, a7 as logConfig, a8 as media, a9 as pluginActivityLog, aa as pluginAssets, ab as pluginHooks, ac as pluginRoutes, ad as plugins, ae as registerCollections, af as selectCollectionSchema, ag as selectContentSchema, ah as selectLogConfigSchema, ai as selectMediaSchema, aj as selectPluginActivityLogSchema, ak as selectPluginAssetSchema, al as selectPluginHookSchema, am as selectPluginRouteSchema, an as selectPluginSchema, ao as selectSystemLogSchema, ap as selectUserSchema, aq as selectWorkflowHistorySchema, ar as syncCollection, as as syncCollections, at as systemLogs, au as users, av as validateCollectionConfig, aw as workflowHistory } from './plugin-bootstrap-Bb4lM9Qt.cjs';
export { AuthManager, Permission, PermissionManager, UserPermissions, bootstrapMiddleware, cacheHeaders, compressionMiddleware, detailedLoggingMiddleware, getActivePlugins, isPluginActive, logActivity, loggingMiddleware, optionalAuth, performanceLoggingMiddleware, requireActivePlugin, requireActivePlugins, requireAnyPermission, requireAuth, requirePermission, requireRole, securityHeaders, securityLoggingMiddleware } from './middleware.cjs';
export { H as HookSystemImpl, a as HookUtils, P as PluginManagerClass, b as PluginRegistryImpl, c as PluginValidatorClass, S as ScopedHookSystemClass } from './plugin-manager-COxzL2R_.cjs';
export { ROUTES_INFO, adminApiRoutes, adminContentRoutes, adminDashboardRoutes, adminLogsRoutes, adminSettingsRoutes, adminUsersRoutes, apiContentCrudRoutes, apiMediaRoutes, apiRoutes, apiSystemRoutes, authRoutes } from './routes.cjs';
export { A as AlertData, C as ConfirmationDialogOptions, F as Filter, a as FilterBarData, b as FilterOption, c as FormData, d as FormField, P as PaginationData, T as TableColumn, e as TableData, g as getConfirmationDialogScript, r as renderAlert, f as renderConfirmationDialog, h as renderFilterBar, i as renderForm, j as renderFormField, k as renderPagination, l as renderTable } from './filter-bar.template-dvMmMKvK.cjs';
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
