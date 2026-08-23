CREATE TABLE IF NOT EXISTS provider_inquiries (
  id TEXT PRIMARY KEY,
  organization TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  website TEXT,
  service_type TEXT NOT NULL,
  coverage TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_inquiries_status_created ON provider_inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_inquiries_email_created ON provider_inquiries(email, created_at DESC);
