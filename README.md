# ComplanX

An AI-powered civic complaint management platform for India. Citizens email their complaints, ComplanX automatically classifies them, routes them to the right government authority, and tracks the entire lifecycle.

---

## How it works

1. A complaint arrives via email (or the web form / simulator)
2. A two-step AI pipeline classifies it — keyword matching first, then Gemini enrichment
3. The system finds the correct authority by city → state → category fallback
4. The complaint is forwarded to that authority (auto or manual)
5. The full status lifecycle is tracked: `RECEIVED → ANALYZING → READY_TO_SEND → SENT → RESOLVED`

---

## Features

- **AI classification** — two-step pipeline: fast keyword matching (English + Hindi + Hinglish) backed by Gemini 1.5 Flash enrichment
- **8 civic categories** — waste, roads, street lighting, water supply, electricity, traffic, sewerage, public infrastructure
- **Gmail IMAP poller** — polls a configured inbox, deduplicates by message ID, skips system senders
- **Authority routing** — city-first, state-fallback, category-aware matching from the authorities DB
- **Auto-send toggle** — send to authority automatically or queue for manual review
- **Email simulator** — dev tool to inject fake complaints without needing a live inbox
- **Admin panel** — manage authorities, view all complaints, trigger analysis manually
- **Role-based access** — `USER` and `ADMIN` roles with protected routes
- **Full status history** — every status transition is timestamped and stored

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Backend | Node.js, Express, TypeScript, tsx |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Email | Nodemailer (SMTP) + ImapFlow (IMAP polling) |
| Auth | JWT + bcrypt |
| Validation | Zod |

---

## Getting started

### Prerequisites

- Node.js 20+
- MongoDB running locally (or a MongoDB Atlas URI)
- A Google Gemini API key (optional — falls back to keyword-only mode)

### Install

```bash
npm run install:all
```

### Configure

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
MONGODB_URI="mongodb://localhost:27017/complanx"
JWT_SECRET="your-secret-here"
GEMINI_API_KEY=""          # optional — keyword mode used if blank
EMAIL_PROVIDER="mock"      # "mock" or "gmail"
NODE_ENV="development"
```

```env
# client/.env
VITE_API_URL="http://localhost:5000/api"
```

### Run

```bash
npm run dev
```

Server → `http://localhost:5000`  
Client → `http://localhost:5173`

### Seed the database

```bash
npm run db:seed
```

This creates an admin user and sample authorities across Indian cities.

---

## Project structure

```
complanx/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios API clients
│       ├── components/      # Shared UI components
│       ├── pages/           # Route-level pages
│       ├── hooks/           # useAuth and other hooks
│       └── types/           # Shared TypeScript types
│
└── server/                  # Express backend
    └── src/
        ├── controllers/     # Route handlers
        ├── models/          # Mongoose schemas
        ├── routes/          # Express routers
        ├── middleware/       # Auth, error handler
        ├── services/
        │   ├── ai/          # Gemini + keyword analyzer
        │   ├── email/       # IMAP poller, SMTP sender, mock provider
        │   ├── complaint/   # Core complaint service
        │   └── authority/   # Authority routing logic
        ├── validators/      # Zod schemas
        └── scripts/         # One-off utility scripts
```

---

## API overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/complaints` | List complaints (paginated) |
| POST | `/api/complaints` | Submit a new complaint |
| GET | `/api/complaints/:id` | Get complaint detail |
| POST | `/api/complaints/:id/analyze` | Trigger AI analysis |
| POST | `/api/complaints/:id/send` | Forward to authority |
| GET | `/api/authorities` | List authorities |
| GET | `/api/settings` | Get app settings |
| PUT | `/api/settings` | Update settings (admin) |
| POST | `/api/dev/simulate-email` | Inject a test complaint (dev only) |

---

## Gmail integration

1. Enable IMAP on your Gmail account
2. Generate a [Google App Password](https://myaccount.google.com/apppasswords)
3. Go to Settings in the app and enter your Gmail credentials
4. Toggle Gmail on — the IMAP poller starts automatically

The poller checks for unseen emails on a configurable interval, processes each one through the AI pipeline, and marks them as seen.

---

## Complaint categories

| Category | Authority type |
|---|---|
| Waste management | Municipal Corporation |
| Road damage | Public Works Department |
| Street lighting | Municipal Corporation |
| Water supply | State Department |
| Electricity | Utility Company |
| Traffic | Traffic Department |
| Sewerage | Municipal Corporation |
| Public infrastructure | Municipal Corporation |

---

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | required |
| `JWT_SECRET` | JWT signing secret | required |
| `GEMINI_API_KEY` | Google Gemini API key | optional |
| `EMAIL_PROVIDER` | `mock` or `gmail` | `mock` |
| `NODE_ENV` | `development` or `production` | `development` |
| `VITE_API_URL` | Backend URL for the client | `http://localhost:5000/api` |
