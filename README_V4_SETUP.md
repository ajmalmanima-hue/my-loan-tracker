# My Loan Tracker V4 — Fixed

This package fixes the V4 delivery/login problem and keeps the existing Supabase database schema.

## Important
Do **not** replace your existing `config.js` in GitHub. Keep the working file that already contains your Supabase Project URL and public anon/publishable key.

Upload/replace the other V4 files. `config.js.example` is only a reference.

## V4 features
- EMI payments stored safely as interest + principal rows (compatible with the existing database constraint).
- Edit/delete payment history.
- EMI payment editing restores/recalculates principal.
- Future EMI schedule.
- Extra principal payment simulator.
- Dashboard totals, search, filters and overdue indicator.
- JSON backup.
- Network-first service worker with a new cache version.

No Supabase SQL change is required.
