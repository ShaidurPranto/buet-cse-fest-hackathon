ALTER TABLE "order" ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_idempotency_key ON "order"(idempotency_key);
