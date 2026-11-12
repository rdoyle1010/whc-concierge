# End-to-end checks

The 1,404 tests in `tests/` read source files. Not one of them opens a browser,
so not one of them would notice that signing in had stopped working, that the
apply button did nothing, or that a dashboard rendered an empty box. Those are
the failures that matter most and were the only ones nothing watched.

These do open a browser. They drive the real site the way a person does.

## Running them

```bash
npm run e2e                 # against production
E2E_BASE_URL=http://localhost:3000 npm run e2e
npm run e2e -- --headed     # watch it happen
```

## The two QA accounts

The signed-out checks need nothing. The signed-in checks need two permanent
accounts on the site - one talent, one employer - and **skip themselves with a
clear message when the credentials are absent**, so the suite is useful before
the accounts exist and does not fail CI on a machine that has no business
holding them.

| Variable | What it is |
|---|---|
| `E2E_TALENT_EMAIL` / `E2E_TALENT_PASSWORD` | a talent account used only for this |
| `E2E_EMPLOYER_EMAIL` / `E2E_EMPLOYER_PASSWORD` | an employer account used only for this |

Create them through the real registration forms, with passwords used nowhere
else. In CI they live in GitHub Actions secrets. They belong in neither the
repository nor a chat window.

## These tests do not write anything

They run against **production**, so they look and never touch: no role is
posted, no application is submitted, no profile is edited, no payment is
started. A test that creates data on a live site leaves litter in front of
real customers and eventually in front of a buyer.

Journeys that must create something belong in a run against a preview
deployment with its own database, gated on `E2E_ALLOW_WRITES`. Until that
exists the honest position is that these checks prove the signed-in surface
loads and carries the right things, not that submission works end to end.

## When one fails

The report names the journey in the words of the person doing it - "a
professional can sign in and reach their dashboard" - so a failure says which
part of the product stopped working rather than which selector moved.
Screenshots and traces for failures land in `e2e-results/`.
