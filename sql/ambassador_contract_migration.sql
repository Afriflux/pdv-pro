-- sql/ambassador_contract_migration.sql
-- Migration : Ajouter les colonnes de contrat sur la table Ambassador

ALTER TABLE "Ambassador"
  ADD COLUMN IF NOT EXISTS contract_accepted    BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_accepted_at TIMESTAMPTZ;

-- Documentation
COMMENT ON COLUMN "Ambassador".contract_accepted
  IS 'Vrai si l''ambassadeur a signé le contrat Yayyam';
COMMENT ON COLUMN "Ambassador".contract_accepted_at
  IS 'Date de signature du contrat ambassadeur (horodatage serveur)';
