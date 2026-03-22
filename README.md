# Run and deploy your tier list app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` with:
   `NEXT_PUBLIC_SUPABASE_URL=...`
   `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
3. Apply the database setup in [schema.sql](/Users/bishalw/Downloads/tier-list-maker/supabase/schema.sql) to your Supabase project.
4. Configure your Supabase OAuth providers and add `/auth/callback` as an allowed redirect URL.
5. Share/save and remix submission require a signed-in user. Local board editing still works without auth.
5. Run the app:
   `npm run dev`
