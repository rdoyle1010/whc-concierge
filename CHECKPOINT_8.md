# WHC Concierge - Checkpoint 8

## Netlify PDF parser correction

- Replaces the legacy PDF reader with the current serverless-compatible parser.
- Moves the Netlify build runtime from Node 18 to the parser's supported Node
  20 release.
- Prevents the old package from looking for its missing sample PDF before it
  reads the candidate's privately stored CV.
- Leaves the candidate-review and manual-save safeguards unchanged.

This remains a test checkpoint and is not approval to merge to production.
