# Campaign Loyalty System Scope

This document captures the agreed project scope for the `Campaign Loyalty System` in this repository.

## Stack

- Backend: Spring Boot (Java)
- Database: PostgreSQL
- Frontend: React

## Purpose

Build a beverage loyalty marketing campaign system where users scan hotel-specific QR codes and earn a free drink after 10 valid scans at the same hotel.

## Core Rules

- Users are identified by a `device_id` cookie.
- A valid scan must be at least 20 minutes after the previous valid scan for the same user at the same hotel.
- A user can have at most 3 valid scans per hotel per day.
- QR tokens rotate every 2 minutes and must expire.
- The flow is fully automatic:
  - no OTP
  - no staff approval
- All scans, valid and invalid, must be logged for fraud analysis.
- Rewards must be counted and stored.

## Backend Feature Modules

### 1. hotel

- `Hotel` entity
- `HotelService`
- `HotelRepository`
- `HotelController`
- DTOs

### 2. qrtoken

- `QrToken` entity
- `QrTokenService`
- `QrTokenRepository`
- `QrTokenController`
- Scheduler to expire old tokens

### 3. customer

- `Customer` entity with `device_id`
- `CustomerRepository`
- `CustomerService`

### 4. scan

- `ScanController`
- `ScanService`
- `ScanHistory` entity and repository
- `customer_hotel_progress` progress logic
- Request and response DTOs

### 5. reward

- `Reward` entity
- `RewardService`
- `RewardRepository`

### 6. dashboard

- `DashboardController`
- `DashboardService`
- Hotel stats and overall stats APIs

### 7. common

- Shared utilities
- Exceptions
- Config

## Scan Business Logic

When `POST /api/scan` is called:

1. Validate the hotel exists.
2. Validate the QR token:
   - exists
   - matches the hotel
   - is not expired
3. Identify or create the customer using the `device_id` cookie.
4. Check `last_scan_at` for that customer and hotel:
   - if less than 20 minutes ago, reject
5. Check `daily_scan_count`:
   - if already 3 or more for that day, reject
6. If valid:
   - accept the scan
   - increment `scan_count`
   - increment `daily_scan_count`
   - update `last_scan_at`
7. Log `scan_history` with:
   - IP
   - user agent
   - whether the scan was valid
   - reject reason if invalid
8. If `scan_count` reaches 10:
   - reset `scan_count` to 0
   - insert a reward record
   - return a reward-earned response

## Frontend Requirements

### Hotel QR Display Page

- Fetch QR tokens from the backend
- Display the current QR code
- Auto-refresh every 2 minutes

### Scan Page

- Open after scanning the QR code
- Perform `POST /api/scan`
- Show current progress count
- Show reward-earned message when applicable

### Hotel Dashboard

- Show number of scans today
- Show rewards given
- Show suspicious scans

## Database

- PostgreSQL
- SQL schema included
- Docker setup included

## Delivery Expectation

Generate the project cleanly in feature folders and include:

- backend entities
- repositories
- services
- controllers
- config
- frontend pages
- frontend API calls

The codebase should be runnable with Maven and npm.

## Working Agreement

This file is the baseline scope reference for future work in this repository unless we intentionally change requirements later.
