CREATE TABLE IF NOT EXISTS memorial_tree_orders (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  customer_name TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  memory TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'checkout_pending',
  stripe_session_id TEXT,
  confirmation_email_status TEXT NOT NULL DEFAULT 'pending',
  confirmation_email_sent_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memorial_tree_orders_status_created
  ON memorial_tree_orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status_created
  ON stripe_webhook_events(status, created_at DESC);
