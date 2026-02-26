-- Remove FOREIGN KEY constraint on content.collection_id -> collections(id).
-- The content-remodel replaced dynamic collections with hardcoded content types
-- (image, text, file). collection_id now stores the type name directly.
-- SQLite does not support ALTER TABLE DROP CONSTRAINT, so we recreate the table.

PRAGMA foreign_keys = OFF;

-- 1. Rename existing table
ALTER TABLE content RENAME TO content_old;

-- 2. Create new table without the FK on collection_id
CREATE TABLE content (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL, -- content type name (image, text, file)
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at INTEGER,
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

-- 3. Copy data
INSERT INTO content SELECT * FROM content_old;

-- 4. Drop old table
DROP TABLE content_old;

PRAGMA foreign_keys = ON;
