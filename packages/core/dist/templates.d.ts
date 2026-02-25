export { A as AlertData, C as ConfirmationDialogOptions, F as Filter, a as FilterBarData, b as FilterOption, c as FormData, d as FormField, P as PaginationData, T as TableColumn, e as TableData, g as getConfirmationDialogScript, r as renderAlert, f as renderConfirmationDialog, h as renderFilterBar, i as renderForm, j as renderFormField, k as renderPagination, l as renderTable } from './filter-bar.template-dvMmMKvK.js';
import { HtmlEscapedString } from 'hono/utils/html';

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

export { type AdminLayoutCatalystData, type AdminLayoutData, renderAdminLayout, renderAdminLayoutCatalyst, renderLogo };
