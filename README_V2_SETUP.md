# My Loan Tracker V2
1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase_schema.sql`.
3. In Project Settings -> API, copy Project URL and public anon/publishable key.
4. Put them into `config.js`. Never use a service_role/secret key.
5. Upload V2 files to GitHub Pages, replacing V1 files.
6. Open the PWA and create an account.
Your loans and payment records are stored in Supabase PostgreSQL and protected by Row Level Security.