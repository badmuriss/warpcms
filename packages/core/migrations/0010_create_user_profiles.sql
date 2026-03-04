-- =============================================================================
-- Migration 0010: Create user_profiles table
-- =============================================================================
-- Adds the user_profiles table for extended user profile data.
-- This table stores optional profile fields that are separate from the
-- core authentication fields in the users table.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  company TEXT,
  job_title TEXT,
  website TEXT,
  location TEXT,
  date_of_birth INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
