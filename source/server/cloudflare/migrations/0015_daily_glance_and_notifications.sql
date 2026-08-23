CREATE TABLE IF NOT EXISTS daily_glances (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  pet_profile_id TEXT NOT NULL,
  checkin_id TEXT NOT NULL,
  glance_date TEXT NOT NULL,
  headline TEXT NOT NULL,
  reflection TEXT NOT NULL,
  share_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(pet_profile_id, glance_date),
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id),
  FOREIGN KEY (pet_profile_id) REFERENCES dog_profiles(id),
  FOREIGN KEY (checkin_id) REFERENCES dog_checkins(id)
);

CREATE TABLE IF NOT EXISTS app_notifications (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE INDEX IF NOT EXISTS idx_daily_glances_pet_date
  ON daily_glances(pet_profile_id, glance_date DESC);

CREATE INDEX IF NOT EXISTS idx_app_notifications_member_unread
  ON app_notifications(member_id, is_read, created_at DESC);
