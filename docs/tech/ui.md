# UI Architecture Map

## Routing & Pages
- **Router**: Next.js *Pages* router (no `/app` directory). Global shell lives in `pages/_app.tsx` and only injects global CSS.
- **Middleware**: None today; all routing is file-based without edge auth or rewrites.
- **Guards**: No shared auth guard. Pages read the JWT from `localStorage` on the client and optimistically call backend APIs.
- **Route inventory**
  - `/` → `pages/index.tsx` *(client redirect)*: React hook redirects to `/dashboard` on mount; no SSR data.
  - `/login` → `pages/login.tsx` *(client)*: Local state form that saves a JWT to `localStorage` and seeds from `NEXT_PUBLIC_DEV_JWT`.
  - `/connect` → `pages/connect.tsx` *(client)*: Form posts account credentials via `connectOanda`; no server-side rendering.
  - `/dashboard` → `pages/dashboard.tsx` *(client UI + client data fetching)*: Loads trading metrics via REST calls, renders charts/tables; `EquityChart` is dynamically imported with `ssr: false` to keep Recharts client-only.
  - `/post-checkout` → `pages/post-checkout.tsx` *(server redirect)*: Has `getServerSideProps` that redirects to `/dashboard`; the component body never renders in practice.

## Data Boundaries
- `/`: No data access; purely a client redirect.
- `/login`
  - **Reads**: `NEXT_PUBLIC_DEV_JWT` to prefill the JWT.
  - **Writes**: Stores `autopip_jwt` in `localStorage`.
  - **Backend**: None.
- `/connect`
  - **Reads**: `autopip_jwt` from `localStorage` for auth headers.
  - **Writes**: Calls `POST {API_BASE}/accounts` via `connectOanda`, sending `{ account_id, token?, label? }`. The backend persists the account record (exact DB tables opaque from UI).
  - **Caching/SWR**: None; direct `fetch`.
- `/dashboard`
  - **Reads**: `autopip_jwt` from `localStorage` for auth headers.
  - **API calls**:
    - `GET {API_BASE}/dashboard/summary?account_id=...` → expects fields: `account_id`, `wtd_pnl`, `wins`, `losses`, `win_rate`, `balance?`, `equity?`.
    - `GET {API_BASE}/dashboard/open-trades?account_id=...` → consumes array with trade fields (`instrument`, `side`, `units`, `entry_price`, `pnl_net`).
    - `GET {API_BASE}/dashboard/equity-series?account_id=...&window=30d` → array of `{ taken_at, equity }`.
    - `GET {API_BASE}/dashboard/closed-trades?account_id=...&limit=50` → array with `closed_at`, `instrument`, `side`, `units`, `entry_price`, `exit_price`, `pnl_net`.
  - **Writes**: None.
  - **Caching/SWR**: None; sequential `fetch` calls inside `load()` with no memoized caching.
- `/post-checkout`
  - **Server hook**: `getServerSideProps` performs a 302 redirect; no client data access.

## State & Libraries
- **Global providers**: None. `_app.tsx` simply renders `Component`.
- **Client state**: Per-page `useState`/`useEffect`. No Redux, Zustand, or React Query.
- **Data fetching**: Native `fetch` via helpers in `lib/api.ts`.
- **Charts**: `components/EquityChart.tsx` uses `recharts` and is loaded client-side via `next/dynamic`.
- **Realtime**: None (no SSE/WebSocket/polling beyond manual reload button).

## Environment Variables
- `NEXT_PUBLIC_API_BASE_URL` → read in `lib/api.ts` to point UI at the backend REST API (falls back to `http://localhost:8000`).
- `NEXT_PUBLIC_DEV_JWT` → read in `lib/api.ts` (`authHeaders`) and `pages/login.tsx` to seed development JWTs.

## Build & Deploy
- **Build command**: `npm run build` → `next build`.
- **Dev/start**: `npm run dev` for local dev (port 3000); `npm run start` serves the built app.
- **Output**: Default Next.js `.next` directory (no custom export).
- **Config**: `next.config.js` only enables `reactStrictMode`; no Vercel-specific settings checked in.
- **Cron/queues**: None in UI repo; all automation assumed server-side.

## Planned Insertion Points
- `/connect` (OANDA connect enhancements)
  - **File**: Continue using `pages/connect.tsx`.
  - **Components**: Break out form sections (`components/connect/AccountForm.tsx`) and shared auth hook (`lib/auth.ts`) when adding validation + paywall checks.
  - **Data**: Extend `lib/api.ts` with typed mutations (e.g., `upsertConnection`) and consolidate token storage before backend call.
- `/controls` (trade mode & risk controls)
  - **File**: New page `pages/controls.tsx` with client form.
  - **Components**: Create `components/controls/RiskPanel.tsx` and `components/controls/TradeModeToggle.tsx`; centralize API access in `lib/api-controls.ts`.
  - **Data**: Backend endpoints for updating risk flags (e.g., `PATCH /accounts/{id}/controls`) can reuse the `authHeaders` helper.
- `/portfolio` (balances, positions, history)
  - **File**: New page `pages/portfolio/index.tsx` if segmented views or a single `pages/portfolio.tsx` otherwise.
  - **Components**: Table widgets in `components/portfolio/*` (e.g., `BalanceSummary`, `PositionsTable`, `HistoryTable`). Consider sharing chart primitives with `EquityChart`.
  - **Data**: Add read helpers in `lib/api-portfolio.ts` (e.g., `GET /portfolio/balances`, `GET /portfolio/positions`). Introduce lightweight SWR hooks (`usePortfolioData`) if periodic refresh is needed.
- `/pricing` (Stripe Checkout entry)
  - **File**: New page `pages/pricing.tsx` to expose plan tiers and call `createCheckout()`.
  - **Components**: Pricing cards in `components/pricing/*`; reuse CTA button styles from `/` landing.
  - **Data**: Use existing `createCheckout` helper; consider moving landing redirect logic into a dedicated component to avoid conflicts with future marketing content.
- `/billing` (Stripe portal link)
  - **File**: New page `pages/billing.tsx` guarded by auth.
  - **Components**: `components/billing/PortalLink.tsx` to hit a new helper (e.g., `createBillingPortal()` in `lib/api.ts`).
  - **Data**: Expect a `POST /stripe/create-portal-session` secured by JWT; add optimistic UI with loading state similar to `/connect`.

- **Cross-cutting additions**
  - Introduce a lightweight auth context (`context/auth-context.tsx`) and wrap `_app.tsx` to provide JWT + guard utilities.
  - Consider middleware once auth/paywall solidifies (`middleware.ts`) to redirect unauthenticated visitors before page load.
