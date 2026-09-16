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

## What a six-way audit found, and what was done about it

Six independent passes over the site in September 2026 - copy and brand voice,
silent failures, trust in an empty marketplace, live technical, search and
discoverability, and commercial structure. The site was technically sound: no
dead links across the whole navigation, no horizontal scroll on a phone, one
heading per page, layout shift inside the good threshold everywhere. What was
wrong was almost all at the point of conversion or discovery, and none of it
produced an error anybody would ever see.

The ones worth an outside view knowing about, because they change what advice
makes sense:

- **/jobs served Google a loading state.** The top URL in the sitemap and the
  first item in the navigation prerendered to a heading and the words "Loading
  live roles...". It competed with Indeed using an empty div. Now
  server-rendered, with every title, salary and link in the static document.
- **The one crawlable roles listing passed nothing to any job.** /roles renders
  150 roles on the server and wrapped every link in /login, which robots.txt
  blocks. Fixed: roles link straight to the role.
- **/pricing quoted fourteen prices and had one link out, for talent.** An
  employer who had decided to spend £995 could not do it from the page that
  quoted the number. Every price now has a destination.
- **Apply threw the role away.** It carried ?intent=apply&role=<id>; the
  registration form reads ?redirect=. Someone who pressed Apply on a specific
  job landed on an empty profile editor. Fixed.
- **Paid adverts fell out of Google Jobs after thirty days.** The JobPosting
  schema set validThrough only from an application deadline most properties do
  not fill in, while the page already knew the real expiry. Fixed.
- **Twenty-six pages had silently lost their share image.** Next merges page
  metadata shallowly, so declaring an openGraph title replaced the root object
  outright. No warning; the symptom is only ever visible on LinkedIn.
- **The old brand name was on the page that proves the platform is real.** The
  certificate verification page said "Issued by Wellness House Collective". The
  contact address, previously typed into eight files, is now defined once.
- **The stock-photograph flash had a third source.** Two defaults files were
  emptied and guarded in an earlier round; the Academy course pictures came from
  a set of files neither test looked at, so /academy painted a stock photo and
  swapped in the real one about 300ms later.

### Why the site felt slow, in case it comes up

Nearly every public page was set to re-validate its cache every sixty seconds,
and the root layout capped the whole site at five minutes. Those numbers were
not a caching policy, they were an apology for not having one: nothing dropped a
cached page when its content changed, so the window had to be short enough that
a new advert appeared quickly.

On a busy site that is invisible, because somebody is always warming the cache.
On this one it inverted: with pages stale within minutes and long gaps between
visitors, most visits paid for a full server render and a round trip to the
database. The person it punished hardest was the owner, because she is the one
reloading a page she has just changed.

Every public page now caches for an hour, and publishing, closing or approving
anything drops the affected pages on the same request. Both directions improve:
a visitor gets a prerendered page, and a published change is live at once rather
than up to five minutes later. A test holds the pairing, because a long window
with no invalidation would be far worse than the slow page it replaced.

Still open, and a bigger piece of work: every page ships roughly 200KB of
gzipped JavaScript before it does anything, and the Academy ships 450KB.

Four things a description of this business would otherwise get wrong:

1. The document library (561 operational documents, £10 to £2,450) is the only
   revenue line that works with no users at all. Eleven of the twelve need
   marketplace liquidity that does not exist yet.
2. Job detail pages are fully public. Copy claiming an account is needed to see
   the property or the brief was never true and has been corrected.
3. There are 29 product-house masterclasses live in the Academy while /brands
   said the first brand pages were being written.
4. The founder photograph on /about has never existed as a file. The page has
   always shown a grey monogram, and it degrades so gracefully nobody noticed.

## Where AI is used, and where it deliberately is not

**Used:** reading a CV into a draft profile, in the professional's own account
and in the concierge queue, from one reader against one taxonomy. A person
corrects every field and presses save; nothing is written until they do. That
attacks the actual bottleneck, which is that a proper profile takes half an
hour to fill in and nobody does it.

**Used:** writing the blank box. Every account type has one field that decides
whether anybody reads the rest of it, and every one of them is left empty: a
professional's About you, a property's description, every long box in the
Property Fact File, and the whole of a consultancy listing. There is a button
next to each. It writes from what is already on that account's own record,
read on the server rather than taken from the request, and offers a draft that
saves nothing by itself. Anything already written is never overwritten, and a
number that is not in the draft is never invented.

**Deliberately not used:** deciding anything about a candidate. The matching
engine is structured and deterministic, and it can tell somebody exactly why
they scored what they scored: four of six required treatments, two of three
systems. An automated decision about somebody's employment is a regulated
thing, and "five agents debated your application" cannot be explained to a
rejected candidate, defended to a regulator, or shown not to have discriminated
on a proxy for a protected characteristic.

That is a decision, not an oversight. Advice to add an LLM scoring panel should
be weighed against it rather than treated as new.

Two related points of accuracy: prompting a model is not training one, so the
matching must never be described as trained on anything; and the vocabulary
the reader picks from (product houses, systems, qualifications, role levels) is
the actual intellectual property here, not the model.

## Operational documents, the second revenue line

Being built now, in two tiers. A library of professional templates (SOPs, risk
assessments, health and safety, job descriptions, performance improvement,
financial sheets), and the same documents generated for a specific property
from its own Property Fact File: its products, its booking system, its
protocols, its commission, its uniform.

The Fact File is the reason the second tier cannot be copied. Anyone can sell
templates by Friday; nobody else holds that data on a property. The argued
position is that the library is free with a property account, because it
drives Fact File completion, which is data the marketplace needs anyway, and
the generated tier is what is charged for.

Every document carries the same governance the modelled originals did not: an
owner and an approver distinct from the author, a version, a review date, one
line on why the procedure matters, how it is measured, and where it goes
wrong. And every document states what it is: a professional template for the
property to review, amend and sign off. A risk assessment carries a second,
specific statement, because it is a legal artefact completed by a competent
person who knows the premises. No signature is ever pre-printed.

### What is actually on the shelf

The library is 506 sellable documents: 460 procedures by department, the pool
and spa Normal Operating Procedure (79 pages) and Emergency Action Plan (66
pages, one emergency per page), 13 risk assessments covering 61 hazards, the
completion and training guides that go free with the safety pack, 9 daily
running checklists, and 20 management report templates. They ship as PDFs with
real form fields, so a buyer types the property name once and it fills in
everywhere it appears.

Four suites are sold on their own argument rather than by document count: the
safety operating procedure (£495), the risk assessment suite (£750), the daily
running checklists (£395) and the financial reporting pack (£1,250).

The checklists are the procedures in the form somebody uses them at seven in
the morning: reception opening, mid shift and close, therapist opening and
closing, cleaning opening and closing, the duty manager walk, and a weekly
maintenance, safety and training sheet. Every block names the procedure,
assessment or policy it is drawn from, so a change to one can be traced to
every checklist it affects, and checks marked STOP decide whether an area
opens at all.

The reporting pack is twenty templates and, more usefully, the measure
definitions behind them. What a spa director lacks is rarely a spreadsheet: it
is agreement on which numbers, measured how, compared against what, and what
somebody does when one moves. It leads with a fifteen-measure director
dashboard and drills into revenue against capacity (RevPATH and unsold hours,
not only budget variance), forward pace, contribution per hour by treatment,
therapist productivity, retail, membership, guests, channels, discount and
yield, vouchers, payroll, the departmental profit and loss, stock, complaints,
standards, safety and marketing. Nothing is pre-filled: a printed benchmark
would be somebody else's spa.

The pack also ships one Excel workbook, generated from the same register the
PDFs are, so the tabs and the definitions cannot drift from the documents.
The split is deliberate: the PDFs are how a month is presented, the workbook
is where it is worked out. A Setup tab takes eight constants, and RevPATH,
occupancy, unsold capacity, payroll percentage, gross operating profit and a
fifteen-measure director dashboard all fall out of them by formula. The
dashboard contains no typed numbers at all, because a dashboard filled in by
hand disagrees with the reports behind it by the third month.

One thing worth knowing about the drafted procedures. A draft that came back
from the model without steps in it was stored as written anyway, so the
register reported nothing left to write while a batch of documents could not
be signed off, and they were found one at a time by pressing sign off and
being refused. **Written** and **Written, not finished** are separate counts
on the library screen now, and one press sends the unfinished ones to be
drafted again. A redraft only replaces what is there if it comes back more
complete, and only on a run that was deliberately sent to redraft: an
unfinished document and one somebody started writing by hand look identical
from the collection's point of view, so the default stays never overwrite.

Redrafting does not always work. Six documents were sent back to the model
twice and came back with no steps both times, each one holding a department
pack off the shelf on its own. They are written by hand in the repository
now, alongside the nine written that way earlier, which is fifteen documents
whose content lives in a diff rather than in a model's output. The lesson
generalises: where a document has failed to draft twice, writing it is
cheaper than a third attempt, and it is the only version that can be reviewed
in a pull request.

The xlsx writer is about three hundred lines in `src/lib/documents/xlsx.ts`
rather than a dependency, because the file format is a zip of XML and node
already has deflate. Every generated workbook is opened by a real spreadsheet
reader in the test suite: a file a buyer downloads and cannot open costs more
trust than a missing feature.

Packs can now carry working files as well: a spreadsheet uploaded against a
pack reaches everybody who owns that pack, including people who bought it
months ago. A file belongs to a pack as a whole, never to a single document,
because there is no sensible way to own half a workbook.

The library is browsed and sold in two groups, not by when a property needs a
document. That old arrangement - before the first guest, first thirty days,
first quarter - is useful once while you are opening and useless every day
after.

**What a guest walks through:** pre-arrival, arrival, experience, departure,
after the visit. **What keeps it running:** money and membership, people,
training, systems and setup, safety and the building, running the day. Eleven
packs, and then a filter by what kind of document it is.

A department pack asks a buyer to know which team owns a procedure. A stage
asks where in a visit the problem is, or which part of the operation is thin,
which is the question they arrived with. Arrival alone spans reception,
housekeeping and membership.

A pack costs about a third of its documents bought singly, capped at £795 and
floored at the price of one document, so they run from £135 for training to
£795 for systems. Every pack together comes to £5,395 against a complete
library at £2,450, deliberately: if somebody wants most of it, the library has
to be the right answer.

The risk assessment suite and the safety operating procedure are in no stage
pack. They are sold on their own arguments at £750 and £495, and a stage pack
priced at a third of its parts would hand both over inside a £655 pack along
with forty-eight other documents. They are in the complete library, which is
the top of the ladder.

Departments are still sold underneath at £299, and every pack slug ever sold
still resolves, because a slug is written into an order and that order is a
buyer's entitlement for as long as they have an account.

One thing worth knowing about the rendering: for a period every plan and risk
assessment printed with text on top of other text, because a page break was
asked for on the rule at the top of a section rather than on the section. It
was invisible in the code and obvious the moment anybody opened the file. The
preview scripts under `scripts/` exist for that reason and should be used
before anything in this library is called finished.

## Technical shape

Next.js 16 App Router · Supabase (auth, Postgres, storage) · Stripe · Netlify.
240 API routes, 174 pages, 135 migrations, 169 test files. 1,232 tests and
46 production-readiness checks, all green.

Two roles: `talent` and `employer`, stored on `profiles.role` (talent is
stored as `candidate`). Admin is a third role on the same column.

## House rules, which are not negotiable

- **British English** everywhere, including code comments and user-facing copy.
- **No em dashes.** A readiness check enforces this across `src/`.
- **One house style for every AI surface**, in `src/lib/house-style.ts`, shared
  by all eight writing routes and checked by readiness check 44. The platform
  calls one provider through one client, `src/lib/ai.ts`, with one key
  (`ANTHROPIC_API_KEY`). `OPENAI_API_KEY` is no longer read anywhere and can be
  removed. Readiness checks 45 and 46 hold both.
- **Nothing on the live site runs on a premium model, and that is deliberate.**
  Members join free, so every AI call is a cost carried before any revenue.
  Both surfaces run Sonnet 5 ($2 per million input, $10 output) rather than
  Opus 5 ($5 / $25). The realistic cost of a new member who uses every AI
  feature on the platform is single-digit pence, and a member who signs in and
  browses costs nothing at all, because AI only runs when somebody presses a
  button. Going back up a tier is one environment variable, and is the right
  move the day members are paying for something.
- **The two jobs are still split, as a lever rather than a saving.** Writing
  prose a person reads (bios, headlines, job adverts, employer messages) and
  reading a document into a shape (CV extraction, Interview Ready, application
  analysis) have separate model constants, `ANTHROPIC_MODEL` and
  `ANTHROPIC_MODEL_READING`. They point at the same model today. Haiku was
  tried for the reading half and rejects the effort setting every call uses,
  taking the older fixed-budget shape, so it is a rewrite rather than a string
  change and not worth it at this volume. Both overrides take effect on the
  next deploy, not immediately: Netlify reads environment variables into a
  function when it builds it.
- **AI is free for members, but bounded.** The question was whether to put AI
  behind the paywall. The answer was no for the profile writer and yes for the
  career tools, and the reasoning matters: what this platform sells to hotels
  is a register of well-presented professionals, so the writer is not a member
  perk, it is what turns a thin profile into sellable inventory. Charging for
  it is charging people to fill in our own catalogue at the moment a new member
  is most likely to leave. Two pence to convert a signup into a complete
  profile is the cheapest acquisition available anywhere.
  Instead there are monthly per-person allowances: 25 profile writes and 3 CV
  reads, settable by Rebecca at `/admin/ai-allowances` with no deploy. Worst
  case a free member reaches about 20p a month; the median spends two or three
  pence. Paying members are not metered, employer content is never metered
  (an advert that gets written is a listing, and a listing is the revenue
  event), and Interview Ready stays on credits because it helps one person win
  one job rather than improving the register.
  That screen also shows the month's real spend per member, read from the
  ledger rather than estimated, which is the number the whole exercise existed
  to produce.

- **Every AI call is labelled and logs its token counts**, held by readiness
  check 47. This exists because the first bill was misread. Roughly sixteen
  dollars in a fortnight looked like a run rate and was blamed on the live
  site; the cost chart showed it was one day, one batch, and the document
  library being drafted on the cheaper model. The live AI surfaces cost
  pennies. Attribution by estimate is not attribution, so the Netlify function
  log now answers it directly.
- **The palette is ivory, forest, stone and charcoal, and there is no metal.**
  Ground `#F6F3ED`, structure and accent `#28322B`, body copy `#222321`, warm
  taupe `#B5A898` and muted sage `#879080` for hairlines and quiet detail only.
  Roughly 65 per cent ivory, 20 forest, 10 taupe and sage. Forest carries
  anything you press or follow, charcoal anything you read. Two readiness
  checks hold it: taupe and sage never carry a word (2.10:1 and 2.99:1 on the
  ivory), and the accent is never equal to the ink. No gold and no brass: brass
  measures 2.89:1, and white on a brass button is 3.2:1 where 4.5 is the floor.
  The printed documents stay neutral black, because they are printed.
- **One price per kind of document, not one price for everything.** A
  procedure is 10 pounds, a checklist 35, a job description 29, a policy 39, a
  risk assessment 75, a management report 75, the pool NOP and EAP 250 each.
  All eleven are hers to change from Prices and Bundles with no deploy. No pack
  may cost more than its own documents bought one at a time: that rule lives in
  `capped()` and is applied inside every pack producer, so changing a document
  price moves every pack containing it.
- **Three complete documents are free**, listed in
  `src/lib/documents/samples.ts`, with no email address asked for.
- **Nothing paid reaches a browser.** The shop lists every title, and it reads
  them from `src/lib/documents/catalogue-index.ts`, which is generated listing
  data with no route back to the writing. Importing the plan modules into a
  client component instead once shipped the hazard prose out of the risk
  assessment suite in a public 444KB chunk. A readiness check now walks the
  import graph from every `'use client'` file and fails if it can reach a
  draft.
- **An API error is read by a person.** No route answers with a bare status
  word. `{ error: 'Unauthorised' }` was returned by 203 routes and the pages in
  front of them print whatever the API says, so a buyer signed out on one
  browser saw "Unauthorised" above "you have not bought any documents yet".
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
