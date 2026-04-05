ALTER TABLE customer
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_phone_number_unique
ON customer(phone_number)
WHERE phone_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_email_unique
ON customer(email)
WHERE email IS NOT NULL;
