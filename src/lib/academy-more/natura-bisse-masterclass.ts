// WHC Academy brand masterclass: Natura Bisse. Independent WHC training - not
// affiliated with or endorsed by Natura Bisse. Answer key lives in
// academy-more-answers/natura-bisse-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'natura-bisse-masterclass',
  title: 'Natura Bisse Masterclass',
  tagline: `The Spanish house of haute couture facials - its story, its collections, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Natura Bisse is a Spanish luxury skincare house founded in Barcelona in 1979 by Ricardo Fisas. The founding story is one of the best in the industry: Fisas, then in his fifties, had learned through his previous work of laboratory research showing that free amino acids, the building blocks of proteins, had remarkable regenerating effects on the skin. He built his first formulas around that discovery and started the company with his family. Natura Bisse remains a family business today, with the founding family still leading it.

From those beginnings the house grew into one of the most respected names in professional skincare, celebrated above all for its facials. Natura Bisse is the brand five-star city spas reach for when they want a facial menu at the very top of the market, and it has repeatedly been honoured within the spa industry for the quality of its treatments.

The philosophy joins two ideas that many houses treat as opposites: rigorous, science-led formulation and unashamed sensorial luxury. Treatments are meticulous, protocol-driven and results-focused, yet delivered with couture-level attention to the guest.

The USP in one breath: Natura Bisse offers diamond-tier, science-led luxury facials, born from amino acid research in Barcelona and delivered with haute couture precision. A guest is not buying a cream; they are buying the most exacting facial of their life.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Natura Bisse organises its skincare into named collections, and knowing the map of those collections is the fastest route to fluency.

The Diamond Collection is the flagship: the house's most luxurious anti-ageing line and the family guests associate with the brand's name. The C+C Vitamin line is built around vitamin C, the classic radiance and antioxidant ingredient, and is the natural home for dull, tired skin. The Inhibit collection focuses on expression lines and wrinkles, the house's targeted answer for guests concerned with lines of movement. The Oxygen collection purifies and revitalises congested, city-stressed skin. And NB Ceutical is the collection for sensitive and delicate skin, where comfort and tolerance lead.

Beneath the collections sits the founding ingredient story: the house began with free amino acids, the building blocks of skin proteins, and that science-led identity still shapes how the brand talks about every formula.

The professional method matters more than any list, because ranges evolve. Learn the collection map first, so you can place any product a guest mentions. Then learn one collection at a time, starting with whichever your spa's menu leans on. Use the testers, read the house training materials, and never invent an ingredient claim: say what you know, check what you do not, and come back with the answer.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A Natura Bisse menu rewards preparation. On day one, learn the flagship first: the Diamond Experience facials are the treatments most guests know the house for, so master your spa's version before anything else. Then map the facial menu by collection, note durations, protocols and products used, and ask the senior therapist rather than guessing. The house is also known for innovation in the treatment experience itself, famously creating a pure air bubble environment for its treatments, so learn whatever signature concepts your venue offers.

Delivery is where the brand lives. The Natura Bisse style is meticulous and couture-like: every step performed precisely as the protocol describes, layered and unhurried, with the guest made to feel that nothing in the room matters more than their skin. Precision is the ritual.

Retail continues the facial at home. Narrate key products during the treatment, then prescribe two or three, linked to the collection you worked with and to what your analysis found. A Diamond facial guest is a Diamond retail guest; do not scatter across collections without reason.

Upsell paths are natural: the classic facial guest moves up to the Diamond tier, the sixty-minute booking extends when the skin genuinely needs it, and courses of facials follow the skin's renewal cycle. Finally, protect the brand: correct products, correct quantities, full protocols, stock reported, and the standard held even under time pressure.`,
    },
  ],
  quiz: [
    {
      q: 'Natura Bisse was founded...',
      options: [
        'In Paris in the 1950s by a fashion house',
        'By Ricardo Fisas in Barcelona in 1979',
        'By a dermatologist in New York in the 1990s',
        'By a Swiss pharmaceutical laboratory',
      ],
    },
    {
      q: `The house's first formulas were built around...`,
      options: [
        'Marine collagen from the Mediterranean',
        'Alpine herb extracts',
        'Synthetic retinoids',
        'Research into free amino acids, the building blocks of skin proteins',
      ],
    },
    {
      q: `Natura Bisse's flagship luxury collection, the one guests most associate with the brand, is...`,
      options: [
        'The Diamond Collection',
        'The Marine Collection',
        'The Pro-Collagen Collection',
        'The Botanical Collection',
      ],
    },
    {
      q: 'The C+C Vitamin line is best known for...',
      options: [
        'Deep cleansing oily skin',
        'Sun protection only',
        'Vitamin C, for radiance and antioxidant benefit on dull, tired skin',
        'Scalp and hair treatment',
      ],
    },
    {
      q: 'The Inhibit collection is targeted at...',
      options: [
        'Body firming only',
        'Expression lines and wrinkles',
        'Blocked pores in teenage skin',
        'Nail and cuticle care',
      ],
    },
    {
      q: 'NB Ceutical is the collection designed for...',
      options: [
        'Sensitive and delicate skin, where comfort and tolerance lead',
        'Advanced anti-ageing at the top price tier',
        'Post-sun tanning',
        'Men only',
      ],
    },
    {
      q: 'Your first move on day one in a Natura Bisse spa should be...',
      options: [
        'Rearrange the retail display',
        'Improvise facials from your general training',
        'Memorise every ingredient list in the range',
        'Learn the flagship Diamond Experience facials and the house protocols, asking rather than guessing',
      ],
    },
    {
      q: 'The strongest way to retail Natura Bisse after a facial is...',
      options: [
        'Present the full range at reception',
        'Recommend whatever is on promotion',
        'Prescribe two or three products linked to the collection used and to what your analysis found',
        'Leave retail entirely to the front desk',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why this facial cost what it did, and the therapist told me the story - a family house from Barcelona, built on amino acid science, that five-star spas choose for their very best facials. By the end of the hour I understood every penny."`,
      helpsYou: `Natura Bisse accounts sit at the very top of the facial market, and hiring managers there look for therapists who can carry the story with confidence. Being able to state the founding story and the USP in one calm sentence is what separates a credible candidate from a hopeful one.`,
      tips: [
        'Learn the one-breath USP: diamond-tier, science-led luxury facials delivered with haute couture precision',
        `Remember the origin: Ricardo Fisas, Barcelona, 1979, and the amino acid discovery`,
        `The house is family-founded and family-led - guests love that part of the story`,
      ],
    },
    {
      guestView: `"She placed my skin in the right collection within minutes - vitamin C for the dullness now, and the Diamond line as my skin matures. It felt like being fitted by a tailor rather than sold to by a counter."`,
      helpsYou: `The collection map is the fastest credibility you can build on a Natura Bisse account. Place any product a guest mentions into its collection and purpose, and you sound like the house's own trainer; scatter guesses across the range and guests hear it instantly.`,
      tips: [
        'Learn the map first: Diamond, C+C Vitamin, Inhibit, Oxygen, NB Ceutical',
        'Match collection to concern: radiance, expression lines, congestion, sensitivity, luxury anti-ageing',
        'Tell the amino acid founding story simply - it is the science behind the whole house',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"Every step of the facial felt deliberate - layered, precise, unhurried. Nothing was rushed and nothing was skipped. Afterwards she wrote down exactly two products from the line she had used on me. I bought both."`,
      helpsYou: `Therapists who deliver the meticulous Natura Bisse style faithfully, retail within the collection they treated with, and build honest upgrade paths into the Diamond tier are the ones the top city spas request, rebook and promote.`,
      tips: [
        `Day one: learn your spa's flagship Diamond Experience facial before anything else`,
        'Precision is the ritual - never trim protocol steps under time pressure',
        'Prescribe two or three products from the collection you treated with',
        'Natural upsell paths: classic facial to Diamond tier, single facial to a course',
      ],
    },
  ],
}
