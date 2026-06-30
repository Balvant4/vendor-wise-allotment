# Vendor Control Tower — Enterprise Next.js

A production-grade logistics management platform built with **Next.js 14 App Router**, TypeScript, MongoDB, and Tailwind CSS.

---

## Architecture

```
Frontend + Backend + Database + Auth — all in one Next.js app (no separate server)
```

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | Next.js 14 (App Router)             |
| Language       | TypeScript (strict)                 |
| Styling        | Tailwind CSS (custom dark theme)    |
| Database       | MongoDB via Mongoose                |
| Auth           | JWT + HttpOnly cookies + Refresh    |
| State          | React Query v5 + Context            |
| Forms          | React Hook Form + Zod               |
| Charts         | Recharts                            |
| File parsing   | SheetJS (xlsx)                      |
| Route guards   | Next.js Middleware (jose)           |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local .env.local
# Edit .env.local with your values:
#   MONGODB_URI=mongodb://localhost:27017/logistics_db
#   JWT_SECRET=your_secret_here (min 32 chars)
#   JWT_REFRESH_SECRET=your_refresh_secret_here
```

### 3. Seed the admin user
```bash
npx tsx server/actions/seed.ts
```

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default credentials:** `admin@logistics.com` / `Admin@1234`

---

## Folder Structure

```
logistics-nextjs/
├── app/                    Routes, pages, API handlers
│   ├── api/                REST API (Route Handlers)
│   ├── dashboard/          Dashboard page
│   ├── vehicles/           Data table page
│   ├── alerts/             >25H violations
│   ├── upload/             File upload page
│   ├── division/           Division analytics
│   ├── vendors/            Transporter analytics
│   └── settings/           Profile + user management
├── components/             Reusable UI components
│   ├── charts/             Recharts wrappers
│   ├── layout/             AppShell, Sidebar, TopBar
│   ├── shared/             KpiCard, Badge, etc.
│   └── tables/             VehicleTable
├── features/               Business feature modules
│   ├── authentication/     AuthProvider, hooks
│   ├── dashboard/          FilterProvider, hooks
│   ├── uploads/            Upload service + hooks
│   └── vehicles/           Vehicle hooks
├── server/                 Backend business logic
│   ├── actions/            Seed scripts
│   ├── services/           auth.service, dashboard.service
│   ├── queries/            vehicle.queries (DB layer)
│   └── validations/        Zod schemas
├── models/                 Mongoose models
├── database/               MongoDB connection (singleton)
├── lib/                    Utilities, auth helpers, axios
├── hooks/                  useDebounce
├── types/                  All TypeScript types
└── middleware.ts            Route protection
```

---

## Available Routes

| Route                 | Description                     |
|-----------------------|---------------------------------|
| `/login`              | Login page                      |
| `/dashboard`          | KPIs, charts, overview          |
| `/vehicles`           | Paginated vehicle records table |
| `/alerts`             | >25H violations                 |
| `/division`           | Division analytics              |
| `/vendors`            | Transporter performance         |
| `/upload`             | File upload + history           |
| `/settings`           | Profile + change password       |
| `/settings/users`     | User management (admin only)    |

## API Endpoints

| Method | Path                  | Description               |
|--------|-----------------------|---------------------------|
| POST   | `/api/auth?action=login`   | Login                |
| POST   | `/api/auth?action=logout`  | Logout               |
| POST   | `/api/auth?action=refresh` | Refresh access token |
| GET    | `/api/auth`           | Get current user          |
| GET    | `/api/dashboard`      | Dashboard data            |
| GET    | `/api/vehicles`       | Paginated vehicle records |
| GET    | `/api/uploads`        | Upload history            |
| POST   | `/api/uploads`        | Upload file               |
| DELETE | `/api/uploads/:id`    | Delete upload + records   |
| GET    | `/api/users`          | List users (admin/manager)|
| POST   | `/api/users`          | Create user (admin)       |
| PATCH  | `/api/users/:id`      | Update user (admin)       |
| DELETE | `/api/users/:id`      | Soft-delete user (admin)  |

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint
npx tsx server/actions/seed.ts  # Seed admin
```


---------------------------------------------------------
Email:    admin@logistics.com
Password: Admin@1234