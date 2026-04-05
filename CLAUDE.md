# CLAUDE.md — WHC Concierge

This file tells Claude Code exactly what this project is and how to work on it.
Read this before touching anything.

---

## What this project is

**WHC Concierge** is a luxury spa and wellness talent platform built by Rebecca Doyle /
Wellness House Collective. It connects spa and wellness professionals (Talent) with
luxury hotel employers (Hotel / Employer).

Live URL: https://talent.wellnesshousecollective.co.uk
Netlify project: whc-concierge
Stack: Next.js (App Router) · Supabase (auth + database) · Stripe (payments) · Netlify (hosting)

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14+ with App Router |
| Auth & Database | Supabase (project ID: klfsemvrxvgrbuzrqyer) |
| Payments | Stripe |
| Hosting / CI | Netlify (deploys from GitHub main branch) |
| Styling | Tailwind CSS |

---

## User roles

There are two distinct user types. Role is stored in the `profiles` table.

- **talent** — spa/wellness professionals. Land on `/talent/dashboard` after login.
- **employer** — hotel/spa employers. Land on `/employer/dashboard` after login.

The login page has a toggle: **Talent** | **Hotel / Employer**

---

## Database tables (Supabase)

- `profiles` — all users. Has a `role` column ('talent' or 'employer').
- `candidate_profiles` — talent-only data.
- `employer_profiles` — employer-only data. Has RLS policies.
- `job_listings` — uses `job_title`, `job_description`, `required_brands`, `is_live`.
- `skills`, `systems`, `product_houses`, `certifications`, `hotel_brands` — taxonomy tables.
- `candidate_skills`, `candidate_systems`, etc. — join tables for structured matching.
- `job_required_skills`, `job_preferred_skills`, etc. — job requirement join tables.
- Check RLS policies before any new queries — 406 errors are almost always RLS-related.

---

## Column name rules (IMPORTANT)

The `job_listings` table uses these column names:
- `job_title` (NOT `title`)
- `job_description` (NOT `description`)
- `required_brands` (NOT `required_product_houses`)
- `is_live` (boolean, NOT `status = 'active'`)
- Join with `employer_profiles` to get `property_name` (NOT `company_name` alone)

The `candidate_profiles` table uses:
- `services_offered` (NOT `specialisms`)
- NO `email` column (email is in `auth.users`)

---

## Routing logic (how auth redirect works)

1. User submits login form
2. Supabase auth -> get user ID
3. Query `profiles` table -> get `role`
4. If role = 'admin' -> redirect to `/admin/dashboard`
5. If role = 'employer' -> redirect to `/employer/dashboard`
6. If role = 'talent' (or null) -> redirect to `/talent/dashboard`

Do NOT query `employer_profiles` for talent users. It will 406.

---

## API routes that bypass RLS

These use the service role key (SUPABASE_SERVICE_ROLE_KEY):
- `/api/register/talent` — creates candidate_profiles record
- `/api/register/employer` — creates employer_profiles record
- `/api/profile/update` — updates candidate_profiles
- `/api/upload` — uploads files to Supabase storage
- `/api/seed-taxonomy` — seeds taxonomy data
- `/api/run-migration` — checks tables + seeds data

---

## Deployment

- Push to `main` -> auto-deploys to Netlify
- Do not manually upload — use GitHub
- Check Netlify deploy logs if something works locally but not live

---

## Environment variables (never commit these)

All secrets live in Netlify environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

## Code style

- British English in all user-facing copy
- Keep components clean — no bloated files
- Always handle loading and error states visibly in the UI
- Use `type="button"` on all non-submit buttons inside forms
- Use the `/api/` routes for any database writes that need service role access
