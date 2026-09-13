# Talent House Collective: the brief

**Copy this whole file into ChatGPT at the start of a conversation about the
platform.** It is written to be pasted, not read by a machine that already has
the repository. Claude Code reads it automatically.

Keep it current. A brief that describes last month is worse than no brief,
because it is believed.

---

## What this is

Talent House Collective is a luxury spa and wellness talent platform, built by
Rebecca Doyle of Wellness House Collective. It connects spa and wellness
professionals with luxury hotel and spa employers.

Live at **talenthousecollective.co.uk**. Launched 11 September 2026.

It is not a job board, and treating it as one is the mistake the market has
already corrected us on. See "What professionals actually told us" below.

## Where it is now

| | |
|---|---|
| Talent on the register | 14 |
| Properties | 1 (Rebecca's own) |
| Completed profiles | 0 |
| Live roles | 0 |
| Revenue | £0 |

That is the whole picture and it is the point. This is a cold-start,
two-sided marketplace three days after launch, and every recommendation has to
be honest about that scale. Advice that assumes traffic, a register, or a
budget is advice for a different business.

## The revenue lines

Six, all built, none earning yet:

1. **Recruitment** - properties pay to list a role (£149 standard, £249 featured)
2. **Agency** - single-day shift cover, platform fee on top of the rate
3. **Residency** - a specialist placed at a property for a season
4. **Academy** - courses and verifiable certificates
5. **Consultancy** - a directory of advisers, free to join deliberately
6. **Advertising** - sponsored brand placements

## What professionals actually told us

Two pieces of feedback that changed the product, and any advice has to respect
both:

**They are frightened of being seen looking.** In an industry where every spa
director knows every other spa director, appearing on a talent platform can
cost somebody their job. New accounts are now **private by default**, with
three settings: Private (nobody can find you), Discreet (properties find you
by skill and see a first name and initial until you accept an introduction),
and Open.

**They do not want it to be about job hunting at all.** They want somewhere
their qualifications and brand training count, courses that carry weight, and
to hear about launches and masterclasses first. Perhaps five per cent of spa
professionals are looking for work at any moment. All of them want to know
what is on. The strategy follows from that: be where the other ninety-five per
cent keep their professional record, and the jobs take care of themselves.

**Nobody completes a profile.** Fourteen sign-ups, zero finished. So there is
now a page where somebody sends a CV and we build the profile for them, and
the first thing they are ever asked to do is set a password on something
already finished.

## The real problem this week

Not the product. Distribution and activation.

- An empty marketplace cannot be launched, only filled. Every hotel sent to an
  empty register is a hotel burned.
- The plan is talent first, by hand: direct approaches, CVs built for people,
  and no hotels until there are thirty real profiles.
- One LinkedIn post is an announcement, not a campaign.

## Technical shape

Next.js 16 App Router · Supabase (auth, Postgres, storage) · Stripe · Netlify.
227 API routes, 165 pages, 122 migrations, 117 test files.

Two roles: `talent` and `employer`, stored on `profiles.role` (talent is
stored as `candidate`). Admin is a third role on the same column.

## House rules, which are not negotiable

- **British English** everywhere, including code comments and user-facing copy.
- **No em dashes.** A readiness check enforces this across `src/`.
- **Secrets live only in Netlify environment variables.** Never in the repo,
  never in a chat, never in a file.
- **SQL is pasted into chat in a code block**, never delivered as a file to run.
- Tests are written as behaviour, not implementation. A test that pins
  formatting fails when correct code changes shape, which teaches everybody to
  ignore it.
- Every new guard is **mutation tested**: break the code deliberately and
  confirm the test goes red. A check that quietly matches nothing looks exactly
  like a check that passes, and this project has been caught by that three
  times.

## How to work with two assistants

They cannot talk to each other. There is no shared session, and anything that
claims otherwise is theatre. What works is different jobs.

**ChatGPT is the outsider.** It cannot see the code, and that is its
advantage: it asks the naive questions a customer would, and it has no
attachment to what has already been built. Use it for positioning, copy,
pricing, market strategy, campaign ideas, and for arguing with the plan.

**Claude Code is the builder.** It has the repository, the tests, the
migrations and the deploy. Use it for anything that changes the product, and
for questions that need the truth rather than a guess about what the code does.

**Do not let both edit the repository.** Two assistants writing to the same
branch produce conflicting changes and broken tests, and neither can see what
the other did.

### The loop that works

1. Ask ChatGPT for the outside view. Paste this brief first.
2. Bring its answer here, verbatim, including the parts you disagree with.
3. Claude checks it against what the code actually does, says plainly which
   parts are right, and builds the ones worth building.
4. Anything material gets added to this file so the next round starts current.

Step 3 matters. An assistant that cannot see the code will confidently
describe features that do not exist and problems that were fixed last week.
That is not a failing, it is the cost of the outside view, and it is why the
answer comes back here before anything is acted on.

### What never goes into an outside chat

Customer names, email addresses, CVs, anything from `auth.users`, and any key
or token. The register is fourteen real people who trusted us with their
careers. Describe the shape of a problem, never the people in it.
