-- sql/vendor_contract_migration.sql
-- Migration : Ajouter les colonnes de contrat partenaire sur la table Store

ALTER TABLE "Store"
  ADD COLUMN IF NOT EXISTS contract_accepted    BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMPTZ;

-- Documentation
COMMENT ON COLUMN "Store".contract_accepted
  IS 'Vrai si le vendeur a signé le contrat partenaire Yayyam';
COMMENT ON COLUMN "Store".contract_accepted_at
  IS 'Date de signature du contrat vendeur (horodatage serveur)';
