import * as hono_types from 'hono/types';
import { Hono } from 'hono';
import { B as Bindings$2, V as Variables$3 } from './app-CrLkcj7q.cjs';
import { D1Database as D1Database$1, KVNamespace as KVNamespace$1, R2Bucket as R2Bucket$1 } from '@cloudflare/workers-types';

interface Variables$2 extends Variables$3 {
    startTime: number;
    cacheEnabled?: boolean;
}
declare const apiRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$2;
}, hono_types.BlankSchema, "/">;

declare const apiContentCrudRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$3;
}, hono_types.BlankSchema, "/">;

declare const apiMediaRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$3;
}, hono_types.BlankSchema, "/">;

declare const apiSystemRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$3;
}, hono_types.BlankSchema, "/">;

declare const adminApiRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$3;
}, hono_types.BlankSchema, "/">;

declare const authRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$3;
}, hono_types.BlankSchema, "/">;

declare const app: Hono<hono_types.BlankEnv, hono_types.BlankSchema, "/">;

declare const adminContentRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$3;
}, hono_types.BlankSchema, "/">;

declare const userRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$3;
}, hono_types.BlankSchema, "/">;

declare const adminLogsRoutes: Hono<{
    Bindings: Bindings$2;
    Variables: Variables$3;
}, hono_types.BlankSchema, "/">;

type Bindings$1 = {
    DB: D1Database$1;
    CACHE_KV: KVNamespace$1;
    MEDIA_BUCKET: R2Bucket$1;
};
type Variables$1 = {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
};
declare const router: Hono<{
    Bindings: Bindings$1;
    Variables: Variables$1;
}, hono_types.BlankSchema, "/">;

type Bindings = {
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
};
type Variables = {
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
};
declare const adminSettingsRoutes: Hono<{
    Bindings: Bindings;
    Variables: Variables;
}, hono_types.BlankSchema, "/">;

/**
 * Routes Module Exports
 */

declare const ROUTES_INFO: {
    readonly message: "Core routes available";
    readonly available: readonly ["apiRoutes", "apiContentCrudRoutes", "apiMediaRoutes", "apiSystemRoutes", "adminApiRoutes", "authRoutes", "testCleanupRoutes", "adminContentRoutes", "adminUsersRoutes", "adminLogsRoutes", "adminDashboardRoutes", "adminSettingsRoutes"];
    readonly status: "Core package routes ready";
    readonly reference: "https://github.com/badmuriss/warpcms";
};

export { ROUTES_INFO, adminApiRoutes, adminContentRoutes, router as adminDashboardRoutes, adminLogsRoutes, adminSettingsRoutes, userRoutes as adminUsersRoutes, apiContentCrudRoutes, apiMediaRoutes, apiRoutes, apiSystemRoutes, authRoutes, app as testCleanupRoutes };
