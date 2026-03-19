-- ============================================================================
-- Opérations atomiques sur le Wallet vendeur
-- Élimine les race conditions du read-modify-write côté applicatif
-- À exécuter dans le SQL Editor Supabase AVANT déploiement
-- ============================================================================

-- 1. Gel atomique de commission (COD)
--    Condition : balance >= commission (sinon aucune ligne mise à jour)
CREATE OR REPLACE FUNCTION freeze_commission(
  p_vendor_id  TEXT,
  p_commission NUMERIC
) RETURNS void LANGUAGE sql AS $$
  UPDATE "Wallet"
  SET
    balance    = balance  - p_commission,
    pending    = pending  + p_commission,
    updated_at = NOW()
  WHERE vendor_id = p_vendor_id
    AND balance >= p_commission;
$$;

-- 2. Libérer commission (après confirmation paiement COD)
CREATE OR REPLACE FUNCTION release_commission(
  p_vendor_id  TEXT,
  p_commission NUMERIC
) RETURNS void LANGUAGE sql AS $$
  UPDATE "Wallet"
  SET
    pending    = GREATEST(0, pending - p_commission),
    updated_at = NOW()
  WHERE vendor_id = p_vendor_id;
$$;

-- 3. Débit atomique wallet (retrait vendeur)
--    Retourne TRUE si le débit a été effectué, FALSE si solde insuffisant
CREATE OR REPLACE FUNCTION debit_wallet(
  p_vendor_id TEXT,
  p_amount    NUMERIC
) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE "Wallet"
  SET
    balance    = balance - p_amount,
    pending    = pending + p_amount,
    updated_at = NOW()
  WHERE vendor_id = p_vendor_id
    AND balance >= p_amount;
  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

-- 4. Crédit atomique ambassadeur
CREATE OR REPLACE FUNCTION credit_ambassador(
  p_ambassador_id TEXT,
  p_amount        NUMERIC
) RETURNS void LANGUAGE sql AS $$
  UPDATE "Ambassador"
  SET
    balance         = balance + p_amount,
    total_earned    = total_earned + p_amount,
    total_qualified = total_qualified + 1,
    updated_at      = NOW()
  WHERE id = p_ambassador_id;
$$;
