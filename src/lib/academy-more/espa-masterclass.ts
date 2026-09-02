// WHC Academy brand masterclass: ESPA. Independent WHC training - not
// affiliated with or endorsed by ESPA. Answer key lives in
// academy-more-answers/espa-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'espa-masterclass',
  title: 'ESPA Masterclass',
  tagline: `The British spa house of ritual - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `ESPA is one of the defining British product houses of modern luxury spa. It was founded in the UK in 1993 by Susan Harmsworth, a spa industry pioneer who had spent decades in beauty and wellness before creating a brand built around a simple conviction: that skincare and spa treatments should treat the whole person, not just the surface of the skin.

From the beginning ESPA was more than a product range. The company designed and developed spas for luxury hotels around the world, which is why the name appears above the door of so many five-star hotel spas. Few houses can claim the same depth of spa heritage: ESPA did not arrive in spas from a retail counter, it grew out of the treatment room itself.

The philosophy blends aromatherapy and naturally derived ingredients, including essential oils, plant actives and marine extracts, with genuine skincare science. The language of the house is calm and holistic: wellbeing, balance, ritual, personalisation.

The USP, the thing a therapist must be able to say in one breath, is this: ESPA offers personalised, ritual-led treatments rooted in aromatherapy and natural actives, created by spa professionals for the world's finest spas. A guest can buy skincare anywhere; at an ESPA spa they are buying a considered ritual, adapted to them, delivered by hands trained in the house style.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Every product house has its icons, the products guests ask for by name, and a therapist's credibility rests on knowing them cold.

For ESPA, start with the heroes. The Optimal Skin range, led by the much-loved Optimal Skin ProCleanser, is the house's everyday skincare backbone. Pink Hair and Scalp Mud is one of the most distinctive products in professional spa, famous for the scalp massage that traditionally finishes an ESPA facial. And the aromatherapy Bath and Body Oils are the soul of the brand: mood-led blends such as Soothing, Energising and Restorative, chosen with the guest through consultation rather than assigned by skin type alone.

The ingredient story follows the philosophy. ESPA formulates with essential oils for mood and the senses, plant actives for skin benefit, and marine extracts drawn from the sea's mineral richness. When you narrate a product during treatment, tell that story simply: what it contains, what it does, and how the guest will feel.

Where you are unsure of a specific formulation, do not invent it. The professional method for learning any range is the same: heroes first, then one category at a time, using the testers, reading the house training materials, and using the key products on your own skin until conviction is real. Guests can hear the difference between memorised copy and genuine knowledge.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `An ESPA menu rewards the therapist who reads it properly. On day one in any ESPA spa, learn the flagship first: the Back, Face and Scalp Treatment, ESPA's famous three-in-one experience, is the treatment most guests know the house for. Then map the personalised facials, the aromatherapy massages with their choice of blend, and the enhancements that can be added to each. Note durations, protocols and which products each treatment uses, and ask the senior therapist rather than guessing.

Delivery is where ESPA lives or dies. The house style is ritual-led: many treatments traditionally open with a welcoming touch such as a cleansing foot ritual and a guided inhalation of the chosen oil blend, and facials classically finish with scalp massage. Unhurried flow, personalisation and calm are the standard.

Retail is the ritual continued at home. Narrate the products as you use them, then prescribe two or three, linked directly to the treatment the guest just experienced. Upsell paths are natural: the facial guest who loved the scalp finish is a Back, Face and Scalp guest next visit; the sixty-minute massage guest with real tension benefits from ninety.

Finally, protect the house. Use the correct products in the correct quantities, follow the protocol, report low stock, and never dilute the ritual under time pressure. On an ESPA shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'ESPA was founded by...',
      options: [
        'A French perfume house in the 1970s',
        'A dermatologist in California',
        'Susan Harmsworth in the UK in 1993',
        'An Italian pharmaceutical group',
      ],
    },
    {
      q: `ESPA's core philosophy is best described as...`,
      options: [
        'Clinical technology first, touch second',
        'Holistic wellbeing: aromatherapy and natural ingredients combined with skincare science, treating the whole person',
        'Budget skincare for the mass market',
        'Medical aesthetics and injectables',
      ],
    },
    {
      q: 'The hallmark finishing touch of a classic ESPA facial is...',
      options: [
        'A scalp massage, famously using Pink Hair and Scalp Mud',
        'A cold stone eye ritual',
        'A paraffin hand wrap',
        'A high-frequency machine pass',
      ],
    },
    {
      q: `ESPA's aromatherapy Bath and Body Oils are grouped by...`,
      options: [
        'Price tier',
        'Skin type only',
        'Bottle colour',
        'Mood and outcome, such as Soothing, Energising and Restorative, chosen with the guest in consultation',
      ],
    },
    {
      q: `ESPA's famous flagship treatment, known as a three-in-one experience, is...`,
      options: [
        'The Diamond Facial',
        'The Back, Face and Scalp Treatment',
        'The Seaweed Leaf Wrap',
        'The Pro-Collagen Facial',
      ],
    },
    {
      q: 'Many ESPA treatments traditionally open with...',
      options: [
        'A retail presentation',
        'A questionnaire completed on the couch',
        'A welcoming touch such as a cleansing foot ritual and a guided inhalation of the chosen oil blend',
        'Bright lights and upbeat music',
      ],
    },
    {
      q: 'The strongest way to retail the ESPA range is...',
      options: [
        'Link the exact products used in the treatment to a short home prescription of two or three items',
        'Present the full range at the till',
        'Discount whatever is overstocked',
        'Leave retail entirely to reception',
      ],
    },
    {
      q: 'Your first professional duty on day one in an ESPA spa is...',
      options: [
        'Improvise treatments from your general training',
        'Rearrange the retail wall',
        'Ask about commission rates',
        'Learn the treatment menu and house protocols, starting with the flagship, and ask rather than guess',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa carried ESPA and the therapist told me the story - a British house built by spa people, for spas. Suddenly the whole menu made sense, and I trusted every recommendation after that."`,
      helpsYou: `Hiring managers at ESPA spas filter for therapists who already speak the house's language. Being able to tell the founding story and state the USP in one confident sentence is exactly what makes an interviewer, or a guest, relax.`,
      tips: [
        'Learn the one-breath USP: personalised, ritual-led, aromatherapy-rooted, created by spa professionals',
        `Remember the heritage: ESPA grew out of the treatment room, not a retail counter`,
        `Match the house voice - calm, holistic words like wellbeing, balance and ritual`,
      ],
    },
    {
      guestView: `"She used the ProCleanser on me and told me, in one sentence, what was in it and why my skin would feel different. Then the pink scalp mud - I went home with both. It never once felt like selling."`,
      helpsYou: `Hero-product fluency is the fastest credibility you can build in a new house. Knowing the Optimal Skin range, the mood-led oils and Pink Hair and Scalp Mud cold means you can walk onto an ESPA shift and belong within an hour.`,
      tips: [
        'Heroes first: ProCleanser, Pink Hair and Scalp Mud, the Bath and Body Oils',
        'Tell ingredient stories simply: what it contains, what it does, how it feels',
        'Use the heroes on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The treatment began with my feet being bathed and a moment breathing the oil we had chosen together. By the scalp massage at the end I understood why people cross town for this brand."`,
      helpsYou: `Therapists who can deliver the ESPA ritual style, retail from the treatment and build honest upgrade paths are the ones hotels rebook and promote - and the ones the brand's own trainers notice on shift.`,
      tips: [
        'Day one: learn the flagship Back, Face and Scalp Treatment before anything else',
        'Protect the ritual - openings and scalp work are the brand, never the bits to trim',
        'Prescribe two or three products, linked to the treatment just delivered',
        'Upsell along natural paths: loved the scalp finish means Back, Face and Scalp next visit',
      ],
    },
  ],
}
