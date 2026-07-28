-- Create database if not exists
-- CREATE DATABASE campaign_loyalty;

-- Use the database
-- \c campaign_loyalty;

CREATE TABLE hotel (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qr_token (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    hotel_id BIGINT NOT NULL REFERENCES hotel(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE customer (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scan_history (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customer(id),
    hotel_id BIGINT NOT NULL REFERENCES hotel(id),
    qr_token VARCHAR(255),
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    valid BOOLEAN NOT NULL,
    reject_reason VARCHAR(255)
);

CREATE TABLE customer_hotel_progress (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customer(id),
    hotel_id BIGINT NOT NULL REFERENCES hotel(id),
    scan_count INT DEFAULT 0,
    daily_scan_count INT DEFAULT 0,
    last_scan_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, hotel_id)
);

CREATE TABLE reward (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customer(id),
    hotel_id BIGINT NOT NULL REFERENCES hotel(id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    redeemed BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_qr_token_token ON qr_token(token);
CREATE INDEX idx_qr_token_hotel_id ON qr_token(hotel_id);
CREATE INDEX idx_customer_device_id ON customer(device_id);
CREATE INDEX idx_scan_history_customer_hotel ON scan_history(customer_id, hotel_id);
CREATE INDEX idx_scan_history_scanned_at ON scan_history(scanned_at);
CREATE INDEX idx_customer_hotel_progress_customer_hotel ON customer_hotel_progress(customer_id, hotel_id);
CREATE INDEX idx_reward_customer_hotel ON reward(customer_id, hotel_id);