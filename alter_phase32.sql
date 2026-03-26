-- Migration SQL native pour l'ajout des Order Bumps (Phase 32)
-- Les entités concernées : Product, SalePage, Order

-- 1. Ajout des colonnes sur Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bump_active" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bump_product_id" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "bump_offer_text" TEXT;

-- 2. Ajout des colonnes sur SalePage
ALTER TABLE "SalePage" ADD COLUMN IF NOT EXISTS "bump_active" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SalePage" ADD COLUMN IF NOT EXISTS "bump_product_id" TEXT;
ALTER TABLE "SalePage" ADD COLUMN IF NOT EXISTS "bump_offer_text" TEXT;

-- 3. Ajout des colonnes sur Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "bump_product_id" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "bump_variant_id" TEXT;
