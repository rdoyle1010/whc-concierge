# WHC Concierge - Checkpoint 4

This checkpoint corrects an inflated compatibility score found during the
14 August 2026 Netlify preview test.

## Scoring correction

- Blank employer requirements no longer receive an automatic 100% match.
- Only criteria actually specified or assessable contribute to the percentage.
- Active criteria are reweighted fairly to produce a 100%-to-10% score.
- The breakdown reports how many factors could not be assessed.
- Profile completeness, paid promotion and reviews do not boost job compatibility.
- Mandatory insurance remains a visible 10% requirement failure and cannot be
  bypassed by the applicant.

## Why this matters

A Spa Director profile was incorrectly receiving a 78% Strong Match for a Spa
Receptionist role because blank criteria were treated as perfect matches. The
role-level mismatch was recognised, but free points from missing job data
overpowered it. This checkpoint removes those free points.

## Verification

`npm ci` and `npm run build` completed successfully. All 123 routes generated.
