-- ─── Migration : Droit de revente sur les produits digitaux ─────────────────
-- Ajoute les colonnes resale_allowed et resale_commission sur la table Product.
-- À exécuter depuis le SQL Editor Supabase ou via CLI.

-- Ajouter les colonnes de revente
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS resale_allowed    BOOLEAN       DEFAULT false,
ADD COLUMN IF NOT EXISTS resale_commission NUMERIC(5,2)  DEFAULT 0.00;

-- COMMENT sur les colonnes pour la documentation
COMMENT ON COLUMN "Product".resale_allowed IS
  'Si true, l''acheteur peut revendre ce produit digital (droit PLR/revente).';
COMMENT ON COLUMN "Product".resale_commission IS
  'Pourcentage reversé au créateur original sur chaque revente (0 à 30%).';

-- Index pour requêtes rapides sur les produits revendables
CREATE INDEX IF NOT EXISTS idx_product_resale
ON "Product"(resale_allowed) WHERE resale_allowed = true;
