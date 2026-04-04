INSERT INTO hotel (id, name, location, password, created_at)
SELECT 1, 'Ocean View Hotel', 'Mogadishu', 'ocean123', CURRENT_TIMESTAMP - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM hotel WHERE id = 1);

INSERT INTO hotel (id, name, location, password, created_at)
SELECT 2, 'Skyline Suites', 'Hargeisa', 'skyline123', CURRENT_TIMESTAMP - INTERVAL '8 days'
WHERE NOT EXISTS (SELECT 1 FROM hotel WHERE id = 2);

INSERT INTO hotel (id, name, location, password, created_at)
SELECT 3, 'Palm Garden Lodge', 'Bosaso', 'palm123', CURRENT_TIMESTAMP - INTERVAL '6 days'
WHERE NOT EXISTS (SELECT 1 FROM hotel WHERE id = 3);

INSERT INTO customer (id, device_id, created_at)
SELECT 1, 'demo-device-ocean-1', CURRENT_TIMESTAMP - INTERVAL '7 days'
WHERE NOT EXISTS (SELECT 1 FROM customer WHERE id = 1);

INSERT INTO customer (id, device_id, created_at)
SELECT 2, 'demo-device-ocean-2', CURRENT_TIMESTAMP - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM customer WHERE id = 2);

INSERT INTO customer (id, device_id, created_at)
SELECT 3, 'demo-device-skyline-1', CURRENT_TIMESTAMP - INTERVAL '4 days'
WHERE NOT EXISTS (SELECT 1 FROM customer WHERE id = 3);

INSERT INTO customer (id, device_id, created_at)
SELECT 4, 'demo-device-palm-1', CURRENT_TIMESTAMP - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM customer WHERE id = 4);

INSERT INTO customer_hotel_progress (id, customer_id, hotel_id, scan_count, daily_scan_count, last_scan_at, updated_at)
SELECT 1, 1, 1, 4, 2, CURRENT_TIMESTAMP - INTERVAL '45 minutes', CURRENT_TIMESTAMP - INTERVAL '45 minutes'
WHERE NOT EXISTS (SELECT 1 FROM customer_hotel_progress WHERE id = 1);

INSERT INTO customer_hotel_progress (id, customer_id, hotel_id, scan_count, daily_scan_count, last_scan_at, updated_at)
SELECT 2, 2, 1, 9, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours'
WHERE NOT EXISTS (SELECT 1 FROM customer_hotel_progress WHERE id = 2);

INSERT INTO customer_hotel_progress (id, customer_id, hotel_id, scan_count, daily_scan_count, last_scan_at, updated_at)
SELECT 3, 3, 2, 6, 3, CURRENT_TIMESTAMP - INTERVAL '25 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes'
WHERE NOT EXISTS (SELECT 1 FROM customer_hotel_progress WHERE id = 3);

INSERT INTO customer_hotel_progress (id, customer_id, hotel_id, scan_count, daily_scan_count, last_scan_at, updated_at)
SELECT 4, 4, 3, 2, 1, CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP - INTERVAL '4 hours'
WHERE NOT EXISTS (SELECT 1 FROM customer_hotel_progress WHERE id = 4);

INSERT INTO qr_token (id, token, hotel_id, created_at, expires_at)
SELECT 1, 'demo-hotel-1-active', 1, CURRENT_TIMESTAMP - INTERVAL '1 minute', CURRENT_TIMESTAMP + INTERVAL '20 minutes'
WHERE NOT EXISTS (SELECT 1 FROM qr_token WHERE token = 'demo-hotel-1-active');

INSERT INTO qr_token (id, token, hotel_id, created_at, expires_at)
SELECT 2, 'demo-hotel-2-active', 2, CURRENT_TIMESTAMP - INTERVAL '1 minute', CURRENT_TIMESTAMP + INTERVAL '20 minutes'
WHERE NOT EXISTS (SELECT 1 FROM qr_token WHERE token = 'demo-hotel-2-active');

INSERT INTO qr_token (id, token, hotel_id, created_at, expires_at)
SELECT 3, 'demo-hotel-3-active', 3, CURRENT_TIMESTAMP - INTERVAL '1 minute', CURRENT_TIMESTAMP + INTERVAL '20 minutes'
WHERE NOT EXISTS (SELECT 1 FROM qr_token WHERE token = 'demo-hotel-3-active');

INSERT INTO qr_token (id, token, hotel_id, created_at, expires_at)
SELECT 4, 'demo-hotel-1-expired', 1, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '15 minutes'
WHERE NOT EXISTS (SELECT 1 FROM qr_token WHERE token = 'demo-hotel-1-expired');

INSERT INTO scan_history (id, customer_id, hotel_id, qr_token, scanned_at, ip_address, user_agent, valid, reject_reason)
SELECT 1, 1, 1, 'demo-hotel-1-active', CURRENT_TIMESTAMP - INTERVAL '6 hours', '197.248.10.10', 'Seeded Demo Browser', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM scan_history WHERE id = 1);

INSERT INTO scan_history (id, customer_id, hotel_id, qr_token, scanned_at, ip_address, user_agent, valid, reject_reason)
SELECT 2, 2, 1, 'demo-hotel-1-active', CURRENT_TIMESTAMP - INTERVAL '4 hours', '197.248.10.11', 'Seeded Demo Browser', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM scan_history WHERE id = 2);

INSERT INTO scan_history (id, customer_id, hotel_id, qr_token, scanned_at, ip_address, user_agent, valid, reject_reason)
SELECT 3, 2, 1, 'demo-hotel-1-active', CURRENT_TIMESTAMP - INTERVAL '3 hours', '197.248.10.11', 'Seeded Demo Browser', FALSE, 'too frequent'
WHERE NOT EXISTS (SELECT 1 FROM scan_history WHERE id = 3);

INSERT INTO scan_history (id, customer_id, hotel_id, qr_token, scanned_at, ip_address, user_agent, valid, reject_reason)
SELECT 4, 3, 2, 'demo-hotel-2-active', CURRENT_TIMESTAMP - INTERVAL '5 hours', '197.248.10.12', 'Seeded Demo Browser', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM scan_history WHERE id = 4);

INSERT INTO scan_history (id, customer_id, hotel_id, qr_token, scanned_at, ip_address, user_agent, valid, reject_reason)
SELECT 5, 3, 2, 'demo-hotel-2-active', CURRENT_TIMESTAMP - INTERVAL '2 hours', '197.248.10.12', 'Seeded Demo Browser', FALSE, 'daily limit reached'
WHERE NOT EXISTS (SELECT 1 FROM scan_history WHERE id = 5);

INSERT INTO scan_history (id, customer_id, hotel_id, qr_token, scanned_at, ip_address, user_agent, valid, reject_reason)
SELECT 6, 4, 3, 'demo-hotel-3-active', CURRENT_TIMESTAMP - INTERVAL '90 minutes', '197.248.10.13', 'Seeded Demo Browser', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM scan_history WHERE id = 6);

INSERT INTO scan_history (id, customer_id, hotel_id, qr_token, scanned_at, ip_address, user_agent, valid, reject_reason)
SELECT 7, NULL, 1, 'demo-hotel-1-expired', CURRENT_TIMESTAMP - INTERVAL '30 minutes', '197.248.10.99', 'Seeded Demo Browser', FALSE, 'invalid token'
WHERE NOT EXISTS (SELECT 1 FROM scan_history WHERE id = 7);

INSERT INTO reward (id, customer_id, hotel_id, earned_at, redeemed)
SELECT 1, 2, 1, CURRENT_TIMESTAMP - INTERVAL '1 day', FALSE
WHERE NOT EXISTS (SELECT 1 FROM reward WHERE id = 1);

INSERT INTO reward (id, customer_id, hotel_id, earned_at, redeemed)
SELECT 2, 3, 2, CURRENT_TIMESTAMP - INTERVAL '3 hours', TRUE
WHERE NOT EXISTS (SELECT 1 FROM reward WHERE id = 2);

SELECT setval('hotel_id_seq', COALESCE((SELECT MAX(id) FROM hotel), 1), TRUE);
SELECT setval('customer_id_seq', COALESCE((SELECT MAX(id) FROM customer), 1), TRUE);
SELECT setval('customer_hotel_progress_id_seq', COALESCE((SELECT MAX(id) FROM customer_hotel_progress), 1), TRUE);
SELECT setval('qr_token_id_seq', COALESCE((SELECT MAX(id) FROM qr_token), 1), TRUE);
SELECT setval('scan_history_id_seq', COALESCE((SELECT MAX(id) FROM scan_history), 1), TRUE);
SELECT setval('reward_id_seq', COALESCE((SELECT MAX(id) FROM reward), 1), TRUE);
