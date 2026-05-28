# Campaign Loyalty System Scope

This document captures the agreed project scope for the `Campaign Loyalty System` in this repository.

## Stack

- Backend: Spring Boot (Java)
- Database: PostgreSQL
- Frontend: React

## Purpose

Build a beverage loyalty marketing campaign system where users scan hotel-specific QR codes and earn a free drink after 10 valid scans at the same hotel.

Brand context:

- Beverage company: `Marathon Klassics`
- Campaign theme: loyal customer giveaway
- Reward copy used in the product: free beer after 10 valid scans
- UI direction: black and white base with restrained supporting accents

## Core Rules

- Users are identified by a `device_id` cookie.
- For cross-origin deployed environments, the same device identity may also be sent through the `X-Device-Id` header.
- Scans are accepted only for devices registered with:
  - username
  - phone number
- A valid scan must be at least 60 minutes after the previous valid scan for the same user at the same hotel.
- A user can have at most 3 valid scans per hotel per day.
- QR tokens rotate every 2 minutes and must expire.
- The flow is fully automatic:
  - no OTP
  - no staff approval
- All scans, valid and invalid, must be logged for fraud analysis.
- Rewards must be counted and stored.
- Invalid token scans must be rejected.
- Rejected scans caused by time-gap or daily-limit violations must be logged with fraud metadata.
- Suspicious activity must be flagged when:
  - there are more than 2 rejected scans within 10 minutes
  - or the same violation repeats within 1 hour

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
- loyal customer registration profile fields
- bulk customer import from Excel

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
- fraud monitoring APIs
- admin customer analytics

### 7. common

- Shared utilities
- Exceptions
- Config

## Scan Business Logic

When `POST /api/scan` is called:

1. Validate the QR token:
   - exists
   - matches the hotel
   - is not expired
2. Identify the customer using the device identity.
   - If the device is not registered with username + phone number, reject the scan.
3. Check `last_scan_at` for that customer and hotel:
   - if less than 60 minutes ago, reject with `MIN_TIME_NOT_REACHED`
4. Check `daily_scan_count`:
   - if already 3 or more for that day, reject with `DAILY_LIMIT_REACHED`
5. If token is invalid or expired:
   - reject with `INVALID_OR_EXPIRED_TOKEN`
6. For rejected scans caused by business-rule violations:
   - log `scan_history`
   - include IP
   - include user agent
   - include `valid = false`
   - include rejection reason
   - include suspicious flag when thresholds are met
7. If valid:
   - accept the scan
   - increment `scan_count`
   - increment `daily_scan_count`
   - update `last_scan_at`
8. Log `scan_history` with:
   - IP
   - user agent
   - whether the scan was valid
   - reject reason if invalid
9. If `scan_count` reaches 10:
   - create a pending reward record
   - return a `confirmation_required` response with reward id
10. When `POST /api/scan/confirm/{rewardId}` is called:
   - confirm the pending reward
   - reset `scan_count` to 0
   - return a `reward_earned` response with reward id and congratulation message

Standard scan response shape:

- `status`
- `currentCount`
- `remainingToReward`
- optional `reason`
- optional `rewardId`
- optional `nextAllowedScanAt`

## Frontend Requirements

### Public Home Page

- Present Marathon Klassics campaign overview
- Explain the loyalty giveaway
- Provide hotel login entry
- Provide loyal customer registration entry
- Do not expose hotel QR controls publicly

### Loyal Customer Registration Page

- Separate public route
- Collect only:
  - username
  - phone number
- Persist browser device identity in local storage and cookie
- Show confirmation message after successful registration

### Scan Result Page

- Open after scanning the QR code
- Perform `POST /api/scan` automatically on page load
- Show current progress count
- Show next allowed scan time when rejected by time rule
- Show reward-earned message when applicable
- Keep guest interaction minimal

### Hotel Dashboard

- Hotel login only
- Show number of scans today
- Show rewards given
- Show suspicious scans

### Admin Dashboard

- Separate admin route in the frontend
- Separate admin login flow
- Show overall campaign stats
- Show registered hotel list
- Support hotel registration
- Support hotel Excel import
- Support loyal customer Excel import
- Show registered customer count
- Show clickable customer analytics list with:
  - customer identity
  - reward count
  - valid scan count
- Control hotel QR generation from admin only
- Show recent suspicious scans and fraud summary data from backend APIs

### Hotel QR Management

- Managed by admin, not exposed on the public home page
- Generate hotel-specific QR tokens
- Display QR code for guest scanning
- Auto-refresh every 2 minutes
- Provide guest-facing scan URL copy action

## Database

- PostgreSQL
- Flyway migrations included and preferred for ongoing schema changes
- Docker setup included

Current schema-related additions include:

- fraud fields on `scan_history`
  - `valid`
  - `rejection_reason`
  - `suspicious`
  - `ip_address`
  - `user_agent`
- loyal customer profile fields on `customer`

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

## Deployment Notes

- Frontend is built with Vite.
- Backend active profile is selected through environment variable.
- Cross-origin local and deployed setups must allow cookie/session usage and CORS correctly.
- Deployed frontend and backend must work across Vercel and Render.
- Device identity fallback via `X-Device-Id` is part of the expected deployed behavior.

## Working Agreement

This file is the baseline scope reference for future work in this repository unless we intentionally change requirements later.
