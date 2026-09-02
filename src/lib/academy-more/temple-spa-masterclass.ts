// WHC Academy brand masterclass: Temple Spa. Independent WHC training - not
// affiliated with or endorsed by Temple Spa. Answer key lives in
// academy-more-answers/temple-spa-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'temple-spa-masterclass',
  title: 'Temple Spa Masterclass',
  tagline: `The British house of the Mediterranean lifestyle - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Temple Spa is a British luxury skincare and spa house founded in the UK in 1998 by husband and wife team Liz and Mark Warom. From an English family business it has grown into a range found in premium hotel spas and, distinctively, in guests' own homes through the brand's consultants, who deliver spa experiences outside the treatment room.

The name tells you the philosophy: the old idea that the body is a temple, deserving care, respect and a little celebration. Around that sits the brand's defining inspiration, the Mediterranean lifestyle. Temple Spa describes its world in the language of la dolce vita: sunshine, good food, rest, generosity and time taken over the pleasures of living well. The ingredient story follows, drawing on Mediterranean sources such as olives, grapes, citrus fruits and aromatic herbs, paired with modern skincare science.

The house voice is warm, generous and playful rather than clinical, and its product names, from Repose to Drift Away, read like invitations rather than formulas.

The USP a therapist must be able to say in one breath: Temple Spa is a British house offering luxury skincare and treatments inspired by the Mediterranean lifestyle, blending Mediterranean botanicals with modern science, and designed to be enjoyed in the spa and continued, just as richly, at home.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Every house has its icons, and a therapist's credibility rests on knowing them cold.

For Temple Spa, start with Repose, the aromatherapy resting cream, one of the most loved night creams in British spa retail and the single product most guests already know. Then In The Beginning, the deep cleansing melt whose name announces its place as the first step of the ritual. At the luxury summit sits the Truffle collection, led by Skin Truffle, the house's flagship rejuvenating skincare. The body range carries the Mediterranean story: names such as Drift Away, the relaxing aromatherapy oil, Work It Out for tired muscles, Sugar Buff for smoothing, and Aaahhh! for hot, tired legs.

The ingredient story is the philosophy in a bottle: Mediterranean botanicals, including olive, grape, citrus and aromatic herbs such as lavender and rosemary, combined with contemporary actives. Narrate it simply in treatment: what it contains, what it does, how the guest will feel.

Where you are unsure of a specific formulation, never invent it. The professional method for learning any range is constant: heroes first, then one category at a time, using testers, reading the house training materials, and using the key products on your own skin until your conviction is real. Guests can hear the difference between memorised copy and genuine knowledge.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A Temple Spa menu rewards the therapist who reads it properly. On day one in any Temple Spa venue, find the flagship first: the house is famous for indulgent signature experiences, with its celebrated Champagne and Truffles experience the name guests most often arrive knowing. Then map the prescriptive facials, the aromatherapy massages built around oils such as Drift Away and Work It Out, and the enhancements that can extend a booking. For every treatment, note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is where the brand lives. The Temple Spa style is warm, generous hospitality: unhurried pace, personal touches, and the Mediterranean sense that the guest is being hosted, not processed. Match the house voice, inviting and joyful rather than clinical.

Retail is the ritual continued at home, and this house was built for it. Narrate products as you use them, then prescribe two or three, linked directly to the treatment just delivered. Upsell paths are natural: the massage guest who melted into Drift Away is a candidate for the longer ritual next visit, and the facial regular is the natural guest for the Truffle tier.

Finally, protect the house: correct products, correct quantities, faithful protocols, stock reported, and the ritual never trimmed under time pressure. On a Temple Spa shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Temple Spa was founded by...',
      options: [
        'A Swiss laboratory group in the 1980s',
        'Husband and wife team Liz and Mark Warom, in the UK in 1998',
        'A Mediterranean hotel chain',
        'A celebrity facialist in London',
      ],
    },
    {
      q: `The defining inspiration behind Temple Spa's philosophy is...`,
      options: [
        'Scandinavian minimalism',
        'Japanese onsen bathing',
        'The Mediterranean lifestyle, la dolce vita, expressed through ingredients and tone',
        'Alpine cold-water therapy',
      ],
    },
    {
      q: 'Repose is best described as...',
      options: [
        `The house's famous aromatherapy resting cream, loved as a night-time relaxation product`,
        'A foaming morning cleanser',
        'A self-tanning lotion',
        'A foot scrub',
      ],
    },
    {
      q: 'The Truffle collection, led by Skin Truffle, sits in the range as...',
      options: [
        'A budget starter line',
        `A men's grooming range`,
        'A sun protection family',
        `The luxury summit of the house's skincare, focused on rejuvenation`,
      ],
    },
    {
      q: 'In The Beginning is...',
      options: [
        'A firming neck gel',
        'A bronzing powder',
        'A deep cleansing melt, named for its place as the first step of the skincare ritual',
        'A sleep spray',
      ],
    },
    {
      q: `Product names such as Drift Away and Aaahhh! tell a therapist that the house voice is...`,
      options: [
        'Warm, playful and outcome-led, an invitation rather than a formula',
        'Strictly clinical and technical',
        'Aimed only at medical professionals',
        'Deliberately anonymous',
      ],
    },
    {
      q: 'Your first move on day one with a Temple Spa treatment menu is...',
      options: [
        'Rewrite the protocols to suit your own style',
        'Learn the flagship signature experience first, such as the celebrated Champagne and Truffles experience, and ask rather than guess',
        'Memorise the price list only',
        'Skip the menu and rely on general training',
      ],
    },
    {
      q: 'The strongest way to retail the Temple Spa range is...',
      options: [
        'Present the full catalogue at the till',
        'Discount slow-moving stock',
        'Leave retail entirely to reception',
        'Narrate products during the treatment, then prescribe two or three items linked to what the guest just experienced',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1647960563439-0160d88ca2b7?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked about the name and the therapist told me the whole story - a British couple, the body as a temple, the Mediterranean way of living well. By the time she started the treatment I felt I had joined something, not just booked something."`,
      helpsYou: `Spas carrying Temple Spa want therapists who can host in the brand's warm, generous voice. Telling the founding story and stating the USP in one confident sentence is what convinces an interviewer, or a guest, that you belong on the account.`,
      tips: [
        'Learn the one-breath USP: British house, Mediterranean lifestyle, botanicals plus modern science, spa continued at home',
        `Remember the name's meaning: the body is a temple, deserving care and celebration`,
        'Match the house voice - warm, generous and playful, never coldly clinical',
      ],
    },
    {
      guestView: `"She used the cleansing melt and told me in one sentence why it was called In The Beginning. Then she mentioned Repose for my terrible sleep. I went home with both, and it never once felt like being sold to."`,
      helpsYou: `Hero-product fluency is the fastest credibility you can build in a new house. Knowing Repose, In The Beginning, the Truffle collection and the named body heroes cold means you can walk onto a Temple Spa shift and belong within an hour.`,
      tips: [
        'Heroes first: Repose, In The Beginning, Skin Truffle, then the named body range',
        'Tell the Mediterranean ingredient story simply: what it contains, what it does, how it feels',
        'Use the heroes on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"It felt like being hosted somewhere sunny - unhurried, generous, personal. At the end she suggested exactly two products and the longer ritual for next time, because of what I had loved. I booked it on the spot."`,
      helpsYou: `Therapists who can read a Temple Spa menu fast, deliver its hospitable signature style, retail from the treatment and build honest upgrade paths are the ones hotels rebook, promote and trust with the flagship experiences.`,
      tips: [
        'Day one: find the flagship signature experience and learn it before anything else',
        'Protect the hospitality - warmth and unhurried pace are the brand, never the bits to trim',
        'Prescribe two or three products, linked to the treatment just delivered',
        'Upsell along natural paths: loved the oil means the longer ritual next visit',
      ],
    },
  ],
}
