-- Migration Phase 28B : Enrichissement des Tâches Internes CRM

ALTER TABLE "public"."Task"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "taskType" TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN "client_name" TEXT,
  ADD COLUMN "client_phone" TEXT,
  ADD COLUMN "order_id" TEXT;
