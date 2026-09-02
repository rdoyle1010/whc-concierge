// WHC Academy brand masterclass: Medik8. Independent WHC training - not
// affiliated with or endorsed by Medik8. Answer key lives in
// academy-more-answers/medik8-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'medik8-masterclass',
  title: 'Medik8 Masterclass',
  tagline: `The British skin science house - CSA philosophy, vitamin A mastery, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Medik8 is one of the most influential British skincare houses of the modern era. It was founded in the UK in 2009 by Elliot Isaacs, a pharmacologist who set out to build a brand on a distinctive promise: professional-grade results from formulations grounded in real skin science, without the confusion that surrounds so much of the industry.

That anti-confusion instinct produced the idea the whole house is built around: the CSA philosophy. CSA stands for vitamin C plus sunscreen by day, and vitamin A by night. It is a complete skin-ageing strategy in a single sentence: antioxidant protection and sun defence through the day, skin renewal through the night. Guests can remember it, therapists can teach it, and every core product in the range has a place inside it.

Around that framework sits the house's defining expertise: vitamin A. Medik8 is best known for its work with retinaldehyde, marketed as retinal, and for making potent actives usable through smart formulation and gradual, tolerable routines.

The USP, in one breath: Medik8 offers clinically minded, results-driven skincare built on the simple CSA philosophy, with world-class vitamin A expertise, formulated to be effective and kind to skin. A guest at a Medik8 spa is buying visible results, delivered through an approach simple enough to live with for life.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `A Medik8 therapist's credibility rests on the heroes, and the heroes map neatly onto CSA.

For the C, the vitamin C serums, including the much-loved C-Tetra family, deliver daily antioxidant defence and radiance; vitamin C by day is one half of the house's core prescription. The S is sunscreen: daily sun protection is non-negotiable in the Medik8 worldview, because no renewal work survives unprotected sun exposure.

The A is where the house is famous. The Crystal Retinal range uses retinaldehyde, a form of vitamin A that sits one conversion step closer to retinoic acid than retinol, which is why it acts faster while remaining a cosmetic ingredient. Crucially, the range comes in ascending strengths, creating what therapists call the vitamin A ladder: guests start low, build tolerance, and step up gradually. The premium r-Retinoate line extends the vitamin A story further.

Around the pillars sit the supporting heroes: Hydr8 B5, the house's celebrated hydration serum pairing hyaluronic acid with vitamin B5, and Press & Glow, its gentle daily PHA exfoliating tonic.

Where a formulation detail is not certain in your mind, never invent it. Learn heroes first, one category at a time, from the brand's own materials, and use the key products yourself until conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Menus vary between Medik8 spas and clinics, so the day-one skill is a reading method. Learn the flagship facials first, then map the tiers: which treatments are relaxation-led, which are results-led, and which involve professional-strength actives such as clinical peels. Peels and advanced treatments require the brand's own professional training; never deliver one you have not been trained and signed off for. For each treatment note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery in a Medik8 room is results-led but warm. Analyse the skin properly, explain what you see and what each step is doing, and connect everything back to CSA. The guest should leave understanding their skin better than when they arrived; education is the house's signature style.

Retail is the CSA routine going home. Prescribe two or three products linked to your analysis: typically a vitamin C for the morning, sunscreen, and the right rung of the vitamin A ladder for the night. Upsell paths are natural: the facial guest ready for more can progress to a results-led or peel-based course; the Crystal Retinal guest tolerating their strength well steps up the ladder at review.

Finally, protect the house: correct products, correct quantities, faithful protocols, patch tests and aftercare where required, stock reported, standards held. On a Medik8 shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Medik8 was founded by...',
      options: [
        'A Swiss cosmetics conglomerate in the 1980s',
        'Pharmacologist Elliot Isaacs in the UK in 2009',
        'A Harley Street dermatology clinic in 2015',
        'A French pharmacy chain',
      ],
    },
    {
      q: `The CSA philosophy stands for...`,
      options: [
        'Cleanse, Steam, Apply',
        'Clinical Skin Analysis',
        'Vitamin C plus Sunscreen by day, and vitamin A by night',
        'Collagen, Serum, Acid',
      ],
    },
    {
      q: 'Retinaldehyde (retinal), used in the Crystal Retinal range, is significant because...',
      options: [
        'It sits one conversion step closer to retinoic acid than retinol, so it acts faster',
        'It is a form of vitamin C',
        'It replaces the need for sunscreen',
        'It is only available on prescription',
      ],
    },
    {
      q: `The vitamin A ladder means...`,
      options: [
        'Applying vitamin A to the face in upward strokes',
        'Using the strongest product from day one for fast results',
        'Alternating vitamin A with vitamin C nightly',
        'Starting on a lower strength and stepping up gradually as the skin builds tolerance',
      ],
    },
    {
      q: 'C-Tetra is best described as...',
      options: [
        'A clinical peel',
        'A vitamin C serum family for daily antioxidant defence and radiance',
        'A cleansing balm',
        'A retinol night cream',
      ],
    },
    {
      q: 'Hydr8 B5 is famous as...',
      options: [
        'A physical exfoliator',
        'A self-tanning serum',
        'A hydration serum pairing hyaluronic acid with vitamin B5',
        'A foot treatment',
      ],
    },
    {
      q: 'The strongest way to retail the Medik8 range is...',
      options: [
        'Prescribe a simple CSA routine of two or three products linked to your skin analysis',
        'Present the full range at the till',
        'Recommend the highest-strength retinal to everyone',
        'Leave retail entirely to reception',
      ],
    },
    {
      q: 'Professional-strength Medik8 treatments such as clinical peels should be delivered...',
      options: [
        'By any qualified therapist who has read the protocol',
        'Only on request from the guest',
        'Whenever the column is quiet',
        `Only by therapists trained and signed off through the brand's own professional training`,
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa chose Medik8 and she gave me one sentence - vitamin C and sunscreen by day, vitamin A by night, from a British house founded by a pharmacologist. For the first time skincare actually made sense to me."`,
      helpsYou: `Interviewers and guests at Medik8 accounts test whether you can state the CSA philosophy and the house story cleanly. One confident sentence marks you as fluent before you have touched a product.`,
      tips: [
        'Learn the one-breath USP: clinically minded, results-driven, built on CSA, world-class vitamin A expertise',
        `Remember the founding story: pharmacologist Elliot Isaacs, UK, 2009`,
        `Match the house voice - clear, scientific, confident, never confusing`,
      ],
    },
    {
      guestView: `"She explained why my new retinal serum starts at a low strength and how I would step up over time. Nobody had ever explained the ladder before - I went home with the serum, the vitamin C and the sunscreen."`,
      helpsYou: `Hero fluency across the CSA pillars - vitamin C, sunscreen, Crystal Retinal, Hydr8 B5, Press & Glow - is the fastest credibility you can build, and it converts directly into honest retail baskets.`,
      tips: [
        'Map every hero onto CSA: C by day, sunscreen always, A by night',
        'Explain retinal simply: one step closer to retinoic acid than retinol, so it acts faster',
        'Teach the ladder: start low, build tolerance, step up gradually',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"The facial felt like a consultation with an expert, not just a pampering hour. She showed me what my skin was doing, wrote me a three-product routine, and booked my review. I finally have a plan."`,
      helpsYou: `Therapists who can read a Medik8 menu on day one, teach as they treat, prescribe CSA routines and build honest course-and-ladder upgrade paths are the ones clinics and spa hotels rebook and promote.`,
      tips: [
        'Day one: learn the flagship facials first, then map results-led tiers and peels',
        'Never deliver a peel you have not been brand-trained and signed off for',
        'Prescribe the CSA trio: a vitamin C, a sunscreen, the right rung of the vitamin A ladder',
        'Plant the review visit - stepping up the ladder is a built-in reason to return',
      ],
    },
  ],
}
