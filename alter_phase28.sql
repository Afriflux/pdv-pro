-- Migration Phase 28 : Tâches Internes CRM

CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "dueDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Task_store_id_idx" ON "public"."Task"("store_id");

ALTER TABLE "public"."Task" 
    ADD CONSTRAINT "Task_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Si vous supprimez ou ajoutez des statuts, n'oubliez pas d'en informer l'application Client.
