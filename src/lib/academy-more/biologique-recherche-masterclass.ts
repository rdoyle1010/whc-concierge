// Talent House Academy brand masterclass: Biologique Recherche. Independent Talent House
// training - not affiliated with or endorsed by Biologique Recherche.
// Answer key lives in academy-more-answers/biologique-recherche-masterclass.ts
// (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'biologique-recherche-masterclass',
  title: 'Biologique Recherche Masterclass',
  tagline: `The Parisian clinical house of Skin Instants - its story, its icons, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Biologique Recherche is one of the most revered names in professional skincare, a French family house founded in Paris in the late 1970s by Yvan Allouche, a biologist, and Josette Allouche, a physiotherapist. Their son, Dr Philippe Allouche, a physician, later joined the company and has long led its creative and scientific direction. The house remains family-run, and that continuity shapes everything about it.

From the start the brand set itself against the perfumed, marketing-led mainstream. Its formulations are famously clinical: highly concentrated in active ingredients, free of added fragrance, and processed cold wherever possible to preserve the integrity of those actives. Even the austere bottles signal the philosophy - this is skincare that behaves like a clinical protocol, not a cosmetic indulgence.

The intellectual heart of the house is the concept of the Skin Instant: the idea that skin is a living, changing organ whose condition varies with stress, climate, hormones and lifestyle, so a professional should assess and treat the skin as it is today rather than filing it under a fixed skin type. The flagship of the brand is its Ambassade de la Beaute in Paris, on the Champs-Elysees, and distribution is deliberately selective, favouring elite spas, medi-spas and five-star hotels.

The USP in one breath: personalised clinical skincare, built on Skin Instant assessment and a rigorous methodology, with raw, concentrated, fragrance-free formulations trusted by the world's most demanding facialists.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `No product in professional skincare has a cult following quite like Lotion P50. First created in 1970 and refined since, it is an exfoliating, balancing lotion often described as a facial in a bottle: applied after cleansing, it gently exfoliates, helps rebalance the skin's pH and prepares the skin to receive everything that follows. The name is widely explained by the brand as a reference to the roughly fifty-day epidermal renewal period the lotion works across. P50 comes in a family of versions formulated for different Skin Instants, which is why the consultation, not habit, decides which one a guest receives.

Beyond P50, learn the heroes guests ask for: the Masque VIP O2, the house's celebrated oxygenating mask, and the concentrated targeted serums that let a facial be built precisely for the Skin Instant in front of you.

The ingredient story follows the philosophy: high concentrations of biological, botanical and marine actives, no added fragrance, and cold processing wherever possible so the actives arrive intact. When narrating a product, keep it clinical and simple: what it contains, what it does, and why it was chosen for this guest today.

Where a specific formulation detail is not certain, never invent it. Learn heroes first, one category at a time, from the house's own training materials, and use the honest gap: say what you know, check the rest.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A Biologique Recherche menu rewards method. On day one, learn how the spa performs its Skin Instant assessment, because every treatment begins there, and then map the facials, the body treatments and the enhancements: durations, protocols, products used and who each suits. Ask the senior therapist rather than guessing; this is a house where improvisation is visible immediately.

Treatments follow the brand's three-stage methodology: an initialisation stage of assessment and preparation, built around cleansing and the correct P50; a treatment stage where concentrated products target the Skin Instant; and a finishing stage that seals and protects the work. Delivery is precise, unhurried and hands-led, with famously sculpting manual techniques, and many spas add the house's celebrated tools: the Remodeling Face machine, which uses gentle currents to tone and sculpt, and cryo-sticks, chilled tools used in lifting massage. Use tools only where trained.

Retail here is prescription. The assessment gives you the diagnosis; prescribe two or three products matched to today's Skin Instant, with P50 as the natural gateway product, and record what you prescribed.

Upsell paths are honest and clinical: a course of treatments to change a Skin Instant over time, machine and cryotherapy enhancements for the guest chasing visible lift, and the step from a single facial to a programme. Protect the standard on every shift: correct products, correct quantities, full protocols, stock reported, and never a shortcut under time pressure.`,
    },
  ],
  quiz: [
    {
      q: 'Biologique Recherche was founded...',
      options: [
        'In New York by a dermatologist in the 1990s',
        'In Paris in the late 1970s by Yvan Allouche, a biologist, and Josette Allouche, a physiotherapist',
        'In Milan by a fashion house',
        'In London as a hotel spa brand',
      ],
    },
    {
      q: `The house's concept of the Skin Instant means...`,
      options: [
        'A quick express facial under thirty minutes',
        'A photograph taken before treatment',
        'The four classic skin types: dry, oily, combination and normal',
        `The skin's condition at a given moment, which changes constantly and is assessed and treated instead of a fixed skin type`,
      ],
    },
    {
      q: `The brand's cult hero product, often described as a facial in a bottle, is...`,
      options: [
        'Lotion P50, an exfoliating, balancing lotion applied after cleansing',
        'A retinol night cream',
        'A vitamin C powder',
        'A rose-scented facial mist',
      ],
    },
    {
      q: `Biologique Recherche's formulation approach is best described as...`,
      options: [
        'Lightly fragranced and mass-market',
        'Organic-certified and food-grade only',
        'Highly concentrated actives, no added fragrance, and cold processing wherever possible',
        'Technology-first with minimal actives',
      ],
    },
    {
      q: `The three stages of the house's treatment methodology are...`,
      options: [
        'Consultation, massage, retail',
        'Initialisation (assessment and preparation), treatment, and finishing',
        'Steam, extraction, mask',
        'Cleanse, tone, moisturise',
      ],
    },
    {
      q: 'The Remodeling Face is...',
      options: [
        'A surgical procedure offered in the Paris flagship',
        'A firming night cream',
        'A machine that uses gentle currents to tone and sculpt the face',
        'A jade roller sold at reception',
      ],
    },
    {
      q: 'The strongest way to retail the Biologique Recherche range is...',
      options: [
        'Prescribe two or three products matched to the Skin Instant found in assessment, with P50 as the natural gateway',
        'Recommend the same bestsellers to every guest',
        'Present the full range at the till',
        'Leave recommendations to the website',
      ],
    },
    {
      q: 'On day one in a Biologique Recherche spa, your first professional duty is...',
      options: [
        'Rearrange the retail display',
        'Improvise treatments from your general facial training',
        'Memorise every ingredient list before touching a guest',
        'Learn the Skin Instant assessment, the menu and the protocols, starting with the flagship treatments, and ask rather than guess',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the bottles looked so plain and the therapist smiled and told me the story - a family of scientists in Paris who refused fragrance and marketing and put everything into the formulas. I have never trusted a brand faster."`,
      helpsYou: `Spas that carry Biologique Recherche are among the most selective employers in the industry. Being able to tell the founding story, explain the Skin Instant idea and state the USP in one sentence marks you out immediately in an interview or on a trial shift.`,
      tips: [
        'Learn the one-breath USP: personalised clinical skincare built on Skin Instant assessment, with raw, concentrated, fragrance-free formulas',
        `Remember the family story: a biologist, a physiotherapist and later their physician son`,
        `Match the house voice - clinical, precise and personal, never perfumed or vague`,
      ],
    },
    {
      guestView: `"She explained why my P50 was a different one from my sister's - because our skin is different this month, not just different in general. Then the oxygen mask. I left with both and I understood exactly why."`,
      helpsYou: `P50 fluency is the fastest credibility you can earn in this house. Knowing the P50 family, the Masque VIP O2 and the logic of the targeted serums means you can walk onto a Biologique Recherche shift and sound like you belong within an hour.`,
      tips: [
        'Heroes first: the Lotion P50 family, Masque VIP O2, then the targeted serums',
        'Explain P50 simply: exfoliates, rebalances, prepares the skin for everything that follows',
        'The consultation, not habit, chooses which P50 version a guest receives',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The facial felt like a clinical consultation and a work of art at once - my skin assessed, every product explained, the sculpting massage, the cool metal sticks at the end. My jawline looked different when I sat up."`,
      helpsYou: `Therapists who can deliver the assessment-led methodology, the sculpting hands-on style and an honest clinical prescription are the ones elite spas fight to keep - and this house's spas talk to each other about who is good.`,
      tips: [
        'Day one: learn the Skin Instant assessment and the flagship protocols before anything else',
        'Respect the three stages: initialisation, treatment, finishing - never trim the preparation',
        `Prescribe two or three products matched to today's assessment, with P50 as the gateway`,
        'Use the Remodeling Face and cryo-sticks only where trained, and follow protocols exactly',
      ],
    },
  ],
}
