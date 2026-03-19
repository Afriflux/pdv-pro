-- ─── Migration : Système de plaintes PDV Pro ─────────────────────────────────
-- Crée la table Complaint pour le signalement de contenu illégal/frauduleux.
-- À exécuter depuis le SQL Editor Supabase ou via CLI.

CREATE TABLE IF NOT EXISTS "Complaint" (
  id            TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::text,
  store_id      TEXT          REFERENCES "Store"(id) ON DELETE SET NULL,
  product_id    TEXT          REFERENCES "Product"(id) ON DELETE SET NULL,
  reporter_id   TEXT          REFERENCES "User"(id) ON DELETE SET NULL,
  type          TEXT          NOT NULL CHECK (type IN ('plagiat', 'fraude', 'contenu_inapproprie', 'autre')),
  description   TEXT          NOT NULL,
  evidence_url  TEXT,
  status        TEXT          NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index pour pagination admin par statut
CREATE INDEX IF NOT EXISTS idx_complaint_status  ON "Complaint"(status);
-- Index pour retrouver les plaintes d'une boutique
CREATE INDEX IF NOT EXISTS idx_complaint_store   ON "Complaint"(store_id);
-- Index pour retrouver les plaintes d'un produit
CREATE INDEX IF NOT EXISTS idx_complaint_product ON "Complaint"(product_id);
-- Index de tri par date décroissante
CREATE INDEX IF NOT EXISTS idx_complaint_created ON "Complaint"(created_at DESC);

-- COMMENT sur la table
COMMENT ON TABLE "Complaint" IS
  'Signalements de contenu illégal, fraudes ou copies non autorisées sur PDV Pro.';
