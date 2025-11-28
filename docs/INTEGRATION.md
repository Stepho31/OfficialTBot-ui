# Integration Guide

## Auth Bootstrap
- The `AuthProvider` (wrapped in `_app.tsx`) loads three endpoints in parallel using the stored JWT:
  - `GET /v1/me`
  - `GET /v1/subscription`
  - `GET /v1/entitlements`
- Components can access the hydrated data via the `useAuthData()` hook (`me`, `subscription`, `entitlements`, `refresh`).
- A missing or invalid JWT clears state and surfaces the login CTA.

## Dashboard Data Flow
- Trades: `GET /v1/trades?limit=&cursor=` (cursor pagination). The dashboard splits responses into open vs. historical rows and provides a “Load more” action when `nextCursor` is present.
- Performance: `GET /v1/performance/summary` populates plan cards (total PnL, win rate, average R, trade count).
- Upgrade CTAs invoke the landing checkout proxy by calling `startCheckout(tier)` → POST `{ tier }` to `${NEXT_PUBLIC_LANDING_URL}/api/checkout` and redirecting to Stripe.

## Broker Settings
- Page: `/account/broker` is visible when `entitlements.canTrade` is true or `me.role === 'ADMIN'`.
- Routes hit:
  - `GET /v1/me/broker` (masked presence only).
  - `PUT /v1/me/broker` to save encrypted credentials.
- Upgrade buttons lean on `startCheckout('TIER1' | 'TIER2')` for upsells when entitlements are missing.

## Post-Checkout Handling
- `/post-checkout` triggers `AuthProvider.refresh()` on mount, pulling subscription/entitlement updates before redirecting back to `/dashboard`.

## Legacy Connect Page
- `/connect` still posts directly to `POST /accounts` via `connectOanda` for the legacy manual OANDA token workflow.

Set `NEXT_PUBLIC_API_BASE_URL` (backend origin) and `NEXT_PUBLIC_LANDING_URL` (marketing site origin) in `.env.local` for end-to-end flows.
