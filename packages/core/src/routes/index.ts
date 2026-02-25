/**
 * Routes Module Exports
 */

// API routes
export { default as apiRoutes } from './api'
export { default as apiContentCrudRoutes } from './api-content-crud'
export { default as apiMediaRoutes } from './api-media'
export { default as apiSystemRoutes } from './api-system'
export { default as adminApiRoutes } from './admin-api'

// Auth routes
export { default as authRoutes } from './auth'

// Test routes (only for development/test environments)
export { default as testCleanupRoutes } from './test-cleanup'

// Admin UI routes
export { default as adminContentRoutes } from './admin-content'
export { userRoutes as adminUsersRoutes } from './admin-users'
export { adminLogsRoutes } from './admin-logs'
export { adminDashboardRoutes } from './admin-dashboard'
export { adminSettingsRoutes } from './admin-settings'

export const ROUTES_INFO = {
  message: 'Core routes available',
  available: [
    'apiRoutes',
    'apiContentCrudRoutes',
    'apiMediaRoutes',
    'apiSystemRoutes',
    'adminApiRoutes',
    'authRoutes',
    'testCleanupRoutes',
    'adminContentRoutes',
    'adminUsersRoutes',
    'adminLogsRoutes',
    'adminDashboardRoutes',
    'adminSettingsRoutes',
  ],
  status: 'Core package routes ready',
  reference: 'https://github.com/badmuriss/warpcms'
} as const
