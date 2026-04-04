ALTER TABLE scan_history DROP CONSTRAINT IF EXISTS scan_history_customer_id_fkey;
ALTER TABLE scan_history DROP CONSTRAINT IF EXISTS scan_history_hotel_id_fkey;
ALTER TABLE customer_hotel_progress DROP CONSTRAINT IF EXISTS customer_hotel_progress_customer_id_fkey;
ALTER TABLE customer_hotel_progress DROP CONSTRAINT IF EXISTS customer_hotel_progress_hotel_id_fkey;
ALTER TABLE reward DROP CONSTRAINT IF EXISTS reward_customer_id_fkey;
ALTER TABLE reward DROP CONSTRAINT IF EXISTS reward_hotel_id_fkey;
ALTER TABLE qr_token DROP CONSTRAINT IF EXISTS qr_token_hotel_id_fkey;

ALTER TABLE hotel
    ALTER COLUMN id TYPE INTEGER;
ALTER TABLE customer
    ALTER COLUMN id TYPE INTEGER;

ALTER TABLE qr_token
    ALTER COLUMN id TYPE INTEGER,
    ALTER COLUMN hotel_id TYPE INTEGER;

ALTER TABLE scan_history
    ALTER COLUMN id TYPE INTEGER,
    ALTER COLUMN customer_id TYPE INTEGER,
    ALTER COLUMN hotel_id TYPE INTEGER;

ALTER TABLE customer_hotel_progress
    ALTER COLUMN id TYPE INTEGER,
    ALTER COLUMN customer_id TYPE INTEGER,
    ALTER COLUMN hotel_id TYPE INTEGER;

ALTER TABLE reward
    ALTER COLUMN id TYPE INTEGER,
    ALTER COLUMN customer_id TYPE INTEGER,
    ALTER COLUMN hotel_id TYPE INTEGER;

ALTER TABLE qr_token
    ADD CONSTRAINT qr_token_hotel_id_fkey
        FOREIGN KEY (hotel_id) REFERENCES hotel(id);

ALTER TABLE scan_history
    ADD CONSTRAINT scan_history_customer_id_fkey
        FOREIGN KEY (customer_id) REFERENCES customer(id),
    ADD CONSTRAINT scan_history_hotel_id_fkey
        FOREIGN KEY (hotel_id) REFERENCES hotel(id);

ALTER TABLE customer_hotel_progress
    ADD CONSTRAINT customer_hotel_progress_customer_id_fkey
        FOREIGN KEY (customer_id) REFERENCES customer(id),
    ADD CONSTRAINT customer_hotel_progress_hotel_id_fkey
        FOREIGN KEY (hotel_id) REFERENCES hotel(id);

ALTER TABLE reward
    ADD CONSTRAINT reward_customer_id_fkey
        FOREIGN KEY (customer_id) REFERENCES customer(id),
    ADD CONSTRAINT reward_hotel_id_fkey
        FOREIGN KEY (hotel_id) REFERENCES hotel(id);
