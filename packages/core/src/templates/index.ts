/**
 * Templates Module Exports
 *
 * Reusable HTML template components for WarpCMS
 */

// Component templates (used by public API consumers)
export { renderAlert } from './components/alert.template'
export type { AlertData } from './components/alert.template'
export { renderConfirmationDialog, getConfirmationDialogScript } from './components/confirmation-dialog.template'
export type { ConfirmationDialogOptions } from './components/confirmation-dialog.template'
export { renderTable } from './components/table.template'
export type { TableColumn, TableData } from './components/table.template'
export { renderPagination } from './components/pagination.template'
export type { PaginationData } from './components/pagination.template'
export { renderFilterBar } from './filter-bar.template'
export type { FilterBarData, Filter, FilterOption } from './filter-bar.template'

// Layout templates
export { renderAdminLayout } from './layouts/admin-layout-v2.template'
export { renderAdminLayoutCatalyst } from './layouts/admin-layout-catalyst.template'
export type { AdminLayoutData } from './layouts/admin-layout-v2.template'
export type { AdminLayoutCatalystData } from './layouts/admin-layout-catalyst.template'

// Component templates
export { renderLogo } from './components/logo.template'
