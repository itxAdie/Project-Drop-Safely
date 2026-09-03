# Drop Safely — Student Transport Platform

A Pakistani student pickup-and-drop ("van") aggregation platform with three panels (Student, Driver, Admin), a live-tracking van service, and a WhatsApp notification microservice.

## Tech Stack

- **Framework**: Next.js 16.3 (App Router, TypeScript) + React 19
- **Styling**: Tailwind CSS v4 (dark glassmorphic theme, Poppins font)
- **Database**: MongoDB with Mongoose 9 ODM
- **Auth**: JWT via `jose` (phone+OTP for users, email+password for admin)
- **Validation**: Zod 4 schemas
- **Data Fetching**: SWR (client) / fetch (server)
- **Maps**: Leaflet (default) / Google Maps (configurable)
- **Notifications**: WhatsApp (microservice) + Web Push (VAPID) + in-app
- **CI**: GitHub Actions (lint + typecheck + Jest)

## Getting Started

### Prerequisites
- Node.js >= 20.9.0 (dev/CI run on **v20.19.1**)
- MongoDB (local or Atlas)
- Cloudinary account
- (Optional) WhatsApp service on port 3001 + VAPID keys

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and edit environment variables
cp .env.example .env.local

# 3. Seed the database (admin, cities, zones, settings)
npm run seed

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run seed` | Seed admin/cities/zones/settings via `scripts/seed.ts` |
| `npm test` | Jest tests |
| `npm run test:watch` | Jest watch mode |
| `npm run test:coverage` | Jest with coverage |

## Default Admin Credentials (after seed)

- **Email**: `admin@dropsafely.com`
- **Password**: `Admin@123!`

⚠️ Change the password immediately in production.

## Panels

| Panel | Base URL | Description |
|-------|----------|-------------|
| Student | `/student/*` | Register with phone+OTP, track van, upload payments, day-offs, notifications |
| Driver | `/dashboard`, `/driver/register`, `/trip`, `/earnings`, `/notifications` | Register (awaits admin approval), start trips, share live GPS, view earnings |
| Admin | `/admin/*` | Dashboard KPIs, heatmap, student/driver management, route clustering, payments, cities, settings |

## WhatsApp Microservice

Separate Express 5 + Baileys service in `whatsapp-service/` (deployed on Oracle VPS / Docker, port 3001). Handles OTP delivery and notification dispatch, plus cron jobs (route clustering, delay detection, billing reminders).

## Documentation

See `docs/` for architecture, API reference, testing plan, access info, project rules, mobile checklist, and session log.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
