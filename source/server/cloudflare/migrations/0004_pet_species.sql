ALTER TABLE dog_profiles ADD COLUMN species TEXT NOT NULL DEFAULT 'dog';
ALTER TABLE care_circle_groups ADD COLUMN species TEXT NOT NULL DEFAULT 'all';

CREATE INDEX IF NOT EXISTS idx_dog_profiles_species_focus ON dog_profiles(species, focus);
CREATE INDEX IF NOT EXISTS idx_care_circle_groups_species_status ON care_circle_groups(species, status, created_at DESC);
