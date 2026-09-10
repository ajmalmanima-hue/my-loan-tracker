# My Loan Tracker V3

V3 keeps the existing Supabase database/schema. No SQL migration is required.

New in V3:
- Interest paid and principal paid summaries
- Overdue indicator for interest-only loans
- Search and loan-type/overdue filters
- Improved mobile layout
- Larger dashboard summary
- Safer authentication error handling
- V3 backup filename/version
- Fresh service-worker cache version

IMPORTANT:
- Keep your existing `config.js` with your real Supabase Project URL and public publishable/anon key.
- Do NOT replace `config.js` with a placeholder version.
- Never use a Supabase secret/service_role key in the browser or public GitHub repository.
- Existing Supabase RLS policies remain in use.

Recommended upload order:
1. Replace index.html
2. Replace app.js
3. Replace style.css
4. Replace manifest.json
5. Replace sw.js
6. Keep your existing config.js unchanged
7. Keep icon-192.png and icon-512.png
8. Wait for GitHub Pages deployment, then hard refresh with Ctrl+Shift+R

\n### EMI payment behavior\n
For EMI loans, Record Payment no longer asks for Interest or Principal. It automatically splits the EMI using the current monthly interest rate and outstanding principal, then stores the two portions as standard `interest` and `principal` payment records. This keeps the existing Supabase payment constraint unchanged. The principal portion reduces the loan balance. Interest-only loans retain separate Interest/Principal payment choices.

\n### Future EMI Schedule\n
EMI loans now have a **Schedule** button. It projects each future EMI from the current outstanding principal using monthly interest (annual rate ÷ 12), showing opening balance, interest, EMI, principal, closing balance, number of payments, and total future interest. The final payment is automatically reduced when necessary. The calculation assumes the rate and EMI remain unchanged. The loan's `due_date` is used as the next EMI date for EMI loans.
