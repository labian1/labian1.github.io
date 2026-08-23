CREATE TABLE IF NOT EXISTS care_circle_members (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  first_name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dog_profiles (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  dog_name TEXT NOT NULL,
  breed TEXT,
  age_years REAL NOT NULL,
  weight_lbs REAL,
  focus TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE TABLE IF NOT EXISTS dog_checkins (
  id TEXT PRIMARY KEY,
  dog_profile_id TEXT NOT NULL,
  sleep_state TEXT NOT NULL,
  mobility_state TEXT NOT NULL,
  appetite_state TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (dog_profile_id) REFERENCES dog_profiles(id)
);

CREATE TABLE IF NOT EXISTS care_circle_posts (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  dog_profile_id TEXT NOT NULL,
  dog_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id),
  FOREIGN KEY (dog_profile_id) REFERENCES dog_profiles(id)
);

CREATE TABLE IF NOT EXISTS care_circle_replies (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  dog_name TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (post_id) REFERENCES care_circle_posts(id),
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE INDEX IF NOT EXISTS idx_dog_profiles_member ON dog_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_dog_checkins_profile_created ON dog_checkins(dog_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_care_circle_posts_status_created ON care_circle_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_care_circle_replies_post_status_created ON care_circle_replies(post_id, status, created_at ASC);
