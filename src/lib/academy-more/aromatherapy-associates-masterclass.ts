// WHC Academy brand masterclass: Aromatherapy Associates. Independent WHC
// training - not affiliated with or endorsed by Aromatherapy Associates.
// Answer key lives in academy-more-answers/aromatherapy-associates-masterclass.ts
// (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'aromatherapy-associates-masterclass',
  title: 'Aromatherapy Associates Masterclass',
  tagline: `The London house that made aromatherapy a luxury - its story, its oils, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Aromatherapy Associates is the British house that turned aromatherapy itself into a luxury spa category. It was founded in London in 1985 by Geraldine Howard and Sue Beechey, two practising aromatherapists who had trained under Micheline Arcier, one of the pioneers who brought clinical aromatherapy to Britain. The brand grew out of their treatment practice: the oils came first, blended for real clients, and the products followed.

That origin explains everything about the house. Where most skincare brands add fragrance to formulations, Aromatherapy Associates builds entire products around therapeutic-grade essential oil blends, chosen for their effect on mood, sleep, stress and energy as much as on the skin. The range is famously organised by how the guest wants to feel rather than by skin type, in wellbeing families such as Relax, Deep Relax, De-Stress and Revive.

The USP a therapist must be able to say in one breath: Aromatherapy Associates offers genuine, expertly blended aromatherapy, created by practising aromatherapists in London and delivered as personalised rituals in the world's finest spas. The guest is not buying a scented product; they are buying the considered use of essential oils to change how they feel, prescribed through consultation and continued at home in the bath. Few houses can claim that authority, and none wear it more quietly.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `The heart of the Aromatherapy Associates range is the Bath and Shower Oil collection, and the most famous of all is Deep Relax, a blend built around vetivert, camomile and sandalwood, created to ease the mind towards sleep. Guests ask for it by name, luxury hotels place it on bathside trays, and many therapists consider it the single most recognisable bath oil in the industry. Around it sit the other wellbeing families: Relax, De-Stress for mind and body, Revive for mornings and travel, Support blends for breathing and resilience, and Inner Strength, a blend created by co-founder Geraldine Howard during her own experience of cancer, which the house has long linked to charitable support.

The formulation story is simple to tell: high concentrations of expertly blended essential oils, carried in nourishing base oils, designed so that a capful in a warm bath becomes a treatment in itself. The skincare range, including the well-loved rose-based products, carries the same aromatic intelligence into facial care.

Where you are unsure of a specific formulation, never invent it. Learn any range the professional way: heroes first, one family at a time, smell every blend until you can describe it with your eyes closed, read the house training materials, and use the key oils yourself. With this house above all others, your nose is your product knowledge.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `On day one in an Aromatherapy Associates spa, read the menu in layers. Start with the flagship: the Ultimate Aromatherapy Experience, the house's renowned full-body massage, is the treatment most guests know the brand for, and its defining moment comes before a hand is laid on the guest, when they smell the oils and choose the blend their body responds to. Then map the facials, the targeted body treatments and the enhancements, noting duration, protocol, products used and who each treatment suits. Ask the senior therapist rather than guessing.

Delivery is where the house lives. The signature style is aromatic and ritual-led: the guided inhalation of the chosen blend, unhurried flow, pressure and focus personalised through consultation, and a calm, attentive presence throughout. The blend the guest chose is the thread; reference it from first breath to aftercare.

Retail is the ritual continued in the guest's own bathroom. The strongest prescription is the bath oil version of the blend they chose, plus one or two products linked to what you found, written down. Upsell paths are natural: the massage guest who slept badly is a Deep Relax guest at home; the sixty-minute guest carrying real tension benefits from ninety.

Finally, protect the brand: correct oils in correct quantities, protocols followed faithfully, testers immaculate, low stock reported, and the ritual never trimmed under time pressure. On shift, you are the house.`,
    },
  ],
  quiz: [
    {
      q: 'Aromatherapy Associates was founded by...',
      options: [
        'A Swiss laboratory in the 1960s',
        'Geraldine Howard and Sue Beechey in London in 1985',
        'A Parisian perfumer in 1990',
        'A hotel group seeking its own spa brand',
      ],
    },
    {
      q: 'The founders trained under...',
      options: [
        'A dermatology professor in Zurich',
        'A Japanese skincare master',
        'Micheline Arcier, a pioneer of clinical aromatherapy in Britain',
        'The perfume houses of Grasse',
      ],
    },
    {
      q: `The house's most famous hero products are...`,
      options: [
        'The Bath and Shower Oils, led by Deep Relax',
        'A collagen serum range',
        'A mineral make-up line',
        'A seaweed body wrap kit',
      ],
    },
    {
      q: 'Deep Relax is built around which signature notes?',
      options: [
        'Peppermint, lemon and eucalyptus',
        'Rose, jasmine and neroli',
        'Tea tree, lavender and mint',
        'Vetivert, camomile and sandalwood',
      ],
    },
    {
      q: 'The range is famously organised by...',
      options: [
        'Price tier',
        'How the guest wants to feel, in wellbeing families such as Relax, De-Stress and Revive',
        'Skin type only',
        'Season of the year',
      ],
    },
    {
      q: `The defining moment of the Ultimate Aromatherapy Experience is...`,
      options: [
        'A high-frequency machine pass',
        'A retail presentation before the massage',
        'The guest smelling the oils and choosing the blend their body responds to',
        'A cold plunge ritual',
      ],
    },
    {
      q: 'The strongest retail prescription after a treatment is...',
      options: [
        'The bath oil version of the blend the guest chose, plus one or two linked products, written down',
        'The full range presented at the till',
        'Whatever is on promotion that week',
        'Leaving retail entirely to reception',
      ],
    },
    {
      q: 'Protecting the brand on shift means...',
      options: [
        'Improvising protocols to save time',
        'Substituting products quietly when stock runs low',
        'Trimming the opening ritual when the column runs late',
        'Correct oils in correct quantities, faithful protocols, stock reported, and the ritual delivered in full',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa used this brand and she told me about two aromatherapists blending oils in London in the eighties. Suddenly it wasn't a product line - it was a practice, and I trusted every drop after that."`,
      helpsYou: `Spas running Aromatherapy Associates want therapists who can carry the house's quiet authority. Telling the founding story and stating the USP in one confident sentence is what makes an interviewer, or a sceptical guest, relax.`,
      tips: [
        'Learn the one-breath USP: genuine expert aromatherapy, blended by practising aromatherapists, delivered as personalised ritual',
        `Remember the origin: the oils came first, blended for real clients - the products followed`,
        `Speak the house language of feeling: relax, restore, revive, breathe`,
      ],
    },
    {
      guestView: `"She held three oils under my nose and asked which one my body wanted. I chose without thinking. A capful of the same oil is now in my bath every Sunday night - and I sleep like I did on that couch."`,
      helpsYou: `Hero fluency in this house means knowing the Bath and Shower Oils cold, above all Deep Relax, and being able to describe each blend by scent and purpose. That fluency lets you walk onto any Aromatherapy Associates shift and belong within the hour.`,
      tips: [
        'Heroes first: the Bath and Shower Oils, led by Deep Relax with vetivert, camomile and sandalwood',
        'Learn the wellbeing families: Relax, Deep Relax, De-Stress, Revive, Support, Inner Strength',
        'Smell every blend until you can describe it with your eyes closed',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"The treatment began with me breathing in the oil I had chosen. An hour later she wrote down that same oil for my bath at home. It never felt like selling - it felt like being prescribed something that already worked on me."`,
      helpsYou: `Therapists who can deliver the aromatic ritual faithfully, retail the chosen blend as the natural continuation of the treatment, and build honest upgrade paths are the ones luxury hotels rebook, promote and request by name.`,
      tips: [
        'Day one: learn the flagship Ultimate Aromatherapy Experience before anything else',
        'The chosen blend is the thread - reference it from first inhalation to aftercare',
        'Prescribe the bath oil of the blend they chose, plus one or two linked products, written down',
        'Never trim the opening ritual under time pressure - flag the schedule instead',
      ],
    },
  ],
}
