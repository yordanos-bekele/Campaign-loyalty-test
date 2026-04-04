# Deployment Guide

This project is set up for:

- Frontend: Vercel
- Backend: Render

## Frontend on Vercel

### Recommended Vercel settings

- Root Directory: `campaign-loyalty-system/frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

### Frontend environment variables

Set these in Vercel:

- `VITE_PUBLIC_APP_URL=https://your-vercel-app.vercel.app`
- `VITE_API_BASE_URL=https://your-render-backend.onrender.com/api`

Optional for local dev only:

- `VITE_DEV_PROXY_TARGET=http://localhost:8080`
- `VITE_DEV_HOST=0.0.0.0`
- `VITE_DEV_PORT=5173`

## Backend on Render

### Recommended Render settings

- Root Directory: `campaign-loyalty-system/backend`
- Runtime: `Docker`

If you prefer native Java instead of Docker:

- Build Command: `mvn -DskipTests package`
- Start Command: `java -jar target/campaign-loyalty-backend-0.0.1-SNAPSHOT.jar`

### Backend environment variables

Set these in Render:

- `SPRING_DATASOURCE_URL=jdbc:postgresql://...`
- `SPRING_DATASOURCE_USERNAME=...`
- `SPRING_DATASOURCE_PASSWORD=...`
- `SPRING_PROFILES_ACTIVE=prod`
- `CAMPAIGN_ADMIN_USERNAME=admin`
- `CAMPAIGN_ADMIN_PASSWORD=choose-a-secure-password`
- `CAMPAIGN_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-vercel-app.vercel.app`
- `SPRING_JPA_SHOW_SQL=false`

Render already provides `PORT`, and the app now reads it automatically.

## Notes

- Flyway migrations run automatically on startup.
- The frontend QR flow now uses `VITE_PUBLIC_APP_URL`, so production QR codes can open the deployed frontend instead of `localhost`.
- The frontend API base uses `VITE_API_BASE_URL`, so Vercel can call the deployed backend directly.
