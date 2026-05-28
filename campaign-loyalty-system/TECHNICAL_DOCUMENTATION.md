# Campaign Loyalty System — Technical Documentation

This document explains the technical architecture, request/response flow, data model, and local/devops setup so a new developer can pick up where work left off.

Repo root (this folder) contains:

- `frontend/` — React + Vite UI (Vercel deploy target).
- `backend/` — Spring Boot API (Render deploy target).
- `docker-compose.yml` — local Postgres only.
- `DEPLOYMENT.md` — Vercel/Render notes.

## 1) Product Flow (What the system does)

Roles:

- **Guest (customer):** scans a rotating QR code at a hotel and sees an immediate result (counted / rejected / reward).
- **Loyal customer registration:** guest registers once (name + phone) to tie progress to their browser device.
- **Hotel user:** logs in to view only their hotel’s dashboard stats.
- **Admin:** logs in to manage hotels/customers, import Excel sheets, and generate the rotating guest-facing QR codes.

Core rule set (backend-configurable in `application-prod.yml`):

- Minimum time gap between valid scans at the same hotel (`campaign.time-gap-minutes`, default 60).
- Max valid scans per customer per hotel per day (`campaign.daily-scan-limit`, default 3).
- Reward threshold valid scans at the same hotel (`campaign.reward-threshold`, default 10).
- Reward requires an explicit confirmation step (see “Reward confirmation” below).

## 2) High-Level Architecture

### Frontend (Vite + React)

- Entry points are controlled by **path + query params**, not React Router:
  - `/` (home, hotel login, scan view)
  - `/admin` (admin dashboard)
  - `/register` (loyal customer registration)
- “Views” on `/` are toggled with `?view=home|hotel|scan`.
- Guest scan links are generated as:
  - `/?view=scan&hotelId=<id>&token=<uuid>`

Key files:

- `frontend/src/App.jsx` — page mode switching (home/hotel/admin/register/scan) and `device_id` cookie creation.
- `frontend/src/services/api.js` — axios client + API wrappers.
- `frontend/src/components/QrDisplay.jsx` — admin generates token and renders QR code; auto-refresh every 2 minutes.
- `frontend/src/components/ScanPage.jsx` — auto-submits the scan token and renders the result.
- `frontend/src/components/Dashboard.jsx` — hotel/admin login and dashboards + import forms.
- `frontend/vite.config.js` — local dev proxy for `/api` → backend.

### Backend (Spring Boot 3.1, Java 17)

- Session-based auth for **admin** and **hotel** via `HttpSession` + cookies.
- Guest scan endpoints do **not** require login, but require a stable **device identifier** (`device_id` cookie or `X-Device-Id` header).
- Database: PostgreSQL with Flyway migrations (`backend/src/main/resources/db/migration`).
- Scheduled cleanup task deletes expired QR tokens every minute.

Key packages:

- `com.campaignloyalty.auth` — session login + role gating.
- `com.campaignloyalty.hotel` — hotel CRUD/import/authenticate.
- `com.campaignloyalty.qrtoken` — generate short-lived QR tokens + cleanup.
- `com.campaignloyalty.scan` — scan validation, progress tracking, suspicious detection.
- `com.campaignloyalty.customer` — loyal customer registration/import + lookup by device id.
- `com.campaignloyalty.dashboard` — reporting APIs.
- `com.campaignloyalty.reward` — reward creation + confirmation.

## 3) Identity Model (Session vs Device)

The system uses **two independent identity concepts**:

1) **Admin/Hotel session (cookie-backed `HttpSession`)**

- Used for admin/hotel dashboard and admin-only operations (create hotel, imports, generate QR tokens).
- Frontend uses `axios({ withCredentials: true })` to persist session cookies across requests.

2) **Guest device id (cookie `device_id`)**

- Used to tie scans and customer registration to the same browser/device.
- Backend accepts either:
  - `device_id` cookie (preferred), or
  - `X-Device-Id` request header (fallback).
- Frontend sets a `device_id` cookie for one year in `frontend/src/App.jsx` (via `ensureDeviceCookie()`).

Important: guest scan flows rely on the device id being present; without it the backend returns HTTP 400.

## 4) Frontend Flow (Screens → API Calls)

### 4.1 Admin

Admin URL: `/admin`

Main actions:

- Login:
  - `POST /api/admin/login` (frontend uses this alias endpoint)
- Create hotel:
  - `POST /api/hotels` (admin-only)
- Import hotels (Excel):
  - `POST /api/hotels/import` (admin-only)
- Import loyal customers (Excel):
  - `POST /api/customers/import` (admin-only)
- Generate hotel QR token:
  - `POST /api/qr-tokens/generate/{hotelId}` (admin-only)
- Dashboard data:
  - `GET /api/dashboard/admin`
  - `GET /api/dashboard/admin/customers`

`frontend/src/components/QrDisplay.jsx`:

- Calls `/api/qr-tokens/generate/{hotelId}`, then builds a scan URL using `VITE_PUBLIC_APP_URL` (or `window.location.origin`) and renders a QR image.
- Auto-refreshes the QR token every **120 seconds**.

### 4.2 Hotel

Hotel login happens on `/` with `?view=hotel`.

Main actions:

- Login:
  - `POST /api/auth/hotel/login`
- Current hotel stats:
  - `GET /api/dashboard/hotel/me`

### 4.3 Loyal customer registration

Registration URL: `/register`

Main actions:

- Load current device registration (if any):
  - `GET /api/customers/me`
- Register/update profile:
  - `POST /api/customers/register`

Backend requires a device id; the frontend creates `device_id` before the registration view loads.

### 4.4 Guest scan (QR)

Guest scan URL shape:

- `/` with `?view=scan&hotelId=<id>&token=<token>`

Main actions:

- Submit scan:
  - `POST /api/scan` body `{ "token": "<uuid>" }`
- If reward confirmation required:
  - `POST /api/scan/confirm/{rewardId}`

Guest UX is intentionally “no forms”; `ScanPage` auto-submits once per page load.

## 5) Backend Flow (Core Logic)

### 5.1 QR Token Generation

`POST /api/qr-tokens/generate/{hotelId}` (admin-only)

- Validates hotel existence.
- Creates a `qr_token` row with:
  - random UUID token
  - `expires_at = now + campaign.qr-token-validity-minutes` (default 3 minutes)
- A scheduled job deletes expired tokens every minute.

### 5.2 Scan Processing

`POST /api/scan`

Inputs:

- device id from `device_id` cookie or `X-Device-Id` header
- QR token from request body
- IP + User-Agent logged to history

Decision tree (simplified):

1) Reject if token missing/expired/invalid (`INVALID_OR_EXPIRED_TOKEN`).
2) Resolve hotel from token; reject if hotel missing.
3) Reject if device id missing.
4) Reject if device not registered as loyal customer (`UNREGISTERED_DEVICE`).
5) Load `customer_hotel_progress` for (customer, hotel), create if missing.
6) Reset `daily_scan_count` if day changed since `last_scan_at`.
7) If there is a `pending_reward_id`, reject with status `confirmation_required`.
8) Enforce minimum time gap since `last_scan_at` (`MIN_TIME_NOT_REACHED`).
9) Enforce daily scan limit (`DAILY_LIMIT_REACHED`).
10) Accept scan:
    - increment `scan_count`, `daily_scan_count`
    - set `last_scan_at = now`
11) If `scan_count >= reward-threshold`, create a **pending** reward and require confirmation.
12) Otherwise return success.

### 5.3 Reward Confirmation (Required)

`POST /api/scan/confirm/{rewardId}`

- Requires device id.
- Validates:
  - the reward exists
  - the reward belongs to the customer and hotel
  - the customer’s progress has `pending_reward_id == rewardId`
- Sets reward `confirmed_at` and `earned_at` timestamps.
- Resets `customer_hotel_progress.scan_count` back to `0` and clears `pending_reward_id`.

This prevents “10th scan” double counting and creates an explicit “claim reward” moment.

### 5.4 Suspicious Scan Detection

When a scan is rejected (time gap / daily limit / etc.), the backend may set `scan_history.suspicious = true` if:

- the rejection is the **3rd failed attempt within 10 minutes**, or
- the same rejection reason repeats within **1 hour** for the same customer+hotel.

Suspicious scans are included in dashboard metrics.

## 6) API Surface (Quick Reference)

Base URL: `/api`

Auth:

- `POST /api/auth/hotel/login`
- `POST /api/auth/admin/login`
- `POST /api/admin/login` (alias used by the frontend admin screen)
- `GET /api/auth/me`
- `POST /api/auth/logout`

Hotels (admin-only unless noted):

- `POST /api/hotels`
- `GET /api/hotels/{id}` (public)
- `POST /api/hotels/import`

QR tokens (admin-only):

- `POST /api/qr-tokens/generate/{hotelId}`

Customers:

- `POST /api/customers/register` (requires device id)
- `GET /api/customers/me` (requires device id)
- `GET /api/customers` (admin-only)
- `POST /api/customers/import` (admin-only)

Scan:

- `POST /api/scan` (requires device id)
- `POST /api/scan/confirm/{rewardId}` (requires device id)

Dashboards:

- `GET /api/dashboard/hotel/me` (hotel-only)
- `GET /api/dashboard/hotel/{hotelId}` (hotel-only for own hotel, or admin)
- `GET /api/dashboard/hotel/{hotelId}/suspicious-scans` (hotel-only for own hotel, or admin)
- `GET /api/dashboard/overall` (admin-only)
- `GET /api/dashboard/admin` (admin-only)
- `GET /api/dashboard/admin/customers` (admin-only)
- `GET /api/dashboard/admin/fraud-summary` (admin-only)

Scan response contract (`ScanResponse`):

- `status`: `success | rejected | confirmation_required | reward_earned`
- `currentCount`: current valid scan count for this hotel
- `remainingToReward`: scans remaining until reward (0 if confirmation required)
- `reason`: a `RejectionReason` enum name when rejected
- `rewardId`: provided when confirmation is required (and later echoed on reward earned)
- `nextAllowedScanAt`: populated for min-time rejections
- `message`: optional human-friendly message

Swagger UI:

- SpringDoc is enabled; typical URL is `GET /swagger-ui/index.html` on the backend host.

## 7) Data Model (Tables + Purpose)

Flyway migrations are the source of truth:

- `backend/src/main/resources/db/migration`

Main tables:

- `hotel`
  - `name`, `location`, `password`, `created_at`
- `qr_token`
  - short-lived `token` tied to `hotel_id` with `expires_at`
- `customer`
  - `device_id` (unique) + optional loyal customer profile fields:
    - `full_name`, `phone_number` (unique where not null), `email` (unique where not null), `registered_at`
- `customer_hotel_progress`
  - per (customer, hotel) counters:
    - `scan_count`, `daily_scan_count`, `last_scan_at`
    - `pending_reward_id` to enforce confirmation
- `reward`
  - created pending; becomes confirmed with `confirmed_at` + `earned_at`
- `scan_history`
  - immutable log of every scan attempt with:
    - `valid`, `reject_reason`, `suspicious`, `scanned_at`, `ip_address`, `user_agent`

Note: `backend/src/main/resources/schema.sql` exists but is not kept in sync with later migrations; prefer Flyway migrations.

## 8) Local Development Setup

### 8.1 Start Postgres

From `campaign-loyalty-system/`:

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` with:

- DB: `campaign_loyalty`
- user: `postgres`
- pass: `password`

### 8.2 Run backend

From `campaign-loyalty-system/backend/`:

```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/campaign_loyalty"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="password"
export SPRING_PROFILES_ACTIVE="default"

./run.sh
```

Backend defaults to port `8080` (override with `PORT`).

Flyway migrations run automatically on startup.

### 8.3 Run frontend

From `campaign-loyalty-system/frontend/`:

```bash
npm install
npm run dev
```

Local API wiring:

- Set `VITE_API_BASE_URL=/api` and Vite will proxy to the backend.
- Configure proxy target if needed:
  - `VITE_DEV_PROXY_TARGET=http://localhost:8080`

If you need QR codes to work on physical phones, you must expose the frontend publicly and set:

- `VITE_PUBLIC_APP_URL=https://<your-public-frontend-url>`

## 9) Deployment Notes (Where things were left)

- Frontend deploy target is Vercel; rewrites configured in `vercel.json` so `/admin` and `/register` work as SPA routes.
- Backend deploy target is Render (Docker); env vars are defined in `render.yaml`.
- CORS is configured to allow credentials (session cookies) and supports wildcard origins via `campaign.cors.allowed-origin-patterns`.
- Production cookie settings:
  - `backend/src/main/resources/application-prod.yml` defaults to `SameSite=None` + `Secure=true` for session cookies.

## 10) Known Gotchas / “Next Developer Should Know”

- **Device id header vs storage key:** backend primarily uses the `device_id` cookie; `X-Device-Id` is optional. The frontend sets the cookie, so the system works even if the header is absent.
- **`schema.sql` drift:** it’s not aligned with later Flyway migrations (missing loyalty fields, suspicious flag, reward confirmation columns).
- **Admin-only QR generation:** `POST /api/qr-tokens/generate/{hotelId}` requires an admin session; hotel sessions cannot generate tokens.
- **Imports assume first worksheet:** both hotel and customer imports read only the first sheet and expect specific headers (see services for validation).

## 11) Where to Start When Continuing Work

Common extension points:

- **Adjust scan rules:** `backend/src/main/resources/application-prod.yml` (and `ScanService` in `com.campaignloyalty.scan.service`).
- **Scan UX changes:** `frontend/src/components/ScanPage.jsx` and `frontend/src/components/QrDisplay.jsx`.
- **Dashboard metrics:** `backend/src/main/java/com/campaignloyalty/dashboard/service/DashboardService.java` plus repository queries.
- **Excel import format changes:** `backend/src/main/java/com/campaignloyalty/hotel/service/HotelService.java` and `backend/src/main/java/com/campaignloyalty/customer/service/CustomerService.java`.

