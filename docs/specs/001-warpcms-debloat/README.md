# Specification: 001-warpcms-debloat

## Status

| Field | Value |
|-------|-------|
| **Created** | 2026-02-25 |
| **Current Phase** | Complete (PRD + SDD + PLAN) |
| **Last Updated** | 2026-02-25 |

## Documents

| Document | Status | Notes |
|----------|--------|-------|
| product-requirements.md | completed | |
| solution-design.md | completed | 4 ADRs pending user confirmation |
| implementation-plan.md | completed | 8 phases, ~50 tasks |

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-25 | Start with PRD | Need to define scope of debloating before implementation |
| 2026-02-25 | All 4 ADRs approved | Delete types outright, remove mock tabs, purge root deps, remove duplicates |
| 2026-02-25 | PLAN completed | 8 phases: baseline -> leaf deletion -> barrel exports -> content types -> settings -> deps -> exports -> verification |

## Context

Remove dead code, unused settings, and consolidate content types in WarpCMS. Key areas:
- 67 unused files identified by knip
- 4 settings categories with mock-only data (appearance, security, notifications, storage)
- Content types: merge PDF into file type, remove HTML type
- 56 unused exports, 37 unused exported types
- 12 unused dependencies, 5 unused devDependencies

---
*This file is managed by the specification-management skill.*
