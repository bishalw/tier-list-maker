<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your tier list app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` with:
   `NEXT_PUBLIC_SUPABASE_URL=...`
   `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
   `GEMINI_API_KEY=...`
3. Apply the database setup in [schema.sql](/Users/bishalw/Downloads/tier-list-maker/supabase/schema.sql) to your Supabase project.
4. Enable anonymous sign-ins in Supabase Auth.
5. Run the app:
   `npm run dev`
