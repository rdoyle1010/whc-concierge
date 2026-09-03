// Talent House Academy brand masterclass: Susanne Kaufmann. Independent Talent House training -
// not affiliated with or endorsed by Susanne Kaufmann. Answer key lives in
// academy-more-answers/susanne-kaufmann-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'susanne-kaufmann-masterclass',
  title: 'Susanne Kaufmann Masterclass',
  tagline: `The Alpine house of holistic skincare - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Susanne Kaufmann is one of the most quietly influential names in modern luxury spa. The brand was founded in 2003 by Susanne Kaufmann herself in Bezau, a village in the Bregenzerwald, an Alpine valley in the Vorarlberg region of Austria. Her family had run the Hotel Post Bezau for generations, and it was there, building the hotel's spa, that she developed the treatments and formulations that became the brand.

That origin matters. Like the best spa houses, Susanne Kaufmann grew out of a working treatment room, not a retail counter. The products were created to answer real guests' needs in a real Alpine spa, and the retail range is the spa taken home.

The philosophy joins three strands: the plant knowledge of the Alps, the region's tradition of naturopathy and holistic healing, and modern skincare science. Formulations are built around natural, plant-based actives, many drawn from Alpine botanicals, and the house is deeply committed to sustainability, with production kept in the Bregenzerwald region itself.

The USP in one breath: Susanne Kaufmann offers holistic, natural skincare rooted in Alpine plant tradition and naturopathy, refined by modern science, created in an Austrian spa and made sustainably in its home valley. A guest is not buying a jar; they are buying the calm and rigour of the Bregenzerwald.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Every house has its icons, and a therapist's credibility on a Susanne Kaufmann account starts with knowing them cold.

Begin with the Enzyme Exfoliator, one of the brand's best-known hero products and one of the easiest honest recommendations in spa retail: a gentle enzymatic exfoliant guests ask for by name. Then the bath culture at the heart of the house: the oil baths, mood-led bathing blends that carry the brand's holistic heritage, and Alkali Salt No.1, the famous alkaline bath salt drawn from the naturopathic tradition of supporting the body's balance through bathing. Bathing rituals are central to how this house thinks, which is rarer than it sounds and gives you a distinctive retail story.

The ingredient philosophy follows the brand story: natural, plant-based actives, with Alpine botanicals such as St John's wort among the signatures of the region's herbal tradition, formulated to modern standards of skincare science. Sustainability runs through it all: regional production in the Bregenzerwald and a considered approach to sourcing and packaging.

Where you are unsure of a specific formulation, never invent it. Learn any range the professional way: heroes first, then one category at a time, using testers, reading the house's own training materials, and using the key products on your own skin until conviction is real. Say what you know, check what you do not.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Menus differ between Susanne Kaufmann spas, so the day-one discipline is a reading method, not a memorised list. Learn the treatment menu before your first guest: identify the flagship facial and body treatments, note each treatment's duration, protocol, products and ideal guest, and ask the senior therapist rather than guessing. A therapist who can honestly say they know the menu by the end of day one is rare and remembered.

Delivery must match the house. The Susanne Kaufmann style is calm, holistic and unhurried: natural products applied with intention, treatments that address the whole person, and a tone of quiet Alpine simplicity rather than theatrical luxury. Protect that calm; it is the brand.

Retail is the spa taken home. Narrate key products during treatment in single honest sentences, then prescribe two or three items linked directly to what you found and what the guest experienced, the exfoliator they felt working or the bath oil that matches the state they came in wanting. Tell them what not to buy; trust compounds.

Upsell paths stay honest: the sixty-minute guest with real tension benefits from ninety; the facial guest who loved the body elements is a full-body ritual guest next visit. And protect the standards on shift: correct products in correct quantities, faithful protocols, immaculate testers, low stock reported, and the ritual never trimmed to rescue a late column. On a Susanne Kaufmann shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'The Susanne Kaufmann brand was founded in...',
      options: [
        'Paris, France',
        'Zurich, Switzerland',
        'Bezau in the Bregenzerwald, Austria',
        'Munich, Germany',
      ],
    },
    {
      q: 'The brand grew out of...',
      options: [
        `The spa Susanne Kaufmann built at her family's Hotel Post Bezau`,
        'A department store beauty counter',
        'A pharmaceutical laboratory',
        'A celebrity endorsement deal',
      ],
    },
    {
      q: `The house philosophy is best described as...`,
      options: [
        'Medical aesthetics and injectables',
        'Alpine plant knowledge and naturopathic tradition, refined by modern skincare science, treating the whole person',
        'Synthetic actives at the lowest possible price',
        'Fragrance-first luxury with no skincare claims',
      ],
    },
    {
      q: 'Which of these is a well-known Susanne Kaufmann hero product?',
      options: [
        'Pro-Collagen Marine Cream',
        'Pink Hair and Scalp Mud',
        'Tri-Enzyme Resurfacing Serum',
        'The Enzyme Exfoliator',
      ],
    },
    {
      q: `A central part of the brand's sustainability story is that production is kept...`,
      options: [
        'Wherever costs are lowest',
        'In the Bregenzerwald, the Alpine valley the brand comes from',
        'Entirely offshore',
        'Secret from customers',
      ],
    },
    {
      q: 'Your first professional duty on day one in a Susanne Kaufmann spa is...',
      options: [
        'Learn the treatment menu and house protocols, and ask the senior therapist rather than guess',
        'Improvise treatments from your general training',
        'Rearrange the retail shelf',
        'Ask about commission rates',
      ],
    },
    {
      q: 'The strongest way to retail the range is...',
      options: [
        'Present the full range at the till',
        'Discount whatever is overstocked',
        'Prescribe two or three products linked to the treatment and your findings, and say what not to buy',
        'Leave retail entirely to reception',
      ],
    },
    {
      q: 'Protecting the brand standards on shift means...',
      options: [
        'Substituting products quietly when stock runs low',
        'Shortening the ritual to rescue a late-running column',
        'Using extra product to impress guests',
        'Correct products in correct quantities, faithful protocols, reporting low stock, and never trimming the ritual',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1590490360836-2e3b067c082b?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa carried Susanne Kaufmann and the therapist told me about the Alpine valley, the family hotel and the naturopathic tradition behind it. Suddenly the whole shelf made sense, and I trusted every recommendation after that."`,
      helpsYou: `Being able to tell the founding story and state the USP in one confident sentence is exactly what makes an interviewer, or a guest, relax. Hiring managers on natural-luxury accounts filter for therapists who already speak the house's language.`,
      tips: [
        'Learn the one-breath USP: holistic Alpine skincare, naturopathic roots, modern science, made sustainably in its home valley',
        `Remember the heritage: the brand grew out of the spa at the family's Hotel Post Bezau, not a retail counter`,
        'Match the house voice - calm, natural, quietly rigorous, never theatrical',
      ],
    },
    {
      guestView: `"She used the enzyme exfoliator on me and told me, in one sentence, what it was doing and why my skin would feel different. Then she explained the alkaline bath salts. I went home with both, and it never once felt like selling."`,
      helpsYou: `Hero-product fluency is the fastest credibility you can build in a new house. Knowing the Enzyme Exfoliator, the oil baths and Alkali Salt No.1 cold means you can walk onto a Susanne Kaufmann shift and belong within an hour.`,
      tips: [
        'Heroes first: the Enzyme Exfoliator, the oil baths, Alkali Salt No.1',
        'Tell ingredient stories simply: Alpine plant actives, naturopathic tradition, modern science',
        'Use the heroes on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The whole treatment felt calm and considered - no theatre, just skill and beautiful natural products. Afterwards she wrote down two things and told me not to buy a third. I have been back every month since."`,
      helpsYou: `Therapists who can read a new menu on day one, deliver the calm holistic style, retail from the treatment and build honest upgrade paths are the ones hotels rebook and promote - and the ones a brand's own trainers notice on shift.`,
      tips: [
        'Day one: learn the menu and the flagship treatments before your first guest, and ask rather than guess',
        'Protect the calm - the unhurried holistic style is the brand, never the bit to trim',
        'Prescribe two or three products linked to the treatment just delivered, and say what not to buy',
        'Upsell along natural paths: real tension means ninety minutes, loved the body work means the full ritual next visit',
      ],
    },
  ],
}
