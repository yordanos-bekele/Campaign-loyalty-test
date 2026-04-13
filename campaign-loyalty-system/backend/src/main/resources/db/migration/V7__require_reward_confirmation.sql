ALTER TABLE reward
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE reward
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

ALTER TABLE reward
    ALTER COLUMN earned_at DROP DEFAULT;

UPDATE reward
SET created_at = COALESCE(created_at, earned_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL;

UPDATE reward
SET confirmed_at = COALESCE(confirmed_at, earned_at)
WHERE confirmed_at IS NULL
  AND earned_at IS NOT NULL;

ALTER TABLE customer_hotel_progress
    ADD COLUMN IF NOT EXISTS pending_reward_id INT REFERENCES reward(id);

CREATE INDEX IF NOT EXISTS idx_reward_confirmed_at ON reward(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_customer_hotel_progress_pending_reward_id ON customer_hotel_progress(pending_reward_id);

