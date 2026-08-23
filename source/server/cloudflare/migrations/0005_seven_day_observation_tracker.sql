ALTER TABLE dog_checkins ADD COLUMN day_number INTEGER;
ALTER TABLE dog_checkins ADD COLUMN prompt TEXT;

CREATE INDEX IF NOT EXISTS idx_dog_checkins_profile_day_created ON dog_checkins(dog_profile_id, day_number, created_at DESC);
