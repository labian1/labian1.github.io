ALTER TABLE care_circle_posts ADD COLUMN group_id TEXT;

CREATE TABLE IF NOT EXISTS care_circle_groups (
  id TEXT PRIMARY KEY,
  host_member_id TEXT NOT NULL,
  host_dog_profile_id TEXT NOT NULL,
  host_dog_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  focus TEXT NOT NULL,
  cadence TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (host_member_id) REFERENCES care_circle_members(id),
  FOREIGN KEY (host_dog_profile_id) REFERENCES dog_profiles(id)
);

CREATE TABLE IF NOT EXISTS care_circle_group_members (
  group_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL,
  PRIMARY KEY (group_id, member_id),
  FOREIGN KEY (group_id) REFERENCES care_circle_groups(id),
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE TABLE IF NOT EXISTS care_circle_media (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  dog_profile_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  media_kind TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id),
  FOREIGN KEY (dog_profile_id) REFERENCES dog_profiles(id)
);

CREATE TABLE IF NOT EXISTS care_circle_post_media (
  post_id TEXT NOT NULL,
  media_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, media_id),
  FOREIGN KEY (post_id) REFERENCES care_circle_posts(id),
  FOREIGN KEY (media_id) REFERENCES care_circle_media(id)
);

CREATE TABLE IF NOT EXISTS form_sync_log (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_care_circle_groups_status_created ON care_circle_groups(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_care_circle_group_members_member ON care_circle_group_members(member_id, group_id);
CREATE INDEX IF NOT EXISTS idx_care_circle_media_status_created ON care_circle_media(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_care_circle_post_media_post ON care_circle_post_media(post_id, position);
CREATE INDEX IF NOT EXISTS idx_form_sync_log_email_created ON form_sync_log(email, created_at DESC);
