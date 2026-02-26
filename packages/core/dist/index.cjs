'use strict';

var chunkQQHOIOAN_cjs = require('./chunk-QQHOIOAN.cjs');
var chunkDAR77FE6_cjs = require('./chunk-DAR77FE6.cjs');
var chunkBKKWE5RI_cjs = require('./chunk-BKKWE5RI.cjs');
var chunkMK7URH7V_cjs = require('./chunk-MK7URH7V.cjs');
var chunkRWAB7PM6_cjs = require('./chunk-RWAB7PM6.cjs');
var chunkWGE45LOF_cjs = require('./chunk-WGE45LOF.cjs');
var chunkWC3DCDT4_cjs = require('./chunk-WC3DCDT4.cjs');
var chunkDWM25XXY_cjs = require('./chunk-DWM25XXY.cjs');
var chunkB5RS75ZO_cjs = require('./chunk-B5RS75ZO.cjs');
require('./chunk-TOACTYOV.cjs');
var chunkRCQ2HIQD_cjs = require('./chunk-RCQ2HIQD.cjs');
var chunkZN756PME_cjs = require('./chunk-ZN756PME.cjs');
require('./chunk-IGJUBJBW.cjs');
var hono = require('hono');
var d1 = require('drizzle-orm/d1');

// src/assets/favicon.ts
var faviconSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   version="1.1"
   id="Layer_1"
   x="0px"
   y="0px"
   viewBox="380 1300 257.89001 278.8855"
   xml:space="preserve"
   width="257.89001"
   height="278.8855"
   xmlns="http://www.w3.org/2000/svg">
<g
   id="g10"
   transform="translate(-383.935,-60.555509)">
	<g
   id="g9">
		<path
   fill="#f1f2f2"
   d="m 974.78,1398.211 c -5.016,6.574 -10.034,13.146 -15.048,19.721 -1.828,2.398 -3.657,4.796 -5.487,7.194 1.994,1.719 3.958,3.51 5.873,5.424 18.724,18.731 28.089,41.216 28.089,67.459 0,26.251 -9.366,48.658 -28.089,67.237 -18.731,18.579 -41.215,27.868 -67.459,27.868 -9.848,0 -19.156,-1.308 -27.923,-3.923 l -4.185,3.354 c -8.587,6.885 -17.154,13.796 -25.725,20.702 17.52,8.967 36.86,13.487 58.054,13.487 35.533,0 65.91,-12.608 91.124,-37.821 25.214,-25.215 37.821,-55.584 37.821,-91.125 0,-35.534 -12.607,-65.911 -37.821,-91.126 -3,-2.999 -6.078,-5.808 -9.224,-8.451 z"
   id="path2" />
		<path
   fill="#34d399"
   d="m 854.024,1585.195 20.001,-16.028 c 16.616,-13.507 33.04,-27.265 50.086,-40.251 1.13,-0.861 2.9,-1.686 2.003,-3.516 -0.843,-1.716 -2.481,-2.302 -4.484,-2.123 -8.514,0.765 -17.016,-0.538 -25.537,-0.353 -1.124,0.024 -2.768,0.221 -3.163,-1.25 -0.371,-1.369 1.088,-2.063 1.919,-2.894 6.26,-6.242 12.574,-12.43 18.816,-18.691 9.303,-9.327 18.565,-18.714 27.851,-28.066 1.848,-1.859 3.701,-3.713 5.549,-5.572 2.655,-2.661 5.309,-5.315 7.958,-7.982 0.574,-0.579 1.259,-1.141 1.246,-1.94 -0.004,-0.257 -0.078,-0.538 -0.254,-0.853 -0.556,-0.981 -1.441,-1.1 -2.469,-0.957 -0.658,0.096 -1.315,0.185 -1.973,0.275 -3.844,0.538 -7.689,1.076 -11.533,1.608 -3.641,0.505 -7.281,1.02 -10.922,1.529 -4.162,0.582 -8.324,1.158 -12.486,1.748 -1.142,0.161 -2.409,1.662 -3.354,0.508 -0.419,-0.508 -0.431,-1.028 -0.251,-1.531 0.269,-0.741 0.957,-1.441 1.387,-2.021 3.414,-4.58 6.882,-9.124 10.356,-13.662 1.74,-2.272 3.48,-4.544 5.214,-6.822 4.682,-6.141 9.369,-12.281 14.051,-18.422 0.09,-0.119 0.181,-0.237 0.271,-0.355 6.848,-8.98 13.7,-17.958 20.553,-26.936 0.488,-0.64 0.977,-1.28 1.465,-1.92 2.159,-2.828 4.315,-5.658 6.476,-8.486 4.197,-5.501 8.454,-10.954 12.67,-16.442 0.263,-0.347 0.538,-0.718 0.717,-1.106 0.269,-0.586 0.299,-1.196 -0.335,-1.776 -0.825,-0.753 -1.8,-0.15 -2.595,0.419 -0.67,0.472 -1.333,0.957 -1.955,1.489 -2.206,1.889 -4.401,3.797 -6.595,5.698 -3.958,3.438 -7.922,6.876 -11.976,10.194 -2.443,2.003 -4.865,4.028 -7.301,6.038 -18.689,-10.581 -39.53,-15.906 -62.549,-15.906 -35.54,0 -65.911,12.607 -91.125,37.82 -25.214,25.215 -37.821,55.592 -37.821,91.126 0,35.54 12.607,65.91 37.821,91.125 4.146,4.146 8.445,7.916 12.87,11.381 -9.015,11.14 -18.036,22.277 -27.034,33.429 -1.208,1.489 -3.755,3.151 -2.745,4.891 0.078,0.144 0.173,0.281 0.305,0.425 1.321,1.429 3.492,-1.303 4.933,-2.457 6.673,-5.333 13.333,-10.685 19.982,-16.042 3.707,-2.984 7.417,-5.965 11.124,-8.952 1.474,-1.188 2.951,-2.373 4.425,-3.561 6.41,-5.164 12.816,-10.333 19.238,-15.481 z m -56.472,-87.186 c 0,-26.243 9.29,-48.728 27.868,-67.459 18.579,-18.723 40.987,-28.089 67.238,-28.089 12.273,0 23.712,2.075 34.34,6.171 -3.37,2.905 -6.734,5.816 -10.069,8.762 -6.075,5.351 -12.365,10.469 -18.667,15.564 -4.179,3.378 -8.371,6.744 -12.514,10.164 -7.54,6.23 -15.037,12.52 -22.529,18.804 -7.091,5.955 -14.182,11.904 -21.19,17.949 -1.136,0.974 -3.055,1.907 -2.135,3.94 0.831,1.836 2.774,1.417 4.341,1.578 l 12.145,-0.599 14.151,-0.698 c 1.031,-0.102 2.192,-0.257 2.89,0.632 0.034,0.044 0.073,0.078 0.106,0.127 1.017,1.561 -0.67,2.105 -1.387,2.942 -6.308,7.318 -12.616,14.637 -18.978,21.907 -8.161,9.339 -16.353,18.649 -24.544,27.958 -2.146,2.433 -4.275,4.879 -6.422,7.312 -1.034,1.172 -2.129,2.272 -1.238,3.922 0.933,1.728 2.685,1.752 4.323,1.602 4.134,-0.367 8.263,-0.489 12.396,-0.492 0.242,0 0.485,-0.01 0.728,0 2.711,0.01 5.422,0.068 8.134,0.145 2.582,0.074 5.166,0.165 7.752,0.249 0.275,1.62 -0.879,2.356 -1.62,3.259 -1.333,1.626 -2.667,3.247 -4,4.867 -4.315,5.252 -8.62,10.514 -12.928,15.772 -3.562,-2.725 -7.007,-5.733 -10.324,-9.051 -18.577,-18.576 -27.867,-40.983 -27.867,-67.234 z"
   id="path9" />
	</g>
</g>
</svg>`;

// src/app.ts
function createWarpCMSApp(config = {}) {
  const app = new hono.Hono();
  const appVersion = config.version || chunkB5RS75ZO_cjs.getCoreVersion();
  const appName = config.name || "WarpCMS";
  app.use("*", async (c, next) => {
    c.set("appVersion", appVersion);
    await next();
  });
  app.use("*", chunkBKKWE5RI_cjs.metricsMiddleware());
  app.use("*", chunkBKKWE5RI_cjs.bootstrapMiddleware(config));
  if (config.middleware?.beforeAuth) {
    for (const middleware of config.middleware.beforeAuth) {
      app.use("*", middleware);
    }
  }
  app.use("*", async (_c, next) => {
    await next();
  });
  app.use("*", async (_c, next) => {
    await next();
  });
  if (config.middleware?.afterAuth) {
    for (const middleware of config.middleware.afterAuth) {
      app.use("*", middleware);
    }
  }
  app.get("/api/media/file/*", async (c) => {
    try {
      if (!c.env.MEDIA_BUCKET) {
        return c.json({ error: "R2 storage is not configured" }, 503);
      }
      const url = new URL(c.req.url);
      const r2Key = url.pathname.replace(/^\/api\/media\/file\//, "");
      if (!r2Key) {
        return c.notFound();
      }
      const object = await c.env.MEDIA_BUCKET.get(r2Key);
      if (!object) {
        return c.notFound();
      }
      const headers = new Headers();
      object.httpMetadata?.contentType && headers.set("Content-Type", object.httpMetadata.contentType);
      object.httpMetadata?.contentDisposition && headers.set("Content-Disposition", object.httpMetadata.contentDisposition);
      headers.set("Cache-Control", "public, max-age=31536000");
      headers.set("Access-Control-Allow-Origin", "*");
      return new Response(object.body, { headers });
    } catch (error) {
      console.error("Error serving media file:", error);
      return c.json({ error: "Failed to serve file" }, 500);
    }
  });
  app.route("/api", chunkQQHOIOAN_cjs.api_default);
  app.route("/api/media", chunkQQHOIOAN_cjs.apiMediaRoutes);
  app.route("/api/system", chunkQQHOIOAN_cjs.apiSystemRoutes);
  app.route("/admin/api", chunkQQHOIOAN_cjs.adminApiRoutes);
  app.route("/admin/dashboard", chunkQQHOIOAN_cjs.router);
  app.route("/admin/settings", chunkQQHOIOAN_cjs.adminSettingsRoutes);
  app.route("/admin/content", chunkQQHOIOAN_cjs.admin_content_default);
  app.route("/admin/logs", chunkQQHOIOAN_cjs.adminLogsRoutes);
  app.route("/admin", chunkQQHOIOAN_cjs.userRoutes);
  app.route("/auth", chunkQQHOIOAN_cjs.auth_default);
  app.route("/", chunkQQHOIOAN_cjs.test_cleanup_default);
  app.get("/favicon.svg", (c) => {
    return new Response(faviconSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000"
      }
    });
  });
  app.get("/files/*", async (c) => {
    try {
      const url = new URL(c.req.url);
      const pathname = url.pathname;
      const objectKey = pathname.replace(/^\/files\//, "");
      if (!objectKey) {
        return c.notFound();
      }
      const object = await c.env.MEDIA_BUCKET.get(objectKey);
      if (!object) {
        return c.notFound();
      }
      const headers = new Headers();
      object.httpMetadata?.contentType && headers.set("Content-Type", object.httpMetadata.contentType);
      object.httpMetadata?.contentDisposition && headers.set("Content-Disposition", object.httpMetadata.contentDisposition);
      headers.set("Cache-Control", "public, max-age=31536000");
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      return new Response(object.body, {
        headers
      });
    } catch (error) {
      console.error("Error serving file:", error);
      return c.notFound();
    }
  });
  if (config.routes) {
    for (const route of config.routes) {
      app.route(route.path, route.handler);
    }
  }
  app.get("/", (c) => {
    return c.redirect("/auth/login");
  });
  app.get("/health", (c) => {
    return c.json({
      name: appName,
      version: appVersion,
      status: "running",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.notFound((c) => {
    return c.json({ error: "Not Found", status: 404 }, 404);
  });
  app.onError((err, c) => {
    console.error(err);
    return c.json({ error: "Internal Server Error", status: 500 }, 500);
  });
  return app;
}
function createDb(d1$1) {
  return d1.drizzle(d1$1, { schema: chunkDAR77FE6_cjs.schema_exports });
}

// src/index.ts
var VERSION = chunkB5RS75ZO_cjs.package_default.version;

Object.defineProperty(exports, "ROUTES_INFO", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.ROUTES_INFO; }
});
Object.defineProperty(exports, "adminApiRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.adminApiRoutes; }
});
Object.defineProperty(exports, "adminContentRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.admin_content_default; }
});
Object.defineProperty(exports, "adminDashboardRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.router; }
});
Object.defineProperty(exports, "adminLogsRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.adminLogsRoutes; }
});
Object.defineProperty(exports, "adminSettingsRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.adminSettingsRoutes; }
});
Object.defineProperty(exports, "adminUsersRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.userRoutes; }
});
Object.defineProperty(exports, "apiContentCrudRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.api_content_crud_default; }
});
Object.defineProperty(exports, "apiMediaRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.apiMediaRoutes; }
});
Object.defineProperty(exports, "apiRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.api_default; }
});
Object.defineProperty(exports, "apiSystemRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.apiSystemRoutes; }
});
Object.defineProperty(exports, "authRoutes", {
  enumerable: true,
  get: function () { return chunkQQHOIOAN_cjs.auth_default; }
});
Object.defineProperty(exports, "Logger", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.Logger; }
});
Object.defineProperty(exports, "PluginBootstrapService", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.PluginBootstrapService; }
});
Object.defineProperty(exports, "PluginServiceClass", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.PluginService; }
});
Object.defineProperty(exports, "apiTokens", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.apiTokens; }
});
Object.defineProperty(exports, "collections", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.collections; }
});
Object.defineProperty(exports, "content", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.content; }
});
Object.defineProperty(exports, "contentVersions", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.contentVersions; }
});
Object.defineProperty(exports, "getLogger", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.getLogger; }
});
Object.defineProperty(exports, "initLogger", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.initLogger; }
});
Object.defineProperty(exports, "insertCollectionSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertCollectionSchema; }
});
Object.defineProperty(exports, "insertContentSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertContentSchema; }
});
Object.defineProperty(exports, "insertLogConfigSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertLogConfigSchema; }
});
Object.defineProperty(exports, "insertMediaSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertMediaSchema; }
});
Object.defineProperty(exports, "insertPluginActivityLogSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertPluginActivityLogSchema; }
});
Object.defineProperty(exports, "insertPluginAssetSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertPluginAssetSchema; }
});
Object.defineProperty(exports, "insertPluginHookSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertPluginHookSchema; }
});
Object.defineProperty(exports, "insertPluginRouteSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertPluginRouteSchema; }
});
Object.defineProperty(exports, "insertPluginSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertPluginSchema; }
});
Object.defineProperty(exports, "insertSystemLogSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertSystemLogSchema; }
});
Object.defineProperty(exports, "insertUserSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.insertUserSchema; }
});
Object.defineProperty(exports, "logConfig", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.logConfig; }
});
Object.defineProperty(exports, "media", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.media; }
});
Object.defineProperty(exports, "pluginActivityLog", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.pluginActivityLog; }
});
Object.defineProperty(exports, "pluginAssets", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.pluginAssets; }
});
Object.defineProperty(exports, "pluginHooks", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.pluginHooks; }
});
Object.defineProperty(exports, "pluginRoutes", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.pluginRoutes; }
});
Object.defineProperty(exports, "plugins", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.plugins; }
});
Object.defineProperty(exports, "selectCollectionSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectCollectionSchema; }
});
Object.defineProperty(exports, "selectContentSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectContentSchema; }
});
Object.defineProperty(exports, "selectLogConfigSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectLogConfigSchema; }
});
Object.defineProperty(exports, "selectMediaSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectMediaSchema; }
});
Object.defineProperty(exports, "selectPluginActivityLogSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectPluginActivityLogSchema; }
});
Object.defineProperty(exports, "selectPluginAssetSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectPluginAssetSchema; }
});
Object.defineProperty(exports, "selectPluginHookSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectPluginHookSchema; }
});
Object.defineProperty(exports, "selectPluginRouteSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectPluginRouteSchema; }
});
Object.defineProperty(exports, "selectPluginSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectPluginSchema; }
});
Object.defineProperty(exports, "selectSystemLogSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectSystemLogSchema; }
});
Object.defineProperty(exports, "selectUserSchema", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.selectUserSchema; }
});
Object.defineProperty(exports, "systemLogs", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.systemLogs; }
});
Object.defineProperty(exports, "users", {
  enumerable: true,
  get: function () { return chunkDAR77FE6_cjs.users; }
});
Object.defineProperty(exports, "AuthManager", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.AuthManager; }
});
Object.defineProperty(exports, "PermissionManager", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.PermissionManager; }
});
Object.defineProperty(exports, "bootstrapMiddleware", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.bootstrapMiddleware; }
});
Object.defineProperty(exports, "cacheHeaders", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.cacheHeaders; }
});
Object.defineProperty(exports, "compressionMiddleware", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.compressionMiddleware; }
});
Object.defineProperty(exports, "detailedLoggingMiddleware", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.detailedLoggingMiddleware; }
});
Object.defineProperty(exports, "getActivePlugins", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.getActivePlugins; }
});
Object.defineProperty(exports, "isPluginActive", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.isPluginActive; }
});
Object.defineProperty(exports, "logActivity", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.logActivity; }
});
Object.defineProperty(exports, "loggingMiddleware", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.loggingMiddleware; }
});
Object.defineProperty(exports, "optionalAuth", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.optionalAuth; }
});
Object.defineProperty(exports, "performanceLoggingMiddleware", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.performanceLoggingMiddleware; }
});
Object.defineProperty(exports, "requireActivePlugin", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.requireActivePlugin; }
});
Object.defineProperty(exports, "requireActivePlugins", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.requireActivePlugins; }
});
Object.defineProperty(exports, "requireAnyPermission", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.requireAnyPermission; }
});
Object.defineProperty(exports, "requireAuth", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.requireAuth; }
});
Object.defineProperty(exports, "requirePermission", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.requirePermission; }
});
Object.defineProperty(exports, "requireRole", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.requireRole; }
});
Object.defineProperty(exports, "securityHeaders", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.securityHeaders; }
});
Object.defineProperty(exports, "securityLoggingMiddleware", {
  enumerable: true,
  get: function () { return chunkBKKWE5RI_cjs.securityLoggingMiddleware; }
});
Object.defineProperty(exports, "MigrationService", {
  enumerable: true,
  get: function () { return chunkMK7URH7V_cjs.MigrationService; }
});
Object.defineProperty(exports, "renderFilterBar", {
  enumerable: true,
  get: function () { return chunkRWAB7PM6_cjs.renderFilterBar; }
});
Object.defineProperty(exports, "getConfirmationDialogScript", {
  enumerable: true,
  get: function () { return chunkWGE45LOF_cjs.getConfirmationDialogScript; }
});
Object.defineProperty(exports, "renderAdminLayout", {
  enumerable: true,
  get: function () { return chunkWGE45LOF_cjs.renderAdminLayout; }
});
Object.defineProperty(exports, "renderAlert", {
  enumerable: true,
  get: function () { return chunkWGE45LOF_cjs.renderAlert; }
});
Object.defineProperty(exports, "renderConfirmationDialog", {
  enumerable: true,
  get: function () { return chunkWGE45LOF_cjs.renderConfirmationDialog; }
});
Object.defineProperty(exports, "renderPagination", {
  enumerable: true,
  get: function () { return chunkWGE45LOF_cjs.renderPagination; }
});
Object.defineProperty(exports, "renderTable", {
  enumerable: true,
  get: function () { return chunkWGE45LOF_cjs.renderTable; }
});
Object.defineProperty(exports, "renderAdminLayoutCatalyst", {
  enumerable: true,
  get: function () { return chunkWC3DCDT4_cjs.renderAdminLayoutCatalyst; }
});
Object.defineProperty(exports, "renderLogo", {
  enumerable: true,
  get: function () { return chunkWC3DCDT4_cjs.renderLogo; }
});
Object.defineProperty(exports, "HookSystemImpl", {
  enumerable: true,
  get: function () { return chunkDWM25XXY_cjs.HookSystemImpl; }
});
Object.defineProperty(exports, "HookUtils", {
  enumerable: true,
  get: function () { return chunkDWM25XXY_cjs.HookUtils; }
});
Object.defineProperty(exports, "PluginManagerClass", {
  enumerable: true,
  get: function () { return chunkDWM25XXY_cjs.PluginManager; }
});
Object.defineProperty(exports, "PluginRegistryImpl", {
  enumerable: true,
  get: function () { return chunkDWM25XXY_cjs.PluginRegistryImpl; }
});
Object.defineProperty(exports, "PluginValidatorClass", {
  enumerable: true,
  get: function () { return chunkDWM25XXY_cjs.PluginValidator; }
});
Object.defineProperty(exports, "ScopedHookSystemClass", {
  enumerable: true,
  get: function () { return chunkDWM25XXY_cjs.ScopedHookSystem; }
});
Object.defineProperty(exports, "QueryFilterBuilder", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.QueryFilterBuilder; }
});
Object.defineProperty(exports, "SONICJS_VERSION", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.SONICJS_VERSION; }
});
Object.defineProperty(exports, "TemplateRenderer", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.TemplateRenderer; }
});
Object.defineProperty(exports, "WARPJS_VERSION", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.WARPJS_VERSION; }
});
Object.defineProperty(exports, "buildQuery", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.buildQuery; }
});
Object.defineProperty(exports, "escapeHtml", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.escapeHtml; }
});
Object.defineProperty(exports, "getCoreVersion", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.getCoreVersion; }
});
Object.defineProperty(exports, "getWarpCMSVersion", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.getWarpCMSVersion; }
});
Object.defineProperty(exports, "renderTemplate", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.renderTemplate; }
});
Object.defineProperty(exports, "sanitizeInput", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.sanitizeInput; }
});
Object.defineProperty(exports, "sanitizeObject", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.sanitizeObject; }
});
Object.defineProperty(exports, "templateRenderer", {
  enumerable: true,
  get: function () { return chunkB5RS75ZO_cjs.templateRenderer; }
});
Object.defineProperty(exports, "metricsTracker", {
  enumerable: true,
  get: function () { return chunkRCQ2HIQD_cjs.metricsTracker; }
});
Object.defineProperty(exports, "HOOKS", {
  enumerable: true,
  get: function () { return chunkZN756PME_cjs.HOOKS; }
});
exports.VERSION = VERSION;
exports.createDb = createDb;
exports.createWarpCMSApp = createWarpCMSApp;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map