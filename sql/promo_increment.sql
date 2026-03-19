-- ============================================================================
-- Incrémentation atomique du compteur d'utilisation PromoCode
-- Élimine la race condition du read-modify-write sur uses
-- À exécuter dans le SQL Editor Supabase AVANT déploiement
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_promo_uses(
  p_promo_id TEXT,
  delta      INTEGER DEFAULT 1
) RETURNS void LANGUAGE sql AS $$
  UPDATE "PromoCode"
  SET uses = uses + delta
  WHERE id = p_promo_id;
$$;
