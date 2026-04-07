-- ─── sql/withdrawal_migration.sql ───────────────────────────────────────────
-- Migration : ajout des colonnes de retrait sur la table Store
-- À exécuter dans l'éditeur SQL Supabase ou via CLI
-- Auteur : Yayyam · Date : 2026-03-17

-- ─── 1. Ajout des colonnes ────────────────────────────────────────────────────

ALTER TABLE "Store"
  ADD COLUMN IF NOT EXISTS withdrawal_method TEXT DEFAULT 'wave',
  ADD COLUMN IF NOT EXISTS withdrawal_number TEXT,
  ADD COLUMN IF NOT EXISTS withdrawal_name   TEXT;

-- withdrawal_method : 'wave' | 'orange_money' | 'bank'
-- withdrawal_number : numéro de téléphone Wave/Orange Money ou IBAN bancaire
-- withdrawal_name   : nom complet du titulaire du compte de retrait

-- ─── 2. Contrainte CHECK sur withdrawal_method ───────────────────────────────

ALTER TABLE "Store"
  DROP CONSTRAINT IF EXISTS chk_store_withdrawal_method;

ALTER TABLE "Store"
  ADD CONSTRAINT chk_store_withdrawal_method
  CHECK (
    withdrawal_method IS NULL OR
    withdrawal_method IN ('wave', 'orange_money', 'bank')
  );

-- ─── 3. Index partiel pour les requêtes de retrait ───────────────────────────

CREATE INDEX IF NOT EXISTS idx_store_withdrawal_number
  ON "Store"(withdrawal_number)
  WHERE withdrawal_number IS NOT NULL;

-- ─── 4. Commentaires de documentation ────────────────────────────────────────

COMMENT ON COLUMN "Store".withdrawal_method IS 'Méthode de retrait préférée : wave | orange_money | bank';
COMMENT ON COLUMN "Store".withdrawal_number IS 'Numéro Wave/Orange Money (format international) ou IBAN bancaire';
COMMENT ON COLUMN "Store".withdrawal_name   IS 'Nom complet du titulaire du compte de retrait';

-- ─── 5. Vérification ─────────────────────────────────────────────────────────

-- Après exécution, vérifier avec :
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'Store'
--   AND column_name IN ('withdrawal_method', 'withdrawal_number', 'withdrawal_name');
