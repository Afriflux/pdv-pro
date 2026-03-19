-- Migration : Table Review (avis clients)
-- Exécuter dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "Review" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id    TEXT NOT NULL REFERENCES "Store"(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES "Product"(id) ON DELETE SET NULL,
  order_id    TEXT REFERENCES "Order"(id) ON DELETE SET NULL,
  buyer_name  TEXT NOT NULL,
  buyer_phone TEXT,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  verified    BOOLEAN DEFAULT false,  -- Avis vérifié (acheteur réel)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_review_store   ON "Review"(store_id);
CREATE INDEX IF NOT EXISTS idx_review_product ON "Review"(product_id);
CREATE INDEX IF NOT EXISTS idx_review_rating  ON "Review"(rating);

-- Politique RLS : lecture publique
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews lisibles publiquement"
  ON "Review" FOR SELECT USING (true);

CREATE POLICY "Insertion publique des avis"
  ON "Review" FOR INSERT WITH CHECK (true);
