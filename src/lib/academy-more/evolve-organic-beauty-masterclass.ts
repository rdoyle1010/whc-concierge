// Talent House Academy brand masterclass: Evolve Organic Beauty. Independent Talent House training - not
// affiliated with or endorsed by Evolve Organic Beauty. Answer key lives in
// academy-more-answers/evolve-organic-beauty-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'evolve-organic-beauty-masterclass',
  title: 'Evolve Organic Beauty Masterclass',
  tagline: `The independent British organic house made by hand in Hertfordshire - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Evolve Organic Beauty, usually just called Evolve, is an independent British natural skincare house founded in 2009 by Laura Rudoe. It remains founder-led and independent, and the brand describes itself as female-led and free of pressure from outside investors.

What sets Evolve apart is where and how its products are made. Rather than handing formulas to a contract manufacturer, as most skincare companies do, Evolve formulates in house and makes its products by hand, in small batches, in its own Eco Studio in Hertfordshire, which the brand says runs on renewable energy. The founder has explained that small-batch making began out of necessity but became a genuine benefit: the team knows exactly what is in every product and where each ingredient comes from.

The philosophy is natural skincare that performs. The brand frames its mission around three ideas: high performance, transparency and sustainability. Many of its products carry COSMOS organic or natural certification, the range is vegan and cruelty free, and the parent company is a certified B Corp.

The USP, in one breath: Evolve is an independent British house making certified organic, high-performing skincare by hand in small batches in its own Hertfordshire studio. A guest is not buying a mass-produced product with a green label, they are buying skincare whose maker can tell them exactly what went into it.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Start with the product the brand itself calls its number one global bestseller: Hyaluronic Serum 200, a natural hyaluronic acid serum that sits at the centre of the Evolve routine. Around it, learn the hydration family the brand sells together as a trio: the Gentle Cleansing Melt, a water-free balm cleanser, and the Daily Renew Facial Cream, which the brand describes as nourishing with organic argan oil and shea butter.

Then learn the two treatment masks guests ask about. The Bio-Retinol Gold Mask uses what the brand calls bio-retinol, from the plant Bidens pilosa, which Evolve describes as giving retinol-like benefits without irritation. The Miracle Vitamin C Mask combines AHAs, a stable vitamin C and maca.

Finally, the aromatherapy blends carry the sensory side of the house: Zen Whisper, built on lavender, frankincense and vetiver, Wild Divine with rose otto, geranium and cacao, plus Joyful Light and Vital Clarity, sold as bath and body oils.

Tell the ingredient story the way the brand does: plant-derived, certified where it says so, made in small batches. Attribute every benefit to the brand's own wording, and when you are unsure of a formulation, check the current product information rather than inventing it.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Evolve has a professional spa offer, described on its own site as holistic face and body protocols, bespoke organic facials, body rituals and a Custom Blend Massage that uses custom-blended organic oils and aromatherapy. The brand says these protocols are designed around modern concerns such as stress, sleep and burnout, and it supports partner spas with training. Exact treatment names, durations and steps differ by spa, so on day one read your own spa's menu and protocols, ask the senior therapist, and never improvise.

The signature style is sensory, natural and personal: the guest's chosen aromatherapy blend, unhurried touch, and clean, honest products explained simply.

Retail is the treatment continued at home. Prescribe two or three products linked to what the guest experienced: the hydration trio for a dry, tired complexion, a mask for a weekly ritual, the blend they chose for the bath. Upsell along honest paths, such as a facial guest who loved the massage moving to a longer face and body protocol.

Protect the house on shift: correct products and amounts, faithful protocols, clean testers, accurate stock reporting, and claims that use only the brand's own words.`,
    },
  ],
  quiz: [
    {
      q: 'Evolve Organic Beauty was founded by...',
      options: [
        'A French pharmacy group in the 1980s',
        'Laura Rudoe, in 2009, as an independent British brand',
        'A Swiss clinic in Geneva',
        'A Californian celebrity make-up artist',
      ],
    },
    {
      q: 'What most distinguishes how Evolve makes its products?',
      options: [
        'They are made by a large contract manufacturer overseas',
        'They are formulated by an external laboratory and licensed',
        'They are made only to order in each spa',
        'They are formulated in house and made by hand in small batches in its own Eco Studio in Hertfordshire',
      ],
    },
    {
      q: 'Which product does Evolve itself describe as its number one global bestseller?',
      options: [
        'Hyaluronic Serum 200',
        'Gentle Cleansing Melt',
        'Miracle Vitamin C Mask',
        'Zen Whisper Bath Oil',
      ],
    },
    {
      q: 'The Bio-Retinol Gold Mask uses bio-retinol from Bidens pilosa, which the brand describes as...',
      options: [
        'A synthetic retinoid for clinical use only',
        'A marine extract from Breton seaweed',
        'A plant-based ingredient giving retinol-like benefits without irritation',
        'A mineral clay for oily skin',
      ],
    },
    {
      q: 'The Zen Whisper aromatherapy blend is built on...',
      options: [
        'Rose otto, geranium and cacao',
        'Eucalyptus, peppermint and rosemary',
        'Lavender, frankincense and vetiver',
        'Grapefruit, lime and ginger',
      ],
    },
    {
      q: `How should a therapist describe the benefits of an Evolve product to a guest?`,
      options: [
        `In the brand's own wording, attributed to the brand, without invented percentages or medical claims`,
        'With the strongest clinical claim that sounds convincing',
        'By comparing it unfavourably with other brands the guest uses',
        'By quoting ingredient percentages from memory',
      ],
    },
    {
      q: 'The Hydration Trio that Evolve sells together combines...',
      options: [
        'Two masks and a body oil',
        'A toner, an exfoliant and a lip balm',
        'Bio-Retinol Gold Mask, Miracle Vitamin C Mask and a body butter',
        'Gentle Cleansing Melt, Hyaluronic Serum 200 and Daily Renew Facial Cream',
      ],
    },
    {
      q: 'On your first shift in a spa running Evolve treatments, the professional first step is...',
      options: [
        'Improvise a facial from your general training',
        `Read the spa's own Evolve menu and protocols and ask the senior therapist rather than guess`,
        'Rearrange the retail shelves',
        'Recommend every product in the range at the till',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: '',
  lessons: [
    {
      guestView: `"I asked who makes it and she told me: an independent British company that makes everything by hand in its own studio in Hertfordshire. It felt like buying from someone, not something."`,
      helpsYou: `Spas choose Evolve for its story as much as its formulas. A therapist who can tell that story accurately, independent, founder-led, made by hand in small batches, certified organic, sounds like a resident of the house from the first consultation.`,
      tips: [
        'Learn the one-breath USP: independent, certified organic, high-performing, made by hand in Hertfordshire',
        'Remember the difference: formulated in house, no contract manufacturer',
        `Use the brand's own three ideas: performance, transparency, sustainability`,
      ],
    },
    {
      guestView: `"She used the serum and told me it was the brand's bestseller and how the brand says it hydrates. No hard sell, just a clear reason. I bought it on the way out."`,
      helpsYou: `Knowing Hyaluronic Serum 200, the hydration trio, the two masks and the aromatherapy blends cold means you can answer most guest questions on day one and retail honestly without reaching for the leaflet.`,
      tips: [
        'Heroes first: Hyaluronic Serum 200, Gentle Cleansing Melt, Daily Renew Facial Cream',
        'Know the masks: Bio-Retinol Gold Mask and Miracle Vitamin C Mask',
        'Let the guest smell and choose the blend: Zen Whisper, Wild Divine, Joyful Light, Vital Clarity',
        `Attribute every benefit to the brand, and check the current label before naming an ingredient`,
      ],
    },
    {
      guestView: `"I chose the lavender blend at the start and it carried through the whole massage. At the end she wrote down three products, including that oil for my bath. That is the bit I use every week."`,
      helpsYou: `Therapists who follow the spa's Evolve protocols faithfully, retail from the treatment and keep claims honest are the ones a natural brand trusts in front of its most discerning guests.`,
      tips: [
        `Day one: read your spa's Evolve menu and protocols before anything else`,
        'Prescribe two or three products linked to the treatment just delivered',
        'Upsell along honest paths: loved the massage means a longer face and body protocol next time',
        `Never add a claim the brand does not make; natural guests check`,
      ],
    },
  ],
}
