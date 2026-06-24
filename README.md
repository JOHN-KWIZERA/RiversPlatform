# RIVERS — Digital Community Impact Platform

A transparent digital community impact platform for sustainable youth employment and social development in Rwanda. Built for the RIVERS Initiative.

Live: **https://rivers-platform.vercel.app**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL + PostgREST) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Storage | Supabase Storage |
| Hosting | Vercel (client) |
| i18n | react-i18next (EN + RW) |
| Charts | Recharts |

> There is no separate server. The React client talks directly to Supabase via `supabase-js`. Row Level Security (RLS) enforces all access control at the database level.

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/JOHN-KWIZERA/RiversPlatform
cd rivers-platform/client
npm install
```

### 2. Configure environment variables

Create `client/.env` from the example:

```bash
cp client/.env.example client/.env
```

Fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Find these in your Supabase dashboard under **Project Settings → API**.

### 3. Apply database migrations

In the Supabase SQL editor, run the migration files in order:

```
supabase/migrations/001_schema.sql   — all tables
supabase/migrations/002_rls.sql      — RLS policies + storage bucket
supabase/migrations/003_functions.sql — triggers and RPCs
supabase/migrations/004_archive.sql  — archive flags
```

### 4. Run locally

```bash
cd client
npm run dev
```

Client runs at **http://localhost:5173**

---

## Supabase setup checklist

- [ ] Run all 4 migration files in the SQL editor
- [ ] Authentication → Providers → Email → disable **"Confirm email"** (for dev)
- [ ] Authentication → Providers → Google → add OAuth Client ID + Secret
- [ ] Storage bucket `rivers-uploads` is created automatically by `002_rls.sql`

### Creating an admin user

1. Sign up normally through the app
2. In Supabase → Table Editor → `users` → find your row → set `role` to `admin`

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Approve/reject/archive campaigns, manage users, view analytics & audit log |
| **Community Leader** | Create & manage campaigns, post volunteer opportunities, archive own content |
| **Sponsor** | Browse & donate to campaigns, view impact reports |
| **Volunteer** | Apply for volunteer opportunities, log hours |
| **Beneficiary** | View aid status and support history |

---

## Project Structure

```
rivers-platform/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── lib/
│       │   ├── supabase.js  # Supabase client + deepCamelCase transformer
│       │   └── api.js       # All data access (campaignApi, opportunityApi, …)
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       ├── pages/
│       │   ├── admin/
│       │   ├── leader/
│       │   ├── sponsor/
│       │   ├── volunteer/
│       │   └── beneficiary/
│       └── i18n/
└── supabase/
    └── migrations/          # SQL schema, RLS, functions, archive
```

---

## Deployment (Vercel)

The client is deployed as a static Vite build. `client/vercel.json` includes a catch-all rewrite for SPA routing:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Set these environment variables in Vercel → Project → Settings → Environment Variables:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Build command: `npm run build` (inside `client/`)  
Output directory: `dist`

---

## Design System

- **Colors**: Terracotta `#C45C26` · Forest Green `#2D6A4F` · Warm Cream `#FDF8F3`
- **Font**: Plus Jakarta Sans
- **Aligned with**: Rwanda Vision 2050, Digital Rwanda Strategy, SDGs 1, 4, 8, 9, 10, 16, 17
