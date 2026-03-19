-- ==========================================
-- MIGRATION : SYSTÈME D'AFFILIATION (CORRECTION FINALE)
-- ==========================================

-- Pour repartir sur une base propre et éviter les conflits avec le schéma Prisma pré-existant
DROP TABLE IF EXISTS "AffiliateTransaction" CASCADE;
DROP TABLE IF EXISTS "AffiliateReferral" CASCADE;
DROP TABLE IF EXISTS "Affiliate" CASCADE;

-- 1. Table des affiliés
CREATE TABLE "Affiliate" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id TEXT NOT NULL UNIQUE REFERENCES "Store"(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,           -- Code unique ex: "CHEIKH2024"
  balance NUMERIC(12,2) DEFAULT 0,     -- Solde disponible
  total_earned NUMERIC(12,2) DEFAULT 0,-- Total gagné depuis création
  total_referred INTEGER DEFAULT 0,    -- Nb total de filleuls
  active_referred INTEGER DEFAULT 0,   -- Nb filleuls actifs (ont commandé ce mois)
  commission_rate NUMERIC(5,2) DEFAULT 5.00, -- Taux actuel en %
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des filleuls (lien parrain -> filleul)
CREATE TABLE "AffiliateReferral" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  affiliate_id TEXT NOT NULL REFERENCES "Affiliate"(id) ON DELETE CASCADE,
  referred_store_id TEXT NOT NULL UNIQUE REFERENCES "Store"(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned')),
  first_order_at TIMESTAMPTZ,          -- Date première commande filleul
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table des transactions d'affiliation
CREATE TABLE "AffiliateTransaction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  affiliate_id TEXT NOT NULL REFERENCES "Affiliate"(id) ON DELETE CASCADE,
  referral_id TEXT REFERENCES "AffiliateReferral"(id),
  order_id TEXT,                        -- ID commande source
  type TEXT NOT NULL CHECK (type IN ('commission', 'withdrawal', 'adjustment')),
  amount NUMERIC(12,2) NOT NULL,
  rate NUMERIC(5,2),                    -- Taux appliqué
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Ajout de la colonne referred_by sur Store (Tracking parrainage)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Store' AND COLUMN_NAME='referred_by') THEN
    ALTER TABLE "Store" ADD COLUMN "referred_by" TEXT REFERENCES "Store"(id);
  END IF;
END $$;

-- 5. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_affiliate_store_id ON "Affiliate"(store_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_code ON "Affiliate"(code);
CREATE INDEX IF NOT EXISTS idx_referral_affiliate_id ON "AffiliateReferral"(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_referred_store_id ON "AffiliateReferral"(referred_store_id);
CREATE INDEX IF NOT EXISTS idx_transaction_affiliate_id ON "AffiliateTransaction"(affiliate_id);

-- 6. Trigger updated_at pour Affiliate
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer l'ancien trigger s'il existait
DROP TRIGGER IF EXISTS update_affiliate_updated_at ON "Affiliate";

CREATE TRIGGER update_affiliate_updated_at 
  BEFORE UPDATE ON "Affiliate" 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. RLS (Row Level Security)
ALTER TABLE "Affiliate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliateReferral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliateTransaction" ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques si elles existent
DROP POLICY IF EXISTS "Affiliates can view their own profile" ON "Affiliate";
DROP POLICY IF EXISTS "Affiliates can view their referrals" ON "AffiliateReferral";
DROP POLICY IF EXISTS "Affiliates can view their transactions" ON "AffiliateTransaction";

-- Nouvelles politiques
CREATE POLICY "Affiliates can view their own profile"
  ON "Affiliate" FOR SELECT
  USING (store_id IN (SELECT id FROM "Store" WHERE user_id = auth.uid()::text));

CREATE POLICY "Affiliates can view their referrals"
  ON "AffiliateReferral" FOR SELECT
  USING (affiliate_id IN (SELECT id FROM "Affiliate" WHERE store_id IN (SELECT id FROM "Store" WHERE user_id = auth.uid()::text)));

CREATE POLICY "Affiliates can view their transactions"
  ON "AffiliateTransaction" FOR SELECT
  USING (affiliate_id IN (SELECT id FROM "Affiliate" WHERE store_id IN (SELECT id FROM "Store" WHERE user_id = auth.uid()::text)));
