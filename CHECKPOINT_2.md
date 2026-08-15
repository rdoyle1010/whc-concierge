# WHC Concierge - Checkpoint 2

This checkpoint corrects the match-ranking behaviour discovered during the
Netlify preview test on 14 August 2026.

## Matching

- All live roles remain visible and rank from 100% down to a minimum of 10%.
- A large role-level gap lowers the score instead of hiding the role.
- A genuine mandatory requirement, such as insurance for an agency shift,
  remains visible but cannot be applied for until the requirement is met.
- Employer ranking uses the same 100%-to-10% scale.

## Security

- Maintenance and data-seeding endpoints now have a server-side administrator
  guard as well as the production middleware block.
- Browser-controlled application and welcome email endpoints are blocked.
- Application decision emails resolve the candidate, role and property on the
  server and verify that the caller owns the role.

## Verification

`npm run build` completed successfully with all 123 routes generated.
