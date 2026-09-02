// WHC Academy brand masterclass: IMAGE Skincare. Independent WHC training -
// not affiliated with or endorsed by IMAGE Skincare. Answer key lives in
// academy-more-answers/image-skincare-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'image-skincare-masterclass',
  title: 'IMAGE Skincare Masterclass',
  tagline: `The American house of results - its story, its ranges, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `IMAGE Skincare is one of the best-known American professional skincare houses in the modern spa and clinic world. It was founded in the United States in 2003 by Janna Ronert, a working aesthetician who built the company from modest beginnings, turning her treatment-room experience into a range designed for professionals like herself. The brand's clinical credibility deepened through the involvement of Dr Marc Ronert, a board-certified plastic surgeon, giving the house a distinctive pairing of aesthetician instinct and medical oversight.

The philosophy is results-driven clinical skincare: formulations built around proven active ingredients, designed to create visible change in the skin rather than simply a pleasant experience. The brand's famous slogan captures its positive, prevention-first outlook in two words: Age later. The message is not fear of ageing but confidence in healthy skin at every age.

Crucially, IMAGE is a professional-only house. Its products and treatments are sold and delivered through trained, licensed skincare professionals in spas, salons and clinics rather than through supermarkets or general high-street retail. That channel is the USP a therapist must be able to state in one breath: professional-grade, results-driven clinical skincare, created by an aesthetician, developed with medical expertise, and delivered through trained professionals. When you work an IMAGE account, you are not just near the brand's point of difference. You are the point of difference.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `IMAGE organises its skincare into named range families, each built around a skin story, and learning that map is the fastest route to fluency. Vital C is the house's much-loved hydration and radiance family, built around vitamin C, and its hydrating serum is one of the products guests most often know by name. Clear Cell is the family for oily and blemish-prone skin, led by salicylic acid. Ormedic balances organic botanical ingredients with clinical effectiveness, making it the natural home for sensitive and unbalanced skin. Ageless works on visible ageing with alpha hydroxy acids such as glycolic acid. The MAX line represents the house's advanced tier, associated with peptide technology, while Iluma addresses dullness and uneven tone, and Prevention+ provides the daily moisturisers with broad-spectrum SPF that finish every IMAGE routine.

The ingredient story follows the philosophy: recognised, results-driven actives, vitamin C, salicylic acid, AHAs, peptides and daily SPF, formulated to professional strength. Narrate them simply during treatment: what it contains, what it does, how the skin will respond.

Where you are unsure of a specific formulation, never invent it. Learn the range the professional way: hero products first, then one family at a time, using the testers, reading the brand's own training materials, and using the key products on your own skin until your conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `An IMAGE menu is read in layers. The house is famous for its professional treatments: results-driven facials and, above all, its family of professional chemical peels, alongside signature experiences such as the O2 Lift oxygen-infused facial. Many spas offer an accessible entry-level vitamin C based treatment, with progressively stronger peels above it. On day one, map the menu: which treatments are facials, which are peels, their durations, the protocols and products each uses, and the contraindications and preparation each requires. Ask the senior therapist rather than guessing.

Delivery is where IMAGE differs from a purely sensorial house. The style is clinical results delivered with luxury hands: a thorough skin analysis, honest consultation about goals and timelines, precise application of actives, and calm, attentive comfort throughout. Never perform an IMAGE peel without completing the brand's professional training for it and following the protocol exactly, including any required patch test and home preparation.

Retail is the result continued at home. Prescribe two or three products linked to your analysis, and almost always include daily SPF, because protecting results is part of the result. Upsell paths are natural: the facial guest with real concerns progresses to a peel, the single peel becomes a course, and home care supports both. Protect the brand on shift: correct products, correct strengths, correct timings, stock reported, protocols honoured.`,
    },
  ],
  quiz: [
    {
      q: 'IMAGE Skincare was founded by...',
      options: [
        'A Swiss pharmaceutical laboratory in the 1980s',
        'Janna Ronert, a working aesthetician, in the United States in 2003',
        'A French fragrance house',
        'A chain of British department stores',
      ],
    },
    {
      q: `The brand's famous two-word slogan is...`,
      options: [
        'Skin first',
        'Forever young',
        'Results now',
        'Age later',
      ],
    },
    {
      q: 'The Vital C range is built around...',
      options: [
        'Vitamin C, for hydration and radiance',
        'Charcoal, for deep cleansing',
        'Retinol only',
        'Marine collagen',
      ],
    },
    {
      q: 'Clear Cell is the IMAGE family designed for...',
      options: [
        'Mature, dry skin',
        'Scalp and hair care',
        'Oily and blemish-prone skin, led by salicylic acid',
        'Sun protection only',
      ],
    },
    {
      q: 'The Ormedic range is best described as...',
      options: [
        'A professional-only chemical peel',
        'Organic botanical ingredients balanced with clinical effectiveness, suited to sensitive and unbalanced skin',
        'A make-up line',
        'A fragrance collection',
      ],
    },
    {
      q: 'IMAGE Skincare is distributed...',
      options: [
        'Through trained, licensed skincare professionals in spas, salons and clinics',
        'Through supermarkets',
        'Through vending machines in gyms',
        'Only online, direct to consumers, with no professional channel',
      ],
    },
    {
      q: `IMAGE's best-known professional treatments include...`,
      options: [
        'Hot stone massage rituals',
        'Hydrotherapy pool circuits',
        'Its family of professional chemical peels and signature facials such as the O2 Lift',
        'Manicures and pedicures',
      ],
    },
    {
      q: 'Before delivering an IMAGE professional peel, a therapist must...',
      options: [
        'Simply read the label on the day',
        'Ask the guest which strength they fancy',
        'Improvise from general facial training',
        `Complete the brand's professional training for that treatment and follow the protocol exactly, including any required patch test`,
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the clinic used IMAGE and the therapist told me: founded by an aesthetician, developed with a surgeon, and only sold through professionals like her. That one sentence made me trust the whole treatment."`,
      helpsYou: `Spas and clinics on an IMAGE account want therapists who can carry the clinical story with confidence. Telling the founding story and stating the professional-only USP in one breath is what makes interviewers, managers and sceptical guests relax.`,
      tips: [
        'Learn the one-breath USP: professional-grade, results-driven, aesthetician-created, medically developed, professionally delivered',
        `Remember the slogan and its spirit: Age later is confidence, not fear`,
        `You are the channel - a professional-only brand is only ever as good as its therapist`,
      ],
    },
    {
      guestView: `"She looked at my skin, named the range that matched it, and explained the vitamin C serum in one plain sentence while I could feel it working. I went home with the serum and the SPF, and it never felt like selling."`,
      helpsYou: `Range-map fluency is the fastest credibility you can build on an IMAGE shift. Knowing which family answers which skin story, and which hero actives drive each, lets you prescribe with the certainty guests pay professionals for.`,
      tips: [
        'Learn the map: Vital C, Clear Cell, Ormedic, Ageless, the MAX, Iluma, Prevention+',
        'Pair each family with its skin story, not just its name',
        'Narrate actives simply: what it contains, what it does, how the skin responds',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"I wanted the strongest peel on the menu. She explained why we would build up to it, booked me a course, and my skin has never looked better. I would not let anyone else near my face now."`,
      helpsYou: `Therapists who can read a results-driven menu, deliver peels strictly to protocol and convert single treatments into courses are the ones clinics trust, insure and promote - and the ones whose columns fill with returning guests.`,
      tips: [
        `Day one: map facials versus peels, with durations, products and contraindications`,
        'Never deliver a peel without the brand training and the exact protocol, patch test included',
        'Prescribe two or three products and almost always include daily SPF',
        'Upsell along natural paths: facial to peel, single peel to course',
      ],
    },
  ],
}
