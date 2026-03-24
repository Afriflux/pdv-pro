ALTER TABLE "Product" ADD COLUMN "payment_type" TEXT NOT NULL DEFAULT 'one_time';
ALTER TABLE "Product" ADD COLUMN "recurring_interval" TEXT;

ALTER TABLE "Order" ADD COLUMN "is_subscription" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "next_billing_at" TIMESTAMP(3);
