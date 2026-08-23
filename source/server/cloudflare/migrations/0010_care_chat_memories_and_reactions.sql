CREATE TABLE IF NOT EXISTS care_chat_conversations (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  pet_profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  privacy TEXT NOT NULL DEFAULT 'private',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id),
  FOREIGN KEY (pet_profile_id) REFERENCES dog_profiles(id)
);

CREATE TABLE IF NOT EXISTS care_chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  body TEXT NOT NULL,
  payload_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES care_chat_conversations(id)
);

CREATE TABLE IF NOT EXISTS care_circle_reactions (
  post_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  reaction TEXT NOT NULL DEFAULT 'helpful',
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, member_id),
  FOREIGN KEY (post_id) REFERENCES care_circle_posts(id),
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE TABLE IF NOT EXISTS care_circle_saves (
  post_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, member_id),
  FOREIGN KEY (post_id) REFERENCES care_circle_posts(id),
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE TABLE IF NOT EXISTS pet_memories (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  pet_profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  media_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id),
  FOREIGN KEY (pet_profile_id) REFERENCES dog_profiles(id),
  FOREIGN KEY (media_id) REFERENCES care_circle_media(id)
);

CREATE TABLE IF NOT EXISTS membership_interests (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  email TEXT NOT NULL COLLATE NOCASE,
  tier TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(email, tier)
);

CREATE INDEX IF NOT EXISTS idx_care_chat_member_created ON care_chat_conversations(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_care_chat_messages_conversation ON care_chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_pet_memories_profile_created ON pet_memories(pet_profile_id, created_at DESC);
