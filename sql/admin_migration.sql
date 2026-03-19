-- 1. Mise à jour de l'ENUM Role
-- Note : super_admin est déjà présent dans prisma, mais on assure sa présence SQL
-- On ajoute 'support' qui manque au schéma Prisma (pour usage futur)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'Role' AND e.enumlabel = 'support') THEN
    ALTER TYPE "Role" ADD VALUE 'support';
  END IF;
END $$;

-- 2. Création de la table AdminLog (si Prisma ne l'a pas encore créée via migrate)
CREATE TABLE IF NOT EXISTS "AdminLog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexation
CREATE INDEX IF NOT EXISTS idx_admin_log_admin ON "AdminLog"(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_target ON "AdminLog"(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_log_created_at ON "AdminLog"(created_at);

-- 4. Configuration de la RLS sur AdminLog
ALTER TABLE "AdminLog" ENABLE ROW LEVEL SECURITY;

-- Seuls les super_admin peuvent voir les logs
DROP POLICY IF EXISTS "Admins can see all logs" ON "AdminLog";
CREATE POLICY "Admins can see all logs" ON "AdminLog"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
      AND "User".role = 'super_admin'
    )
  );

-- Seul le système/admin peut insérer des logs
DROP POLICY IF EXISTS "System can insert logs" ON "AdminLog";
CREATE POLICY "System can insert logs" ON "AdminLog"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
      AND "User".role IN ('super_admin', 'support')
    )
  );

COMMENT ON TABLE "AdminLog" IS 'Journal d''audit des actions effectuées par les administrateurs.';
