CREATE TABLE IF NOT EXISTS "TelegramCommunityAccess" (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id     TEXT NOT NULL,
  community_id TEXT NOT NULL REFERENCES "TelegramCommunity"(id) ON DELETE CASCADE,
  buyer_phone  TEXT,
  invite_link  TEXT,
  sent_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tca_order
  ON "TelegramCommunityAccess" (order_id);
CREATE INDEX IF NOT EXISTS idx_tca_community
  ON "TelegramCommunityAccess" (community_id);
