CREATE TABLE IF NOT EXISTS newsletter_signups (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS community_research_queries (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  dog_profile_id TEXT NOT NULL,
  query TEXT NOT NULL,
  species TEXT NOT NULL,
  public_facebook_url TEXT,
  source_scope TEXT NOT NULL,
  status TEXT NOT NULL,
  brief_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id),
  FOREIGN KEY (dog_profile_id) REFERENCES dog_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_signups_created ON newsletter_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_research_member_created ON community_research_queries(member_id, created_at DESC);
