import { Hono, Context } from 'hono';
import { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

/**
 * Main Application Factory
 *
 * Creates a configured WarpCMS application with all core functionality
 */

interface Bindings {
    DB: D1Database;
    CACHE_KV: KVNamespace;
    MEDIA_BUCKET: R2Bucket;
    ASSETS: Fetcher;
    EMAIL_QUEUE?: Queue;
    SENDGRID_API_KEY?: string;
    DEFAULT_FROM_EMAIL?: string;
    IMAGES_ACCOUNT_ID?: string;
    IMAGES_API_TOKEN?: string;
    ENVIRONMENT?: string;
    BUCKET_NAME?: string;
    GOOGLE_MAPS_API_KEY?: string;
}
interface Variables {
    user?: {
        userId: string;
        email: string;
        role: string;
        exp: number;
        iat: number;
    };
    requestId?: string;
    startTime?: number;
    appVersion?: string;
}
interface WarpCMSConfig {
    routes?: Array<{
        path: string;
        handler: Hono;
    }>;
    middleware?: {
        beforeAuth?: Array<(c: Context, next: () => Promise<void>) => Promise<void>>;
        afterAuth?: Array<(c: Context, next: () => Promise<void>) => Promise<void>>;
    };
    version?: string;
    name?: string;
}
type WarpCMSApp = Hono<{
    Bindings: Bindings;
    Variables: Variables;
}>;
/**
 * Create a WarpCMS application with core functionality
 *
 * @param config - Application configuration
 * @returns Configured Hono application
 *
 * @example
 * ```typescript
 * import { createWarpCMSApp } from '@warpcms/core'
 *
 * const app = createWarpCMSApp({
 *   collections: {
 *     directory: './src/collections',
 *     autoSync: true
 *   },
 *   plugins: {
 *     directory: './src/plugins',
 *     autoLoad: true
 *   }
 * })
 *
 * export default app
 * ```
 */
declare function createWarpCMSApp(config?: WarpCMSConfig): WarpCMSApp;
/** @deprecated Use WarpCMSConfig */
type SonicJSConfig = WarpCMSConfig;
/** @deprecated Use WarpCMSApp */
type SonicJSApp = WarpCMSApp;
/** @deprecated Use createWarpCMSApp */
declare const createSonicJSApp: typeof createWarpCMSApp;
/**
 * Setup core middleware (backward compatibility)
 *
 * @param _app - Hono application
 * @deprecated Use createWarpCMSApp() instead
 */
declare function setupCoreMiddleware(_app: WarpCMSApp): void;
/**
 * Setup core routes (backward compatibility)
 *
 * @param _app - Hono application
 * @deprecated Use createWarpCMSApp() instead
 */
declare function setupCoreRoutes(_app: WarpCMSApp): void;

export { type Bindings as B, type SonicJSApp as S, type Variables as V, type WarpCMSApp as W, type SonicJSConfig as a, type WarpCMSConfig as b, createSonicJSApp as c, createWarpCMSApp as d, setupCoreRoutes as e, setupCoreMiddleware as s };
