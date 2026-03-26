-- Script d'altération pour la Phase 29 : Livraisons & Flotte

-- 1. Création de la table Deliverer
CREATE TABLE IF NOT EXISTS "public"."Deliverer" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deliverer_pkey" PRIMARY KEY ("id")
);

-- 2. Ajout de la clé de relation dans Order
ALTER TABLE "public"."Order" ADD COLUMN IF NOT EXISTS "deliverer_id" TEXT;

-- 3. Ajout des contraintes de clés étrangères
ALTER TABLE "public"."Deliverer" ADD CONSTRAINT "Deliverer_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_deliverer_id_fkey" FOREIGN KEY ("deliverer_id") REFERENCES "public"."Deliverer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Optionnel : Index pour les performances
CREATE INDEX IF NOT EXISTS "Deliverer_store_id_idx" ON "public"."Deliverer"("store_id");
CREATE INDEX IF NOT EXISTS "Order_deliverer_id_idx" ON "public"."Order"("deliverer_id");
