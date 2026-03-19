-- Fichier SQL 100% Sécurisé pour PDV Pro (Ne supprime aucune table Auth)

CREATE TABLE IF NOT EXISTS "ClosingRequest" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "call_attempts" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "closing_fee" DOUBLE PRECISION NOT NULL DEFAULT 500,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClosingRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BuyerScore" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "success_orders" INTEGER NOT NULL DEFAULT 0,
    "refused_orders" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BuyerScore_pkey" PRIMARY KEY ("id")
);

-- Index pour la recherche rapide
CREATE UNIQUE INDEX IF NOT EXISTS "ClosingRequest_order_id_key" ON "ClosingRequest"("order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "BuyerScore_phone_key" ON "BuyerScore"("phone");

-- Foreign Keys (Utiliser DO NOTHING en cas de duplication)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClosingRequest_order_id_fkey') THEN
        ALTER TABLE "ClosingRequest" ADD CONSTRAINT "ClosingRequest_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClosingRequest_store_id_fkey') THEN
        ALTER TABLE "ClosingRequest" ADD CONSTRAINT "ClosingRequest_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Mise à jour des tables existantes sans écraser les données
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "delivery_commission" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "closing_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "closing_fee" DOUBLE PRECISION NOT NULL DEFAULT 500;
