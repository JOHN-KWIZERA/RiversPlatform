# RIVERS — Digital Community Impact Platform

A transparent digital community impact platform for sustainable youth employment and social development in Rwanda. Built for the RIVERS Initiative.

## Quick Start

### 1. Clone & Install
```bash
npm run install:all
```

### 2. Configure Environment Variables

**Server** — copy `.env.example` to `.env`:
```bash
cd server && cp .env.example .env
```
Fill in your MongoDB URI, Firebase Admin SDK credentials, and Supabase keys.

**Client** — copy `.env.example` to `.env`:
```bash
cd client && cp .env.example .env
```
Fill in your Firebase web app config (from Firebase Console → Project Settings → Your apps).

### 3. Run (both server + client together)
```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5000

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | Firebase Authentication |
| Storage | Supabase Storage |
| i18n | react-i18next (EN + RW) |
| Charts | Recharts |

## User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Campaign approval, user management, platform analytics |
| **Community Leader** | Create & manage campaigns, submit verification evidence |
| **Sponsor** | Browse & donate to campaigns, view impact reports |
| **Volunteer** | Apply for volunteer opportunities, log hours |
| **Beneficiary** | View aid status and support history |

## Project Structure
```
rivers-platform/
├── server/          # Express API
│   └── src/
│       ├── config/  # DB + Firebase
│       ├── models/  # Mongoose models
│       ├── routes/  # API routes
│       └── controllers/
└── client/          # React frontend
    └── src/
        ├── components/
        ├── pages/
        ├── context/
        └── i18n/
```

## Design System
- **Colors**: Terracotta `#C45C26` · Forest Green `#2D6A4F` · Warm Cream `#FDF8F3`
- **Font**: Plus Jakarta Sans
- **Aligned with**: Rwanda Vision 2050, Digital Rwanda Strategy, SDGs 1, 4, 8, 9, 10, 16, 17
