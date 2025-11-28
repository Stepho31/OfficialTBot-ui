# CHANGELOG (MVP)

- Updated `createCheckout` helper to post tier payloads to `/stripe/checkout`.
- Added broker settings page (`/account/broker`) gated by trading entitlements; users can save encrypted OANDA credentials or upgrade plans.
- Introduced global auth context (`AuthProvider`) to hydrate `/v1/me`, `/v1/subscription`, and `/v1/entitlements`, enabling dashboard gating.
- Rebuilt dashboard to consume `/v1/trades` (cursor pagination) and `/v1/performance/summary`, surfacing plan CTAs for Tier-1/Tier-2 upgrades.
- `/post-checkout` now refreshes entitlements client-side before redirecting back to the dashboard.
- Added persistent Admin role badge and removed upgrade prompts when `me.role === 'ADMIN'`.
