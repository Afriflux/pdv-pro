-- 1. Ajout des colonnes de tracking à la table Order (IF NOT EXISTS)
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "last_reminder_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "is_archived" BOOLEAN DEFAULT false;

-- 2. Création de la table WithdrawalRequest (Demandes de retrait)
CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL REFERENCES "Store"(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES "Wallet"(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL, -- 'wave', 'orange_money', 'bank'
  phone_or_iban TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'insufficient_funds')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Création des index pour la performance des crons
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON "WithdrawalRequest"(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_created_at ON "WithdrawalRequest"(created_at);
CREATE INDEX IF NOT EXISTS idx_order_is_archived ON "Order"(is_archived);
CREATE INDEX IF NOT EXISTS idx_order_status_updated ON "Order"(status, updated_at);

-- 4. Configuration de la RLS sur WithdrawalRequest
ALTER TABLE "WithdrawalRequest" ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux vendeurs de voir leurs propres demandes
DROP POLICY IF EXISTS "Vendeurs voient leurs propres retraits" ON "WithdrawalRequest";
CREATE POLICY "Vendeurs voient leurs propres retraits" ON "WithdrawalRequest"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Store" 
      WHERE "Store".id = "WithdrawalRequest".store_id 
      AND "Store".user_id = auth.uid()::text
    )
  );

-- Politique pour permettre aux vendeurs de créer une demande
DROP POLICY IF EXISTS "Vendeurs créent leurs demandes" ON "WithdrawalRequest";
CREATE POLICY "Vendeurs créent leurs demandes" ON "WithdrawalRequest"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Store" 
      WHERE "Store".id = "WithdrawalRequest".store_id 
      AND "Store".user_id = auth.uid()::text
    )
  );

-- 5. Trigger updated_at (Création de la fonction et du trigger)

-- Créer la fonction si elle n'existe pas déjà
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS tr_withdrawal_updated_at ON "WithdrawalRequest";
CREATE TRIGGER tr_withdrawal_updated_at
  BEFORE UPDATE ON "WithdrawalRequest"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
