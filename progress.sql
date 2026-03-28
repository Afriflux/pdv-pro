CREATE TABLE IF NOT EXISTS "public"."MasterclassProgress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterclassProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MasterclassProgress_user_id_article_id_key" ON "public"."MasterclassProgress"("user_id", "article_id");

-- Ignore foreign key constraint creation if it already exists to avoid errors on retry
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MasterclassProgress_user_id_fkey') THEN
        ALTER TABLE "public"."MasterclassProgress" ADD CONSTRAINT "MasterclassProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END;
$$;

-- PATCH POUR LA TABLE DE CONFIG GLOBALE (PLATFORM CONFIG)
-- Pour éviter l'erreur "PGRST204 Could not find the 'key' column of 'PlatformConfig'"
ALTER TABLE "public"."PlatformConfig" ADD COLUMN IF NOT EXISTS "key" TEXT UNIQUE;
ALTER TABLE "public"."PlatformConfig" ADD COLUMN IF NOT EXISTS "value" TEXT;

-- Force Supabase à recharger le cache de la structure de base de données
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- MISE À JOUR DES VISUELS DU SITE (28 MARS 2026)
-- À exécuter dans l'éditeur SQL de Supabase pour injecter les sublimes images générées !
-- ==============================================================================
INSERT INTO "PlatformConfig" ("key", "value", "updated_at")
VALUES 
  ('landing_logo', '/icon-512x512.png', NOW()),
  ('auth_bg', '/assets/auth_bg.png', NOW()),
  ('seo_og_image', '/assets/social_preview.png', NOW()),
  ('seo_title', 'PDV Pro - La Plateforme #1 d''Affiliation E-commerce en Afrique', NOW()),
  ('seo_description', 'Touchez vos commissions automatiquement avec l''écosystème e-commerce.', NOW()),
  ('platform_name', 'PDV Pro', NOW())
ON CONFLICT ("key") 
DO UPDATE SET 
  "value" = EXCLUDED."value",
  "updated_at" = EXCLUDED."updated_at";

-- ==============================================================================
-- MISE À JOUR DES DONNÉES LÉGALES (28 MARS 2026)
-- À exécuter dans l'éditeur SQL de Supabase
-- ==============================================================================
INSERT INTO "PlatformConfig" ("key", "value", "updated_at")
VALUES 
  ('legal_cgu_url', 'https://pdvpro.sn/mentions-legales', NOW()),
  ('legal_privacy_url', 'https://pdvpro.sn/politique-confidentialite', NOW()),
  ('legal_refund_url', 'https://pdvpro.sn/conditions-remboursement', NOW())
ON CONFLICT ("key") 
DO UPDATE SET 
  "value" = EXCLUDED."value",
  "updated_at" = EXCLUDED."updated_at";
