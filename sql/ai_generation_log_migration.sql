-- ============================================================================
-- Migration : Table AIGenerationLog — Rate limiting des générations IA
-- À exécuter dans Supabase SQL Editor AVANT le déploiement
-- ============================================================================

-- 1. Créer la table de logging
CREATE TABLE IF NOT EXISTS "AIGenerationLog" (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type       TEXT        NOT NULL CHECK (type IN ('product', 'script')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Index pour les requêtes de rate limiting (user_id + created_at)
CREATE INDEX IF NOT EXISTS idx_ai_gen_user_created
  ON "AIGenerationLog" (user_id, created_at);

-- 3. Activer RLS
ALTER TABLE "AIGenerationLog" ENABLE ROW LEVEL SECURITY;

-- 4. Policy : chaque user ne voit que ses propres logs
CREATE POLICY "Users see only own logs"
  ON "AIGenerationLog" FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Policy : chaque user peut insérer ses propres logs
CREATE POLICY "Users can insert own logs"
  ON "AIGenerationLog" FOR INSERT
  WITH CHECK (auth.uid() = user_id);
