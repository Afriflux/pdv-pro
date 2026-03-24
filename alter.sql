CREATE TABLE IF NOT EXISTS "TelegramMember" (
    "id" TEXT NOT NULL,
    "telegram_user_id" TEXT NOT NULL,
    "telegram_username" TEXT,
    "chat_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "joined_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TelegramMember_order_id_key" ON "TelegramMember"("order_id");

ALTER TABLE "TelegramMember" DROP CONSTRAINT IF EXISTS "TelegramMember_order_id_fkey";
ALTER TABLE "TelegramMember" ADD CONSTRAINT "TelegramMember_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
