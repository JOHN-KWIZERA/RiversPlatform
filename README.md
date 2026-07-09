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

In the Supabase SQL editor, run the migration files in order (`001` … `015`):

```
supabase/migrations/001_schema.sql        — all tables
supabase/migrations/002_rls.sql           — RLS policies + storage bucket
supabase/migrations/003_functions.sql     — triggers and RPCs
supabase/migrations/004_archive.sql        — archive flags
…
supabase/migrations/013_email_infra.sql   — pg_cron/pg_net, email_log, opt-out, schedules
supabase/migrations/014_sponsor_activity.sql — abandoned-donation tracking + broadcasts
supabase/migrations/015_shared_reports.sql — shareable web-report snapshots
```

### 4. Run locally

```bash
cd client
npm run dev
```

Client runs at **http://localhost:5173**

---

## Supabase setup checklist

- [ ] Run all migration files (`001` … `015`) in the SQL editor
- [ ] Authentication → Providers → Email → disable **"Confirm email"** (for dev)
- [ ] Authentication → Providers → Google → add OAuth Client ID + Secret
- [ ] Storage bucket `rivers-uploads` is created automatically by `002_rls.sql`
- [ ] Enable extensions **pg_cron** and **pg_net** (Database → Extensions) if `013_email_infra.sql` didn't
- [ ] Complete the **Email & automation** setup below

---

## Email & automation setup

Automated emails (pledge reminders, abandoned-donation nudges, admin broadcasts)
run on Supabase Edge Functions triggered by `pg_cron`. All emails send through
[Resend](https://resend.com). No PII is stored in logs — `email_log` keeps only
`user_id` + kind + status.

### 1. Edge-function secrets

```bash
supabase secrets set RESEND_API_KEY=<your-resend-key>
supabase secrets set FROM_EMAIL=noreply@yourdomain.rw
supabase secrets set PUBLIC_SITE_URL=https://rivers-platform.vercel.app
```
(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)

### 2. Deploy the functions

```bash
supabase functions deploy pledge-reminders
supabase functions deploy abandoned-nudge
supabase functions deploy send-broadcast
supabase functions deploy send-application-email
```

### 3. Store the cron credentials (once, in the SQL editor)

`013_email_infra.sql` schedules the daily jobs but needs the project URL + service
key to call the functions:

```sql
insert into private.app_config(key, value) values
  ('project_url',      'https://<ref>.supabase.co'),
  ('service_role_key', '<service-role-key>')
on conflict (key) do update set value = excluded.value;
```

Verify the schedules with `select * from cron.job;`. The **Email Broadcasts** admin
page (`/dashboard/broadcasts`) sends marketing emails on demand; recipients who
unsubscribed (`email_opt_out`) are always excluded.

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

## Deployment (on Vercel)

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
