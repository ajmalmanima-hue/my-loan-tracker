# My Loan Tracker V4

V4 keeps the existing V3.5 Supabase database schema. No SQL migration is required.

## Upgrade
1. Keep your existing working `config.js` from V3.5/GitHub. Do NOT replace it with `config.js.example`.
2. Upload the V4 files to the GitHub Pages repository: `index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, and the two icons.
3. Do not upload `config.js.example` as `config.js`.
4. Open the site and do a hard refresh in Firefox (`Ctrl+Shift+R` on desktop). On mobile, close the tab/PWA and reopen it.

## V4 features
- Supabase sign-in/sign-up with visible errors and no accidental form reload
- EMI payment automatically split into interest + principal
- Edit/delete individual interest/principal payments
- Edit/delete grouped EMI payments
- Future EMI schedule
- Extra principal payment simulator
- Dashboard totals and principal-repaid progress
- Estimated debt-free date for EMI loans
- Upcoming/overdue due-date panel
- Payment calendar for the next 90 days
- Monthly/yearly reports and interest analysis
- CSV export and browser Print/PDF
- Full JSON backup
- Search/filter
- Browser reminder permission (checks due items when the app is opened; true background reminders depend on browser/PWA support)

No service_role/secret key belongs in the frontend.
