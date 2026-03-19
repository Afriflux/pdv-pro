-- ═══════════════════════════════════════════════════════════════════════════════
-- Telegram Communities — Groupes d'apprenants liés aux boutiques PDV Pro
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Table principale
CREATE TABLE IF NOT EXISTS "TelegramCommunity" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id        TEXT NOT NULL REFERENCES "Store"(id) ON DELETE CASCADE,
  chat_id         TEXT UNIQUE,
  chat_title      TEXT,
  chat_type       TEXT CHECK (chat_type IN ('group', 'supergroup', 'channel')),
  product_id      TEXT REFERENCES "Product"(id) ON DELETE SET NULL,
  connect_code    TEXT UNIQUE,
  code_expires_at TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT true,
  members_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_telegram_community_store
  ON "TelegramCommunity" (store_id);

CREATE INDEX IF NOT EXISTS idx_telegram_community_code
  ON "TelegramCommunity" (connect_code)
  WHERE connect_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_telegram_community_chat
  ON "TelegramCommunity" (chat_id)
  WHERE chat_id IS NOT NULL;

-- 3. RLS
ALTER TABLE "TelegramCommunity" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendeur gère ses communautés"
  ON "TelegramCommunity"
  FOR ALL
  USING (
    store_id IN (
      SELECT id FROM "Store" WHERE user_id = (SELECT auth.uid()::text)
    )
  );

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION update_telegram_community_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_telegram_community_updated
  BEFORE UPDATE ON "TelegramCommunity"
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_community_timestamp();
