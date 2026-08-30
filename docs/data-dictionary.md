# WHC Data Dictionary

The definitions behind every number WHC reports, publishes or pitches.
A metric gets an entry here before it gets a dashboard. Update this file in
the same commit that adds or changes a metric.

Rules that apply everywhere:

- **Provenance is part of the fact.** Every valuable data point records who
  asserted it: `candidate_declared`, `employer_advertised`,
  `employer_confirmed`, `document_verified`, `academy_assessed`,
  `platform_transaction`. Declared and confirmed numbers are never blended
  in one statistic.
- **History over overwrites.** Salaries and role changes are dated rows in
  `salary_records` / `placements`, never in-place updates. Movement over
  time is the commercially valuable signal.
- **Sample size is part of the number.** Nothing is published externally
  below 500 relevant records; shown in-product with a "based on n" label at
  100-499; internal-only below that; suppressed entirely below 30 or where
  any displayed cut contains fewer than 5 people. Medians and quartiles,
  never means, for money.

## Core definitions

| Term | Definition |
| --- | --- |
| Active talent | Candidate with a complete, approved profile who has logged in or applied within 90 days. Not "registered users". |
| Active employer | Employer with an approved profile and at least one live role, booking or search session within 90 days. |
| Placement | A row in `placements`: an application that reached hire-confirmed. Permanent - survives later archiving or the person leaving the job. |
| Salary (confirmed) | `salary_records.kind = 'confirmed'` - from an accepted offer at hire completion (`source = 'platform_transaction'`). The only salary used in market statistics. |
| Salary (expectation) | `salary_records.kind = 'expectation'` - candidate-declared, dated on every change. Displayed to employers only where the candidate has not kept it private. |
| Salary (advertised) | `salary_records.kind = 'advertised'` - the band on a paid, activated job listing (`source = 'employer_advertised'`). |
| Verified | A fact with provenance of `document_verified` or better (`candidate_certifications.verified_source`). "Verified profile" = identity + at least one qualification verified. |
| Fill rate | Live roles reaching hire-confirmed within their listing period ÷ live roles expiring in the same period. |
| Time to hire | Days from job activation (`job_posted` event) to offer acceptance (`offer_accepted` event). Time to start is reported separately from `placements.start_date`. |
| Agency fulfilment rate | Agency shifts completed as booked ÷ shifts confirmed, trailing 90 days, from `agency_bookings` (platform-observed; never self-declared). |

## Event vocabulary (`analytics_events.event_name`)

One append-only table; service-role writes only; fire-and-forget (an
analytics failure must never break the emitting request).

| Event | Emitted when | Where |
| --- | --- | --- |
| application_submitted | Candidate sends an application | `api/applications/submit` |
| application_withdrawn | Candidate withdraws a sent application | `api/applications/withdraw` |
| candidate_shortlisted | Employer shortlists | `api/employer/applications/decision` |
| application_rejected | Employer declines | `api/employer/applications/decision` |
| interview_scheduled | Interview invitation created (payload: round) | `api/employer/applications/interview` |
| offer_created | Employer sends an offer | `api/employer/applications/offer` |
| offer_accepted / offer_declined | Candidate responds | `api/talent/applications/offer` |
| hire_confirmed | Employer completes the hire (placement row created) | `api/employer/applications/complete-hire` |
| job_posted | Paid role activates (payload: tier, held_for_approval) | Stripe webhook `job_posting` branch |
| course_completed | First pass of a course assessment (payload: course_slug, score) | `api/academy` quiz action |

Funnel metrics derive from these: application→interview, interview→offer,
offer acceptance, time to hire. Add new event names to this table in the
same commit that emits them.

## Tables added by `20260830233000_instrumentation.sql`

- `analytics_events` - behavioural record. Owner: platform. Retention:
  indefinite (contains ids, no free-text personal data in payloads - keep it
  that way).
- `placements` - permanent hire records with confirmed salary/package.
  Owner: platform. Never deleted; `application_id` nullable so the record
  outlives application cleanup.
- `salary_records` - dated salary history with kind + source. Owner:
  platform. Aggregate-only exposure; minimum cell size 5 in any display.
- `candidate_certifications.verified_at / verified_source` - provenance on
  the existing `is_verified` flag.

All four are RLS-enabled with service-role-only access: no client reads.
Anything shown to users is served through an API that applies the
aggregation and privacy rules above.

## Privacy classification

`salary_records` and `analytics_events` are personal data (linkable to a
candidate). They are excluded from employer-facing surfaces except as
aggregates meeting the sample-size rules, they fall under data-deletion
requests (delete rows by candidate_id on erasure, keeping only fully
anonymised aggregates), and they are never exported per-person.
