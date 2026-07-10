# RIVERS Platform — Advanced Features Implementation Report

**Project:** RIVERS — Digital Community Impact Platform
**Scope of this report:** the second implementation cycle, in which five advanced
feature areas were added to the existing platform and then refined through
iterative testing and feedback.

> **How to use this document.** Drop the screenshots you captured during testing
> into `docs/screenshots/` using the filenames referenced under each *Figure*
> caption, and they will render inline when this file is exported to PDF/Word or
> viewed on GitHub.

---

## 1. Overview

The RIVERS platform is a transparent community-impact application for sustainable
youth employment and social development in Rwanda. The first implementation
delivered the core platform (campaigns, donations, volunteering, beneficiary
registers, role-based dashboards, PDF/Excel reports).

This cycle extended the platform with five capabilities requested after the first
release:

1. **Automated pledge-reminder emails** — remind sponsors before a recurring
   pledge is due, and follow up if it lapses.
2. **Shareable full-page web reports** — in addition to PDF/Excel export, generate
   a public, link-shareable web version of any impact report.
3. **Automated email flows & marketing** — abandoned-donation nudges for
   logged-in sponsors, plus an admin email-broadcast (marketing) tool.
4. **Archived-campaign visibility** — archived campaigns are now presented as
   such to sponsors and the public (read-only), not just to their creators.
5. **Landing-page gallery** — a photo mosaic of past campaigns plus an embedded
   YouTube highlight video.

A cross-cutting requirement — **allowing visitors to donate without logging in** —
was also implemented during this cycle.

---

## 2. Tools & Technologies

| Layer | Technology | Role in this cycle |
|-------|-----------|--------------------|
| Frontend | **React 18 + Vite** | All new pages/components; lazy-loaded routes |
| Styling | **Tailwind CSS** | Design-system-consistent UI (mosaic, report view, modals) |
| Rich text | **TipTap v3** (`@tiptap/react`) | Broadcast message composer |
| Backend | **Supabase (PostgreSQL + PostgREST)** | Tables, Row-Level Security (RLS), RPCs, triggers |
| Serverless | **Supabase Edge Functions (Deno + TypeScript)** | Email sending logic |
| Scheduling | **pg_cron + pg_net** | Daily triggering of email jobs |
| Email delivery | **Resend API** | Transactional & broadcast email |
| Exports | **jsPDF / jsPDF-AutoTable, SheetJS (xlsx)** | PDF & Excel report generation |
| Routing | **React Router v6** | Public + protected routes |
| i18n | **react-i18next** (EN + RW) | All new user-facing strings |

**Architecture note.** The platform has *no traditional server*: the React client
talks directly to Supabase, and RLS enforces access control at the database
level. Server-side logic that must not run in the browser (sending email with a
secret API key) lives in Edge Functions, triggered on a schedule by `pg_cron`.

```
Browser (React) ──► Supabase PostgREST (RLS) ──► PostgreSQL
      │                                              ▲
      │ functions.invoke()                           │ pg_cron (daily)
      ▼                                              │
Supabase Edge Functions (Deno) ──► Resend API   ─────┘ net.http_post()
```

---

## 3. Feedback & Iteration Log

The table below records every change made **after the first feature implementation**,
in the order it occurred. This is the empirical core of the iterative development
process and is useful evidence of a test-driven refinement loop.

| # | Trigger / Feedback | Category | Resolution |
|---|--------------------|----------|------------|
| 1 | Requirements clarification (pledge = payment reminders; nudges = logged-in sponsors; gallery on landing; reports = shareable web page) | Scoping | Confirmed scope before build via structured questions |
| 2 | "More direction needed on `supabase secrets` / `functions deploy`" | Documentation | Added a full Email & automation setup guide to the README |
| 3 | `invoke_edge` error: *Bad hostname* | Config bug | Placeholder `<project-ref>` had been saved into `app_config`; replaced with real project URL |
| 4 | "How do I test these features?" | Documentation | Produced a per-feature test plan (frontend + SQL-seeded email tests) |
| 5 | Report **Overview** numbers overflowing their cards | UI defect | `MetricCard` given responsive font sizing, `break-words`, `min-w-0`, `overflow-hidden` |
| 6 | Shareable report title looked different when **printed** | Rendering defect | Added `print-color-adjust: exact` so the dark cover band prints its background |
| 7 | Redundant report action buttons | UX refinement | Consolidated to *Open Report Preview* + *Excel*; removed separate share button; moved *Download PDF* + *Copy link* into the preview tab |
| 8 | "Toast says preview opened, but no tab appears" | Runtime defect | Popup blocker — the new tab is now opened *synchronously* on click, then redirected once the snapshot is saved |
| 9 | User supplied real campaign photos | Enhancement | Wired local images via Vite imports; fixed `.JPG` (uppercase) build error by normalising filenames |
| 10 | Full-resolution photos too heavy (~11.8 MB) | Performance | User re-exported web-resolution images (~2 MB total); filenames normalised, 6 photos used |
| 11 | Gallery photo layout "looked off" | UI refinement | Rebuilt the mosaic with fixed row heights and explicit per-tile grid spans (perfect tiling at every breakpoint) |
| 12 | Archived campaign still donatable by sponsors | Logic defect | Gated *Donate*/*Pledge* on the campaign **detail** page (card was already gated); added an "Archived — donations closed" notice |
| 13 | Guest donation → *RLS policy violation* | Security/schema | Migration `016`: `sponsor_id` made nullable; policies for authenticated-as-self and anonymous-guest inserts; notify trigger updated for null donor |
| 14 | Guest donation → *401 Unauthorized* | Session/permissions | Stale token diagnosis; guest insert changed to **not** request the row back (anon lacks a SELECT policy) |
| 15 | Admin broadcast page rendered blank | Runtime defect | TipTap v3 null-editor crash → `immediatelyRender: false` + `{editor && …}` guard; added an app-wide **Error Boundary** |
| 16 | Broadcast send → *Failed to send a request to the Edge Function* | CORS defect | Broadened `Access-Control-Allow-Headers` to include `x-client-info, apikey` so the preflight succeeds |
| 17 | "When do pledge reminders arrive?" | Clarification | Documented the daily 08:00 UTC schedule and trigger windows |

**Analysis.** The defects cluster into three instructive categories:
*presentation* (5, 6, 11), *browser/runtime constraints* (8, 15) and
*security-boundary interactions* (13, 14, 16). The security-boundary cluster is
the most significant: each was a direct consequence of Supabase's
defence-in-depth model (RLS + role grants + CORS), and each fix tightened the
mental model of *who* is allowed to do *what* and *from where*.

---

## 4. Implementation Detail, by Feature

Each subsection gives the design rationale, the key source code, and a short
analysis. File paths are relative to the repository root.

### 4.1 Email Infrastructure (foundation)

Automated email needs a scheduler. Rather than introduce an external cron
service, the implementation uses Supabase-native `pg_cron` to invoke Edge
Functions via `pg_net`, keeping everything inside one platform.

`supabase/migrations/013_email_infra.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- One-click unsubscribe + de-dupe log (no PII stored)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_opt_out boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  kind text NOT NULL,            -- pledge_reminder | pledge_lapsed | abandoned_nudge | broadcast
  ref_id uuid,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Credentials for the scheduler live in a private, RLS-locked table
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.app_config (key text PRIMARY KEY, value text NOT NULL);
ALTER TABLE private.app_config ENABLE ROW LEVEL SECURITY;   -- no policies → unreachable via API

-- Helper that a cron job calls to hit an Edge Function
CREATE OR REPLACE FUNCTION private.invoke_edge(fn text, payload jsonb DEFAULT '{}'::jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER
SET search_path = private, public, net AS $$
DECLARE v_url text; v_key text; v_id bigint;
BEGIN
  SELECT value INTO v_url FROM private.app_config WHERE key = 'project_url';
  SELECT value INTO v_key FROM private.app_config WHERE key = 'service_role_key';
  IF v_url IS NULL OR v_key IS NULL THEN RETURN NULL; END IF;
  SELECT net.http_post(
    url := v_url || '/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key),
    body := payload
  ) INTO v_id;
  RETURN v_id;
END; $$;

SELECT cron.schedule('rivers-pledge-reminders', '0 8 * * *', $$ SELECT private.invoke_edge('pledge-reminders'); $$);
SELECT cron.schedule('rivers-abandoned-nudge',  '0 9 * * *', $$ SELECT private.invoke_edge('abandoned-nudge');  $$);
```

**Analysis.** The service-role key is never exposed to the browser — it lives in
`private.app_config`, a table with RLS enabled *and no policies*, so PostgREST
(and therefore the `anon`/`authenticated` roles) cannot read it; only
`SECURITY DEFINER` functions can. `email_log` deliberately stores only a
`user_id`, a `kind` and a `status` — never an address or message body — which
both respects the platform's no-PII data-minimisation rule and provides the
de-duplication key that prevents repeat sends within a cycle.

*Figure 4.1 — cron jobs registered.* `![cron jobs](screenshots/cron_jobs.png)`

### 4.2 Pledge Payment-Due Reminders

The `pledge-reminders` Edge Function scans active recurring pledges and emails
sponsors whose next payment is imminent (or overdue), writing both an in-app
notification and an `email_log` row.

`supabase/functions/pledge-reminders/index.ts` (core loop):

```ts
const due = p.next_due_date as string;
let kind: 'pledge_reminder' | 'pledge_lapsed' | null = null;
if (due >= todayStr && due <= dueSoonStr) kind = 'pledge_reminder';  // within 3 days
else if (due < lapsedStr)                 kind = 'pledge_lapsed';     // >2 days overdue
if (!kind) continue;

// Skip if we already emailed this pledge this cycle (de-dupe)
const { count } = await supabase.from('email_log')
  .select('id', { count: 'exact', head: true })
  .eq('kind', kind).eq('ref_id', p.id).gte('created_at', cycleAgo);
if ((count ?? 0) > 0) { skipped++; continue; }
```

**Analysis.** Because the platform has no wallet, "insufficient balance" was
reinterpreted (with the stakeholder) as *payment-due reminders* — the sponsor is
prompted to have funds ready and pay via Mobile Money. The 25-day de-dupe window
keyed on `email_log` guarantees idempotency: the daily cron can run repeatedly
without spamming.

**Schedule.** The job runs daily at **08:00 UTC (10:00 Kigali)**. A reminder is
sent when a pledge falls due within 3 days; a "continue your pledge" follow-up is
sent when it is more than 2 days overdue.

### 4.3 Automated Flows & Admin Broadcast

Two mechanisms were built on a shared activity table.

**Abandoned-donation tracking** (`016`… no — `014_sponsor_activity.sql`):

```sql
CREATE TABLE public.sponsor_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event text NOT NULL,           -- campaign_view | donation_started | donation_completed
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

The React client logs events fire-and-forget (`activityApi.log`) when a sponsor
views a campaign or opens/submits the donation modal. The `abandoned-nudge`
function then finds sponsors who *started* but never *completed* a donation and
emails a single, cooldown-limited nudge.

**Admin broadcast (email marketing).** An admin composes a rich-text message,
picks an audience segment, previews it, and sends. The `send-broadcast` function
verifies the caller is an admin, resolves the segment (excluding opted-out
users), and sends via Resend:

```ts
// Verify the caller is an admin (uses the caller's JWT)
const { data: { user } } = await userClient.auth.getUser();
const { data: me } = await userClient.from('users').select('role').eq('id', user.id).single();
if (me?.role !== 'admin') return json({ error: 'Forbidden' }, 403);
```

**Analysis.** Segmentation is enforced server-side and opt-outs are always
respected, so the marketing tool cannot be misused to email users who
unsubscribed. Admin authorisation is verified inside the function (not merely in
the UI), a defence-in-depth choice.

*Figure 4.3 — broadcast composer with live preview.* `![broadcast composer](screenshots/broadcast_preview.png)`

### 4.4 Shareable Full-Page Web Report

Reports already supported a live preview and PDF/Excel export. This cycle added a
**public, link-shareable** web report. The key design decision was to
**snapshot** the fully-resolved report data at share time, so the public viewer
needs no cross-table read access and no donor PII is exposed.

`supabase/migrations/015_shared_reports.sql`:

```sql
CREATE TABLE public.shared_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Impact Report',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Public read is only ever by unguessable token, via a DEFINER RPC
-- (prevents anonymous enumeration of the table).
CREATE OR REPLACE FUNCTION public.get_shared_report(p_token uuid)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object('title', sr.title, 'config', sr.config,
                           'snapshot', sr.snapshot, 'createdAt', sr.created_at)
  FROM public.shared_reports sr WHERE sr.token = p_token LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_shared_report(uuid) TO anon, authenticated;
```

A popup-blocker issue (feedback #8) was resolved by opening the tab
synchronously within the click, then redirecting it once the snapshot is saved:

```js
// client/src/pages/ReportsPage.jsx
const win = window.open('', '_blank');   // opened inside the click → not blocked
// … build + persist snapshot …
if (win && !win.closed) win.location.href = `${origin}/report/${token}`;
```

**Analysis.** Snapshotting trades a small amount of storage for a large
simplification of the security model: the public route reads a single row through
a `SECURITY DEFINER` RPC keyed on an unguessable UUID, so no anonymous SELECT
policy on `donations`/`expenditures` is ever required.

*Figure 4.4a — web report (screen).* `![web report screen](screenshots/report_web.png)`
*Figure 4.4b — same report printed to PDF.* `![web report print](screenshots/report_print.png)`

### 4.5 Archived-Campaign Visibility

RLS already permitted reading approved/active/completed campaigns regardless of
`is_archived`, so this was primarily a frontend change: Active/Archived tabs were
added to the sponsor and public campaign browsers, and archived cards were made
read-only. The overlooked path — donating from a campaign's **detail** page — was
also gated (feedback #12):

```jsx
// client/src/pages/CampaignDetail.jsx
{campaign.isArchived && (
  <div className="…bg-gray-100…">Archived — donations closed</div>
)}
{campaign.status === 'active' && !campaign.isArchived && (
  <Button onClick={() => setDonateOpen(true)}>Donate Now</Button>
)}
```

**Analysis.** This is a textbook example of an authorisation rule that must be
enforced consistently across *every* entry point, not just the most obvious one.

### 4.6 Landing-Page Gallery

A self-contained `ImpactGallery` component renders a photo mosaic plus an embedded
YouTube Short. The mosaic uses fixed row heights and explicit per-tile spans so it
tiles perfectly at every breakpoint (feedback #11):

```jsx
// client/src/components/landing/ImpactGallery.jsx
const SPANS = [
  'col-span-2 row-span-2',        // feature photo (2×2)
  '', '', '', '',
  'col-span-2 sm:col-span-1',     // fills the last mobile row
];
// grid grid-cols-2 sm:grid-cols-3 auto-rows-[128px] sm:auto-rows-[150px] lg:auto-rows-[172px]
```

Photos are imported through Vite (hashed, cache-busted assets). Full-resolution
originals (~11.8 MB) were replaced with web-resolution exports (~2 MB) after a
performance review — important given the platform's bandwidth-constrained mobile
audience in Rwanda.

*Figure 4.6 — landing gallery + video.* `![gallery](screenshots/gallery.png)`

### 4.7 Guest (Logged-Out) Donations

To let visitors donate without an account, `donations.sponsor_id` was made
nullable and dedicated RLS policies were added:

`supabase/migrations/016_guest_donations.sql`:

```sql
ALTER TABLE public.donations ALTER COLUMN sponsor_id DROP NOT NULL;

CREATE POLICY "donations_insert" ON public.donations FOR INSERT TO authenticated
  WITH CHECK (sponsor_id = auth.uid() OR sponsor_id IS NULL);

CREATE POLICY "donations_insert_guest" ON public.donations FOR INSERT TO anon
  WITH CHECK (sponsor_id IS NULL);
GRANT INSERT ON public.donations TO anon;
```

Two follow-on defects were resolved: (a) the notify trigger was updated to handle
a null donor ("A supporter"); and (b) the client stops requesting the inserted
row back for guests, because the `anon` role has no SELECT policy on `donations`:

```js
// client/src/lib/api.js
if (!id) {                                   // guest
  const { error } = await supabase.from('donations').insert(payload);
  if (error) throw error;
  return null;                               // don't request representation
}
```

**Analysis.** Guest donations are recorded **without any personal data** (no name
or email) — consistent with data-minimisation — which means guests cannot receive
an emailed receipt. That is a deliberate, documented trade-off.

*Figure 4.7 — donation modal (guest, logged-out).* `![guest donation](screenshots/guest_donation.png)`

---

## 5. Notable Engineering Challenges & Resolutions

These are worth an explicit "discussion" section in a dissertation because each
illustrates a general principle.

1. **CORS preflight rejection** (broadcast send). Browsers send a preflight
   `OPTIONS` request listing the headers they intend to use; `functions.invoke`
   sends `apikey` and `x-client-info`, which the function must explicitly allow:

   ```ts
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   ```
   *Principle: the allow-list must match every header the client actually sends.*

2. **Third-party library lifecycle** (TipTap v3). The editor is `null` on first
   render; rendering `<EditorContent editor={null}>` throws. Fixed with
   `immediatelyRender: false` and a null guard.
   *Principle: never assume async-initialised objects exist on first paint.*

3. **Resilience** — a single component crash was blanking the whole SPA (no error
   boundary). A React **Error Boundary** now converts any page crash into a
   readable message, which also accelerated diagnosis of #2.

   *Figure 5 — error boundary surfacing a runtime error.* `![error boundary](screenshots/error_boundary.png)`

4. **Browser popup policy** — `window.open` after an `await` is blocked because it
   is no longer tied to the user gesture (see §4.4).

---

## 6. Security & Privacy Analysis

- **Row-Level Security** is the primary access-control mechanism; every new table
  ships with explicit policies (`shared_reports`, `sponsor_activity`,
  `email_broadcasts`, `email_log`).
- **Secret handling** — the Resend key and service-role key never reach the
  browser; email is sent only from Edge Functions, and cron credentials live in an
  API-unreachable `private` schema.
- **Data minimisation (no-PII rule)** — analytics/log tables (`email_log`,
  `sponsor_activity`) store identifiers and statuses only; guest donations store
  no personal data; report snapshots exclude donor names.
- **Consent** — every automated email carries a one-click unsubscribe
  (`unsubscribe_token` + `unsubscribe_email` RPC), and all sends skip opted-out
  users.

---

## 7. Verification & Testing

- **Build verification** — the client was rebuilt (`npm run build`) after every
  change; all builds passed.
- **Frontend features** — verified in the running dev app (`npm run dev`):
  gallery rendering, archived tabs (view-only), guest donation, shareable report
  in an incognito/logged-out window.
- **Email features** — Edge Functions deployed via the Supabase CLI; jobs can be
  triggered on demand with `select private.invoke_edge('pledge-reminders');` and
  verified through `email_log` rows and the Edge Function logs.
- **Known external dependency** — end-to-end email delivery requires a verified
  Resend sending domain; until then Resend delivers only to the account owner's
  address (a Resend sandbox limitation, not a code issue).

---

## 8. Deployment Notes

1. Run migrations `013`–`016` in the Supabase SQL editor.
2. Enable the `pg_cron` and `pg_net` extensions.
3. Store project URL + service-role key in `private.app_config`.
4. Set Edge-Function secrets (`RESEND_API_KEY`, `FROM_EMAIL`, `PUBLIC_SITE_URL`)
   and deploy `pledge-reminders`, `abandoned-nudge`, `send-broadcast`,
   `send-application-email`.
5. Client deploys to Vercel as a static Vite build.

(Full commands are in the project `README.md` under *Email & automation setup*.)

---

## 9. Future Work

- Optional guest email capture (with consent) to enable receipts, if the privacy
  policy is revised.
- A view-based re-engagement flow (currently only `donation_started` abandonment
  is acted upon; `campaign_view` events are captured but unused).
- Build-time image optimisation (e.g. `vite-imagetools`) so full-resolution
  uploads are compressed automatically.
- Delivery/open analytics for broadcasts via Resend webhooks.

---

## Appendix A — New & Modified Files

**New (backend):** `013_email_infra.sql`, `014_sponsor_activity.sql`,
`015_shared_reports.sql`, `016_guest_donations.sql`; Edge Functions
`pledge-reminders`, `abandoned-nudge`, `send-broadcast`, shared helper
`_shared/email.ts`.

**New (frontend):** `components/landing/ImpactGallery.jsx`,
`components/reports/ReportView.jsx`, `components/ui/ErrorBoundary.jsx`,
`pages/ReportViewerPage.jsx`, `pages/Unsubscribe.jsx`,
`pages/admin/EmailBroadcasts.jsx`.

**Modified (frontend):** `lib/api.js`, `App.jsx`, `components/layout/Sidebar.jsx`,
`pages/Landing.jsx`, `pages/Campaigns.jsx`, `pages/sponsor/BrowseCampaigns.jsx`,
`components/campaigns/CampaignCard.jsx`, `components/donations/DonationModal.jsx`,
`pages/CampaignDetail.jsx`, `pages/ReportsPage.jsx`, `pages/Settings.jsx`,
`pages/sponsor/RecurringGiving.jsx`, `components/ui/RichTextEditor.jsx`,
i18n `en.json` / `rw.json`.

## Appendix B — Screenshot Checklist

Place these in `docs/screenshots/` (filenames match the Figure references):

- [ ] `gallery.png` — landing-page gallery + video
- [ ] `report_web.png` — shareable web report (on screen)
- [ ] `report_print.png` — same report printed to PDF
- [ ] `broadcast_preview.png` — broadcast composer preview
- [ ] `guest_donation.png` — donation modal while logged out
- [ ] `error_boundary.png` — the error-boundary card
- [ ] `cron_jobs.png` — `select * from cron.job;` output
