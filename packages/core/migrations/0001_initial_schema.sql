-- =============================================================================
-- SonicJS AI - Consolidated Initial Schema Migration
-- =============================================================================
-- Combines migrations 001-031 into a single clean schema.
-- All tables use CREATE TABLE IF NOT EXISTS with final column definitions.
-- All seed data uses INSERT OR IGNORE for idempotency.
-- =============================================================================

PRAGMA foreign_keys = ON;

-- =============================================================================
-- SECTION 1: CORE TABLES (Users, Collections, Content, Media, API Tokens)
-- =============================================================================

-- Users table with full profile, preferences, and auth columns
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  avatar TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- Profile fields (migration 004)
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  email_notifications INTEGER DEFAULT 1,
  theme TEXT DEFAULT 'dark',
  -- Two-factor authentication
  two_factor_enabled INTEGER DEFAULT 0,
  two_factor_secret TEXT,
  -- Password reset
  password_reset_token TEXT,
  password_reset_expires INTEGER,
  -- Email verification
  email_verified INTEGER DEFAULT 0,
  email_verification_token TEXT,
  -- Invitation system
  invitation_token TEXT,
  invited_by TEXT REFERENCES users(id),
  invited_at INTEGER,
  accepted_invitation_at INTEGER
);

-- Collections table for content schema definitions
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  schema TEXT NOT NULL, -- JSON schema definition
  is_active INTEGER NOT NULL DEFAULT 1,
  managed INTEGER NOT NULL DEFAULT 0, -- migration 011: config-managed collections
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Content table with scheduling, workflow, review, and metadata columns
CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON content data
  status TEXT NOT NULL DEFAULT 'draft',
  published_at INTEGER,
  author_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- Scheduling (migration 003)
  scheduled_publish_at INTEGER,
  scheduled_unpublish_at INTEGER,
  -- Review workflow (migration 003)
  review_status TEXT DEFAULT 'none',
  reviewer_id TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  review_notes TEXT,
  -- Content metadata (migration 003)
  meta_title TEXT,
  meta_description TEXT,
  featured_image_id TEXT REFERENCES media(id),
  content_type TEXT DEFAULT 'standard',
  -- Workflow & automation (migration 005)
  workflow_state_id TEXT DEFAULT 'draft',
  embargo_until DATETIME,
  expires_at DATETIME,
  version_number INTEGER DEFAULT 1,
  is_auto_saved INTEGER DEFAULT 0
);

-- Content versions table (Drizzle schema definition)
CREATE TABLE IF NOT EXISTS content_versions (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content(id),
  version INTEGER NOT NULL,
  data TEXT NOT NULL, -- JSON data
  author_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);

-- Media/files table with R2 integration
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  folder TEXT NOT NULL DEFAULT 'uploads',
  r2_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt TEXT,
  caption TEXT,
  tags TEXT, -- JSON array of tags
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  uploaded_at INTEGER NOT NULL,
  updated_at INTEGER,
  published_at INTEGER,
  scheduled_at INTEGER,
  archived_at INTEGER,
  deleted_at INTEGER
);

-- API tokens table for programmatic access
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id),
  permissions TEXT NOT NULL, -- JSON array of permissions
  expires_at INTEGER,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Workflow history table for content workflow tracking
CREATE TABLE IF NOT EXISTS workflow_history (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL REFERENCES content(id),
  action TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  comment TEXT,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- SECTION 2: CONTENT MANAGEMENT EXTENSIONS (Fields, Relationships, Templates)
-- =============================================================================

-- Dynamic field definitions for collections
CREATE TABLE IF NOT EXISTS content_fields (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES collections(id),
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, richtext, number, boolean, date, select, media, relationship, slug
  field_label TEXT NOT NULL,
  field_options TEXT, -- JSON for select options, validation rules, etc.
  field_order INTEGER NOT NULL DEFAULT 0,
  is_required INTEGER NOT NULL DEFAULT 0,
  is_searchable INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(collection_id, field_name)
);

-- Content relationships
CREATE TABLE IF NOT EXISTS content_relationships (
  id TEXT PRIMARY KEY,
  source_content_id TEXT NOT NULL REFERENCES content(id),
  target_content_id TEXT NOT NULL REFERENCES content(id),
  relationship_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(source_content_id, target_content_id, relationship_type)
);

-- Reusable workflow templates
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  collection_id TEXT REFERENCES collections(id),
  workflow_steps TEXT NOT NULL, -- JSON array of workflow steps
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- =============================================================================
-- SECTION 3: USER MANAGEMENT & PERMISSIONS
-- =============================================================================

-- Teams for team-based collaboration
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES users(id),
  settings TEXT, -- JSON for team settings
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Team memberships
CREATE TABLE IF NOT EXISTS team_memberships (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  permissions TEXT, -- JSON for specific permissions
  joined_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Granular permissions
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Role-permission mappings
CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  permission_id TEXT NOT NULL REFERENCES permissions(id),
  created_at INTEGER NOT NULL,
  UNIQUE(role, permission_id)
);

-- User sessions for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER
);

-- Activity log for audit trails
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT, -- JSON with additional details
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

-- Password history for security
CREATE TABLE IF NOT EXISTS password_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- SECTION 4: WORKFLOW & AUTOMATION SYSTEM
-- =============================================================================

-- Workflow states
CREATE TABLE IF NOT EXISTS workflow_states (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  is_initial INTEGER DEFAULT 0,
  is_final INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
  is_active INTEGER DEFAULT 1,
  auto_publish INTEGER DEFAULT 0,
  require_approval INTEGER DEFAULT 1,
  approval_levels INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow transitions
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  from_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  to_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  required_permission TEXT,
  auto_transition INTEGER DEFAULT 0,
  transition_conditions TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content workflow status tracking
CREATE TABLE IF NOT EXISTS content_workflow_status (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL REFERENCES workflows(id),
  current_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  assigned_to TEXT REFERENCES users(id),
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_id, workflow_id)
);

-- Scheduled content actions
CREATE TABLE IF NOT EXISTS scheduled_content (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  executed_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  email_enabled INTEGER DEFAULT 1,
  in_app_enabled INTEGER DEFAULT 1,
  digest_frequency TEXT DEFAULT 'daily',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, notification_type)
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT NOT NULL, -- JSON array of event types
  is_active INTEGER DEFAULT 1,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  last_success_at DATETIME,
  last_failure_at DATETIME,
  failure_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON
  response_status INTEGER,
  response_body TEXT,
  attempt_count INTEGER DEFAULT 1,
  delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions TEXT, -- JSON
  action_type TEXT NOT NULL,
  action_config TEXT, -- JSON
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auto-save drafts
CREATE TABLE IF NOT EXISTS auto_save_drafts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  content_id TEXT REFERENCES content(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT,
  content TEXT,
  fields TEXT, -- JSON
  last_saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_id, user_id)
);

-- =============================================================================
-- SECTION 5: PLUGIN SYSTEM
-- =============================================================================

-- Plugins registry
CREATE TABLE IF NOT EXISTS plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  is_core BOOLEAN DEFAULT FALSE,
  settings JSON,
  permissions JSON,
  dependencies JSON,
  download_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  installed_at INTEGER NOT NULL,
  activated_at INTEGER,
  last_updated INTEGER NOT NULL,
  error_message TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Plugin hooks
CREATE TABLE IF NOT EXISTS plugin_hooks (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  hook_name TEXT NOT NULL,
  handler_name TEXT NOT NULL,
  priority INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  UNIQUE(plugin_id, hook_name, handler_name)
);

-- Plugin routes
CREATE TABLE IF NOT EXISTS plugin_routes (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  handler_name TEXT NOT NULL,
  middleware JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE,
  UNIQUE(plugin_id, path, method)
);

-- Plugin assets (CSS, JS files)
CREATE TABLE IF NOT EXISTS plugin_assets (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('css', 'js', 'image', 'font')),
  asset_path TEXT NOT NULL,
  load_order INTEGER DEFAULT 100,
  load_location TEXT DEFAULT 'footer' CHECK (load_location IN ('header', 'footer')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

-- Plugin activity log
CREATE TABLE IF NOT EXISTS plugin_activity_log (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT,
  details JSON,
  timestamp INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

-- =============================================================================
-- SECTION 6: STANDALONE PLUGIN TABLES (FAQs, Testimonials, Code Examples)
-- =============================================================================

-- FAQ table (table structure only, no sample data)
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  tags TEXT,
  isPublished INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Testimonials table (table structure only, no sample data)
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_company TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  isPublished INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Code examples table (table structure only, no sample data)
CREATE TABLE IF NOT EXISTS code_examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT,
  tags TEXT,
  isPublished INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- =============================================================================
-- SECTION 7: SYSTEM LOGGING
-- =============================================================================

-- System logs for tracking application events
CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  category TEXT NOT NULL CHECK (category IN ('auth', 'api', 'workflow', 'plugin', 'media', 'system', 'security', 'error')),
  message TEXT NOT NULL,
  data TEXT, -- JSON data
  user_id TEXT REFERENCES users(id),
  session_id TEXT,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  method TEXT,
  url TEXT,
  status_code INTEGER,
  duration INTEGER,
  stack_trace TEXT,
  tags TEXT, -- JSON array
  source TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Log configuration per category
CREATE TABLE IF NOT EXISTS log_config (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL UNIQUE CHECK (category IN ('auth', 'api', 'workflow', 'plugin', 'media', 'system', 'security', 'error')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  retention_days INTEGER NOT NULL DEFAULT 30,
  max_size_mb INTEGER NOT NULL DEFAULT 100,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- =============================================================================
-- SECTION 8: SETTINGS
-- =============================================================================

-- Application settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL, -- JSON value
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(category, key)
);

-- =============================================================================
-- SECTION 9: AUTHENTICATION EXTENSIONS (Magic Links, OTP)
-- =============================================================================

-- Magic links for passwordless login
CREATE TABLE IF NOT EXISTS magic_links (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  used_at INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

-- OTP codes for passwordless authentication
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  used_at INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  attempts INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- SECTION 10: FORMS SYSTEM
-- =============================================================================

-- Form definitions with Form.io integration and Turnstile support
CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  formio_schema TEXT NOT NULL, -- Complete Form.io JSON schema
  settings TEXT, -- JSON settings
  is_active INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 1,
  managed INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  tags TEXT, -- JSON array of tags
  submission_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  updated_by TEXT REFERENCES users(id),
  turnstile_enabled INTEGER DEFAULT 0,
  turnstile_settings TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Form submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  submission_data TEXT NOT NULL, -- JSON
  status TEXT DEFAULT 'pending',
  submission_number INTEGER,
  user_id TEXT REFERENCES users(id),
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at INTEGER,
  review_notes TEXT,
  is_spam INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  submitted_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Form file attachments
CREATE TABLE IF NOT EXISTS form_files (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  uploaded_at INTEGER NOT NULL
);

-- =============================================================================
-- SECTION 11: AI SEARCH PLUGIN
-- =============================================================================

-- AI search settings
CREATE TABLE IF NOT EXISTS ai_search_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enabled BOOLEAN DEFAULT 0,
  ai_mode_enabled BOOLEAN DEFAULT 1,
  selected_collections TEXT,
  dismissed_collections TEXT,
  autocomplete_enabled BOOLEAN DEFAULT 1,
  cache_duration INTEGER DEFAULT 1,
  results_limit INTEGER DEFAULT 20,
  index_media BOOLEAN DEFAULT 0,
  index_status TEXT,
  last_indexed_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- AI search history/analytics
CREATE TABLE IF NOT EXISTS ai_search_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  mode TEXT,
  results_count INTEGER,
  user_id INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- AI search index metadata per collection
CREATE TABLE IF NOT EXISTS ai_search_index_meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  collection_name TEXT NOT NULL,
  total_items INTEGER DEFAULT 0,
  indexed_items INTEGER DEFAULT 0,
  last_sync_at INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  UNIQUE(collection_id)
);

-- =============================================================================
-- SECTION 12: INDEXES
-- =============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_managed ON collections(managed);
CREATE INDEX IF NOT EXISTS idx_collections_managed_active ON collections(managed, is_active);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_content_collection ON content(collection_id);
CREATE INDEX IF NOT EXISTS idx_content_author ON content(author_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_published ON content(published_at);
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_publish ON content(scheduled_publish_at);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_unpublish ON content(scheduled_unpublish_at);
CREATE INDEX IF NOT EXISTS idx_content_review_status ON content(review_status);
CREATE INDEX IF NOT EXISTS idx_content_reviewer ON content(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_content_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_workflow_state ON content(workflow_state_id);

-- Content versions indexes
CREATE INDEX IF NOT EXISTS idx_content_versions_content ON content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_version ON content_versions(version);
CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON content_versions(content_id);

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_folder ON media(folder);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_at ON media(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_media_deleted ON media(deleted_at);

-- API tokens indexes
CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);

-- Workflow history indexes
CREATE INDEX IF NOT EXISTS idx_workflow_history_content ON workflow_history(content_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_user ON workflow_history(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_content_id ON workflow_history(content_id);

-- Content fields indexes
CREATE INDEX IF NOT EXISTS idx_content_fields_collection ON content_fields(collection_id);
CREATE INDEX IF NOT EXISTS idx_content_fields_name ON content_fields(field_name);
CREATE INDEX IF NOT EXISTS idx_content_fields_type ON content_fields(field_type);
CREATE INDEX IF NOT EXISTS idx_content_fields_order ON content_fields(field_order);

-- Content relationships indexes
CREATE INDEX IF NOT EXISTS idx_content_relationships_source ON content_relationships(source_content_id);
CREATE INDEX IF NOT EXISTS idx_content_relationships_target ON content_relationships(target_content_id);
CREATE INDEX IF NOT EXISTS idx_content_relationships_type ON content_relationships(relationship_type);

-- Workflow templates indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_collection ON workflow_templates(collection_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_active ON workflow_templates(is_active);

-- Team & membership indexes
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user_id ON team_memberships(user_id);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

-- Password history indexes
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

-- Workflow system indexes
CREATE INDEX IF NOT EXISTS idx_content_workflow_status_content_id ON content_workflow_status(content_id);
CREATE INDEX IF NOT EXISTS idx_content_workflow_status_workflow_id ON content_workflow_status(workflow_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled_at ON scheduled_content(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_status ON scheduled_content(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_auto_save_drafts_user_id ON auto_save_drafts(user_id);

-- Plugin system indexes
CREATE INDEX IF NOT EXISTS idx_plugins_status ON plugins(status);
CREATE INDEX IF NOT EXISTS idx_plugins_category ON plugins(category);
CREATE INDEX IF NOT EXISTS idx_plugin_hooks_plugin ON plugin_hooks(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_routes_plugin ON plugin_routes(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_assets_plugin ON plugin_assets(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_activity_plugin ON plugin_activity_log(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_activity_timestamp ON plugin_activity_log(timestamp);

-- FAQ indexes
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(isPublished);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sortOrder);

-- Testimonials indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(isPublished);
CREATE INDEX IF NOT EXISTS idx_testimonials_sort_order ON testimonials(sortOrder);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);

-- Code examples indexes
CREATE INDEX IF NOT EXISTS idx_code_examples_published ON code_examples(isPublished);
CREATE INDEX IF NOT EXISTS idx_code_examples_sort_order ON code_examples(sortOrder);
CREATE INDEX IF NOT EXISTS idx_code_examples_language ON code_examples(language);
CREATE INDEX IF NOT EXISTS idx_code_examples_category ON code_examples(category);

-- System logging indexes
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_status_code ON system_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_category_key ON settings(category, key);

-- Magic links indexes
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(user_email);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);

-- OTP codes indexes
CREATE INDEX IF NOT EXISTS idx_otp_email_code ON otp_codes(user_email, code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_used ON otp_codes(used);

-- Forms indexes
CREATE INDEX IF NOT EXISTS idx_forms_name ON forms(name);
CREATE INDEX IF NOT EXISTS idx_forms_category ON forms(category);
CREATE INDEX IF NOT EXISTS idx_forms_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_forms_public ON forms(is_public);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON forms(created_by);
CREATE INDEX IF NOT EXISTS idx_forms_turnstile ON forms(turnstile_enabled);

-- Form submissions indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(user_email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_spam ON form_submissions(is_spam);

-- Form files indexes
CREATE INDEX IF NOT EXISTS idx_form_files_submission ON form_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_form_files_media ON form_files(media_id);

-- AI search indexes
CREATE INDEX IF NOT EXISTS idx_ai_search_history_created_at ON ai_search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_search_history_mode ON ai_search_history(mode);
CREATE INDEX IF NOT EXISTS idx_ai_search_index_meta_collection_id ON ai_search_index_meta(collection_id);
CREATE INDEX IF NOT EXISTS idx_ai_search_index_meta_status ON ai_search_index_meta(status);

-- =============================================================================
-- SECTION 13: TRIGGERS
-- =============================================================================

-- Auto-update updated_at for FAQs
CREATE TRIGGER IF NOT EXISTS faqs_updated_at
  AFTER UPDATE ON faqs
BEGIN
  UPDATE faqs SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Auto-update updated_at for testimonials
CREATE TRIGGER IF NOT EXISTS testimonials_updated_at
  AFTER UPDATE ON testimonials
BEGIN
  UPDATE testimonials SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Auto-update updated_at for code examples
CREATE TRIGGER IF NOT EXISTS code_examples_updated_at
  AFTER UPDATE ON code_examples
BEGIN
  UPDATE code_examples SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

-- Auto-increment submission_number per form
CREATE TRIGGER IF NOT EXISTS set_submission_number
AFTER INSERT ON form_submissions
BEGIN
  UPDATE form_submissions
  SET submission_number = (
    SELECT COUNT(*)
    FROM form_submissions
    WHERE form_id = NEW.form_id
    AND id <= NEW.id
  )
  WHERE id = NEW.id;
END;

-- Auto-increment form submission_count
CREATE TRIGGER IF NOT EXISTS increment_form_submission_count
AFTER INSERT ON form_submissions
BEGIN
  UPDATE forms
  SET submission_count = submission_count + 1,
      updated_at = unixepoch() * 1000
  WHERE id = NEW.form_id;
END;

-- =============================================================================
-- SECTION 14: SEED DATA
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 14a: Collections (pages + news only, slug type fixed per migration 028)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO collections (
  id, name, display_name, description, schema,
  is_active, managed, created_at, updated_at
) VALUES (
  'pages-collection',
  'pages',
  'Pages',
  'Static page content collection',
  '{"type":"object","properties":{"title":{"type":"string","title":"Title","required":true},"content":{"type":"string","title":"Content","format":"richtext"},"slug":{"type":"slug","title":"Slug"},"meta_description":{"type":"string","title":"Meta Description"},"featured_image":{"type":"string","title":"Featured Image","format":"media"}},"required":["title"]}',
  1,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
),
(
  'news-collection',
  'news',
  'News',
  'News article content collection',
  '{"type":"object","properties":{"title":{"type":"string","title":"Title","required":true},"content":{"type":"string","title":"Content","format":"richtext"},"publish_date":{"type":"string","title":"Publish Date","format":"date"},"author":{"type":"string","title":"Author"},"category":{"type":"string","title":"Category","enum":["technology","business","general"]}},"required":["title"]}',
  1,
  0,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- ---------------------------------------------------------------------------
-- 14b: Workflow states (6 defaults)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO workflow_states (id, name, description, color, is_initial, is_final) VALUES
  ('draft', 'Draft', 'Content is being worked on', '#F59E0B', 1, 0),
  ('pending-review', 'Pending Review', 'Content is waiting for review', '#3B82F6', 0, 0),
  ('approved', 'Approved', 'Content has been approved', '#10B981', 0, 0),
  ('published', 'Published', 'Content is live', '#059669', 0, 1),
  ('rejected', 'Rejected', 'Content was rejected', '#EF4444', 0, 1),
  ('archived', 'Archived', 'Content has been archived', '#6B7280', 0, 1);

-- ---------------------------------------------------------------------------
-- 14c: Default workflow template
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO workflow_templates (
  id, name, description, workflow_steps, is_active, created_at, updated_at
) VALUES (
  'default-content-workflow',
  'Default Content Workflow',
  'Standard content workflow: Draft -> Review -> Published',
  '[
    {"step": "draft", "name": "Draft", "description": "Content is being created", "permissions": ["author", "editor", "admin"]},
    {"step": "review", "name": "Under Review", "description": "Content is pending review", "permissions": ["editor", "admin"]},
    {"step": "published", "name": "Published", "description": "Content is live", "permissions": ["editor", "admin"]},
    {"step": "archived", "name": "Archived", "description": "Content is archived", "permissions": ["admin"]}
  ]',
  1,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- ---------------------------------------------------------------------------
-- 14d: Permissions (22 default + manage:plugins)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO permissions (id, name, description, category, created_at) VALUES
  ('perm_content_create', 'content.create', 'Create new content', 'content', strftime('%s', 'now') * 1000),
  ('perm_content_read', 'content.read', 'View content', 'content', strftime('%s', 'now') * 1000),
  ('perm_content_update', 'content.update', 'Edit existing content', 'content', strftime('%s', 'now') * 1000),
  ('perm_content_delete', 'content.delete', 'Delete content', 'content', strftime('%s', 'now') * 1000),
  ('perm_content_publish', 'content.publish', 'Publish/unpublish content', 'content', strftime('%s', 'now') * 1000),
  ('perm_collections_create', 'collections.create', 'Create new collections', 'collections', strftime('%s', 'now') * 1000),
  ('perm_collections_read', 'collections.read', 'View collections', 'collections', strftime('%s', 'now') * 1000),
  ('perm_collections_update', 'collections.update', 'Edit collections', 'collections', strftime('%s', 'now') * 1000),
  ('perm_collections_delete', 'collections.delete', 'Delete collections', 'collections', strftime('%s', 'now') * 1000),
  ('perm_collections_fields', 'collections.fields', 'Manage collection fields', 'collections', strftime('%s', 'now') * 1000),
  ('perm_media_upload', 'media.upload', 'Upload media files', 'media', strftime('%s', 'now') * 1000),
  ('perm_media_read', 'media.read', 'View media files', 'media', strftime('%s', 'now') * 1000),
  ('perm_media_update', 'media.update', 'Edit media metadata', 'media', strftime('%s', 'now') * 1000),
  ('perm_media_delete', 'media.delete', 'Delete media files', 'media', strftime('%s', 'now') * 1000),
  ('perm_users_create', 'users.create', 'Invite new users', 'users', strftime('%s', 'now') * 1000),
  ('perm_users_read', 'users.read', 'View user profiles', 'users', strftime('%s', 'now') * 1000),
  ('perm_users_update', 'users.update', 'Edit user profiles', 'users', strftime('%s', 'now') * 1000),
  ('perm_users_delete', 'users.delete', 'Deactivate users', 'users', strftime('%s', 'now') * 1000),
  ('perm_users_roles', 'users.roles', 'Manage user roles', 'users', strftime('%s', 'now') * 1000),
  ('perm_settings_read', 'settings.read', 'View system settings', 'settings', strftime('%s', 'now') * 1000),
  ('perm_settings_update', 'settings.update', 'Modify system settings', 'settings', strftime('%s', 'now') * 1000),
  ('perm_activity_read', 'activity.read', 'View activity logs', 'settings', strftime('%s', 'now') * 1000),
  -- Plugin management permission (migration 006)
  ('manage:plugins', 'Manage Plugins', 'Install, uninstall, activate, and configure plugins', 'system', unixepoch());

-- ---------------------------------------------------------------------------
-- 14e: Role permissions (admin=21, editor=9, viewer=4 + manage:plugins for admin)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO role_permissions (id, role, permission_id, created_at) VALUES
  -- Admin: all 21 base permissions
  ('rp_admin_content_create', 'admin', 'perm_content_create', strftime('%s', 'now') * 1000),
  ('rp_admin_content_read', 'admin', 'perm_content_read', strftime('%s', 'now') * 1000),
  ('rp_admin_content_update', 'admin', 'perm_content_update', strftime('%s', 'now') * 1000),
  ('rp_admin_content_delete', 'admin', 'perm_content_delete', strftime('%s', 'now') * 1000),
  ('rp_admin_content_publish', 'admin', 'perm_content_publish', strftime('%s', 'now') * 1000),
  ('rp_admin_collections_create', 'admin', 'perm_collections_create', strftime('%s', 'now') * 1000),
  ('rp_admin_collections_read', 'admin', 'perm_collections_read', strftime('%s', 'now') * 1000),
  ('rp_admin_collections_update', 'admin', 'perm_collections_update', strftime('%s', 'now') * 1000),
  ('rp_admin_collections_delete', 'admin', 'perm_collections_delete', strftime('%s', 'now') * 1000),
  ('rp_admin_collections_fields', 'admin', 'perm_collections_fields', strftime('%s', 'now') * 1000),
  ('rp_admin_media_upload', 'admin', 'perm_media_upload', strftime('%s', 'now') * 1000),
  ('rp_admin_media_read', 'admin', 'perm_media_read', strftime('%s', 'now') * 1000),
  ('rp_admin_media_update', 'admin', 'perm_media_update', strftime('%s', 'now') * 1000),
  ('rp_admin_media_delete', 'admin', 'perm_media_delete', strftime('%s', 'now') * 1000),
  ('rp_admin_users_create', 'admin', 'perm_users_create', strftime('%s', 'now') * 1000),
  ('rp_admin_users_read', 'admin', 'perm_users_read', strftime('%s', 'now') * 1000),
  ('rp_admin_users_update', 'admin', 'perm_users_update', strftime('%s', 'now') * 1000),
  ('rp_admin_users_delete', 'admin', 'perm_users_delete', strftime('%s', 'now') * 1000),
  ('rp_admin_users_roles', 'admin', 'perm_users_roles', strftime('%s', 'now') * 1000),
  ('rp_admin_settings_read', 'admin', 'perm_settings_read', strftime('%s', 'now') * 1000),
  ('rp_admin_settings_update', 'admin', 'perm_settings_update', strftime('%s', 'now') * 1000),
  ('rp_admin_activity_read', 'admin', 'perm_activity_read', strftime('%s', 'now') * 1000),
  -- Admin: manage plugins (migration 006)
  ('role-perm-manage-plugins', 'admin', 'manage:plugins', unixepoch()),
  -- Editor: 9 permissions
  ('rp_editor_content_create', 'editor', 'perm_content_create', strftime('%s', 'now') * 1000),
  ('rp_editor_content_read', 'editor', 'perm_content_read', strftime('%s', 'now') * 1000),
  ('rp_editor_content_update', 'editor', 'perm_content_update', strftime('%s', 'now') * 1000),
  ('rp_editor_content_publish', 'editor', 'perm_content_publish', strftime('%s', 'now') * 1000),
  ('rp_editor_collections_read', 'editor', 'perm_collections_read', strftime('%s', 'now') * 1000),
  ('rp_editor_media_upload', 'editor', 'perm_media_upload', strftime('%s', 'now') * 1000),
  ('rp_editor_media_read', 'editor', 'perm_media_read', strftime('%s', 'now') * 1000),
  ('rp_editor_media_update', 'editor', 'perm_media_update', strftime('%s', 'now') * 1000),
  ('rp_editor_users_read', 'editor', 'perm_users_read', strftime('%s', 'now') * 1000),
  -- Viewer: 4 permissions
  ('rp_viewer_content_read', 'viewer', 'perm_content_read', strftime('%s', 'now') * 1000),
  ('rp_viewer_collections_read', 'viewer', 'perm_collections_read', strftime('%s', 'now') * 1000),
  ('rp_viewer_media_read', 'viewer', 'perm_media_read', strftime('%s', 'now') * 1000),
  ('rp_viewer_users_read', 'viewer', 'perm_users_read', strftime('%s', 'now') * 1000);

-- ---------------------------------------------------------------------------
-- 14f: Log configuration (8 entries)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO log_config (id, category, enabled, level, retention_days, max_size_mb) VALUES
  ('log-config-auth', 'auth', TRUE, 'info', 90, 50),
  ('log-config-api', 'api', TRUE, 'info', 30, 100),
  ('log-config-workflow', 'workflow', TRUE, 'info', 60, 50),
  ('log-config-plugin', 'plugin', TRUE, 'warn', 30, 25),
  ('log-config-media', 'media', TRUE, 'info', 30, 50),
  ('log-config-system', 'system', TRUE, 'info', 90, 100),
  ('log-config-security', 'security', TRUE, 'warn', 180, 100),
  ('log-config-error', 'error', TRUE, 'error', 90, 200);

-- ---------------------------------------------------------------------------
-- 14g: Default settings (5 entries)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO settings (id, category, key, value, created_at, updated_at)
VALUES
  (lower(hex(randomblob(16))), 'general', 'siteName', '"SonicJS AI"', unixepoch() * 1000, unixepoch() * 1000),
  (lower(hex(randomblob(16))), 'general', 'siteDescription', '"A modern headless CMS powered by AI"', unixepoch() * 1000, unixepoch() * 1000),
  (lower(hex(randomblob(16))), 'general', 'timezone', '"UTC"', unixepoch() * 1000, unixepoch() * 1000),
  (lower(hex(randomblob(16))), 'general', 'language', '"en"', unixepoch() * 1000, unixepoch() * 1000),
  (lower(hex(randomblob(16))), 'general', 'maintenanceMode', 'false', unixepoch() * 1000, unixepoch() * 1000);

-- ---------------------------------------------------------------------------
-- 14h: Default contact form
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO forms (
  id, name, display_name, description, category,
  formio_schema, settings,
  is_active, is_public,
  turnstile_enabled, turnstile_settings,
  created_at, updated_at
) VALUES (
  'default-contact-form',
  'contact',
  'Contact Form',
  'A simple contact form for getting in touch',
  'contact',
  '{"components":[]}',
  '{"emailNotifications":false,"successMessage":"Thank you for your submission!","submitButtonText":"Submit","requireAuth":false}',
  1,
  1,
  0,
  '{"inherit":true}',
  unixepoch() * 1000,
  unixepoch() * 1000
);

-- ---------------------------------------------------------------------------
-- 14i: Plugin registrations (all 19 plugins, final state)
-- ---------------------------------------------------------------------------

-- 1. core-auth (active, core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, settings, installed_at, last_updated
) VALUES (
  'core-auth',
  'core-auth',
  'Authentication System',
  'Core authentication and user management system',
  '1.0.0',
  'SonicJS Team',
  'security',
  '🔐',
  'active',
  TRUE,
  '["manage:users", "manage:roles", "manage:permissions"]',
  '{"requiredFields":{"email":{"required":1,"minLength":5,"label":"Email","type":"email"},"password":{"required":1,"minLength":8,"label":"Password","type":"password"},"username":{"required":1,"minLength":3,"label":"Username","type":"text"},"firstName":{"required":1,"minLength":1,"label":"First Name","type":"text"},"lastName":{"required":1,"minLength":1,"label":"Last Name","type":"text"}},"validation":{"emailFormat":1,"allowDuplicateUsernames":0,"passwordRequirements":{"requireUppercase":0,"requireLowercase":0,"requireNumbers":0,"requireSpecialChars":0}},"registration":{"enabled":1,"requireEmailVerification":0,"defaultRole":"viewer"}}',
  unixepoch(),
  unixepoch()
);

-- 2. core-media (active, core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'core-media',
  'core-media',
  'Media Manager',
  'Core media upload and management system',
  '1.0.0',
  'SonicJS Team',
  'media',
  '📸',
  'active',
  TRUE,
  '["manage:media", "upload:files"]',
  unixepoch(),
  unixepoch()
);

-- 3. core-workflow (active, core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'core-workflow',
  'core-workflow',
  'Workflow Engine',
  'Content workflow and approval system',
  '1.0.0',
  'SonicJS Team',
  'content',
  '🔄',
  'active',
  TRUE,
  '["manage:workflows", "approve:content"]',
  unixepoch(),
  unixepoch()
);

-- 4. core-analytics (active, core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'core-analytics',
  'core-analytics',
  'Analytics & Tracking',
  'Core analytics tracking and reporting plugin with page views and event tracking',
  '1.0.0',
  'SonicJS Team',
  'seo',
  '📊',
  'active',
  TRUE,
  '["view:analytics", "manage:tracking"]',
  unixepoch(),
  unixepoch()
);

-- 5. demo-login-prefill (inactive, core) - original from 007
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'demo-login-prefill',
  'demo-login-plugin',
  'Demo Login Prefill',
  'Prefills login form with demo credentials (admin@sonicjs.com/sonicjs!) for easy site demonstration',
  '1.0.0',
  'SonicJS',
  'demo',
  '🎯',
  'inactive',
  TRUE,
  '[]',
  unixepoch(),
  unixepoch()
);

-- 6. demo-login-plugin (active, non-core) - from 015
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, installed_at, last_updated
) VALUES (
  'demo-login-plugin',
  'demo-login-plugin',
  'Demo Login Prefill',
  'Prefills login form with demo credentials for easy site demonstration',
  '1.0.0',
  'SonicJS',
  'demo',
  '🎯',
  'active',
  FALSE,
  '[]',
  '[]',
  unixepoch(),
  unixepoch()
);

-- 7. faq-plugin (active, non-core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'faq-plugin',
  'faq-plugin',
  'FAQ Management',
  'Frequently Asked Questions management plugin with categories, search, and custom styling',
  '1.0.0',
  'SonicJS',
  'content',
  '❓',
  'active',
  FALSE,
  '["manage:faqs"]',
  unixepoch(),
  unixepoch()
);

-- 8. seed-data (inactive, non-core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'seed-data',
  'seed-data',
  'Seed Data Generator',
  'Generate realistic example users and content for testing and development',
  '1.0.0',
  'SonicJS Team',
  'development',
  '🌱',
  'inactive',
  FALSE,
  '["admin"]',
  unixepoch(),
  unixepoch()
);

-- 9. database-tools (active, non-core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'database-tools',
  'database-tools',
  'Database Tools',
  'Database management tools including truncate, backup, and validation',
  '1.0.0',
  'SonicJS Team',
  'system',
  '🗄️',
  'active',
  FALSE,
  '["manage:database", "admin"]',
  unixepoch(),
  unixepoch()
);

-- 10. testimonials-plugin (active, non-core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, settings, installed_at, last_updated
) VALUES (
  'testimonials-plugin',
  'testimonials-plugin',
  'Customer Testimonials',
  'Manage customer testimonials and reviews with rating support',
  '1.0.0',
  'SonicJS',
  'content',
  '⭐',
  'active',
  FALSE,
  '["manage:testimonials"]',
  '[]',
  '{"defaultPublished": true, "requireRating": false}',
  unixepoch(),
  unixepoch()
);

-- 11. code-examples-plugin (active, non-core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, settings, installed_at, last_updated
) VALUES (
  'code-examples-plugin',
  'code-examples-plugin',
  'Code Examples',
  'Manage code snippets and examples with syntax highlighting support',
  '1.0.0',
  'SonicJS',
  'content',
  '💻',
  'active',
  FALSE,
  '["manage:code-examples"]',
  '[]',
  '{"defaultPublished": true, "supportedLanguages": ["javascript", "typescript", "python", "go", "rust", "java", "php", "ruby", "sql"]}',
  unixepoch(),
  unixepoch()
);

-- 12. workflow-plugin (active, core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, installed_at, last_updated
) VALUES (
  'workflow-plugin',
  'workflow-plugin',
  'Workflow Engine',
  'Content workflow management with approval chains, scheduling, and automation',
  '1.0.0',
  'SonicJS Team',
  'content',
  '🔄',
  'active',
  TRUE,
  '["manage:workflows", "approve:content"]',
  '[]',
  unixepoch(),
  unixepoch()
);

-- 13. email (inactive, core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'email',
  'email',
  'Email',
  'Send transactional emails using Resend',
  '1.0.0-beta.1',
  'SonicJS Team',
  'utilities',
  '📧',
  'inactive',
  TRUE,
  '["email:manage", "email:send", "email:view-logs"]',
  unixepoch(),
  unixepoch()
);

-- 14. magic-link-auth (inactive, non-core, depends on email)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, installed_at, last_updated
) VALUES (
  'magic-link-auth',
  'magic-link-auth',
  'Magic Link Authentication',
  'Passwordless authentication via email magic links. Users receive a secure one-time link to sign in without entering a password.',
  '1.0.0',
  'SonicJS Team',
  'security',
  '🔗',
  'inactive',
  FALSE,
  '["auth:manage", "auth:magic-link"]',
  '["email"]',
  unixepoch(),
  unixepoch()
);

-- 15. tinymce-plugin (active, non-core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, settings, installed_at, last_updated
) VALUES (
  'tinymce-plugin',
  'tinymce-plugin',
  'TinyMCE Rich Text Editor',
  'Powerful WYSIWYG rich text editor for content creation. Provides a full-featured editor with formatting, media embedding, and customizable toolbars for richtext fields.',
  '1.0.0',
  'SonicJS Team',
  'editor',
  '✏️',
  'active',
  FALSE,
  '[]',
  '[]',
  '{"apiKey":"no-api-key","defaultHeight":300,"defaultToolbar":"full","skin":"oxide-dark"}',
  unixepoch(),
  unixepoch()
);

-- 16. easy-mdx (active, non-core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, settings, installed_at, last_updated
) VALUES (
  'easy-mdx',
  'easy-mdx',
  'EasyMDE Markdown Editor',
  'Lightweight markdown editor with live preview. Provides a simple and efficient editor with markdown support for richtext fields.',
  '1.0.0',
  'SonicJS Team',
  'editor',
  '📝',
  'active',
  FALSE,
  '[]',
  '[]',
  '{"defaultHeight":400,"theme":"dark","toolbar":"full","placeholder":"Start writing your content..."}',
  unixepoch(),
  unixepoch()
);

-- 17. quill-editor (active, non-core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, settings, installed_at, last_updated
) VALUES (
  'quill-editor',
  'quill-editor',
  'Quill Rich Text Editor',
  'Modern rich text editor for content creation. Provides a clean, intuitive WYSIWYG editor with customizable toolbars for richtext fields.',
  '1.0.0',
  'SonicJS Team',
  'editor',
  '✍️',
  'active',
  FALSE,
  '[]',
  '[]',
  '{"theme":"snow","defaultHeight":300,"defaultToolbar":"full","placeholder":"Start writing your content..."}',
  unixepoch(),
  unixepoch()
);

-- 18. easymde-editor (inactive, core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, dependencies, settings, installed_at, last_updated
) VALUES (
  'easymde-editor',
  'easymde-editor',
  'EasyMDE Editor',
  'Lightweight markdown editor for content creation. Simple, elegant WYSIWYG markdown editor with live preview, toolbar, and dark mode support for richtext fields.',
  '1.0.0',
  'SonicJS Team',
  'editor',
  '✍️',
  'inactive',
  TRUE,
  '[]',
  '[]',
  '{"theme":"dark","defaultHeight":300,"toolbar":"full","spellChecker":false,"placeholder":"Start writing your content..."}',
  unixepoch(),
  unixepoch()
);

-- 19. otp-login (inactive, core)
INSERT OR IGNORE INTO plugins (
  id, name, display_name, description, version, author, category, icon,
  status, is_core, permissions, installed_at, last_updated
) VALUES (
  'otp-login',
  'otp-login',
  'OTP Login',
  'Passwordless authentication via email one-time codes',
  '1.0.0-beta.1',
  'SonicJS Team',
  'security',
  '🔢',
  'inactive',
  TRUE,
  '["otp:manage", "otp:request", "otp:verify"]',
  unixepoch(),
  unixepoch()
);

-- ---------------------------------------------------------------------------
-- 14j: Content fields for pages and news (slug uses field_type='slug' per migration 027)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO content_fields (
  id, collection_id, field_name, field_type, field_label, field_options, field_order, is_required, is_searchable, created_at, updated_at
) VALUES
-- Pages fields
('pages-title-field', 'pages-collection', 'title', 'text', 'Title', '{"maxLength": 200, "placeholder": "Enter page title"}', 1, 1, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('pages-content-field', 'pages-collection', 'content', 'richtext', 'Content', '{"toolbar": "full", "height": 500}', 2, 1, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('pages-slug-field', 'pages-collection', 'slug', 'slug', 'URL Slug', '{"pattern": "^[a-zA-Z0-9_-]+$", "placeholder": "url-friendly-slug", "help": "Use letters, numbers, underscores, and hyphens only"}', 3, 1, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('pages-meta-desc-field', 'pages-collection', 'meta_description', 'text', 'Meta Description', '{"maxLength": 160, "rows": 2, "placeholder": "SEO description for search engines"}', 4, 0, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('pages-template-field', 'pages-collection', 'template', 'select', 'Page Template', '{"options": ["default", "landing", "contact", "about"], "default": "default"}', 5, 0, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

-- News fields
('news-title-field', 'news-collection', 'title', 'text', 'Title', '{"maxLength": 200, "placeholder": "Enter news title"}', 1, 1, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('news-content-field', 'news-collection', 'content', 'richtext', 'Content', '{"toolbar": "news", "height": 400}', 2, 1, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('news-category-field', 'news-collection', 'category', 'select', 'Category', '{"options": ["technology", "business", "politics", "sports", "entertainment", "health"], "required": true}', 3, 1, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('news-author-field', 'news-collection', 'author', 'text', 'Author', '{"placeholder": "Author name"}', 4, 1, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('news-source-field', 'news-collection', 'source', 'text', 'Source', '{"placeholder": "News source"}', 5, 0, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
('news-priority-field', 'news-collection', 'priority', 'select', 'Priority', '{"options": ["low", "normal", "high", "breaking"], "default": "normal"}', 6, 0, 0, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- =============================================================================
-- END OF CONSOLIDATED MIGRATION
-- =============================================================================
