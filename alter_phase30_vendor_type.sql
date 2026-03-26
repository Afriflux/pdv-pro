-- alter_phase30_vendor_type.sql
-- Ajout de la colonne pour suivre la date de dernière modification du modèle économique.

ALTER TABLE "public"."Store" ADD COLUMN "vendor_type_updated_at" TIMESTAMP(3);
