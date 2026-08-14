# WHC Concierge - Repair Checkpoint 1

Prepared from the uploaded source copy on 14 August 2026. This is a tested
repair checkpoint, not approval to deploy directly to production.

## What this checkpoint fixes

- Replaces the 90-point/boosted match calculation with a true 100-point
  compatibility score.
- Removes Featured Profile, profile-completion and review boosts from job
  compatibility. Promotion and reputation must remain separate signals.
- Recalculates application and mutual-match scores on the server. The browser
  can no longer choose the percentage saved to the database.
- Binds talent and employer profile registration to the signed-in account.
- Allows messaging only after an application, shortlist, mutual match or
  agency booking.
- Restricts the generic notification endpoint to administrators. Shortlist and
  swipe notifications are now created by their checked server routes.
- Corrects the candidate/talent mismatch in GDPR export and account deletion.
- Stops document uploads falling back into the public site-images bucket.
- Enforces owned upload paths and introduces authenticated short-lived file
  links for CVs, insurance documents and message attachments.
- Replaces the anonymous agency `candidate_profiles.select('*')` query with a
  safe public directory endpoint that excludes CVs, telephone numbers,
  documents and precise coordinates.
- Adds migration `031_security_rescue.sql` to remove inherited permissive RLS
  policies, protect admin roles, enforce record ownership and make document
  buckets private.
- Synchronises `package-lock.json` with `package.json`, so `npm ci` works.

## Verification completed

- `npm ci` - passed.
- `npm run build` - passed, including TypeScript and Next.js validity checks.
- 123 application pages/routes generated successfully.

## Safe deployment order

1. Create a new Git branch. Do not work directly on `main`.
2. Take a Supabase database backup and export the current RLS/storage policy
   list.
3. Deploy the code to a Netlify Deploy Preview with staging Supabase keys.
4. Apply `supabase/migrations/031_security_rescue.sql` to staging only.
5. Complete the two-account test below.
6. Review any existing candidate document URL containing `/site-images/`.
   Earlier code may have placed a CV or insurance file there as a fallback.
   Move those files into `talent-documents` before production deployment.
7. Only after sign-off should the migration and code be released together to
   production.

## Required two-account test

Use one new candidate and one new employer account:

- Candidate registers, uploads and reopens a CV.
- Anonymous visitor sees the agency card but cannot obtain private fields.
- Pending employer cannot browse candidate records.
- Admin approves employer and candidate.
- Employer posts a role and sees a server-calculated candidate score.
- Candidate applies and the saved application score matches the displayed
  score.
- Messaging is refused before a shortlist/application and works afterwards.
- Candidate data export contains their profile and applications.
- Test accounts can be deleted without orphaned profile data.

## Deliberately left for the next checkpoint

- Connect the detailed 10-step taxonomy to the live matching engine.
- Make urgent agency cover treatment/qualification aware and run the cascade
  from a scheduled function.
- Add Supabase Realtime chat updates and reporting/blocking controls.
- Consolidate Stripe customer records, payouts and refunds.
- Choose and publish one agency pricing model everywhere.
- Replace the remaining public employer-profile reads with a safe public view.
- Close the legacy email/job-alert trigger routes and add durable rate limits.
- Add automated end-to-end tests for candidate, employer, agency and payment
  journeys.
