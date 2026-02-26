# Implementation Plan

## Validation Checklist

- [x] All specification file paths are correct and exist
- [x] Context priming section is complete
- [x] All implementation phases are defined
- [x] Each phase follows TDD: Prime -> Test -> Implement -> Validate
- [x] Dependencies between phases are clear (no circular dependencies)
- [x] Parallel work is properly tagged with `[parallel: true]`
- [x] Activity hints provided for specialist selection `[activity: type]`
- [x] Every phase references relevant SDD sections
- [x] Every test references PRD acceptance criteria
- [x] Integration & E2E tests defined in final phase
- [x] Project commands match actual project setup
- [x] A developer could follow this plan independently

---

## Specification Compliance Guidelines

### Deviation Protocol

If implementation cannot follow specification exactly:
1. Document the deviation and reason
2. Get approval before proceeding
3. Update SDD if the deviation is an improvement
4. Never deviate without documentation

## Metadata Reference

- `[parallel: true]` - Tasks that can run concurrently
- `[ref: document/section; lines: 1, 2-3]` - Links to specifications
- `[activity: type]` - Activity hint for specialist agent selection

---

## Context Priming

*GATE: You MUST fully read all files mentioned in this section before starting any implementation.*

**Specification**:
- `docs/specs/001-warpcms-debloat/product-requirements.md` - Product Requirements
- `docs/specs/001-warpcms-debloat/solution-design.md` - Solution Design

**Key Design Decisions**:
- ADR-1: Delete PDF/HTML content types outright (no deprecation)
- ADR-2: Delete mock settings tabs (not implement them)
- ADR-3: Purge all root package.json dependencies
- ADR-4: Remove root-level duplicate templates

**Implementation Context**:
- Build: `npm run build:core` (from workspace root)
- Tests: `npm test` (from workspace root, delegates to core)
- Type check: `npm run type-check` (from workspace root)
- Dead code: `npx knip --no-progress` (from workspace root)
- Migration gen: `npm run generate:migrations` (from packages/core)
- Pattern: Bottom-up deletion (leaves first, then barrel exports, then parent modules)
- Constraint: NEVER delete files under `plugins/` directories

---

## Implementation Phases

### Phase 0: Baseline Measurement

- [ ] T0 Capture baseline metrics before any changes

    - [ ] T0.1 Record current bundle size `[activity: bash]`
        - [ ] T0.1.1 Run `npm run build:core` and note output size
        - [ ] T0.1.2 Record `dist/` directory total size: `du -sh packages/core/dist/`
    - [ ] T0.2 Record current test status `[activity: bash]`
        - [ ] T0.2.1 Run `npm test` and confirm 99 tests pass
    - [ ] T0.3 Record current knip report `[activity: bash]`
        - [ ] T0.3.1 Run `npx knip --no-progress 2>&1 | head -5` to capture unused file/dep counts

---

### Phase 1: Delete Unused Leaf Files

*No other source file imports these. Safe to delete without updating any imports.*

- [ ] T1 Delete unused template, route, and middleware files `[ref: SDD/Directory Map "Deletions"]`

    - [ ] T1.1 Prime Context
        - [ ] T1.1.1 Read SDD Directory Map "Deletions" section `[ref: solution-design.md; lines: 157-186]`
        - [ ] T1.1.2 Confirm no file in the delete list is imported by a non-deleted file: grep for each filename across `src/` `[activity: search]`

    - [ ] T1.2 Delete unused page templates `[parallel: true]` `[activity: delete-files]`
        - [ ] T1.2.1 Delete `packages/core/src/templates/pages/admin-api-reference.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.2.2 Delete `packages/core/src/templates/pages/admin-collections-form.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.2.3 Delete `packages/core/src/templates/pages/admin-collections-list.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.2.4 Delete `packages/core/src/templates/pages/admin-database-table.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.2.5 Delete `packages/core/src/templates/pages/admin-field-types.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.2.6 Delete `packages/core/src/templates/pages/admin-media-library.template.ts` `[ref: PRD 4.4]`

    - [ ] T1.3 Delete unused component templates `[parallel: true]` `[activity: delete-files]`
        - [ ] T1.3.1 Delete `packages/core/src/templates/components/form.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.3.2 Delete `packages/core/src/templates/components/media-file-details.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.3.3 Delete `packages/core/src/templates/components/media-grid.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.3.4 Delete `packages/core/src/templates/components/pagination.template.ts` `[ref: PRD 4.4]`
        - [ ] T1.3.5 Delete `packages/core/src/templates/components/table.template.ts` `[ref: PRD 4.4]`

    - [ ] T1.4 Delete root-level duplicate templates `[parallel: true]` `[activity: delete-files]`
        - [ ] T1.4.1 Delete `packages/core/src/templates/alert.template.ts` `[ref: SDD/ADR-4]`
        - [ ] T1.4.2 Delete `packages/core/src/templates/confirmation-dialog.template.ts` `[ref: SDD/ADR-4]`
        - [ ] T1.4.3 Delete `packages/core/src/templates/filter-bar.template.ts` `[ref: SDD/ADR-4]`
        - [ ] T1.4.4 Delete `packages/core/src/templates/form.template.ts` `[ref: SDD/ADR-4]`
        - [ ] T1.4.5 Delete `packages/core/src/templates/pagination.template.ts` `[ref: SDD/ADR-4]`
        - [ ] T1.4.6 Delete `packages/core/src/templates/table.template.ts` `[ref: SDD/ADR-4]`

    - [ ] T1.5 Delete unused route files `[parallel: true]` `[activity: delete-files]`
        - [ ] T1.5.1 Delete `packages/core/src/routes/admin-api-reference.ts` `[ref: PRD 4.3.1]`
        - [ ] T1.5.2 Delete `packages/core/src/routes/admin-collections.ts` `[ref: PRD 4.3.1]`
        - [ ] T1.5.3 Delete `packages/core/src/routes/admin-media.ts` `[ref: PRD 4.3.1]`

    - [ ] T1.6 Delete unused middleware `[activity: delete-files]`
        - [ ] T1.6.1 Delete `packages/core/src/middleware/admin-setup.ts` `[ref: PRD 4.3.1]`

    - [ ] T1.7 Validate Phase 1
        - [ ] T1.7.1 Grep `src/` for any remaining import of deleted filenames `[activity: search]`
        - [ ] T1.7.2 If any imports found, they will be fixed in Phase 2

---

### Phase 2: Update Barrel Exports

*Remove re-exports that reference deleted files. Must complete Phase 1 first.*

- [ ] T2 Update barrel files to remove references to deleted modules `[ref: SDD/Implementation Patterns "Deletion Order Pattern" Phase 2]`

    - [ ] T2.1 Prime Context
        - [ ] T2.1.1 Read `packages/core/src/templates/index.ts` `[ref: solution-design.md; ICO-3]`
        - [ ] T2.1.2 Read `packages/core/src/index.ts` `[ref: solution-design.md; ICO-3]`

    - [ ] T2.2 Update `templates/index.ts` `[activity: edit-code]`
        - [ ] T2.2.1 Remove all re-exports from root-level template files (form.template, table.template, pagination.template, alert.template, confirmation-dialog.template, filter-bar.template) `[ref: SDD/Implementation Gotchas]`
        - [ ] T2.2.2 Keep: layout re-exports (`renderAdminLayout`, `renderAdminLayoutCatalyst`) and `renderLogo`

    - [ ] T2.3 Update `src/index.ts` `[activity: edit-code]`
        - [ ] T2.3.1 Remove re-exports that came from templates/index.ts for deleted templates: `renderForm`, `renderFormField`, `renderTable`, `renderPagination`, `renderAlert`, `renderConfirmationDialog`, `getConfirmationDialogScript`, `renderFilterBar` `[ref: SDD/Building Block View "Modifications"]`
        - [ ] T2.3.2 Remove corresponding type re-exports: `FormField`, `FormData`, `TableColumn`, `TableData`, `PaginationData`, `AlertData`, `ConfirmationDialogOptions`, `FilterBarData`, `Filter`, `FilterOption`

    - [ ] T2.4 Validate Phase 2
        - [ ] T2.4.1 Run `npm run build:core` - must succeed `[activity: bash]`
        - [ ] T2.4.2 Run `npm run type-check` - must succeed `[activity: bash]`
        - [ ] T2.4.3 Run `npm test` - all tests must pass `[activity: bash]`

---

### Phase 3: Content Type Consolidation

*Remove pdf and html from CONTENT_TYPES. Add SQL migration.*

- [ ] T3 Consolidate content types from 5 to 3 `[ref: SDD/Application Data Models; PRD 4.1]`

    - [ ] T3.1 Prime Context
        - [ ] T3.1.1 Read `packages/core/src/content-types.ts` `[ref: solution-design.md; ICO-1]`
        - [ ] T3.1.2 Read `packages/core/src/routes/admin-content.ts` to understand how types are consumed `[ref: solution-design.md; ICO-1]`
        - [ ] T3.1.3 Read `packages/core/src/db/migrations-bundle.ts` to understand migration bundling `[ref: SDD/Implementation Gotchas]`

    - [ ] T3.2 Implement content type removal `[activity: edit-code]`
        - [ ] T3.2.1 Remove `pdf` entry from `CONTENT_TYPES` in `content-types.ts` `[ref: PRD 4.1.1]`
        - [ ] T3.2.2 Remove `html` entry from `CONTENT_TYPES` in `content-types.ts` `[ref: PRD 4.1.2]`
        - [ ] T3.2.3 Verify `getContentType`, `getContentTypeNames`, `getAllContentTypes` still work with remaining 3 types (image, text, file) - no code change needed, they use `CONTENT_TYPES` object

    - [ ] T3.3 Create SQL migration `[activity: create-file]`
        - [ ] T3.3.1 Create `packages/core/migrations/0002_consolidate_content_types.sql` with idempotent UPDATE statements `[ref: SDD/Implementation Examples "Content Type Migration SQL"]`
        - [ ] T3.3.2 Run `npm run generate:migrations --workspace=@warpcms/core` to regenerate `migrations-bundle.ts` `[activity: bash]`
        - [ ] T3.3.3 Verify `migrations-bundle.ts` includes the new migration `[activity: search]`

    - [ ] T3.4 Validate Phase 3
        - [ ] T3.4.1 Run `npm run build:core` `[activity: bash]`
        - [ ] T3.4.2 Run `npm test` `[activity: bash]`
        - [ ] T3.4.3 Verify `getAllContentTypes()` returns exactly 3 types `[ref: PRD 4.1.3]`

---

### Phase 4: Settings Page Cleanup

*Remove 4 mock settings tabs from routes and template.*

- [ ] T4 Strip fake settings tabs `[ref: SDD/Application Data Models "SettingsPageData"; PRD 4.2]`

    - [ ] T4.1 Prime Context
        - [ ] T4.1.1 Read `packages/core/src/routes/admin-settings.ts` `[ref: solution-design.md; ICO-2]`
        - [ ] T4.1.2 Read `packages/core/src/templates/pages/admin-settings.template.ts` (full file) `[ref: solution-design.md; ICO-2]`
        - [ ] T4.1.3 Read SDD "Settings Template Tab Removal" example `[ref: solution-design.md; lines: 289-301]`

    - [ ] T4.2 Clean route file `packages/core/src/routes/admin-settings.ts` `[activity: edit-code]`
        - [ ] T4.2.1 Remove route handler: `GET /appearance` `[ref: PRD 4.2.1]`
        - [ ] T4.2.2 Remove route handler: `GET /security` `[ref: PRD 4.2.1]`
        - [ ] T4.2.3 Remove route handler: `GET /notifications` `[ref: PRD 4.2.1]`
        - [ ] T4.2.4 Remove route handler: `GET /storage` `[ref: PRD 4.2.1]`
        - [ ] T4.2.5 Simplify `getMockSettings()`: remove `appearance`, `security`, `notifications`, `storage` mock data. Only keep `general` (as defaults), `migrations`, and `databaseTools` `[ref: PRD 4.2.3]`

    - [ ] T4.3 Clean template `packages/core/src/templates/pages/admin-settings.template.ts` `[activity: edit-code]`
        - [ ] T4.3.1 Remove interfaces: `AppearanceSettings`, `SecuritySettings`, `NotificationSettings`, `StorageSettings` `[ref: SDD/Application Data Models]`
        - [ ] T4.3.2 Remove from `SettingsPageData.settings?` type: the 4 removed optional fields `[ref: SDD/Application Data Models]`
        - [ ] T4.3.3 Remove 4 tab button renders: `renderTabButton('appearance', ...)`, `renderTabButton('security', ...)`, `renderTabButton('notifications', ...)`, `renderTabButton('storage', ...)` `[ref: PRD 4.2.3]`
        - [ ] T4.3.4 Remove 4 switch cases in `renderTabContent()` `[ref: SDD/Implementation Examples]`
        - [ ] T4.3.5 Remove entire functions: `renderAppearanceSettings()`, `renderSecuritySettings()`, `renderNotificationSettings()`, `renderStorageSettings()` `[ref: PRD 4.2.1]`

    - [ ] T4.4 Validate Phase 4
        - [ ] T4.4.1 Run `npm run build:core` `[activity: bash]`
        - [ ] T4.4.2 Run `npm test` `[activity: bash]`
        - [ ] T4.4.3 Verify settings template only renders 3 tabs (General, Migrations, Database Tools) `[ref: PRD 4.2.3]`

---

### Phase 5: Dependency Cleanup

*Remove unused packages from both package.json files.*

- [ ] T5 Clean dependencies `[ref: SDD/ADR-3; PRD 4.3.3]`

    - [ ] T5.1 Prime Context
        - [ ] T5.1.1 Read root `package.json` `[ref: solution-design.md; ICO-3]`
        - [ ] T5.1.2 Read `packages/core/package.json`
        - [ ] T5.1.3 Verify highlight.js usage: grep for `highlight` across remaining `src/` files `[activity: search]`

    - [ ] T5.2 Clean root `package.json` `[activity: edit-code]`
        - [ ] T5.2.1 Remove from `dependencies`: `@hono/zod-openapi`, `@hono/zod-validator`, `@warpcms/core`, `drizzle-kit`, `drizzle-orm`, `drizzle-zod`, `highlight.js`, `hono`, `marked`, `semver`, `zod` `[ref: PRD 4.3.3]`
        - [ ] T5.2.2 Remove from `devDependencies`: `@cloudflare/workers-types` `[ref: PRD 4.3.3]`
        - [ ] T5.2.3 Evaluate `@vitest/coverage-v8` and `glob`: remove if tests/scripts only run from core workspace `[ref: PRD 4.3.3]`
        - [ ] T5.2.4 Keep `vitest`, `wrangler`, `tsx`, `typescript`, `@types/node`, `@types/semver` in root devDeps (used by workspace scripts)

    - [ ] T5.3 Clean core `packages/core/package.json` `[activity: edit-code]`
        - [ ] T5.3.1 If highlight.js is not imported in any remaining source file, remove from `dependencies` `[ref: PRD 4.3.3]`
        - [ ] T5.3.2 Remove `glob` from `devDependencies` `[ref: PRD 4.3.3]`

    - [ ] T5.4 Reinstall dependencies `[activity: bash]`
        - [ ] T5.4.1 Run `npm install` from workspace root to regenerate lockfile

    - [ ] T5.5 Validate Phase 5
        - [ ] T5.5.1 Run `npm run build:core` `[activity: bash]`
        - [ ] T5.5.2 Run `npm test` `[activity: bash]`
        - [ ] T5.5.3 Run `npm run dev` briefly to verify dev server starts `[activity: bash]`

---

### Phase 6: Unused Exports Cleanup

*Remove unused exports flagged by knip that are NOT in plugin files.*

- [ ] T6 Clean unused exports and fix duplicate exports `[ref: PRD 4.3.2, 4.3.4]`

    - [ ] T6.1 Prime Context
        - [ ] T6.1.1 Run `npx knip --no-progress` to get fresh unused exports list `[activity: bash]`
        - [ ] T6.1.2 Filter results: ignore anything under `plugins/`, `__tests__/`, and already-deleted files

    - [ ] T6.2 Fix duplicate exports `[activity: edit-code]`
        - [ ] T6.2.1 Fix `adminApiRoutes|default` in `routes/admin-api.ts` - use only named export `[ref: PRD 4.3.4]`
        - [ ] T6.2.2 Fix `apiMediaRoutes|default` in `routes/api-media.ts` `[ref: PRD 4.3.4]`
        - [ ] T6.2.3 Fix `apiSystemRoutes|default` in `routes/api-system.ts` `[ref: PRD 4.3.4]`

    - [ ] T6.3 Remove unused non-plugin exports `[activity: edit-code]`
        - [ ] T6.3.1 Remove `getContentTypeNames` from `content-types.ts` (flagged by knip, not used anywhere) `[ref: PRD 4.3.2]`
        - [ ] T6.3.2 Remove other unused exports identified in T6.1.1 that are NOT part of the public SDK surface and NOT in plugin/test files `[ref: PRD 4.3.2]`

    - [ ] T6.4 Validate Phase 6
        - [ ] T6.4.1 Run `npm run build:core` `[activity: bash]`
        - [ ] T6.4.2 Run `npm test` `[activity: bash]`

---

### Phase 7: Final Verification

*End-to-end validation against all PRD success metrics.*

- [ ] T7 Integration & End-to-End Validation `[ref: SDD/Quality Requirements; PRD 6]`

    - [ ] T7.1 Build verification `[activity: bash]`
        - [ ] T7.1.1 Run `npm run build:core` - must exit 0 `[ref: PRD 6]`
        - [ ] T7.1.2 Run `npm run type-check` - must pass `[ref: SDD/Quality Requirements]`

    - [ ] T7.2 Test verification `[activity: bash]`
        - [ ] T7.2.1 Run `npm test` - all tests must pass `[ref: PRD 6]`

    - [ ] T7.3 Dead code verification `[activity: bash]`
        - [ ] T7.3.1 Run `npx knip --no-progress` `[ref: PRD 6]`
        - [ ] T7.3.2 Verify 0 unused dependencies reported
        - [ ] T7.3.3 Verify 0 unused files reported outside of `plugins/` directories
        - [ ] T7.3.4 Document remaining plugin false positives (expected)

    - [ ] T7.4 Bundle size comparison `[activity: bash]`
        - [ ] T7.4.1 Record `dist/` directory size: `du -sh packages/core/dist/`
        - [ ] T7.4.2 Compare to Phase 0 baseline and document reduction `[ref: PRD 6]`

    - [ ] T7.5 PRD acceptance criteria verification
        - [ ] T7.5.1 Content types: `getAllContentTypes()` returns 3 types (image, text, file) `[ref: PRD 4.1.3]`
        - [ ] T7.5.2 Settings: template renders 3 tabs (General, Migrations, Database Tools) `[ref: PRD 4.2.3]`
        - [ ] T7.5.3 No broken imports in any source file `[ref: PRD 5 "Risks"]`
        - [ ] T7.5.4 Migration file exists: `0002_consolidate_content_types.sql` `[ref: PRD 4.1.1, 4.1.2]`

    - [ ] T7.6 SDD compliance verification
        - [ ] T7.6.1 No files deleted under `plugins/` `[ref: SDD/CON-3]`
        - [ ] T7.6.2 Layout templates untouched `[ref: SDD/Implementation Boundaries]`
        - [ ] T7.6.3 All 4 ADRs implemented as approved `[ref: SDD/Architecture Decisions]`
