-- /Users/cheikhabdoulkhadredjeylanidjitte/Desktop/PDV Pro/sql/telegram_bot_migration.sql
-- Migration pour l'intégration du Bot Telegram @PDVProBot
-- À exécuter dans le SQL Editor de Supabase

-- 1. Ajout des colonnes Telegram à la table Store
-- 'telegram_chat_id' permet d'identifier l'utilisateur sur Telegram
-- 'telegram_notifications' stocke les préférences de notifications
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "telegram_chat_id" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "telegram_notifications" JSONB DEFAULT '{"orders": true, "payments": true, "whatsapp": true, "stock": true}';

-- 2. Création de la table pour les tokens de liaison temporaires
-- Utilisée pour lier de manière sécurisée un compte Telegram à un compte Vendeur
CREATE TABLE IF NOT EXISTS "telegram_link_tokens" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "store_id" TEXT NOT NULL REFERENCES "Store"("id") ON DELETE CASCADE, -- Correction : TEXT au lieu de UUID
    "token" TEXT UNIQUE NOT NULL, -- Token de 6 caractères alphanumériques
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexation pour optimiser la recherche de tokens
CREATE INDEX IF NOT EXISTS "idx_telegram_link_tokens_token" ON "telegram_link_tokens"("token");
CREATE INDEX IF NOT EXISTS "idx_telegram_link_tokens_store_id" ON "telegram_link_tokens"("store_id");

-- 4. Activation de RLS (Row Level Security) pour la table des tokens
ALTER TABLE "telegram_link_tokens" ENABLE ROW LEVEL SECURITY;

-- Politique : Un vendeur ne peut voir que les tokens liés à ses boutiques
CREATE POLICY "vendeurs_own_tokens" ON "telegram_link_tokens"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM "Store" 
            WHERE "Store".id = "telegram_link_tokens".store_id 
            AND "Store".user_id = auth.uid()::text
        )
    );

COMMENT ON TABLE "telegram_link_tokens" IS 'Stockage des tokens temporaires pour la liaison des comptes Telegram.';
