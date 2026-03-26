-- Migration pour la création de la table Workflow
-- Création de la table
CREATE TABLE "public"."Workflow" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "triggerType" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "last_run" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- Création de l'index pour optimiser les recherches par boutique
CREATE INDEX "Workflow_store_id_idx" ON "public"."Workflow"("store_id");

-- Ajout de la clé étrangère reliant le Workflow à la Boutique
ALTER TABLE "public"."Workflow" ADD CONSTRAINT "Workflow_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ajout du trigger pour mettre à jour 'updated_at' automatiquement (Optionnel mais recommandé)
-- (Si vous avez déjà une fonction handle_updated_at dans Supabase)
-- CREATE TRIGGER handle_updated_at BEFORE UPDATE ON "public"."Workflow" FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
