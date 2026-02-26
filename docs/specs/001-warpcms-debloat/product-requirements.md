# Product Requirements: WarpCMS Debloat

## 1. Problem Statement

WarpCMS carries significant dead weight from its SonicJS fork origins. The codebase contains 67 unused files, 4 fake settings categories rendered in UI but backed by hardcoded mock data, redundant content types, and dozens of unused exports/dependencies. This bloat increases bundle size, confuses contributors, and creates a false impression of features that don't actually work.

## 2. Goals

1. **Remove dead code** - Delete unused files, exports, types, and dependencies identified by knip
2. **Strip fake settings** - Remove appearance, security, notifications, and storage settings tabs that only display mock data
3. **Consolidate content types** - Merge PDF into the generic file type (browsers handle PDF display natively); remove the HTML content type entirely
4. **Clean dependencies** - Remove unused packages from both root and core package.json

## 3. Non-Goals

- Adding new features or settings that actually work
- Changing the database schema (existing content rows with `collectionId = 'pdf'` or `'html'` need a migration strategy, but the goal is removal not replacement)
- Redesigning the settings page architecture
- Touching the plugin system architecture (plugins are loaded dynamically; knip flags them as unused because it can't trace dynamic imports)

## 4. Requirements

### 4.1 Content Type Consolidation

#### 4.1.1 Remove PDF content type

| Field | Detail |
|-------|--------|
| **What** | Delete the `pdf` entry from `CONTENT_TYPES` in `content-types.ts` |
| **Why** | PDF is just a file with `accept: 'application/pdf'`. The generic `file` type already accepts any file including PDFs. Browsers open PDFs inline and download everything else - this is browser behavior, not CMS behavior. |
| **Migration** | Existing content rows with `collectionId = 'pdf'` must be migrated to `collectionId = 'file'` via a SQL migration |
| **Acceptance** | No "PDF" option in content creation UI. Existing PDF content accessible under "File" type. |

#### 4.1.2 Remove HTML content type

| Field | Detail |
|-------|--------|
| **What** | Delete the `html` entry from `CONTENT_TYPES` in `content-types.ts` |
| **Why** | The HTML type uses a richtext editor to produce HTML content. This is functionally identical to the `text` type but with a different editor. If rich editing is needed in the future, it should be a field-level capability (richtext field type) not a separate content type. |
| **Migration** | Existing content rows with `collectionId = 'html'` must be migrated to `collectionId = 'text'`. The `content` field data (HTML markup) is preserved as-is. |
| **Acceptance** | No "HTML" option in content creation UI. Existing HTML content accessible under "Text" type. |

#### 4.1.3 Resulting content types

After consolidation, WarpCMS has **3 content types**:

| Type | Purpose | Has file upload |
|------|---------|----------------|
| **image** | Images with metadata (alt text, etc.) | Yes (image/* only) |
| **text** | Text/markup content | No |
| **file** | Any downloadable file (PDF, DOCX, etc.) | Yes (any type) |

### 4.2 Settings Page Cleanup

#### 4.2.1 Remove mock settings tabs

Remove these settings tabs and their associated routes, templates, and mock data:

| Tab | Route | Reason |
|-----|-------|--------|
| **Appearance** | `/admin/settings/appearance` | 100% mock data. No POST handler. Theme/color/CSS never saved. |
| **Security** | `/admin/settings/security` | 100% mock data. 2FA, session timeout, IP whitelist - none functional. |
| **Notifications** | `/admin/settings/notifications` | 100% mock data. Email notification toggles do nothing. |
| **Storage** | `/admin/settings/storage` | 100% mock data. File size limits, backup frequency - not enforced. |

#### 4.2.2 Keep these settings tabs

| Tab | Route | Reason |
|-----|-------|--------|
| **General** | `/admin/settings/general` | Fully functional - reads/writes to DB via SettingsService |
| **Migrations** | `/admin/settings/migrations` | Functional - real migration status from MigrationService |
| **Database Tools** | `/admin/settings/database-tools` | Functional - real DB stats, integrity check, truncate |

#### 4.2.3 Acceptance criteria

- Settings page shows only 3 tabs: General, Migrations, Database Tools
- No broken links or references to removed tabs in navigation
- `getMockSettings()` function removed or reduced to only provide defaults for General settings
- Settings template reduced from ~1568 lines by removing 4 tab panels

### 4.3 Dead Code Removal

#### 4.3.1 Unused files (67 files from knip)

**Category breakdown:**

| Category | Count | Action |
|----------|-------|--------|
| Plugin files (core-plugins, available, design, sdk, config) | 47 | **Keep** - Plugins are dynamically loaded; knip can't trace them |
| Unused route files (admin-api-reference, admin-collections, admin-media) | 3 | Delete |
| Unused template files (6 component templates, 5 page templates) | 11 | Delete |
| Unused middleware (admin-setup.ts) | 1 | Delete |
| Cache plugin (index.ts) | 1 | **Keep** - dynamically loaded |
| Duplicate template files (root-level alert, confirmation-dialog, etc.) | 4 | Delete after confirming components/ versions are used |

> **Important**: Plugin files must NOT be deleted. Knip reports them as unused because plugins use dynamic imports via the plugin manager. The 47 plugin-related files are valid code.

#### 4.3.2 Unused exports (56 exports, 37 types)

- Remove exports not consumed by any other module
- Exception: exports that are part of the public SDK/API surface (re-exported from `index.ts`)
- Test fixture exports (`__tests__/utils/`) can be cleaned up separately

#### 4.3.3 Unused dependencies

**Root package.json - remove:**

| Package | Reason |
|---------|--------|
| `@hono/zod-openapi` | Not imported anywhere |
| `@hono/zod-validator` | Not imported anywhere |
| `@warpcms/core` | Workspace reference, not needed in root |
| `drizzle-kit` | Should be devDependency if needed at all |
| `drizzle-orm` | Consumed by core package, not root |
| `drizzle-zod` | Consumed by core package, not root |
| `highlight.js` | Consumed by core package, not root |
| `hono` | Consumed by core package, not root |
| `marked` | Consumed by core package, not root |
| `semver` | Consumed by core package, not root |
| `zod` | Consumed by core package, not root |

**Root package.json devDependencies - remove:**

| Package | Reason |
|---------|--------|
| `@cloudflare/workers-types` | Consumed by core, not root |
| `@vitest/coverage-v8` | Verify if tests run from root or core |
| `glob` | Not imported in core package |

> Note: `vitest` and `wrangler` in root may be needed if scripts run from workspace root. Verify before removing.

**Core package.json - remove:**

| Package | Reason |
|---------|--------|
| `highlight.js` (if unused after template cleanup) | Verify after dead template removal |

#### 4.3.4 Duplicate exports

Fix 3 duplicate export cases:
- `adminApiRoutes|default` in `routes/admin-api.ts`
- `apiMediaRoutes|default` in `routes/api-media.ts`
- `apiSystemRoutes|default` in `routes/api-system.ts`

### 4.4 Template Cleanup

Remove template files that are no longer imported after route/feature removal:

| Template | Reason |
|----------|--------|
| `admin-api-reference.template.ts` | Route file unused |
| `admin-collections-form.template.ts` | Route file unused |
| `admin-collections-list.template.ts` | Route file unused |
| `admin-database-table.template.ts` | No corresponding route |
| `admin-field-types.template.ts` | No corresponding route |
| `admin-media-library.template.ts` | Route file unused |
| `form.template.ts` (component) | Unused component |
| `media-file-details.template.ts` | Unused component |
| `media-grid.template.ts` | Unused component |
| `pagination.template.ts` (component) | Unused component |
| `table.template.ts` (component) | Unused component |

Also remove root-level duplicate templates if `components/` versions exist:
- `templates/alert.template.ts` (duplicate of `components/alert.template.ts`)
- `templates/confirmation-dialog.template.ts`
- `templates/filter-bar.template.ts`
- `templates/form.template.ts`
- `templates/pagination.template.ts`
- `templates/table.template.ts`

## 5. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Deleting a plugin file that's actually loaded at runtime | Plugin breaks | Do NOT delete any file under `plugins/` directories |
| Existing content with `collectionId = 'pdf'` or `'html'` becomes inaccessible | Data loss for users | SQL migration to remap collectionId values before removing types |
| Root dependencies needed by workspace scripts | Build breaks | Test `npm run build`, `npm test`, `npm run dev` after cleanup |
| Template removal breaks a route that imports it | 500 errors | Verify each template's import chain before deleting |

## 6. Success Metrics

- Knip reports 0 unused files (excluding plugin false positives)
- Knip reports 0 unused dependencies
- Settings page renders 3 tabs only
- Content creation offers 3 types: image, text, file
- All existing tests pass
- Build succeeds (`npm run build:core`)
- Bundle size reduction measured before/after

## 7. Validation Checklist

- [ ] Problem statement clearly defined
- [ ] Goals are specific and measurable
- [ ] Non-goals explicitly stated
- [ ] All requirements have acceptance criteria
- [ ] Migration path defined for content type changes
- [ ] Risk mitigations identified
- [ ] No implementation details (only what, not how)
