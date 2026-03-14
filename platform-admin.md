# Platform Admin Module

## Goal

Implement a fully isolated Platform Admin (Super Admin) module with separated TOTP 2FA, independent MPA frontend build, and complete system monitoring and enterprise management capabilities.

## Tech Stack

- Backend: Node.js, Fastify, Prisma, PostgreSQL
- Frontend: React, Vite, Tailwind (MPA configuration for `/platform/`)
- Security: `speakeasy` & `qrcode` for TOTP, isolated platform JWTs, `bcrypt` for backup codes.

## File Structure

- `backend/src/modules/platform/`: Core platform domains (auth, dashboard, companies, support, holidays, settings, admins, monitoring).
- `backend/src/middleware/`: `platformAuthenticate`, `platformAuthorize`, `platformAuditLogger`, `platformRateLimiter`.
- `frontend/`:
  - `platform.html` (MPA entry point)
  - `index.html` (Main App entry point)
  - `src/platform/`: Platform specific pages and components.
  - `src/app/`: Existing app components moved here for MPA structure.
  - `src/shared/`: Shared utilities.

## Tasks

- [ ] Task 1: Update Prisma schema with Platform Admin models + migrate. → Verify: `npx prisma migrate dev` succeeds.
- [ ] Task 2: Create Platform Auth and TOTP service backend. → Verify: Unit test or manual API test can generate TOTP QR and verify.
- [ ] Task 3: Implement Platform Middlewares (Auth, Audit, RateLimit). → Verify: Request to `/api/v1/platform/*` without token fails with 401.
- [ ] Task 4: Implement Platform Domains (Companies, Admins, Settings, Monitoring, Support). → Verify: API endpoints successfully respond with dummy/DB data.
- [ ] Task 5: Refactor frontend to MPA (move existing to `src/app`, setup `platform.html` and Vite build). → Verify: `npm run build` generates separate bundles.
- [ ] Task 6: Build Platform Login & 2FA Setup views. → Verify: Can login as Super Admin and see 2FA prompt.
- [ ] Task 7: Build Platform Dashboard & Companies list views. → Verify: Charts and datatables render correctly.
- [ ] Task 8: Build Platform Support, Holidays, Admins & Monitoring views. → Verify: CRUD operations and monitoring states display correctly.

## Done When

- [ ] Super Admin can log in using 2FA, viewing global metrics across companies.
- [ ] App and Platform Frontends are completely separate HTTP bundles.
- [ ] All platform actions correctly log to `PlatformAuditLog`.
