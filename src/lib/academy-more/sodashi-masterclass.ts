// WHC Academy brand masterclass: Sodashi. Independent WHC training - not
// affiliated with or endorsed by Sodashi. Answer key lives in
// academy-more-answers/sodashi-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'sodashi-masterclass',
  title: 'Sodashi Masterclass',
  tagline: `The Australian house of pure, high-touch natural luxury - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Sodashi is one of the quiet aristocrats of luxury spa: a small Australian house with an outsized presence in some of the finest hotel spas in the world. It was founded in 1999 by Megan Larsen, an aromatherapist and natural skincare formulator, in Western Australia, and the products are still made there in small batches rather than on a mass production line.

The name tells you the philosophy before you open a jar. Sodashi is derived from Sanskrit and is usually translated as wholeness, purity and radiance, and those three words are the brand in miniature. The house's founding conviction is that skincare can be completely natural and still perform at true luxury level: formulations built from plant actives, essential oils and mineral-rich natural ingredients, free from synthetic chemicals, artificial fragrances and fillers.

Sodashi's route to fame was the treatment room, not the shop shelf. It earned its reputation inside five-star hotel and destination spas, where therapists deliver its high-touch, ritual-led treatments to guests who could buy anything.

The USP in one breath: Sodashi offers pure, completely natural, high-performance skincare, hand-blended in small batches in Australia, delivered through deeply personal, touch-rich spa rituals. A guest can buy natural skincare anywhere; at a Sodashi spa they are buying purity without compromise, and hands trained to honour it.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `A Sodashi therapist's credibility rests on being able to tell the purity story accurately, and on knowing the products guests ask about by name.

Start at the top. The Samadara Ultimate Age-Defying Cream is the house's flagship prestige product, the jar the brand is most famous for, and the anchor of its age-defying offer. Learn it first: what it is, who it suits, and the treatment it crowns on menus that carry a Samadara facial. Around it sit face and body ranges organised by skin need, built on the same natural foundation.

The ingredient story is the philosophy made visible. Sodashi formulates with plant actives chosen for genuine skin benefit, essential oils for the senses and the nervous system, and mineral-rich natural ingredients such as clays and floral waters. Just as important is what is absent: no synthetic chemicals, no artificial fragrances, no fillers. When you narrate a product in treatment, tell that story in one sentence: what it contains, what it leaves out, and how the guest will feel.

Where you are unsure of a specific formulation, never invent it. The professional method for learning any range holds here as everywhere: heroes first, then one category at a time, using the testers, reading the house training materials, and using the key products on your own skin until conviction is real. Purity is a claim guests test; only accuracy protects it.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Every Sodashi spa's menu differs in detail, so your day one discipline is a method. Read the menu flagship first: find the treatment the spa positions at the top, often a Samadara age-defying facial where the range is stocked, and learn it completely, duration, protocol, products and who it is for. Then map the facials, the body treatments and rituals, and the enhancements that extend them. Read the protocols the spa holds and ask the senior therapist rather than guessing.

Delivery is where Sodashi lives. The house style is high-touch and ritual-led: generous hands-on time, unhurried flow, warm attentive presence, and personalisation at every decision point. The products are pure; the delivery must feel equally considered. Guests choose a Sodashi spa for a deeply natural, deeply human experience, and a rushed or mechanical treatment breaks the promise the jar made.

Retail is the ritual continued at home. Narrate products as you use them, then prescribe two or three, linked directly to the treatment and to what you found, and write the prescription down. Upsell paths are natural: the facial guest ready for the flagship experience next visit, the sixty-minute booking that genuinely needs ninety, the enhancement that answers something the consultation surfaced.

Finally, protect the house. Correct products in correct quantities, protocols followed faithfully, testers immaculate, low stock reported, and the ritual never trimmed under time pressure. On a Sodashi shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Sodashi was founded by...',
      options: [
        'A Swiss laboratory group in the 1980s',
        'Megan Larsen, an aromatherapist, in Western Australia in 1999',
        'A Parisian perfume house',
        'A dermatology clinic in Sydney',
      ],
    },
    {
      q: `The name Sodashi is usually translated as...`,
      options: [
        'Strength, science and results',
        'Ocean, mineral and light',
        'A family surname with no wider meaning',
        'Wholeness, purity and radiance, from Sanskrit',
      ],
    },
    {
      q: `Sodashi's formulation promise is...`,
      options: [
        'Completely natural: plant actives, essential oils and mineral-rich ingredients, free from synthetic chemicals, artificial fragrances and fillers',
        'Clinical actives at the highest legal percentages',
        'Natural where possible, synthetic where cheaper',
        'Fragrance-led formulas designed around signature scents',
      ],
    },
    {
      q: `The house's flagship prestige product is...`,
      options: [
        'The Pro-Collagen Marine Cream',
        'The Optimal Skin ProCleanser',
        'The Samadara Ultimate Age-Defying Cream',
        'The Pink Hair and Scalp Mud',
      ],
    },
    {
      q: 'Sodashi products are made...',
      options: [
        'Under licence in several countries',
        'In small batches in Western Australia',
        'In a mass production facility in Europe',
        'By each spa on site',
      ],
    },
    {
      q: 'Your first move with an unfamiliar Sodashi treatment menu on day one is...',
      options: [
        'Learn the flagship treatment completely, then map the rest, reading protocols and asking the senior therapist rather than guessing',
        'Improvise from your general facial training',
        'Memorise the price list',
        'Deliver every treatment the same way to stay consistent',
      ],
    },
    {
      q: 'The strongest way to retail the Sodashi range is...',
      options: [
        'Present the full range at the till',
        'Leave retail to reception',
        'Discount whatever is overstocked',
        'Narrate products during treatment, then prescribe two or three linked to what you found, written down',
      ],
    },
    {
      q: 'Protecting the brand on a Sodashi shift means...',
      options: [
        'Substituting products quietly when stock runs low',
        'Shortening the ritual to keep the column on time',
        'Correct products and quantities, faithful protocols, stock reported, and the ritual never trimmed under pressure',
        'Adding your own signature steps to every protocol',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa chose Sodashi and she told me the story - a small Australian house, hand-blended, completely natural, in the best spas in the world. I stopped reading ingredient labels and started trusting her."`,
      helpsYou: `Sodashi accounts are rare and coveted, and managers filter hard for therapists who can tell the purity story accurately. Stating the founding story and the USP in one confident sentence is what makes an interviewer, or a sceptical guest, relax.`,
      tips: [
        'Learn the one-breath USP: pure, completely natural, high-performance, hand-blended in small batches, delivered through touch-rich ritual',
        `Remember the meaning of the name: wholeness, purity and radiance, from Sanskrit`,
        `Sodashi earned its name in five-star treatment rooms, not on shop shelves - say so`,
      ],
    },
    {
      guestView: `"She told me what was in the cream, and then what was not in it - no synthetics, no artificial fragrance, no fillers. Nobody had ever sold me skincare by what it leaves out before. I bought it."`,
      helpsYou: `Purity is a claim guests test, and hero-product fluency is the fastest credibility you can build in a natural house. Knowing the Samadara flagship and the plant, essential oil and mineral story cold lets you belong on a Sodashi shift within an hour.`,
      tips: [
        'Heroes first: know the Samadara Ultimate Age-Defying Cream before anything else',
        'Tell the story in one sentence: what it contains, what it leaves out, how it feels',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The treatment felt hand-made, like the products - unhurried, warm, completely personal. At the end she wrote down two products, told me a third could wait, and suggested the signature facial next time. I booked it there and then."`,
      helpsYou: `Therapists who can deliver the high-touch Sodashi style, retail from the treatment and build honest upgrade paths are the ones five-star spas rebook, promote and put in front of VIPs.`,
      tips: [
        'Day one: learn the flagship treatment on the menu completely before anything else',
        'The house style is high-touch and unhurried - the ritual is never the thing to trim',
        'Prescribe two or three products, linked to the treatment just delivered, written down',
        'Upsell along natural paths: consultation findings, the flagship facial, sixty to ninety minutes',
      ],
    },
  ],
}
