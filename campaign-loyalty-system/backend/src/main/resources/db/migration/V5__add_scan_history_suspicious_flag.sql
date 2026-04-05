ALTER TABLE scan_history
ADD COLUMN IF NOT EXISTS suspicious BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_scan_history_hotel_suspicious_scanned_at
ON scan_history(hotel_id, suspicious, scanned_at DESC);
