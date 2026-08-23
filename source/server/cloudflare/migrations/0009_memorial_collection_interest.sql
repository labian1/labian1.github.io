CREATE TABLE IF NOT EXISTS memorial_collection_interest (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  first_name TEXT,
  collection_slug TEXT NOT NULL,
  pet_species TEXT NOT NULL,
  timing TEXT NOT NULL,
  page_context TEXT,
  note TEXT,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(email, collection_slug)
);

CREATE INDEX IF NOT EXISTS idx_memorial_collection_interest_created
  ON memorial_collection_interest(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memorial_collection_interest_collection_created
  ON memorial_collection_interest(collection_slug, created_at DESC);
