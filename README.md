# Autopip UI (Starter)

Minimal Next.js app that talks to the Autopip FastAPI backend.

## Quick Start

1. `cp .env.local.example .env.local` and set `NEXT_PUBLIC_API_BASE_URL`
2. `npm install`
3. `npm run dev`  ➜ http://localhost:3000

## Pages
- `/` — Landing with $25 checkout button
- `/post-checkout` — Post-purchase screen
- `/login` — Paste JWT (MVP)
- `/connect` — Connect OANDA Account ID (+ optional token)
- `/dashboard` — Summary cards, open trades, equity list
