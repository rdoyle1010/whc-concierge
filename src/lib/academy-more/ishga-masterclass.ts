// Talent House Academy brand masterclass: ishga. Independent Talent House training - not
// affiliated with or endorsed by ishga. Answer key lives in
// academy-more-answers/ishga-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'ishga-masterclass',
  title: 'ishga Masterclass',
  tagline: `The Hebridean seaweed house - its story, its science, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `ishga is a Scottish luxury skincare house born on the Isle of Lewis in the Outer Hebrides, one of the most remote and unspoilt coastlines in Europe. Founded in 2013, the brand takes its name from the Gaelic word for water, and everything about it flows from that origin: the cold, clean Atlantic waters around the Hebrides, the seaweed that thrives in them, and the island community that harvests it by hand.

The philosophy is natural marine skincare done seriously. ishga is built on sustainably hand-harvested Hebridean seaweed, an ingredient prized for its antioxidants, minerals and vitamins, blended into products designed to protect, condition and restore the skin. The tone of the house is honest, elemental and quietly Scottish: purity, provenance and the power of the sea, rather than glamour or clinical jargon.

Sustainability is not a marketing layer, it is the founding logic. Seaweed is a renewable resource, harvested by hand so the plant regrows, and the brand's identity is inseparable from caring for the environment it comes from.

The USP a therapist must be able to say in one breath: ishga offers natural, sustainable skincare powered by hand-harvested Hebridean seaweed, bringing the purity of Scotland's island waters into the treatment room. A guest can buy marine skincare in many places; with ishga they are buying a genuine place, a genuine plant and a genuinely sustainable story.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `With most houses you learn hero products first. With ishga, the hero is the ingredient itself: Hebridean seaweed, and every product in the range is a different way of delivering it to the skin.

Start there. The cold, nutrient-rich Atlantic waters around the Hebrides support seaweeds that are exceptionally rich in antioxidants, minerals, vitamins and amino acids. In skincare terms that translates to protection against environmental stress, conditioning and hydration, and a soothing, calming quality that suits even sensitive skins. Alongside the seaweed extract, the house draws on pure Hebridean water and other naturally derived ingredients, keeping formulations clean and honest.

Then map the range by category rather than memorising isolated items: facial care, from cleansers through serums and moisturisers; body care, including the salt and seaweed scrubs and body oils that anchor spa treatments; and bath products that bring the seaweed ritual home. For each category, learn which products the treatments use, because in an ishga spa the retail shelf mirrors the treatment menu closely.

Where you are unsure of a specific formulation, never invent it. Use the professional learning method: the ingredient story first, then one category at a time, using testers, the house training materials and the products on your own skin until conviction is real. With ishga, the single sentence that always serves you is the true one: this contains hand-harvested Hebridean seaweed, and here is what it will do for your skin.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `An ishga menu is built around the seaweed, and reading it is your first duty on day one. Identify the flagship treatment the spa promotes hardest, learn it in full, then map the rest in layers: the facials and what distinguishes each, the massages and which oils they use, the body rituals such as scrubs and wraps where the seaweed story is most vivid, and the enhancements that can extend a booking. For each, note duration, protocol, products used and who it is for, and ask the senior therapist rather than guessing.

Delivery is where the brand lives. The ishga style is elemental and unhurried: let the marine scent, the warmth of the oils and the texture of salt and seaweed do the storytelling, and narrate the provenance simply, one sentence at a time. A guest who learns mid-treatment that the seaweed on their skin was hand-harvested from Hebridean shores is experiencing the USP, not hearing it.

Retail is the ritual continued at home. Prescribe two or three products linked directly to the treatment just delivered, tell the guest what not to buy, write it down and record it.

Upsell paths are natural: the facial guest who loved the marine scent suits a full body ritual next visit; the sixty-minute massage guest with real tension benefits from ninety.

Finally, protect the house: correct products in correct quantities, protocols followed, stock reported, and the ritual never trimmed under time pressure. On an ishga shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'ishga originates from...',
      options: [
        'The west coast of Ireland',
        'The Isle of Lewis in the Outer Hebrides, Scotland',
        'The Norwegian fjords',
        'Cornwall, in the south west of England',
      ],
    },
    {
      q: 'The name ishga derives from...',
      options: [
        'The Gaelic word for water',
        `The founder's surname`,
        'A Norse word for island',
        'The Latin name of a seaweed species',
      ],
    },
    {
      q: `The hero ingredient at the heart of the ishga range is...`,
      options: [
        'Alpine herbs',
        'Diamond dust',
        'Sustainably hand-harvested Hebridean seaweed',
        'Volcanic clay',
      ],
    },
    {
      q: 'Seaweed earns its place in skincare because it is...',
      options: [
        'Brightly coloured and photogenic',
        'Cheap to farm intensively',
        'A strong exfoliant that strips the skin',
        'Rich in antioxidants, minerals and vitamins that protect and condition the skin',
      ],
    },
    {
      q: `ishga's approach to sustainability is best described as...`,
      options: [
        'A recent marketing campaign',
        'Founding logic: seaweed is a renewable resource, harvested by hand so the plant regrows',
        'Limited to recyclable boxes',
        'Not part of the brand story',
      ],
    },
    {
      q: 'Your first duty on day one in an ishga spa is...',
      options: [
        'Learn the treatment menu, flagship first, and ask rather than guess',
        'Rearrange the retail shelf',
        'Improvise treatments from your general training',
        'Memorise every ingredient list in the range',
      ],
    },
    {
      q: 'The strongest way to retail the ishga range is...',
      options: [
        'Present the full range at reception',
        'Discount whatever is overstocked',
        'Leave retail entirely to the front desk',
        'Prescribe two or three products linked directly to the treatment just delivered',
      ],
    },
    {
      q: 'Protecting the brand on an ishga shift means...',
      options: [
        'Adding your own favourite techniques to the protocol',
        'Using less product to save stock',
        'Correct products in correct quantities, protocols followed, stock reported, ritual never trimmed',
        'Only treating guests who already know the brand',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked where the products came from and the therapist told me about an island in the Outer Hebrides, seaweed cut by hand, and a name that means water in Gaelic. I stopped comparing it with anything else on my shelf after that."`,
      helpsYou: `Spas that carry ishga chose it for the story as much as the formulations, and they hire and rebook therapists who can tell that story in one confident breath. Provenance fluency is the fastest credibility you can build with this house.`,
      tips: [
        'Learn the one-breath USP: natural, sustainable skincare powered by hand-harvested Hebridean seaweed',
        'Remember the name: ishga comes from the Gaelic word for water',
        `Match the house voice - elemental, honest words like purity, provenance and the sea`,
      ],
    },
    {
      guestView: `"She told me, in one sentence, that the serum contained hand-harvested Hebridean seaweed and what it would do for my skin. I could smell the sea in it. I went home with two products and never once felt sold to."`,
      helpsYou: `With ishga the hero is the ingredient, which means one true, well-told story carries you across the whole range. Master the seaweed narrative and the category map, and you can walk onto an ishga shift and belong within an hour.`,
      tips: [
        'The hero is the ingredient: Hebridean seaweed, rich in antioxidants, minerals and vitamins',
        'Learn the range one category at a time - facial, body, bath',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The scrub smelt of salt and the sea, and while she worked she mentioned the seaweed had been harvested by hand off Hebridean shores. By the end I understood I had not just had a treatment, I had visited a place."`,
      helpsYou: `Therapists who can read an ishga menu on day one, deliver the elemental style faithfully, retail from the treatment and build honest upgrade paths are the ones coastal spas and five-star hotels ask for by name.`,
      tips: [
        'Day one: find the flagship treatment and learn it in full before anything else',
        'Let the marine scent and textures tell the story - narrate provenance in single sentences',
        'Prescribe two or three products linked to the treatment just delivered',
        'Protect the ritual - never trim the seaweed story to rescue a late column',
      ],
    },
  ],
}
