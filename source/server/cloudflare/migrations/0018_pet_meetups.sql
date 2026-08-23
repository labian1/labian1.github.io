CREATE TABLE IF NOT EXISTS pet_meetup_profiles (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  pet_profile_id TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  radius_miles INTEGER NOT NULL DEFAULT 10,
  mixed_species_ok INTEGER NOT NULL DEFAULT 0,
  size_band TEXT NOT NULL,
  energy_level TEXT NOT NULL,
  temperament TEXT NOT NULL,
  mobility_needs TEXT NOT NULL,
  play_style TEXT NOT NULL,
  availability TEXT NOT NULL,
  venue_preference TEXT NOT NULL,
  owner_goal TEXT NOT NULL,
  safety_notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(member_id, pet_profile_id),
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id),
  FOREIGN KEY (pet_profile_id) REFERENCES dog_profiles(id)
);

CREATE TABLE IF NOT EXISTS pet_meetup_matches (
  id TEXT PRIMARY KEY,
  profile_a_id TEXT NOT NULL,
  profile_b_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  reasons_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'suggested',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (profile_a_id) REFERENCES pet_meetup_profiles(id),
  FOREIGN KEY (profile_b_id) REFERENCES pet_meetup_profiles(id)
);

CREATE TABLE IF NOT EXISTS pet_meetup_feedback (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  comfort_rating INTEGER NOT NULL,
  energy_fit_rating INTEGER NOT NULL,
  owner_fit_rating INTEGER NOT NULL,
  safety_rating INTEGER NOT NULL,
  meet_again INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(match_id, member_id),
  FOREIGN KEY (match_id) REFERENCES pet_meetup_matches(id),
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE INDEX IF NOT EXISTS idx_meetup_profiles_location ON pet_meetup_profiles(country, region, city, active);
CREATE INDEX IF NOT EXISTS idx_meetup_profiles_member ON pet_meetup_profiles(member_id, pet_profile_id);
CREATE INDEX IF NOT EXISTS idx_meetup_matches_profiles ON pet_meetup_matches(profile_a_id, profile_b_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetup_feedback_member ON pet_meetup_feedback(member_id, created_at DESC);
