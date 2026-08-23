ALTER TABLE care_circle_members ADD COLUMN location TEXT;
ALTER TABLE care_circle_members ADD COLUMN mobile_link_code TEXT;
ALTER TABLE care_circle_members ADD COLUMN membership_plan TEXT NOT NULL DEFAULT 'free';

ALTER TABLE dog_profiles ADD COLUMN health_conditions TEXT;
ALTER TABLE dog_profiles ADD COLUMN medications TEXT;
ALTER TABLE dog_profiles ADD COLUMN routine_notes TEXT;

CREATE TABLE IF NOT EXISTS marketplace_vendor_applications (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  product_categories TEXT NOT NULL,
  product_story TEXT NOT NULL,
  fulfillment_regions TEXT,
  consent_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_interests_v2 (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  email TEXT NOT NULL,
  desired_plan TEXT NOT NULL DEFAULT 'care-plus',
  yearbook_interest INTEGER NOT NULL DEFAULT 0,
  monthly_story_interest INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(email, desired_plan),
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_applications_status_created ON marketplace_vendor_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_profiles_member_created ON dog_profiles(member_id, created_at DESC);
