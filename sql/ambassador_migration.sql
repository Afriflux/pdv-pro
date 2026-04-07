-- ============================================================
-- MIGRATION : Système Ambassadeur — Yayyam
-- Exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Extensions nécessaires
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 2. Colonnes additionnelles sur les tables existantes
-- ────────────────────────────────────────────────────────────

-- La colonne role existe déjà comme enum "Role" dans Prisma
-- On n'ajoute rien ici — les valeurs 'ambassador' et 'client'
-- ont été ajoutées directement via ALTER TYPE "Role" ADD VALUE

-- Lien ambassadeur sur Store
ALTER TABLE "Store"
  ADD COLUMN IF NOT EXISTS referred_by_ambassador TEXT REFERENCES "Ambassador"(id) ON DELETE SET NULL;

ALTER TABLE "Store"
  ADD COLUMN IF NOT EXISTS registration_month TEXT;  -- Format : "2026-03"

-- ────────────────────────────────────────────────────────────
-- 3. Table Ambassador
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Ambassador" (
  id                    TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id               TEXT        NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  store_id              TEXT        REFERENCES "Store"(id) ON DELETE SET NULL,
  code                  TEXT        NOT NULL UNIQUE,
  name                  TEXT        NOT NULL,
  bio                   TEXT,
  commission_per_vendor NUMERIC(10,2) NOT NULL DEFAULT 1000,
  min_ca_requirement    NUMERIC(12,2) NOT NULL DEFAULT 50000,
  total_referred        INTEGER     NOT NULL DEFAULT 0,
  total_qualified       INTEGER     NOT NULL DEFAULT 0,
  total_earned          NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance               NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active             BOOLEAN     NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 4. Table AmbassadorReferral
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AmbassadorReferral" (
  id                       TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ambassador_id            TEXT        NOT NULL REFERENCES "Ambassador"(id) ON DELETE CASCADE,
  vendor_store_id          TEXT        NOT NULL UNIQUE REFERENCES "Store"(id) ON DELETE CASCADE,
  registration_month       TEXT        NOT NULL,           -- Format : "2026-03"
  ca_in_registration_month NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_qualified             BOOLEAN     NOT NULL DEFAULT false,
  commission_paid          BOOLEAN     NOT NULL DEFAULT false,
  commission_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. Table AmbassadorTransaction
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AmbassadorTransaction" (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ambassador_id  TEXT        NOT NULL REFERENCES "Ambassador"(id) ON DELETE CASCADE,
  referral_id    TEXT        REFERENCES "AmbassadorReferral"(id) ON DELETE SET NULL,
  type           TEXT        NOT NULL CHECK (type IN ('commission', 'withdrawal', 'bonus')),
  amount         NUMERIC(12,2) NOT NULL,
  description    TEXT,
  status         TEXT        NOT NULL DEFAULT 'completed'
                             CHECK (status IN ('completed', 'pending', 'failed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. Index pour les performances
-- ────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassador_code
  ON "Ambassador"(code);

CREATE INDEX IF NOT EXISTS idx_ambassador_user_id
  ON "Ambassador"(user_id);

CREATE INDEX IF NOT EXISTS idx_ambassador_is_active
  ON "Ambassador"(is_active);

CREATE INDEX IF NOT EXISTS idx_referral_ambassador_id
  ON "AmbassadorReferral"(ambassador_id);

CREATE INDEX IF NOT EXISTS idx_referral_vendor_store_id
  ON "AmbassadorReferral"(vendor_store_id);

CREATE INDEX IF NOT EXISTS idx_referral_registration_month
  ON "AmbassadorReferral"(registration_month);

CREATE INDEX IF NOT EXISTS idx_referral_is_qualified
  ON "AmbassadorReferral"(is_qualified);

CREATE INDEX IF NOT EXISTS idx_referral_commission_paid
  ON "AmbassadorReferral"(commission_paid);

CREATE INDEX IF NOT EXISTS idx_ambassador_tx_ambassador_id
  ON "AmbassadorTransaction"(ambassador_id);

-- ────────────────────────────────────────────────────────────
-- 7. Trigger updated_at sur Ambassador
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_ambassador_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ambassador_updated_at ON "Ambassador";
CREATE TRIGGER trg_ambassador_updated_at
  BEFORE UPDATE ON "Ambassador"
  FOR EACH ROW
  EXECUTE FUNCTION set_ambassador_updated_at();

-- ────────────────────────────────────────────────────────────
-- 8. Row Level Security (RLS)
-- ────────────────────────────────────────────────────────────

-- Ambassador : lecture publique sur code + name (pour validation),
-- écriture réservée à l'admin (service_role via createAdminClient)
ALTER TABLE "Ambassador" ENABLE ROW LEVEL SECURITY;

-- Un ambassadeur voit sa propre ligne
CREATE POLICY IF NOT EXISTS "ambassador_select_own"
  ON "Ambassador" FOR SELECT
  USING (user_id = auth.uid()::text);

-- L'admin (service_role) bypasse le RLS — pas de policy nécessaire
-- (createAdminClient utilise service_role key)

-- AmbassadorReferral : l'ambassadeur voit ses propres référrals
ALTER TABLE "AmbassadorReferral" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "referral_select_own"
  ON "AmbassadorReferral" FOR SELECT
  USING (
    ambassador_id IN (
      SELECT id FROM "Ambassador" WHERE user_id = auth.uid()::text
    )
  );

-- AmbassadorTransaction : l'ambassadeur voit ses propres transactions
ALTER TABLE "AmbassadorTransaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "tx_select_own"
  ON "AmbassadorTransaction" FOR SELECT
  USING (
    ambassador_id IN (
      SELECT id FROM "Ambassador" WHERE user_id = auth.uid()::text
    )
  );

-- ────────────────────────────────────────────────────────────
-- 9. Correction de l'ordre de création des colonnes sur Store
-- (La FK referred_by_ambassador sur Store référence Ambassador,
--  mais Ambassador est créé après. Sous Supabase, les FK peuvent
--  être ajoutées via ALTER TABLE après création des deux tables.)
-- ────────────────────────────────────────────────────────────

-- Supprimer la FK provisoire si elle existe déjà (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'store_referred_by_ambassador_fkey'
      AND table_name = 'Store'
  ) THEN
    ALTER TABLE "Store"
      ADD CONSTRAINT store_referred_by_ambassador_fkey
      FOREIGN KEY (referred_by_ambassador)
      REFERENCES "Ambassador"(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- FIN DE MIGRATION
-- ────────────────────────────────────────────────────────────
