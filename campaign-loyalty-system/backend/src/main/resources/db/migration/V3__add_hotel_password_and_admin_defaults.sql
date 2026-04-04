ALTER TABLE hotel
    ADD COLUMN IF NOT EXISTS password VARCHAR(255);

UPDATE hotel
SET password = 'hotel123'
WHERE password IS NULL OR password = '';

ALTER TABLE hotel
    ALTER COLUMN password SET NOT NULL;
