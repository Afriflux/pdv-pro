CREATE TABLE IF NOT EXISTS "public"."AIKnowledgeBase" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIKnowledgeBase_pkey" PRIMARY KEY ("id")
);
