// WHC Academy - the course catalogue. Content lives in code (no CMS needed);
// enrolments, progress and certificates live in the course_enrollments table.
// IMPORTANT: quiz answer keys are NOT in this file - they live in
// academy-answers.ts, which is only ever imported server-side.

import { MORE_COURSES } from './academy-more'

export const COURSE_PRICE = 1000 // pence - £10 per course
export const BUNDLE_PRICE = 7900 // pence - all 11 courses for £79 (save £31)
export const PUBLIC_COURSE_PRICE = 1500 // pence - £15 for non-members buying from the public page
export const PASS_MARK = 80 // percent required on the final quiz

export type AcademyLesson = { title: string; content: string }
export type AcademyQuestion = { q: string; options: string[] }
export type AcademyCourse = {
  slug: string
  title: string
  tagline: string
  category: 'Guest Experience' | 'Standards' | 'Treatments' | 'Commercial' | 'Brands' | 'Specialist Care'
  minutes: number
  price?: number // pence; defaults to COURSE_PRICE (brand masterclasses are 500)
  lessons: AcademyLesson[]
  quiz: AcademyQuestion[]
}

export const ACADEMY: AcademyCourse[] = [
  {
    slug: 'consultation-excellence',
    title: 'The Perfect Consultation',
    tagline: 'Turn the first five minutes into the whole treatment',
    category: 'Guest Experience',
    minutes: 35,
    lessons: [
      { title: 'Why the consultation is the treatment', content: `A five-star treatment does not start at the massage couch. It starts the moment the guest sits down opposite you. The consultation is where trust is built, expectations are set and the treatment is personalised - and it is the single part of the experience most often rushed.

A proper consultation does three jobs at once. It keeps the guest safe (contraindications, allergies, medical conditions). It tells you what the guest actually wants, which is often different from what they booked. And it signals professionalism: a therapist who asks intelligent questions is trusted before they have laid a hand on the guest.

Never treat the consultation form as paperwork to get through. Guests can tell the difference between someone reading questions off a card and someone genuinely interested in their wellbeing. Sit at the same level as the guest, make eye contact, and listen more than you speak.` },
      { title: 'The consultation form, properly used', content: `The written form protects the guest, you, and the business. Every field exists for a reason.

Medical history and contraindications come first. Pregnancy, high or low blood pressure, recent surgery, skin conditions, medication, allergies - each can change or rule out a treatment. If anything is flagged, know your protocol: adapt the treatment, or refer to a doctor's note if your insurance requires it. Never guess. "I am sure it will be fine" is not a clinical judgement.

Record what the guest tells you, in their words where possible, and record what you agreed to change as a result. If a guest declines to share medical information, note that too. A complete, signed form is your professional protection; an incomplete one is a liability sitting in a filing cabinet.

Data matters: consultation forms hold sensitive personal data. They are stored securely, never left on the trolley, and never discussed with colleagues by name.` },
      { title: 'Questions that unlock the treatment', content: `Closed questions collect facts. Open questions collect the treatment brief. Use both, in that order.

Start with the essentials: "Any injuries, operations or medical conditions I should know about?" Then open it up: "How is your sleep at the moment?", "Where do you hold your tension?", "What would make this hour perfect for you?" The answers tell you pressure preference, focus areas, whether the guest wants conversation or silence, and what outcome they are quietly hoping for.

Repeat the brief back before you begin: "So today we will focus on your shoulders and neck, medium-to-firm pressure, and you would rather I check in once and then let you drift off. Shall we begin?" That single sentence tells the guest they have been heard - and it is the difference between a treatment and a treatment that gets rebooked.` },
      { title: 'Closing the loop', content: `The consultation does not end when the treatment starts. It ends at the goodbye.

Afterwards, connect the aftercare to what they told you at the start: "Because you mentioned poor sleep, tonight avoid caffeine and drink plenty of water - the lavender in that blend will keep working." Aftercare that references the consultation feels personal; generic aftercare feels like a script.

This is also the natural moment for professional recommendation - the product that extends the treatment, or the follow-up booking that addresses what you found. Done from genuine expertise, this is service, not selling.

Finally, record anything useful for next time on the guest's record: preferences, focus areas, products used. A returning guest greeted with "shall we work on those shoulders again, slightly firmer this time?" has just been shown five-star memory. That is how regulars are made.` },
    ],
    quiz: [
      { q: 'What is the FIRST purpose of a consultation?', options: ['To upsell products', 'Guest safety - identifying contraindications and medical conditions', 'To save time later', 'To fill in required paperwork'] },
      { q: 'A guest mentions they are pregnant. What do you do?', options: ['Carry on - massage is always safe', 'Adapt the treatment according to training and protocol, and never guess', 'Cancel the booking immediately', 'Ask them to sign a waiver and proceed unchanged'] },
      { q: 'Which is an OPEN question?', options: ['"Any allergies?"', '"Is medium pressure okay?"', '"Where do you hold your tension?"', '"Have you been here before?"'] },
      { q: 'Why repeat the treatment brief back to the guest?', options: ['To use up consultation time', 'It shows the guest they have been heard and confirms the plan', 'It is required by law', 'To practise your speaking voice'] },
      { q: 'A guest declines to share medical information. You should...', options: ['Refuse the treatment in all cases', 'Note the refusal on the form and follow your protocol', 'Ignore it and carry on', 'Ask a colleague what they think'] },
      { q: 'How should consultation forms be stored?', options: ['On the trolley for easy access', 'Securely, as they contain sensitive personal data', 'In the staff room', 'Guests keep them'] },
      { q: 'The best aftercare advice is...', options: ['The same script for every guest', 'Linked to what the guest told you in the consultation', 'Optional if you are busy', 'Only about buying products'] },
      { q: 'Recording guest preferences after the treatment matters because...', options: ['Managers check the paperwork', 'It lets the next visit feel personal and builds regulars', 'It is a legal requirement in every case', 'It fills quiet time'] },
    ],
  },
  {
    slug: 'retail-excellence',
    title: 'Retail & Recommendation',
    tagline: 'Sell like a therapist, not a salesperson',
    category: 'Commercial',
    minutes: 30,
    lessons: [
      { title: 'Reframing retail', content: `Most therapists dislike "selling". Good ones realise they are not selling - they are finishing the treatment.

A guest who has just had a bespoke facial and goes home to the wrong cleanser undoes your work within a week. Recommending the right products is aftercare, and withholding a recommendation because you feel awkward is actually poorer service. The industry benchmark for strong spa retail is products recommended after every treatment, with retail revenue at 10 to 20 percent or more of treatment revenue. The best therapists get there without a single pushy moment.

The mindset shift: you are the expert who spent an hour with this guest's skin or body. Nobody in any shop will ever be better placed to advise them. Prescribe, do not pitch.` },
      { title: 'The prescription method', content: `The recommendation starts in the treatment, not at the till.

During the treatment, narrate purposefully at key moments: "I am using the ESPA Optimal Skin cleanser here - notice how it dissolves without stripping." You have now introduced the product while the guest is experiencing it. That is the most honest advertising in the industry.

At the close, prescribe: no more than two or three products, linked directly to what you found. "Your skin is dehydrated rather than dry, so the one thing I would send you home with is this hyaluronic serum. The moisturiser you have is fine." Limiting the prescription - and telling them what NOT to buy - builds enormous trust and, over time, higher spend.

Write it down. A small prescription card with the two products named converts far better than a verbal mention at a busy reception desk.` },
      { title: 'Handling hesitation with grace', content: `"I will think about it" usually means one of three things: price, overwhelm, or no urgency. None of them is a "no", and none of them is an invitation to push.

Price: agree cheerfully and downsize. "The serum is the workhorse - start with just that one." A single-product sale that works turns into a routine sale on the next visit.

Overwhelm: simplify to one step. "Ignore everything else - just swap your cleanser. That alone will calm the redness."

No urgency: connect to their goal and timeline. "You mentioned the wedding in June - starting this now is what gets the result by then."

If it is still a no, close warmly and note the products on their record. The guest who feels zero pressure today is the guest who buys on visit two. The guest who feels cornered never comes back at all - and the lifetime value of a regular is worth fifty times one sale.` },
      { title: 'Retail as a career skill', content: `Retail performance is one of the first numbers a spa manager looks at when hiring or promoting, because it reflects the whole skillset: consultation quality, product knowledge, guest trust and commercial awareness in one figure.

Know your numbers. Retail-to-treatment percentage, average retail transaction, link rate (what share of your treatments end with a purchase). If your spa shares these, track your own; if it does not, count privately. Improving from a 10 percent link rate to 30 percent marks you out immediately.

Know the range. Spend time with testers, read the training materials, use the hero products yourself. Conviction sells; you cannot prescribe what you would not use.

And remember the quiet rule of luxury retail: the guest should leave feeling looked after, never sold to. If a recommendation would not survive being read back to the guest's best friend, do not make it.` },
    ],
    quiz: [
      { q: 'The healthiest way to think about spa retail is...', options: ['A necessary evil', 'Finishing the treatment - recommendation is aftercare', 'A commission opportunity', 'Reception’s job'] },
      { q: 'When does a great product recommendation begin?', options: ['At the till', 'During the treatment, by narrating what you are using and why', 'In the marketing email afterwards', 'Never - guests should ask first'] },
      { q: 'How many products should a prescription usually contain?', options: ['The full range', 'Two or three, linked to what you found', 'Whatever is on promotion', 'One of every category'] },
      { q: 'Telling a guest what NOT to buy...', options: ['Loses revenue and should be avoided', 'Builds trust and raises long-term spend', 'Is against most spa policies', 'Confuses the guest'] },
      { q: 'A guest says "I’ll think about it" and you sense price is the issue. Best response?', options: ['Offer an unauthorised discount', 'Downsize warmly to the single most important product', 'Repeat the benefits more firmly', 'Say nothing and look disappointed'] },
      { q: 'A strong benchmark for spa retail revenue is...', options: ['1-2% of treatment revenue', '10-20% or more of treatment revenue', '50% of treatment revenue', 'Retail does not get benchmarked'] },
      { q: 'What is a "link rate"?', options: ['Products linked on the website', 'The share of your treatments that end with a retail purchase', 'How many brands the spa stocks', 'Your rebooking percentage'] },
      { q: 'Why do managers care about a therapist’s retail numbers?', options: ['They reflect consultation quality, product knowledge and guest trust in one figure', 'Retail pays managers’ bonuses', 'They are easy to measure', 'They show who works the longest hours'] },
    ],
  },
  {
    slug: 'five-star-service',
    title: 'Five-Star Customer Service',
    tagline: 'The details that separate good from unforgettable',
    category: 'Guest Experience',
    minutes: 35,
    lessons: [
      { title: 'What five-star actually means', content: `Five-star service is not politeness. Politeness is the entry ticket. Five-star service is anticipation: solving needs the guest has not voiced yet.

The guest arriving with a suitcase gets it taken care of before they ask. The guest squinting at the menu is offered reading glasses from the drawer you keep them in. The guest who mentioned an anniversary at booking finds a card in the treatment room. None of this is expensive; all of it is deliberate.

Luxury guests rarely complain - they simply do not come back, and they tell their friends why. Research across hospitality consistently shows most dissatisfied luxury guests never voice it in the moment. That is why you cannot wait for feedback; you have to read the room constantly. Assume every detail is being noticed, because by the guests who matter most, it is.` },
      { title: 'The arrival and the goodbye', content: `Guests remember beginnings and endings far more vividly than middles - psychologists call it the peak-end rule. Spend your effort accordingly.

The arrival: use the guest's name within the first exchange, make eye contact, and never let a guest stand unacknowledged - if you are occupied, a nod and "I will be right with you" buys grace. Walk guests to places rather than pointing. Offer water or tea before it is requested.

The goodbye is even more powerful, because it is the memory they leave holding. Never let a guest simply drift out. Stand, use their name, reference their visit specifically ("I hope those shoulders behave themselves this week"), and plant the return: "Next time you might love the hot stones." A warm, personal, unhurried goodbye after a slightly imperfect treatment beats a perfect treatment with a cold exit - that is how memory works.` },
      { title: 'Recovering when things go wrong', content: `Things will go wrong. A double booking, a cold treatment room, a late start. What defines a five-star operation is not the absence of problems but the speed and grace of recovery.

Use the LEARN pattern: Listen fully without interrupting. Empathise honestly ("that is frustrating, and I am sorry"). Apologise without deflection - "I am sorry we kept you waiting" beats "sorry, we are short-staffed today" (the guest does not need your staffing problems). Resolve with something concrete, now: the best available alternative, an extended treatment, a quiet upgrade. Notify - tell your manager and log it, so the next shift protects the guest from a repeat.

The paradox of recovery: a guest whose problem is handled brilliantly often becomes more loyal than one who never had a problem. The complaint is an audition. Pass it.` },
      { title: 'Reading the guest', content: `The same treatment is a different experience for different guests, and the skill is telling which guest is in front of you within the first minute.

The talker wants connection - match their energy in the consultation, then let the treatment quieten naturally. The silent guest wants peace - one check-in on pressure, then presence without chatter. The nervous first-timer needs the process explained before it happens: what to wear, where to lie, what you will do. The regular wants recognition: their name, their preferences already known, nothing re-explained.

Cues are everywhere: short answers mean wind down the talk; a guest checking their watch values pace; a guest who lingers over the tea wants the ritual, not just the treatment. Adjusting to the guest, rather than delivering your standard performance, is the single most reliable marker of a five-star therapist - and it is the thing guests describe when they request you by name.` },
    ],
    quiz: [
      { q: 'The essence of five-star service is...', options: ['Politeness', 'Anticipation - solving unvoiced needs', 'Speed', 'Formality'] },
      { q: 'Why can you not rely on luxury guests to complain?', options: ['They always complain loudly', 'Most simply never return, without saying why', 'Complaints are banned in spas', 'They only complain online'] },
      { q: 'The peak-end rule tells us to invest most in...', options: ['The middle of the treatment', 'The arrival and especially the goodbye', 'The booking email', 'The pricing'] },
      { q: 'A guest arrives while you are on the phone. You should...', options: ['Finish the call without acknowledgement', 'Acknowledge them with eye contact and "I will be right with you"', 'Hang up mid-sentence', 'Point them to the seats'] },
      { q: 'In service recovery, "Apologise without deflection" means...', options: ['Blame staffing levels honestly', 'Say sorry for the guest’s experience without excuses', 'Offer money immediately', 'Apologise only if it was your fault'] },
      { q: 'What is the recovery paradox?', options: ['Recovered guests often become MORE loyal than guests who had no problem', 'Recovery always costs more than it earns', 'Guests forget problems anyway', 'Apologies make things worse'] },
      { q: 'The silent guest generally wants...', options: ['A full conversation', 'One pressure check-in, then peaceful presence', 'Music turned up', 'A shorter treatment'] },
      { q: 'The strongest way to end a visit is...', options: ['A quick "bye" from the desk', 'Standing, using their name, referencing their visit and planting the return', 'Handing over a feedback form', 'A discount voucher'] },
    ],
  },
  {
    slug: 'lqa-forbes-standards',
    title: 'LQA & Forbes Standards',
    tagline: 'How the world’s toughest inspectors score your spa',
    category: 'Standards',
    minutes: 40,
    lessons: [
      { title: 'Who inspects, and why it matters to you', content: `Two names dominate luxury hospitality auditing: LQA (Leading Quality Assurance) and Forbes Travel Guide. Both send anonymous inspectors who book, arrive, experience and score every touchpoint of a spa visit against hundreds of detailed standards. Forbes star ratings and LQA scores decide marketing claims, management bonuses and, bluntly, careers.

The inspector looks exactly like a normal guest, so the only strategy that works is treating every guest as if they might be the inspector. This is not paranoia - it is the point. The standards exist because they describe what a flawless guest experience looks like; the audit just checks you deliver it consistently.

For a therapist, knowing the standards is career gold. A candidate who can say "I have worked to Forbes standards and know what the audit measures" is speaking the language spa directors think in.` },
      { title: 'The measurable moments', content: `Inspectors score concrete, observable details. Learn the classics and you can hear the audit ticking as you work.

Timing: the phone answered within three rings, with a smile you can hear. The guest greeted promptly on arrival. The treatment starting and finishing on time - a 60-minute treatment must deliver 60 minutes, and hands-on time is measured. Late starts and early finishes are among the most commonly failed standards in real audits.

Names: the guest's name used naturally at arrival, during service and at departure - without overuse.

The tour and orientation: facilities explained unprompted, robe and locker offered, water or tea offered proactively.

The consultation: conducted privately, covering health, preferences, pressure and focus areas - and preferences then actually honoured during the treatment. Inspectors deliberately state a preference and check whether it is remembered.` },
      { title: 'In the treatment room', content: `Room standards: immaculate, correct temperature, lighting dimmed to the right level, music at a consistent low volume, linens fresh and crease-free, no product residue on bottles, no clutter, no personal items visible. The couch warm before the guest lies down.

Therapist standards: professional greeting with introduction by name, the treatment explained before it begins, draping modest and secure at all times, pressure checked once early and adjusted without being asked again, transitions between phases smooth and unhurried, no abrupt endings - the guest gently brought back rather than startled by lights.

Closing standards: aftercare advice given and personalised, water offered, the guest escorted rather than pointed, retail available but never pushed (Forbes explicitly checks that recommendation is made professionally and without pressure), and a warm, name-using farewell with an invitation to return.

Each of these is a line item on a real scoresheet. A therapist who nails them all is, quite literally, a walking audit pass.` },
      { title: 'Living the standards without losing the soul', content: `The danger with standards is robotic delivery - name-dropping the guest three times mechanically, or reciting a script while thinking about lunch. Inspectors score warmth and genuineness alongside compliance; Forbes standards explicitly include "graciousness" and staff appearing to genuinely enjoy their work.

The professional trick is internalisation. Practise the standards until they are habits, then let your personality carry them. The three-ring phone answer becomes your rhythm; the name use becomes how you naturally speak; the punctual start becomes your personal pride, not a stopwatch fear.

When something conflicts, guest wellbeing beats the checklist - and the great operators know it. If a distressed guest needs five extra minutes of consultation, take them and adjust elsewhere. Standards describe the average perfect visit; judgement handles the exceptions. Having both is what makes you five-star, and it is what this certificate tells an employer you understand.` },
    ],
    quiz: [
      { q: 'Why treat every guest as a potential inspector?', options: ['Inspectors announce themselves', 'Inspectors are anonymous, and the standards describe what every guest deserves anyway', 'Only VIP guests are scored', 'Inspections are pre-scheduled'] },
      { q: 'A classic phone standard is answering within...', options: ['One ring', 'Three rings', 'Ten rings', 'Whenever convenient'] },
      { q: 'A 60-minute treatment should deliver...', options: ['50 minutes with turnaround time', '60 minutes - hands-on time is measured', '55 minutes if running late', 'However long feels right'] },
      { q: 'Inspectors often state a preference (e.g. lighter pressure) because...', options: ['They are fussy', 'They are checking whether it is remembered and honoured', 'They want a discount', 'It fills the consultation'] },
      { q: 'Which is a treatment-room standard?', options: ['Couch warmed before the guest lies down', 'Personal phone on the trolley', 'Bright overhead lighting', 'Music varying loudly'] },
      { q: 'How should a treatment end?', options: ['Lights on immediately to save time', 'The guest brought back gently, never startled', 'Leaving the room silently', 'An alarm sound'] },
      { q: 'Forbes checks that retail recommendation is...', options: ['Skipped entirely', 'Made professionally and without pressure', 'Pushed at least twice', 'Left to reception'] },
      { q: 'When a standard conflicts with a guest’s genuine wellbeing...', options: ['The checklist always wins', 'Guest wellbeing wins, with judgement and adjustment elsewhere', 'Ask the guest to choose', 'Skip the treatment'] },
    ],
  },
  {
    slug: 'health-safety-hygiene',
    title: 'Health, Safety & Hygiene in the Spa',
    tagline: 'The non-negotiables that protect every guest and your licence',
    category: 'Standards',
    minutes: 40,
    lessons: [
      { title: 'Your legal and professional duty', content: `Health and safety in a UK spa is not optional culture - it is law. Under the Health and Safety at Work Act, employers must provide a safe environment, and every worker has a personal legal duty to take reasonable care of themselves and others, follow training, and report hazards. "I was busy" is not a defence for anyone.

For therapists the stakes are concrete: cross-infection between guests, burns from hot stones or wax, slips on wet tiles, allergic reactions to products, and injuries to yourself from poor working posture. Every one is preventable with the disciplines in this course.

Know where things are before you need them: the first aid kit, the accident book, the fire exits and assembly point, the nearest first aider. If you cannot answer those four in a new workplace within your first hour, ask. Employers rate agency staff on exactly this kind of professionalism.` },
      { title: 'Hygiene and cross-infection control', content: `Hand hygiene is the single most effective infection control measure in existence. Wash thoroughly before and after every guest, after handling used linen, and after touching your face or hair. Effective hand washing takes around 20 seconds with soap and warm water; sanitiser supplements it but does not replace washing when hands are visibly soiled.

Linen: one guest, one set, no exceptions. Used linen goes straight to the laundry bin, never on the floor and never reused "because it looks clean". Couch roll where the venue uses it, changed every guest.

Tools and equipment: anything touching a guest is cleaned and disinfected between uses according to product instructions - bowls, stones, spatulas, tweezers. Single-use items are exactly that. Product hygiene matters too: decant with a clean spatula, never fingers into jars, and never return unused product to the container.

Your own health: do not treat guests with infectious conditions present on your hands, and cover cuts with a waterproof dressing. Protecting guests sometimes means stepping back - that is professionalism, not weakness.` },
      { title: 'Safe working: the room, the products, yourself', content: `The room: cables managed, floors dry, spills dealt with immediately and signed if wet, trolleys stable, hot equipment (stone heaters, wax pots, steamers) on stable surfaces away from guest contact and checked with a thermometer, never by guesswork. Test hot stones on your own inner forearm before they go near a guest.

Products: COSHH applies - know which products are irritants or flammable, store them as directed, keep lids on, and never mix chemicals (especially cleaning products). Patch tests where the brand or treatment requires them, performed at the interval the manufacturer states, are not optional extras; performing a reactive treatment without one can void insurance.

Yourself: massage is physical work. Protect your career with couch height set to your knuckles, weight transfer from your legs and body rather than pushing from thumbs and shoulders, and micro-stretches between guests. Therapist careers are ended by cumulative strain more than by any accident - working safely IS working long-term.` },
      { title: 'When something happens', content: `Accidents and near-misses get reported, every time, however minor. The accident book exists to protect the injured person and to reveal patterns - three near-slips in the same corridor is a flooring problem waiting to become a broken wrist. Serious workplace injuries are legally reportable by the employer under RIDDOR, and your accurate, prompt record is what makes that possible.

A guest feels faint or unwell mid-treatment: stop, ensure their safety and dignity, call for the first aider, and never leave them alone. Do not diagnose and do not dispense medication - even paracetamol. Record what happened and what was done.

Fire: know the alarm sound, the exits from every room you work in, and the assembly point. Your job in an evacuation is calm guest shepherding - guests will be in robes, possibly mid-treatment, and they will follow your tone. You are not just a therapist in that moment; you are the member of staff they trust.` },
    ],
    quiz: [
      { q: 'Under UK health and safety law, the duty of care belongs to...', options: ['The employer only', 'The employer AND every individual worker', 'The general manager only', 'The guest'] },
      { q: 'The single most effective infection-control measure is...', options: ['Air freshener', 'Thorough hand washing before and after every guest', 'Wearing black uniform', 'Opening a window'] },
      { q: 'Linen rules in a spa are...', options: ['Reuse if it looks clean', 'One guest, one set, straight to laundry after', 'Change linens daily', 'Flip the towel over between guests'] },
      { q: 'Hot stones should be tested...', options: ['On the guest’s back gently', 'On your own inner forearm, with the heater checked by thermometer', 'By eye', 'They never need testing'] },
      { q: 'A patch test required by the brand is...', options: ['Optional if the guest is in a hurry', 'Mandatory - skipping it can void insurance', 'Only for new therapists', 'Reception’s decision'] },
      { q: 'Never decant product with...', options: ['A clean spatula', 'Your fingers', 'A pump dispenser', 'A disposable applicator'] },
      { q: 'Why record near-misses that hurt nobody?', options: ['To fill the accident book', 'They reveal patterns before someone is actually hurt', 'For insurance discounts', 'You should not record them'] },
      { q: 'A guest feels faint mid-treatment. You should...', options: ['Offer paracetamol', 'Stop, keep them safe and accompanied, and call the first aider', 'Carry on more gently', 'Leave to fetch water'] },
      { q: 'The best protection for your own career longevity is...', options: ['Stronger thumbs', 'Correct couch height and weight transfer from your body, plus stretching', 'Fewer bookings', 'Wrist supports'] },
    ],
  },
  {
    slug: 'room-standards',
    title: 'Treatment Room Standards',
    tagline: 'Set the stage before the guest ever walks in',
    category: 'Standards',
    minutes: 25,
    lessons: [
      { title: 'The room speaks first', content: `Before you say a word, the room has already told the guest what kind of hour this will be. Luxury guests read rooms instantly: temperature, scent, light, sound, order. A perfect treatment in a sloppy room scores like a sloppy treatment.

The professional discipline is the reset ritual: the room returned to identical, flawless condition between every single guest, however tight the turnaround. Great spas photograph the perfect setup and put it on the back of the door - if yours does not, build the photograph in your head and hit it every time.

Walk in as the guest would: what do you see first, smell first, hear first? The bin should be invisible and empty, the trolley composed like a display, the couch dressed like a made hotel bed with the welcome fold, and nothing - nothing - personal in sight.` },
      { title: 'The sensory checklist', content: `Temperature: comfortable for an undressed, stationary guest, not for a working therapist - warmer than feels natural to you, typically several degrees above normal room comfort. The couch pre-warmed with a blanket or heater in cooler months.

Light: dimmed, indirect, no face-level glare when the guest lies down. Look up from the couch yourself once - a bright spotlight straight into a relaxed guest's eyes is the most common lighting failure and the easiest to fix.

Sound: music low, consistent and appropriate; door management quiet; corridor noise controlled. Silence outside the room is part of the room.

Scent: clean and softly signature, never a cocktail of leftover products, cleaning chemicals or lunch. Air the room on turnaround.

Touch: linens smooth and fresh, robes and towels warm where possible, product bottles clean of residue and drips. Every surface a guest might brush against should feel deliberate.` },
      { title: 'Turnaround under pressure', content: `A tight schedule is exactly when standards earn their keep. Build a fixed turnaround routine and run it in the same order every time - routine is what protects quality when you are rushed.

A proven order: linens stripped and away, surfaces and equipment disinfected, bin cleared, products replenished and faced (labels forward), trolley rebuilt to the standard layout, couch dressed, temperature and lighting reset, one slow scan from the doorway as the final check.

Prepare what the next treatment needs before the guest arrives: products opened and in order of use, towels staged, stones heating with time to test. Mid-treatment scrambling to find a product breaks the guest's trance and your flow.

If turnaround time is genuinely impossible - back-to-back bookings with no gap - flag it to the coordinator rather than silently cutting corners. A professional protects the standard; the schedule is management's job to fix.` },
    ],
    quiz: [
      { q: 'Why do room standards matter so much?', options: ['Managers inspect rooms daily', 'The room sets the guest’s expectations before the treatment begins', 'They are only for audits', 'They speed up turnaround'] },
      { q: 'Room temperature should be set for...', options: ['The working therapist', 'An undressed, stationary guest - warmer than feels natural to you', 'Energy saving', 'Whatever the last guest chose'] },
      { q: 'The most common lighting failure is...', options: ['Too dim', 'A glare source shining into the guest’s eyes when lying down', 'Coloured bulbs', 'Candles'] },
      { q: 'The reset ritual means...', options: ['Deep cleaning weekly', 'Returning the room to identical flawless condition between every guest', 'Resetting the music playlist', 'Restocking retail'] },
      { q: 'Products on the trolley should be...', options: ['Wherever they fit', 'Clean of residue, labels faced forward, arranged in order of use', 'Hidden in drawers', 'As many as possible'] },
      { q: 'The final step of turnaround is...', options: ['Spraying scent', 'A slow scan of the room from the doorway, as the guest would see it', 'Checking your phone', 'Opening the door'] },
      { q: 'If the schedule leaves genuinely no time to reset properly...', options: ['Cut corners quietly', 'Flag it to the coordinator - protecting the standard is professional', 'Skip the disinfecting only', 'Start treatments late without telling anyone'] },
      { q: 'Personal items in the treatment room are...', options: ['Fine if tidy', 'Never visible', 'Allowed on the trolley', 'Only phones are banned'] },
    ],
  },
  {
    slug: 'upgrading-treatments',
    title: 'Upgrading Treatments',
    tagline: 'Grow every booking with integrity',
    category: 'Commercial',
    minutes: 25,
    lessons: [
      { title: 'The economics of the upgrade', content: `A spa's costliest asset is an empty treatment room; its second costliest is a booked hour that could have been worth more. Upgrades - lengthening a treatment, adding an enhancement, moving to a superior product line - are the highest-margin revenue in the building, because the guest, the room and your hands are already there.

For you, upgrades are a professional signature. Average spend per guest is tracked in every serious spa, and therapists who lift it without complaints are the ones trusted with VIPs and promoted first.

The integrity rule that governs everything: an upgrade must make the guest's outcome better, not just the bill bigger. If a stressed guest would genuinely benefit from thirty more minutes, offering it is service. Offering a scalp add-on to someone who is desperate to make a lunch booking is just noise, and it costs trust you will not get back.` },
      { title: 'The three natural moments', content: `At booking or arrival: the schedule moment. "You have the 60-minute booked - the 90 is our most rebooked treatment, and today I could extend you at no rush. Would you like the extra half hour?" Guests say yes most often when the day still feels open.

In consultation: the diagnosis moment. The consultation surfaces the need, and the upgrade answers it. "You mentioned your scalp gets tight from screen work - I can add fifteen minutes of scalp massage that targets exactly that." An upgrade tied to their own words never feels like selling.

At close: the next-visit moment. If today could not fit it, plant it forward. "Next time, try the version with hot stones - with the tension you carry, you would feel the difference." Then note it on their record so whoever books them next can honour it.

One offer per moment, made warmly, accepted or declined without a flicker. Repetition is what turns an offer into pressure.` },
      { title: 'Language that upgrades', content: `The words do the work. Compare "Do you want to add anything?" (a question about spending) with "May I recommend...?" (a professional prescribing). Always the second.

Lead with the outcome, not the mechanism: "so the tension release lasts days rather than hours" beats "it is an extra 25 pounds for 30 minutes". Price comes last, stated plainly and confidently - discomfort with the price on your side creates discomfort on theirs.

Use the language of specificity: "the deeper work your shoulders need" not "our premium option". Specific equals expert; generic equals script.

And accept the no beautifully: "Of course - I will make the sixty minutes count." Then do exactly that. The guest who declines and still gets your absolute best is the guest who upgrades next time, because they have learned the offer was real.` },
    ],
    quiz: [
      { q: 'Why are upgrades such valuable revenue?', options: ['They require no skill', 'The guest, room and therapist are already committed - the margin is exceptional', 'They replace retail', 'They shorten the day'] },
      { q: 'The integrity rule of upgrading is...', options: ['Always offer the most expensive option', 'The upgrade must improve the guest’s outcome, not just the bill', 'Offer until the guest accepts', 'Only upgrade new guests'] },
      { q: 'The best moment to tie an upgrade to the guest’s own words is...', options: ['At the till', 'During the consultation', 'Mid-treatment', 'In a follow-up email'] },
      { q: 'Which phrasing is right?', options: ['"Do you want extras?"', '"May I recommend..." leading with the outcome', '"It’s only £25 more"', '"Most people add this"'] },
      { q: 'How many times should you offer the same upgrade in a visit?', options: ['Until accepted', 'Once per natural moment, then let it rest', 'Three times minimum', 'Never offer upgrades'] },
      { q: 'A guest declines the upgrade. You should...', options: ['Look disappointed', 'Deliver the booked treatment at your absolute best', 'Shorten the treatment', 'Mention it again at the end'] },
      { q: 'Planting a future upgrade works best when...', options: ['You write it on the receipt', 'It is noted on the guest’s record so the next visit honours it', 'You text the guest later', 'You tell reception verbally'] },
      { q: 'Price should be stated...', options: ['First, to filter guests', 'Last, plainly and confidently', 'Never - let reception handle it', 'In a whisper'] },
    ],
  },
  {
    slug: 'personal-presentation',
    title: 'Personal Presentation & Hygiene',
    tagline: 'You are part of the product',
    category: 'Standards',
    minutes: 20,
    lessons: [
      { title: 'Why presentation is professional, not personal', content: `In luxury wellness, the therapist is inside the guest's personal space for a full hour. Your presentation is not about vanity; it is a clinical and commercial standard, exactly like a chef's whites.

The baseline: uniform clean, pressed and correctly worn every shift, with a spare available for spills; name badge on; shoes closed-toe, clean and quiet. Hair clean and secured back off the face so it never touches the guest. Nails short, smooth, unvarnished for hands-on treatments - a scratch from a nail edge undoes an hour of skill. Jewellery minimal: rings and bracelets off for massage, both for hygiene and to avoid catching skin.

Fragrance: none or barely-there. The guest booked the spa's scent, not yours, and strong perfume in an enclosed room can trigger headaches or nausea in a relaxed, face-down guest.` },
      { title: 'The details guests notice at close range', content: `Breath: at conversation distance for an hour, breath is noticed before anything else. No smoking on shift; coffee followed by water and mints; carry mints as seriously as you carry oil.

Hands: your instruments. Warm before contact (cold hands are the most complained-about sensation in massage), soft (moisturise between guests - constant washing wrecks skin), and immaculately clean including under nails.

Skin and general grooming: guests unconsciously read a therapist's own skin as proof of the products' worth - one more reason to actually use the range you retail. Visible piercings and tattoos follow house policy; when working agency shifts, ask the policy on arrival rather than guessing.

Posture and energy: stand tall, move calmly, never yawn in guest areas, never lean on walls at reception. Tiredness is human; visible tiredness in a luxury spa reads as disinterest. The performance standard applies from the car park, because you never know where the guest journey - or the mystery inspector - begins.` },
    ],
    quiz: [
      { q: 'Presentation standards exist because...', options: ['Managers like uniformity', 'The therapist works inside the guest’s personal space - it is a clinical and commercial standard', 'They reduce laundry costs', 'They are tradition'] },
      { q: 'Nails for hands-on treatments should be...', options: ['Long with clear varnish', 'Short, smooth and unvarnished', 'Gel only', 'Any length if clean'] },
      { q: 'Fragrance on shift should be...', options: ['Your signature scent', 'None or barely-there', 'Refreshed hourly', 'Matched to the spa candle'] },
      { q: 'The most complained-about sensation in massage is...', options: ['Too much oil', 'Cold hands', 'Music volume', 'Bright light'] },
      { q: 'Rings and bracelets during massage are...', options: ['Fine if small', 'Removed - hygiene and guest safety', 'Allowed on the right hand', 'House choice always'] },
      { q: 'On an agency shift, tattoo and piercing rules are...', options: ['Whatever you prefer', 'The house policy - ask on arrival rather than guess', 'Always cover everything', 'Never asked about'] },
      { q: 'Why use the products you retail?', options: ['Discounts', 'Guests read your own skin as proof the products work, and conviction sells', 'It is compulsory', 'To finish old stock'] },
      { q: 'The presentation standard applies...', options: ['Only in the treatment room', 'From the car park - the guest journey can begin anywhere', 'Only during audits', 'Only at reception'] },
    ],
  },
  {
    slug: 'perfect-massage',
    title: 'The Perfect Massage',
    tagline: 'Structure, flow and the details that get you requested by name',
    category: 'Treatments',
    minutes: 40,
    lessons: [
      { title: 'The architecture of a great massage', content: `Every memorable massage has the same architecture: a settled beginning, a purposeful middle, and an unhurried ending - inside an unbroken flow.

The beginning settles the nervous system. Confirm pressure preference in the consultation, then open with still, grounding contact through the towels before skin work begins. First touch is a promise: warm hands, unhurried, confident. The first two minutes decide whether the guest surrenders or stays on guard for the hour.

The middle does the work the consultation prescribed. Effleurage to warm and connect, petrissage and deeper techniques where the brief demands, always sequenced so the body feels a logic: an area opened, worked, resolved and closed before you move on. Return to the guest's stated focus area more than once - guests measure whether they were heard by whether the shoulders they mentioned got the time.

The ending is a landing, not a stop. Pressure lightens gradually, strokes lengthen and slow, contact resolves stillness before the final release. Abrupt endings undo twenty minutes of descent in five seconds.` },
      { title: 'Pressure: the make-or-break skill', content: `Surveys of spa complaints put pressure at the top of the list in both directions - too light reads as amateur, too deep as unsafe. The professional answer is calibration, not strength.

Calibrate early: one check-in a few minutes into the body of the massage - "how is this depth for you?" - then adjust visibly, so the guest feels the response. After that, read the body rather than asking again: flinching, breath-holding, muscles bracing against you mean ease off; the body softening and breath deepening mean you have it right. Repeated verbal check-ins break the trance the guest came for.

Depth comes from body weight and leverage, never thumb strength: lower the couch, lean in with straight arms, use forearms and elbows for sustained deep work. This protects your career and delivers pressure that feels solid rather than pointy.

Honour the asymmetries: the side the guest complained about deserves visible extra minutes. Equal time everywhere is fair; targeted time is five-star.` },
      { title: 'Flow, draping and the unbroken spell', content: `What separates a good massage from a spa-quality one is continuity - the sense of one continuous piece of work rather than a series of techniques.

Keep one point of contact with the guest whenever possible, even while moving around the couch or re-oiling (an oiled forearm resting lightly does the job). Learn to dispense oil one-handed. Every break of contact is a small wake-up call to a drifting guest.

Draping is both dignity and craft: only the area being worked is uncovered, towels folded with crisp, deliberate movements, never flapped or dragged across the guest. Secure tucks so nothing slips mid-stroke. Confident draping communicates safety at a level guests feel but cannot name.

Transitions - turning over, moving from back to legs - are choreography. Guide with clear, quiet instructions and support the towels so the guest never feels exposed or uncertain. The spell survives the logistics only if you have rehearsed the logistics.` },
      { title: 'The closing minutes and the aftertaste', content: `The last five minutes fix the memory of the whole hour - the peak-end rule again. Slow everything: long connecting strokes head to foot, gradually lightening pressure, a still hold to finish, then a soft verbal return: "take your time - there is water beside you, and I will meet you outside."

Never rush the guest off the couch. The re-entry ritual - dim light held a moment, water offered, an unhurried tone - is part of the treatment, and it is the state in which the guest forms the sentence they will say at reception and repeat to their friends.

Outside, close the loop with substance: what you found ("a lot of holding in the right shoulder - likely your mouse arm"), one realistic piece of aftercare, and the forward plant ("that depth of tension takes two or three sessions to fully release"). Delivered with warmth, that is not upselling - it is a treatment plan, and it is how a one-off booking becomes a standing appointment with your name on it.` },
    ],
    quiz: [
      { q: 'The first two minutes of a massage decide...', options: ['The retail sale', 'Whether the guest settles and surrenders or stays on guard', 'The tip', 'Nothing measurable'] },
      { q: 'The most complained-about massage issue is...', options: ['Music', 'Pressure - in both directions', 'Room temperature', 'Talking'] },
      { q: 'After the first pressure check-in, you should...', options: ['Ask again every five minutes', 'Read the body - bracing means ease off, softening means right depth', 'Assume it is fine', 'Ask at the end'] },
      { q: 'Sustained deep pressure should come from...', options: ['Thumb strength', 'Body weight and leverage - forearms, elbows, straight arms', 'Faster strokes', 'A higher couch'] },
      { q: 'Breaking physical contact repeatedly during a massage...', options: ['Is unavoidable and harmless', 'Acts as small wake-up calls that break the guest’s trance', 'Improves hygiene', 'Is required for re-oiling'] },
      { q: 'Correct draping means...', options: ['Uncovering only the area being worked, with secure, deliberate movements', 'Removing towels for efficiency', 'Loose towels for easy movement', 'Whatever is fastest'] },
      { q: 'The ending of the massage should be...', options: ['Prompt so you finish on time', 'A gradual landing - slower, lighter, stillness, then a soft verbal return', 'A firm final stroke', 'Lights on and a cheerful goodbye'] },
      { q: 'The strongest close outside the room includes...', options: ['A generic "hope you enjoyed it"', 'What you found, one piece of aftercare, and a forward treatment plan', 'The bill', 'A feedback card'] },
    ],
  },
  {
    slug: 'perfect-facial',
    title: 'The Perfect Facial',
    tagline: 'Skin analysis, protocol and results guests can see',
    category: 'Treatments',
    minutes: 40,
    lessons: [
      { title: 'Analysis before everything', content: `A facial without proper skin analysis is a product demonstration. The analysis is where the expert earns the title.

Cleanse first, then look properly - with a magnifying lamp where available and always with clean, dry hands. Assess skin TYPE (the skin you were born with: dry, oily, combination, normal) separately from skin CONDITION (the state it is in now: dehydrated, sensitised, congested, dull). The most common professional error is confusing the two: oily skin can be badly dehydrated, and treating it with stripping products makes it oilier.

Narrate your findings as you go - "you have combination skin, but the real story today is dehydration through the cheeks" - because the analysis, spoken aloud, is what convinces the guest they are in expert hands, and it is the foundation for every product choice and every recommendation that follows.

Check contraindications specific to faces: active cold sores, recent aesthetic treatments or injectables, retinoid use, medication affecting skin sensitivity. When in doubt, gentler wins.` },
      { title: 'Protocol with intention', content: `Whatever the brand, the classic architecture holds: cleanse (twice - the first removes the day, the second treats the skin), exfoliate appropriately to the skin's tolerance, steam or warm where the protocol calls for it, extractions only where trained and appropriate, massage, mask, and finish with targeted serums, moisturiser and SPF awareness.

Two disciplines elevate the protocol. First, adapt every step to your analysis - pressure lighter on sensitised skin, exfoliation dialled down for compromised barriers, the mask chosen for the condition you actually found rather than the one on the menu. Second, protect the experience: the facial massage is most guests' favourite phase, so never trim it for time; product removal should be as luxurious as application - warm mitts or sponges, no drips into ears or hairline, no cold splashes.

Keep the guest informed at transitions without breaking calm: "a gentle warmth now as the mask works". Surprise is the enemy of relaxation on a face.` },
      { title: 'Results, home care and the return visit', content: `A facial ends with evidence. Before the guest dresses, show them their skin: the mirror moment, lit kindly, with your commentary - "see the brightness through the cheeks where we rehydrated". Guests buy outcomes they can see, and rebook the therapist who showed them.

Home care is the treatment's other half, and it follows directly from your analysis: prescribe the two or three products that address the condition you found, explain the order of use in ten seconds (cleanse, treat, protect), and be honest about timelines - skin cycles take weeks, and honesty about that builds more trust than promised miracles.

Plant the course, not just the visit: professional skin results come from a series - typically a facial every four to six weeks, matching the skin's renewal cycle, with home care in between. Explain it as the professional truth it is. A guest who understands the cycle books the series; a guest who was sold a one-off buys a one-off.

Record everything: analysis, products used, skin's response, recommendations. The next facial should begin where this one ended.` },
    ],
    quiz: [
      { q: 'Skin TYPE versus skin CONDITION means...', options: ['They are the same thing', 'Type is inherent (e.g. oily); condition is the current state (e.g. dehydrated) - and both must be assessed', 'Type changes weekly', 'Condition is permanent'] },
      { q: 'Oily skin that is dehydrated should be...', options: ['Stripped with strong products', 'Rehydrated - stripping makes oiliness worse', 'Exfoliated daily', 'Left untreated'] },
      { q: 'Why narrate your skin analysis aloud?', options: ['To fill silence', 'It demonstrates expertise and founds every recommendation that follows', 'Brand rules require it', 'To practise terminology'] },
      { q: 'Why cleanse twice?', options: ['To use more product', 'The first removes the day; the second treats the skin', 'Tradition', 'One cleanse is fine'] },
      { q: 'Which is a facial-specific contraindication check?', options: ['Recent injectables or active cold sores', 'Shoe size', 'Blood type', 'Hair colour'] },
      { q: 'The phase most guests love most, never to be trimmed for time, is...', options: ['Extractions', 'The facial massage', 'Steam', 'Mask removal'] },
      { q: 'The "mirror moment" exists because...', options: ['Guests check their hair', 'Guests buy and rebook outcomes they can SEE', 'It is an audit standard', 'It speeds up dressing'] },
      { q: 'The professional facial cycle is typically...', options: ['Weekly forever', 'Every four to six weeks, matching skin renewal, with home care between', 'Twice a year', 'Only before events'] },
    ],
  },
  {
    slug: 'brand-knowledge',
    title: 'Product House Knowledge',
    tagline: 'Speak ESPA, Elemis and Dermalogica like a native',
    category: 'Brands',
    minutes: 35,
    lessons: [
      { title: 'Why brands are a language', content: `Luxury spas do not buy products; they buy partnerships with product houses - ESPA, Elemis, Dermalogica, Comfort Zone, Aromatherapy Associates, Natura Bissé, Bamford, VOYA and their peers. The house defines the treatment menu, the training, the retail wall and much of the spa's identity.

For a therapist, brand fluency is employability. A spa running ESPA can slot in an ESPA-trained therapist with almost no ramp-up; hiring managers filter CVs on exactly this. On agency shifts it matters double: you may have one hour to deliver another house's signature treatment convincingly.

Fluency means three things: knowing the house's philosophy (what it believes in), its hero products (the icons guests ask for by name), and its signature language (every house has vocabulary - "Tri-Enzyme", "Pro-Collagen", "skin health" - that tells the guest you belong). This course gives you the map; the houses' own training gives you the depth.` },
      { title: 'The British institutions: ESPA and Elemis', content: `ESPA, born in the UK and rooted in aromatherapy and holistic wellness, is the house of natural actives, essential-oil blends and treatments that treat the whole person - its signature experiences pair skin work with scalp, back and body rituals. ESPA language is calm and holistic: wellbeing, balance, personalised blends. Its hero products include the Optimal Skin range and its iconic bath and body oils. ESPA spas expect intuitive, ritual-led therapists.

Elemis, also British, is the house of results-driven naturals - clinically framed skincare with marine and plant actives. Its Pro-Collagen family (notably the Marine Cream) is one of the best-selling premium skincare lines in the UK, and its facial menu historically pairs touch with technology (the BIOTEC concept). Elemis language is confident and outcome-led: clinically proven, visible results. Elemis spas love a therapist who can talk results without losing warmth.

Knowing the difference in tone matters as much as the products: an ESPA guest expects a ritual; an Elemis guest expects a result. Deliver each in its own accent.` },
      { title: 'The skin-health scientists and the sensorial houses', content: `Dermatologically led houses: Dermalogica, founded by a skin therapist, is the house of "skin health, not beauty" - famous for Face Mapping zone-by-zone analysis, no-frills clinical positioning, and education (its training arm is the industry's most recognised). A Dermalogica spa expects diagnostic confidence: analyse, prescribe, educate.

Comfort Zone (Italian, science-meets-sustainability), Natura Bissé (Spanish, diamond-tier luxury facials beloved of five-star city spas) and QMS or Biologique Recherche in the medical-adjacent tier each carry their own protocols - if your venue stocks them, do the house training before improvising.

Sensorial and natural houses: Aromatherapy Associates (British, the aromatherapy authority - its bath oils are legend), Bamford (organic, English-countryside serenity), VOYA (Irish, hand-harvested seaweed), Sodashi and ila (high-vibration natural luxury) win on scent, story and touch. In these houses, the ritual and the narrative ARE the product: learn each one's origin story, because guests are buying it as much as the jar.

The universal rule across all houses: never blag a brand. "I trained with Elemis and ESPA; I would love to learn your house" earns respect. Improvising another house's signature ritual and getting it wrong, in front of a guest who knows it by heart, is how agency therapists do not get rebooked.` },
    ],
    quiz: [
      { q: 'Why do hiring managers filter on brand experience?', options: ['Snobbery', 'A house-trained therapist slots into the menu with almost no ramp-up', 'It reduces wages', 'Brands require it'] },
      { q: 'Brand fluency means knowing...', options: ['Prices only', 'Philosophy, hero products and the house’s signature language', 'The founder’s biography', 'Every ingredient list'] },
      { q: 'ESPA is best characterised as...', options: ['Clinical technology', 'Aromatherapy-rooted holistic wellness with ritual-led treatments', 'Budget skincare', 'Medical aesthetics'] },
      { q: 'Elemis’s most famous product family is...', options: ['Tri-Enzyme... of another house', 'Pro-Collagen, notably the Marine Cream', 'Diamond Lift', 'Seaweed Bath'] },
      { q: 'Face Mapping zone analysis belongs to...', options: ['Dermalogica', 'Bamford', 'VOYA', 'ESPA'] },
      { q: 'An ESPA guest expects a ritual; an Elemis guest expects...', options: ['A discount', 'A visible result, talked about confidently', 'A longer treatment', 'Silence'] },
      { q: 'VOYA’s signature story is...', options: ['Alpine herbs', 'Hand-harvested Irish seaweed', 'Diamond dust', 'Marine collagen'] },
      { q: 'You are offered an agency shift at a house you have never trained with. The professional move is...', options: ['Improvise their signature ritual', 'Be honest about your training and learn their house rather than blag it', 'Decline all such shifts forever', 'Perform your usual routine and rename it'] },
    ],
  },
  {
    slug: 'spa-revenue-fundamentals',
    title: 'Spa Revenue Fundamentals',
    tagline: 'Capacity, utilisation, rate and RevPATH - read your spa the way a director does',
    category: 'Commercial',
    minutes: 75,
    lessons: [
      { title: 'Understanding Spa Capacity', content: 'Two ceilings - room-hours and honest sellable therapist-hours - and why the lower one caps revenue at every moment.' },
      { title: 'Utilisation', content: 'Booked hours over sellable hours, read by daypart: the earning rate of the capacity you pay for, and the ten-second revenue diagnosis.' },
      { title: 'Average Treatment Rate', content: 'Value per treatment versus value per hour, and the three forces that move the rate: mix, discounting and duration.' },
      { title: 'RevPATH', content: 'Revenue per available treatment hour - the one number that combines everything and cannot be flattered - and how to decompose it.' },
      { title: 'Pricing and Demand', content: 'The diary as a pricing report: protect the peak, fence every offer, and fill the trough with products rather than discounts.' },
      { title: 'Commercial Case Study', content: 'The full diagnosis run on a realistic 12-room spa - quantified, prioritised, and written up the way an owner approves.' },
    ],
    quiz: [
      { q: 'A spa has 8 rooms open 12 hours a day and rosters 7 therapists on 8-hour shifts (5.75 sellable hours each). Today\'s sellable capacity is:', options: ['96 hours', '56 hours', '40.25 hours', '84 hours'] },
      { q: 'Booked treatment hours 31; sellable hours 40.25. Utilisation is closest to:', options: ['67%', '82%', '77%', '91%'] },
      { q: 'A daypart runs at 96% utilisation for six straight weeks with logged refusals. The evidence-led response is:', options: ['A loyalty discount at that time', 'Extend opening hours immediately', 'A measured price rise or premium tier at that daypart', 'Nothing - full is the target'] },
      { q: 'Revenue £26,400; 288 treatments; 262 booked hours; 340 sellable hours. Rate per treatment HOUR is closest to:', options: ['£91.67', '£100.76', '£77.65', '£110.20'] },
      { q: 'Using the same figures, RevPATH is closest to:', options: ['£100.76', '£91.67', '£77.65', '£84.20'] },
      { q: 'RevPATH fell 6% while utilisation held. Which family of causes CANNOT be responsible?', options: ['A mix shift toward cheaper treatments', 'Discount leakage into full-price demand', 'Treatments habitually over-running at the same price', 'Fewer bookings arriving'] },
      { q: 'A blanket 20% discount applied to all bookings must lift volume by at least roughly what to break even?', options: ['20%', 'A quarter', 'A third', 'Half'] },
      { q: 'The primary purpose of a fence on an offer is to:', options: ['Meet advertising regulations', 'Keep the lower price away from demand that would have paid full rate', 'Simplify reception\'s scripts', 'Cap total redemptions'] },
      { q: 'Moving one rostered therapist-hour weekly from a £30-RevPATH daypart to a therapist-constrained £105-RevPATH daypart is worth roughly:', options: ['Nothing - revenue just relocates', '£75 a week', '£135 a week', '£30 a week'] },
      { q: 'A 14-month unfenced midweek discount has pulled achieved rate £30 below menu. The professional repair is:', options: ['Cancel it overnight and hold firm', 'Deepen it to drive more volume', 'Replace it with fenced, value-led products and rebuild the rate over a quarter', 'Extend it to weekends for fairness'] },
    ],
  },
]

// The original core curriculum - the £79 bundle covers exactly these.
export const CORE_SLUGS = ACADEMY.map(c => c.slug)

// Additional courses (brand masterclasses, specialist care) register here.
ACADEMY.push(...MORE_COURSES)

export const coursePrice = (c: { price?: number }) => c.price ?? COURSE_PRICE
export const publicCoursePrice = (c: { price?: number }) => (c.price ?? COURSE_PRICE) + 500

export const courseBySlug = (slug: string) => ACADEMY.find(c => c.slug === slug)
export const courseTitle = (slug: string) => courseBySlug(slug)?.title || slug
