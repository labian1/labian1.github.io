ALTER TABLE provider_inquiries ADD COLUMN request_type TEXT NOT NULL DEFAULT 'directory-listing';

CREATE TABLE IF NOT EXISTS care_session_registrations (
  id TEXT PRIMARY KEY,
  session_slug TEXT NOT NULL,
  session_title TEXT NOT NULL,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  species TEXT NOT NULL,
  focus TEXT NOT NULL,
  question TEXT,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(email, session_slug)
);

CREATE INDEX IF NOT EXISTS idx_care_session_registrations_created ON care_session_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_care_session_registrations_session_created ON care_session_registrations(session_slug, created_at DESC);
