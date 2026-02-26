-- =============================================================================
-- Migration 0004: Remove status, published_at from content; drop workflow_history
-- =============================================================================
-- Content no longer has a draft/published lifecycle. All content is visible.
-- The workflow_history table only tracked status transitions, so it is removed.
-- SQLite requires table recreation to drop columns.
-- =============================================================================

-- Step 1: Recreate content table without status and published_at
CREATE TABLE IF NOT EXISTS content_new (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  scheduled_publish_at INTEGER,
  scheduled_unpublish_at INTEGER,
  review_status TEXT DEFAULT 'none',
  reviewer_id TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  review_notes TEXT,
  meta_title TEXT,
  meta_description TEXT,
  featured_image_id TEXT REFERENCES media(id),
  content_type TEXT DEFAULT 'standard',
  workflow_state_id TEXT DEFAULT 'draft',
  embargo_until DATETIME,
  expires_at DATETIME,
  version_number INTEGER DEFAULT 1,
  is_auto_saved INTEGER DEFAULT 0
);

-- Step 2: Copy data from old table (excluding status and published_at)
INSERT INTO content_new (
  id, collection_id, slug, title, data, author_id, created_at, updated_at,
  scheduled_publish_at, scheduled_unpublish_at, review_status, reviewer_id,
  reviewed_at, review_notes, meta_title, meta_description, featured_image_id,
  content_type, workflow_state_id, embargo_until, expires_at, version_number,
  is_auto_saved
)
SELECT
  id, collection_id, slug, title, data, author_id, created_at, updated_at,
  scheduled_publish_at, scheduled_unpublish_at, review_status, reviewer_id,
  reviewed_at, review_notes, meta_title, meta_description, featured_image_id,
  content_type, workflow_state_id, embargo_until, expires_at, version_number,
  is_auto_saved
FROM content;

-- Step 3: Drop old table and rename new one
DROP TABLE content;
ALTER TABLE content_new RENAME TO content;

-- Step 4: Drop workflow_history table
DROP TABLE IF EXISTS workflow_history;
