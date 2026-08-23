ALTER TABLE care_circle_posts ADD COLUMN care_chat_conversation_id TEXT;

CREATE INDEX IF NOT EXISTS idx_care_circle_posts_conversation
  ON care_circle_posts(care_chat_conversation_id);
