# Wellness House Collective — Mobile Audit & Launch Tracker

> Numbering system: JOB 001/1000 onward. The `/1000` is only a permanent job-ID range, **not** a percentage complete.
>
> Status key:
> - ✅ CODE + CI — implementation is present on `full-app-audit-hardening` and the branch passes automated checks.
> - 📱 DEVICE TEST — must still be tested in the fresh native app build by a real user.
> - 🚨 LAUNCH BLOCKER — failure would prevent safe launch or revenue.
> - ◻️ LATER — valuable polish, but does not justify delaying launch.
>
> **Operating rule:** revenue and broken workflows come before cosmetic perfection. We do not spend days redesigning low-risk screens before testing the real app.

## Current checkpoint

- Pull request: #47 — `Full mobile workflow audit and stage hardening`
- Branch: `full-app-audit-hardening`
- Base production branch: `main`
- PR state: draft / not merged
- Current PR scope at tracker creation: **63 commits / 50 changed files**
- Netlify preview: healthy
- Latest Mobile CI: green
- Latest Platform Quality CI: green
- Native iOS visual/device review: **PENDING**

## Revenue-first launch gate

These are the journeys that must work before we spend more time on non-essential polish.

| Job | Priority | Journey | Code/CI | Native device | Launch decision |
|---|---|---|---|---|---|
| JOB 002/1000 | 🚨 | Talent sign-up, login and MFA | ✅ | 📱 | Must pass |
| JOB 003/1000 | 🚨 | Talent profile + CV upload/save | ✅ | 📱 | Must pass |
| JOB 004/1000 | 🚨 | Browse roles + job detail | ✅ | 📱 | Must pass |
| JOB 005/1000 | 🚨 | Start application + match + covering letter | ✅ | 📱 | Must pass |
| JOB 006/1000 | 🚨 | Submit application + employer receives it | ✅ | 📱 | Must pass |
| JOB 007/1000 | 🚨 | Employer shortlist/interview workflow | ✅ | 📱 | Must pass |
| JOB 008/1000 | 🚨 | Talent interview confirmation | ✅ | 📱 | Must pass |
| JOB 009/1000 | 🚨 | Employer offer + talent accept/decline | ✅ | 📱 | Must pass |
| JOB 010/1000 | 🚨 | Employer post/edit/close/fill job | ✅ | 📱 | Must pass |
| JOB 011/1000 | 🚨 | Filled-role applicant notification | ✅ | 📱 | Must pass |
| JOB 012/1000 | 🚨 | Talent ↔ employer messages | ✅ | 📱 | Must pass |
| JOB 013/1000 | 🚨 | Talent billing / membership / Stripe management | ✅ | 📱 | Must pass |
| JOB 014/1000 | 🚨 | Featured Talent / Featured Employer purchase path | ✅ | 📱 | Must pass |
| JOB 015/1000 | 🚨 | Agency browse/match | ✅ | 📱 | Must pass |
| JOB 016/1000 | 🚨 | Agency accept/decline/counter | ✅ | 📱 | Must pass |
| JOB 017/1000 | 🚨 | Agency employer payment + WHC fee | ✅ | 📱 | Must pass |
| JOB 018/1000 | 🚨 | Agency Before You Arrive / Fact File | ✅ | 📱 | Must pass |
| JOB 019/1000 | 🚨 | Agency post-shift review | ✅ | 📱 | Must pass |
| JOB 020/1000 | 🚨 | Residency membership checkout | ✅ | 📱 | Must pass |
| JOB 021/1000 | 🚨 | Residency profile/listing approval flow | ✅ | 📱 | Must pass |
| JOB 022/1000 | 🚨 | Residency employer payment | ✅ | 📱 | Must pass |
| JOB 023/1000 | 🚨 | Privacy / Stealth employer blocking | ✅ | 📱 | Must pass |
| JOB 024/1000 | 🚨 | Notifications arrive and deep-link correctly | ✅ | 📱 | Must pass |
| JOB 025/1000 | 🚨 | Fresh native iOS build from audited branch | — | — | NEXT GATE |
| JOB 026/1000 | 🚨 | Real-device revenue smoke test | — | — | NEXT GATE |
| JOB 027/1000 | 🚨 | Fix only failures found by smoke test | — | — | AFTER TEST |
| JOB 028/1000 | 🚨 | Merge audited PR to `main` | — | — | AFTER TEST |
| JOB 029/1000 | 🚨 | Production smoke test | — | — | AFTER MERGE |
| JOB 030/1000 | 🚨 | App Store/TestFlight release candidate | — | — | AFTER PASS |

## Completed / hardened mobile areas in PR #47

These have code changes in the current audit branch and are covered by the branch's automated build/quality checks. They still require the native device review where relevant.

| Job | Area | Status |
|---|---|---|
| JOB 031/1000 | Shared mobile theme / typography / spacing system | ✅ CODE + CI |
| JOB 032/1000 | Mobile navigation | ✅ CODE + CI |
| JOB 033/1000 | Landing / app entry | ✅ CODE + CI |
| JOB 034/1000 | Login | ✅ CODE + CI |
| JOB 035/1000 | MFA challenge | ✅ CODE + CI |
| JOB 036/1000 | Home | ✅ CODE + CI |
| JOB 037/1000 | Talent profile | ✅ CODE + CI |
| JOB 038/1000 | Browse jobs | ✅ CODE + CI |
| JOB 039/1000 | Job detail / property context | ✅ CODE + CI |
| JOB 040/1000 | Application builder + match + covering letter assistant | ✅ CODE + CI |
| JOB 041/1000 | Talent application tracking | ✅ CODE + CI |
| JOB 042/1000 | Employer applications workspace | ✅ CODE + CI |
| JOB 043/1000 | Employer application detail | ✅ CODE + CI |
| JOB 044/1000 | Interview workflow stage hardening | ✅ CODE + CI |
| JOB 045/1000 | Offer workflow stage hardening | ✅ CODE + CI |
| JOB 046/1000 | AI employer message stage guardrails | ✅ CODE + CI |
| JOB 047/1000 | Messages inbox | ✅ CODE + CI |
| JOB 048/1000 | Message conversation | ✅ CODE + CI |
| JOB 049/1000 | Notifications | ✅ CODE + CI |
| JOB 050/1000 | Billing | ✅ CODE + CI |
| JOB 051/1000 | Privacy & Stealth | ✅ CODE + CI |
| JOB 052/1000 | Security | ✅ CODE + CI |
| JOB 053/1000 | Tour / onboarding | ✅ CODE + CI |
| JOB 054/1000 | Interview Ready | ✅ CODE + CI |
| JOB 055/1000 | Awards | ✅ CODE + CI |
| JOB 056/1000 | Reputation | ✅ CODE + CI |
| JOB 057/1000 | Academy home / student portal | ✅ CODE + CI |
| JOB 058/1000 | Academy course / handbook / learning structure | ✅ CODE + CI |
| JOB 059/1000 | Academy transcript | ✅ CODE + CI |
| JOB 060/1000 | Admin mobile control centre | ✅ CODE + CI |
| JOB 061/1000 | Employer analytics | ✅ CODE + CI |
| JOB 062/1000 | Discover Talent | ✅ CODE + CI |
| JOB 063/1000 | Employer job management | ✅ CODE + CI |
| JOB 064/1000 | Talent matching | ✅ CODE + CI |
| JOB 065/1000 | Agency main workspace | ✅ CODE + CI |
| JOB 066/1000 | Agency Account | ✅ CODE + CI |
| JOB 067/1000 | Agency Booking Detail | ✅ CODE + CI |
| JOB 068/1000 | Agency Fact File | ✅ CODE + CI |
| JOB 069/1000 | Before You Arrive | ✅ CODE + CI |
| JOB 070/1000 | Agency post-shift review | ✅ CODE + CI |
| JOB 071/1000 | Agency account API / mobile return bridge | ✅ CODE + CI |
| JOB 072/1000 | Residency main workspace | ✅ CODE + CI |
| JOB 073/1000 | Residency Setup | ✅ CODE + CI |
| JOB 074/1000 | Residency Payment | ✅ CODE + CI |
| JOB 075/1000 | Platform quality CI workflow | ✅ CODE + CI |
| JOB 076/1000 | Mobile workflow guardrail tests | ✅ CODE + CI |

## Do not delay launch for these unless the native test shows a real problem

| Job | Area | Status |
|---|---|---|
| JOB 077/1000 | Additional animation polish | ◻️ LATER |
| JOB 078/1000 | Non-critical illustration polish | ◻️ LATER |
| JOB 079/1000 | Extra Academy catalogue content | ◻️ LATER |
| JOB 080/1000 | Salary benchmarking | ◻️ LATER |
| JOB 081/1000 | Mentor matching | ◻️ LATER |
| JOB 082/1000 | Formal Wellness Score | ◻️ LATER |
| JOB 083/1000 | Formal Employer Reputation Score | ◻️ LATER |
| JOB 084/1000 | Additional brand guides | ◻️ LATER |
| JOB 085/1000 | Career timeline enhancements | ◻️ LATER |

## Immediate next action

**JOB 025/1000 — Fresh native iOS build from the audited branch.**

We should stop broad design work here unless CI or the build exposes a real blocker. The purpose of the fresh build is to test the actual product, especially the revenue journeys, before spending more days on polish.

## Device smoke-test order

When the new build is available, test in this order:

1. Login / MFA.
2. Talent profile + CV.
3. Browse role → job detail → apply.
4. Employer sees application → shortlist → interview → offer.
5. Talent confirms interview → accepts/declines offer.
6. Messages and notifications.
7. Talent billing / Featured purchase.
8. Agency end-to-end including payment.
9. Residency end-to-end including payment.
10. Privacy / Stealth.
11. Academy / Interview Ready only after the revenue workflows pass.

If any of steps 1–10 fail, create a numbered blocker and fix it immediately. If they pass, proceed toward merge/release rather than reopening broad design work.
