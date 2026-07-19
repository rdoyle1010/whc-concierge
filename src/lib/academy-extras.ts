// WHC Academy lesson enrichment - imagery, the guest's viewpoint, the
// career benefit and quick tips for every lesson. Kept separate from
// academy.ts so course text, quizzes and answer keys stay untouched.
// Lessons are matched by index; images are the same licence-free Unsplash
// sources used on the homepage.

export type LessonExtras = { guestView: string; helpsYou: string; tips: string[] }
export type CourseExtras = { image: string; lessons: LessonExtras[] }

const img = (id: string) => `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=crop`

export const ACADEMY_EXTRAS: Record<string, CourseExtras> = {
  'consultation-excellence': {
    image: img('photo-1544161515-4ab6ce6db874'),
    lessons: [
      { guestView: `"She actually sat down and asked about me. I'd booked a massage; what I got was someone who understood why I needed one."`,
        helpsYou: `Therapists who consult properly get requested by name - and requested therapists fill their columns first, negotiate better rates, and survive quiet seasons.`,
        tips: ['Sit at the guest’s level, never stand over them', 'Listen twice as much as you speak', 'Never start the clock feeling rushed - a calm consultation saves time later'] },
      { guestView: `"They asked about my blood pressure medication and adjusted the treatment. I felt safe - that's when I actually relaxed."`,
        helpsYou: `A complete, signed form is your professional protection. If anything is ever questioned, your paperwork is the difference between a closed matter and a career problem.`,
        tips: ['Never guess on a contraindication - adapt or refer', 'Record what the guest said in their words', 'Forms locked away, never on the trolley'] },
      { guestView: `"She repeated back exactly what I wanted - shoulders, firm, no chat. And that is precisely what I got."`,
        helpsYou: `The repeated-back brief is the cheapest guarantee of a five-star review in the industry: guests score whether they were HEARD as much as the treatment itself.`,
        tips: ['Closed questions for facts, open questions for the brief', 'Always ask where they hold tension', 'Repeat the plan back in one sentence before starting'] },
      { guestView: `"A week later I came back. She remembered my shoulders, my pressure, even the oil I liked. I've never gone anywhere else since."`,
        helpsYou: `Recorded preferences turn one-off guests into regulars, and regulars are the backbone of a therapist's income and reputation.`,
        tips: ['Link aftercare to what they told you at the start', 'Recommend from findings, never from a script', 'Write preferences on the record before your next guest'] },
    ],
  },
  'retail-excellence': {
    image: img('photo-1556228720-195a672e8a03'),
    lessons: [
      { guestView: `"I hate being sold to. But she wasn't selling - she was telling me how to keep the results at home. That's different."`,
        helpsYou: `Retail percentage is the first number many spa managers check when promoting or hiring. Strong retail without complaints marks you as senior-material.`,
        tips: ['Reframe: recommending is finishing the treatment', 'Withholding advice is poorer service, not politeness', 'Aim for a recommendation after every treatment'] },
      { guestView: `"She used the serum on me and I could feel the difference before she ever mentioned buying it. The product sold itself."`,
        helpsYou: `Prescribing two products from genuine findings outsells pushing ten - and builds the trust that compounds into bigger baskets later.`,
        tips: ['Narrate hero products during the treatment', 'Prescribe two or three, never the whole shelf', 'Write the prescription down - cards convert, memory doesn’t'] },
      { guestView: `"I said I'd think about it and she just smiled and said the serum alone would do most of the work. So I bought the serum. Next month I bought the rest."`,
        helpsYou: `Handling hesitation gracefully is what separates therapists hotels trust with VIPs - pressure complaints end careers, warm downsells build them.`,
        tips: ['Price worry? Downsize to the one workhorse product', 'Overwhelm? One step only', 'A relaxed no today is a yes on visit two'] },
      { guestView: `"You can tell she uses it all herself. When someone that good says this cleanser, you buy the cleanser."`,
        helpsYou: `Knowing your link rate and average retail transaction lets you prove your value in any interview or review - numbers beat adjectives.`,
        tips: ['Track your own link rate even if the spa doesn’t', 'Use the heroes yourself - conviction sells', 'Never recommend what you wouldn’t tell a friend to buy'] },
    ],
  },
  'five-star-service': {
    image: img('photo-1551816646-d64cca8d3ba0'),
    lessons: [
      { guestView: `"Nobody asked if I wanted water. It just appeared, cold, exactly when I wanted it. That's when I knew this place was different."`,
        helpsYou: `Anticipation is the single most-cited quality in guest praise at five-star level - and praised staff get the VIP bookings and the best shifts.`,
        tips: ['Solve needs before they’re voiced', 'Assume every detail is noticed - it is', 'Silent dissatisfaction is real: read the room, don’t wait for complaints'] },
      { guestView: `"I honestly can't remember the middle of the treatment. I remember being met by name, and I remember the goodbye. I booked again at the desk."`,
        helpsYou: `Guests remember beginnings and endings - polish those two minutes and your reviews improve out of proportion to the effort.`,
        tips: ['Name within the first exchange', 'Walk guests, never point', 'End with their name, a specific reference, and plant the return visit'] },
      { guestView: `"The room mix-up was annoying - but the way they fixed it, instantly and without excuses, actually impressed me more than if nothing had gone wrong."`,
        helpsYou: `Recovery skill is what management watches under pressure. Handle a complaint well and you become the person trusted when it matters.`,
        tips: ['LEARN: Listen, Empathise, Apologise, Resolve, Notify', 'Never blame staffing to a guest', 'Fix something concrete NOW, then log it'] },
      { guestView: `"I didn't want conversation that day. She read it instantly - one pressure check, then peace. Best treatment I've ever had."`,
        helpsYou: `Reading the guest is why two therapists with identical training get completely different rebooking rates. It is the skill guests describe when they request you.`,
        tips: ['Short answers = wind down the chat', 'Nervous first-timer? Explain before, not during', 'Regulars want recognition, not re-explanation'] },
    ],
  },
  'lqa-forbes-standards': {
    image: img('photo-1590490360836-2e3b067c082b'),
    lessons: [
      { guestView: `"I was the inspector. The therapist never knew. She treated me like the most important guest of her week - which is exactly why the spa kept its stars."`,
        helpsYou: `"I know what LQA and Forbes audit and I work to it" is one of the most powerful sentences you can say in a five-star interview.`,
        tips: ['Inspectors look like ordinary guests - all guests get the standard', 'Standards describe a flawless visit, not bureaucracy', 'Learn them once, benefit every shift of your career'] },
      { guestView: `"They answered before the third ring, greeted me by name, and my 60 minutes was 60 minutes. You feel the difference even if you can't name it."`,
        helpsYou: `Timing standards are the most commonly failed audit items - being reliably punctual instantly puts you ahead of most of the industry.`,
        tips: ['Phone within three rings, smile audible', 'A 60-minute treatment delivers 60 hands-on minutes', 'State a preference back to the guest - inspectors plant them deliberately'] },
      { guestView: `"The couch was warm. The lights were low. Nothing in that room said 'staff work here' - it all said 'this hour is yours'."`,
        helpsYou: `Every room and treatment standard is a line on a real scoresheet - nail them all and you are, quite literally, a walking audit pass.`,
        tips: ['Warm the couch before every guest', 'Check pressure once early, then honour it unprompted', 'End gently - never startle a relaxed guest with lights'] },
      { guestView: `"What struck me was that it never felt like a checklist. It felt like people who loved their work. That's what I scored highest."`,
        helpsYou: `Forbes scores graciousness alongside compliance - internalising the standards until they're habits is what lets your personality shine through them.`,
        tips: ['Practise standards into habits, then relax into them', 'Guest wellbeing beats the checklist when they conflict', 'Warmth is a standard too - it is scored'] },
    ],
  },
  'health-safety-hygiene': {
    image: img('photo-1540555700478-4be289fbecef'),
    lessons: [
      { guestView: `"I watched her wash her hands before she touched me, saw the fresh linen go on. I stopped worrying and started relaxing."`,
        helpsYou: `Safety competence is a legal duty on YOU personally - and the professionalism agencies and hotels quietly grade you on from hour one.`,
        tips: ['First hour anywhere new: find first aid kit, accident book, fire exits, first aider', 'Report hazards - "busy" is not a defence', 'Your safety habits are being noticed'] },
      { guestView: `"You can just tell a clean spa. Nothing needs saying - the fresh couch roll, the sealed spatulas, the spotless bottles say it all."`,
        helpsYou: `A single cross-infection incident can end a spa's reputation and a therapist's career - the disciplines in this lesson are what insurance and employers rely on.`,
        tips: ['20 seconds of hand washing before and after every guest', 'One guest, one linen set, no exceptions', 'Spatulas always - never fingers in jars'] },
      { guestView: `"She tested the stones on her own arm before they came near me. I'd never seen that before. Total confidence from that second."`,
        helpsYou: `Working with correct couch height and body mechanics is the difference between a 5-year career and a 25-year one.`,
        tips: ['Hot stones: thermometer plus your own forearm first', 'Never mix cleaning chemicals - COSHH is law', 'Couch at knuckle height, weight from your legs'] },
      { guestView: `"When I felt faint she stopped everything, stayed with me, and someone qualified appeared within a minute. Frightening moment, perfect handling."`,
        helpsYou: `Calm incident handling gets remembered by managers for years - the accident book protects the guest, the business and you.`,
        tips: ['Record every incident AND near-miss', 'Never diagnose, never dispense - not even paracetamol', 'Know the assembly point in every building you work in'] },
    ],
  },
  'room-standards': {
    image: img('photo-1600334129128-685c5582fd35'),
    lessons: [
      { guestView: `"I opened the door and exhaled. The temperature, the scent, the light - my treatment had already started and no one had touched me yet."`,
        helpsYou: `Consistent flawless rooms are how coordinators decide who gets the VIP suite bookings - the reset ritual is your signature even when you’re unseen.`,
        tips: ['Reset to identical perfection between every guest', 'Walk in as the guest would - see, smell, hear', 'Nothing personal ever in sight'] },
      { guestView: `"Lying down, I opened my eyes once - soft light, no glare, music I only noticed when it stopped. Someone had thought about lying exactly where I was lying."`,
        helpsYou: `The sensory checklist is fast to learn and instantly visible to inspectors, managers and guests alike - cheap effort, premium impression.`,
        tips: ['Set temperature for an undressed, still guest', 'Lie on the couch once - check for glare yourself', 'Labels faced forward, bottles residue-free'] },
      { guestView: `"Back-to-back Saturday, fully booked - and my 3pm room looked exactly like my friend's 9am photos. That consistency is why we keep coming."`,
        helpsYou: `A fixed turnaround routine is what protects your standard when the schedule is brutal - and flagging impossible gaps professionally marks you as a standard-keeper, not a corner-cutter.`,
        tips: ['Same reset order every time - routine survives pressure', 'Stage the next treatment’s products in order of use', 'Final check: one slow scan from the doorway'] },
    ],
  },
  'upgrading-treatments': {
    image: img('photo-1583416750470-965b2707b355'),
    lessons: [
      { guestView: `"She suggested the ninety minutes because of what I'd told her about my back - not because it cost more. It was the best money I spent that month."`,
        helpsYou: `Average spend per guest is tracked in every serious spa - lifting it without complaints is the fastest visible path to promotion.`,
        tips: ['Upgrade must improve the OUTCOME, not just the bill', 'The guest, room and your hands are already there - pure margin', 'Wrong-time offers cost trust you won’t get back'] },
      { guestView: `"At booking they mentioned the hot stones. In the consultation she connected them to my tension. By then saying yes felt like my own idea."`,
        helpsYou: `Upgrades tied to the guest's own words in consultation convert at multiples of till-point offers - and never feel like selling.`,
        tips: ['Three moments: booking, consultation, close', 'Consultation upgrades answer the guest’s own words', 'One offer per moment - repetition is pressure'] },
      { guestView: `"She said no problem, and gave me the best sixty minutes I've had anywhere. Next visit I booked the ninety without being asked."`,
        helpsYou: `"May I recommend" language and a beautifully-accepted no are what let you upsell for years without a single complaint on your record.`,
        tips: ['"May I recommend..." - never "do you want extras?"', 'Lead with the outcome, price last and confident', 'Decline? Deliver your absolute best anyway'] },
    ],
  },
  'personal-presentation': {
    image: img('photo-1519823551278-64ac92734fb1'),
    lessons: [
      { guestView: `"An hour with someone in my personal space - and everything about her said clinical, calm, cared-for. I trusted her hands before they touched me."`,
        helpsYou: `Presentation is judged in the first five seconds of every shift, interview and agency booking - it is the cheapest career upgrade that exists.`,
        tips: ['Nails short, smooth, unvarnished for hands-on work', 'Rings and bracelets off for massage', 'Fragrance: none or barely-there'] },
      { guestView: `"Warm hands. Fresh breath. Her own skin glowed with the products she recommended. Every close-range detail said 'professional'."`,
        helpsYou: `Guests read your own grooming as proof of the products' worth - your presentation quietly does your retail selling for you.`,
        tips: ['Warm your hands before first contact - always', 'Carry mints as seriously as you carry oil', 'On agency shifts, ask the house grooming policy on arrival'] },
    ],
  },
  'perfect-massage': {
    image: img('photo-1544161515-4ab6ce6db874'),
    lessons: [
      { guestView: `"The first touch told me everything - warm, certain, unhurried. I remember thinking: oh, she's good. Then I stopped thinking at all."`,
        helpsYou: `The settled beginning and returned-to focus areas are precisely what guests describe when they request a therapist by name - and named requests are career currency.`,
        tips: ['First two minutes decide the whole hour', 'Open with still contact through the towels', 'Return to their stated focus area more than once'] },
      { guestView: `"One check on pressure, one tiny adjustment, and then she just knew. I didn't have to manage her. That's the luxury."`,
        helpsYou: `Pressure complaints are the number one massage complaint in both directions - calibration skill directly protects your reviews and your shoulders.`,
        tips: ['One early check-in, then read the body', 'Bracing means ease off; softening means right', 'Depth from body weight and forearms, never thumbs'] },
      { guestView: `"She never seemed to leave me - even changing sides, one hand stayed. The towels moved like choreography. I felt completely safe the entire hour."`,
        helpsYou: `Unbroken contact and confident draping are the two most recognisable marks of spa-grade training - agencies hear about both.`,
        tips: ['Keep one point of contact, even while re-oiling', 'Uncover only the area being worked', 'Rehearse turnover transitions until silent'] },
      { guestView: `"She brought me back so gently I didn't know the hour had ended. Outside, she told me what she'd found and what to do about it. I booked three more sessions."`,
        helpsYou: `The closing minutes fix the memory of the whole hour - and the findings-plus-plan close is how single bookings become standing appointments.`,
        tips: ['Slow everything for the last five minutes', 'Never rush a guest off the couch', 'Close with findings, one aftercare point, and the forward plan'] },
    ],
  },
  'perfect-facial': {
    image: img('photo-1570172619644-dfd03ed5d881'),
    lessons: [
      { guestView: `"She looked at my skin under the lamp and told me things about it no one ever had. I'd have bought anything she recommended after that."`,
        helpsYou: `Spoken analysis is what separates a £100 facial from a product demonstration - and it is the foundation of every recommendation you’ll make.`,
        tips: ['Assess TYPE and CONDITION separately', 'Oily but dehydrated? Rehydrate - never strip', 'Narrate your findings aloud'] },
      { guestView: `"The face massage was so good I nearly cried when it ended. And the mask came off with warm mitts, not cold splashes. Pure luxury, start to finish."`,
        helpsYou: `Protecting the experience - especially the massage phase and luxurious removal - is what earns facials their premium price and you your rebooks.`,
        tips: ['Cleanse twice: remove the day, then treat the skin', 'Never trim the massage phase for time', 'Warn gently at transitions - surprise kills relaxation'] },
      { guestView: `"She showed me my own cheeks in the mirror and I could SEE it. Then she wrote down two products and told me not to buy a third. Sold - and back every five weeks since."`,
        helpsYou: `The mirror moment plus an honest course-of-treatments close is the engine of facial rebooking - guests buy outcomes they can see and plans they believe.`,
        tips: ['Always end with the mirror moment', 'Prescribe two or three products, in ten seconds', 'Explain the 4-6 week skin cycle honestly'] },
    ],
  },
  'brand-knowledge': {
    image: img('photo-1590490360836-2e3b067c082b'),
    lessons: [
      { guestView: `"I asked about the Pro-Collagen and she knew it - the story, the marine actives, why it suits me. You can't fake that, and guests can tell."`,
        helpsYou: `Hiring managers filter CVs on brand experience because a house-trained therapist slots straight into the menu - fluency is employability.`,
        tips: ['Learn each house’s philosophy, heroes and language', 'Agency shifts double the stakes - one hour to belong', 'The houses’ own training gives depth; this map gives you the start'] },
      { guestView: `"At the ESPA spa it was a ritual - oils, scalp, the lot. At the Elemis spa she talked results and my skin showed them. Both brilliant - completely different."`,
        helpsYou: `Delivering each house in its own accent - ritual for ESPA, results for Elemis - is what makes hotels rebook an agency therapist on sight.`,
        tips: ['ESPA: holistic, aromatherapy-rooted, ritual-led', 'Elemis: results language, Pro-Collagen heroes', 'Match your tone to the house, not just the protocol'] },
      { guestView: `"The therapist admitted she hadn't trained with our house yet, and asked smart questions before my treatment. I respected that far more than bluffing."`,
        helpsYou: `Honesty about training - and quick fluency in each house's story - is the difference between agency therapists who get rebooked and those who don't.`,
        tips: ['Dermalogica: skin health, Face Mapping, education-first', 'Sensorial houses sell the story - learn each origin tale', 'Never blag a brand: honesty earns respect, improvising loses it'] },
    ],
  },
}

export const courseImage = (slug: string) =>
  ACADEMY_EXTRAS[slug]?.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&auto=format&fit=crop'

export const lessonExtras = (slug: string, index: number): LessonExtras | null =>
  ACADEMY_EXTRAS[slug]?.lessons[index] || null
