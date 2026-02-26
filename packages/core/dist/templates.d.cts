import { HtmlEscapedString } from 'hono/utils/html';

type AlertType = 'success' | 'error' | 'warning' | 'info';
interface AlertData {
    type: AlertType;
    title?: string;
    message: string;
    dismissible?: boolean;
    className?: string;
    icon?: boolean;
}
declare function renderAlert(data: AlertData): string;

interface ConfirmationDialogOptions {
    id: string;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmClass?: string;
    iconColor?: 'red' | 'yellow' | 'blue';
    onConfirm?: string;
}
declare function renderConfirmationDialog(options: ConfirmationDialogOptions): string;
/**
 * Helper function to show a confirmation dialog programmatically
 * Usage in templates: Add this script and call showConfirmDialog()
 */
declare function getConfirmationDialogScript(): string;

interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
    sortType?: 'string' | 'number' | 'date' | 'boolean';
    render?: (value: any, row: any) => string;
}
interface TableData<T = any> {
    columns: TableColumn[];
    rows: T[];
    selectable?: boolean;
    className?: string;
    emptyMessage?: string;
    tableId?: string;
    title?: string;
    rowClickable?: boolean;
    rowClickUrl?: (row: T) => string;
}
declare function renderTable<T = any>(data: TableData<T>): string;

interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    startItem: number;
    endItem: number;
    baseUrl: string;
    queryParams?: Record<string, string>;
    showPageNumbers?: boolean;
    maxPageNumbers?: number;
    showPageSizeSelector?: boolean;
    pageSizeOptions?: number[];
}
declare function renderPagination(data: PaginationData): string;

interface FilterOption {
    value: string;
    label: string;
    selected?: boolean;
    color?: string;
}
interface Filter {
    name: string;
    label: string;
    options: FilterOption[];
}
interface FilterBarData {
    filters: Filter[];
    actions?: Array<{
        label: string;
        className?: string;
        onclick?: string;
        hxGet?: string;
        hxTarget?: string;
    }>;
    bulkActions?: Array<{
        label: string;
        value: string;
        icon?: string;
        className?: string;
    }>;
}
declare function renderFilterBar(data: FilterBarData): string;

interface AdminLayoutData {
    title: string;
    pageTitle?: string;
    currentPath?: string;
    version?: string;
    enableExperimentalFeatures?: boolean;
    user?: {
        name: string;
        email: string;
        role: string;
    };
    scripts?: string[];
    styles?: string[];
    content: string | HtmlEscapedString;
    dynamicMenuItems?: Array<{
        label: string;
        path: string;
        icon: string;
    }>;
}
declare function renderAdminLayout(data: AdminLayoutData): string;

interface AdminLayoutCatalystData {
    title: string;
    pageTitle?: string;
    currentPath?: string;
    version?: string;
    enableExperimentalFeatures?: boolean;
    user?: {
        name: string;
        email: string;
        role: string;
    };
    scripts?: string[];
    styles?: string[];
    content: string | HtmlEscapedString;
    dynamicMenuItems?: Array<{
        label: string;
        path: string;
        icon: string;
    }>;
}
declare function renderAdminLayoutCatalyst(data: AdminLayoutCatalystData): string;

interface LogoData {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'white' | 'dark';
    showText?: boolean;
    showVersion?: boolean;
    version?: string;
    className?: string;
    href?: string;
}
declare function renderLogo(data?: LogoData): string;

export { type AdminLayoutCatalystData, type AdminLayoutData, type AlertData, type ConfirmationDialogOptions, type Filter, type FilterBarData, type FilterOption, type PaginationData, type TableColumn, type TableData, getConfirmationDialogScript, renderAdminLayout, renderAdminLayoutCatalyst, renderAlert, renderConfirmationDialog, renderFilterBar, renderLogo, renderPagination, renderTable };
