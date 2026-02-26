-- Add language preference column to users table for i18n support.
-- Accepted values: 'en', 'pt', 'es'. Defaults to 'en'.
-- Note: The consolidated migration (0001) already includes this column,
-- so this will be a no-op for databases created after consolidation.
-- The migration service skips "duplicate column name" errors gracefully.
ALTER TABLE users ADD COLUMN language TEXT NOT NULL DEFAULT 'en';
