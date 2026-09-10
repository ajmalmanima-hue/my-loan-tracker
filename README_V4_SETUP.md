# My Loan Tracker V4

V4 is built from the stable V3.5 data model. **No Supabase database migration is required.**

## Important
Keep your existing working `config.js` from V3.5. Do not replace it with a placeholder.

Your `config.js` should contain your existing Supabase project URL and public anon/publishable key. Never use a service-role/secret key in this file.

## Files to upload to GitHub
Replace these files from this package:
- index.html
- style.css
- app.js
- sw.js
- manifest.json
- icon-192.png
- icon-512.png

Keep your existing:
- config.js

`config.js.example` is not needed for deployment.

## V4 features
- Supabase sign-in/sign-up with visible errors
- EMI payment automatically split into interest + principal
- Edit/delete payments
- Grouped EMI edit/delete with principal recalculation
- EMI and interest-only schedules
- Search, type filter and loan category filter
- Loan categories stored safely inside the existing notes field (no DB migration)
- Principal repayment progress and debt-free estimate
- What-if calculator for higher EMI and/or extra principal
- Three-month payment calendar
- Monthly/yearly/all-time payment analysis
- CSV export
- Printable report / Save as PDF
- JSON backup and restore
- Browser reminders when permission is granted
- Mobile/tablet responsive layout
- Network-first service worker to reduce stale-code problems

## Notes
The existing database only permits `payment_type` values `interest` and `principal`. EMI payments are therefore stored as two rows, one for each portion. A private group marker links the two rows for editing/deleting as one EMI payment.

The browser reminder is a convenience notification checked when the app is opened; it is not a guaranteed background alarm when the browser is completely closed.
