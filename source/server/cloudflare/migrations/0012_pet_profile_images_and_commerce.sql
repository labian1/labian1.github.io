ALTER TABLE dog_profiles ADD COLUMN profile_media_id TEXT;

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  email TEXT NOT NULL COLLATE NOCASE,
  customer_name TEXT NOT NULL,
  shipping_region TEXT NOT NULL,
  items_json TEXT NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'checkout_pending',
  stripe_session_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE TABLE IF NOT EXISTS membership_checkouts (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  email TEXT NOT NULL COLLATE NOCASE,
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'checkout_pending',
  stripe_session_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (member_id) REFERENCES care_circle_members(id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status_created
  ON marketplace_orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_membership_checkouts_status_created
  ON membership_checkouts(status, created_at DESC);
