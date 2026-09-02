// WHC Academy brand masterclass: Sisley Paris. Independent WHC training -
// not affiliated with or endorsed by Sisley Paris. Answer key lives in
// academy-more-answers/sisley-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'sisley-masterclass',
  title: 'Sisley Paris Masterclass',
  tagline: `The French family house of phyto-cosmetology - its story, its icons, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Sisley Paris is one of the great French houses of prestige skincare, founded in Paris in 1976 by Hubert d'Ornano, a nobleman from a family already steeped in cosmetics, together with his wife Isabelle. Half a century later it remains privately owned and run by the d'Ornano family, with the founders' children carrying the house forward. That continuity is rare at the top of luxury beauty, and it shapes everything: Sisley answers to a family's name, not to a quarterly report.

The founding idea was phyto-cosmetology: the belief that plant extracts and essential oils, selected rigorously and used at genuinely effective concentrations, could deliver serious skincare results. Sisley was among the earliest prestige houses to build itself entirely on botanical actives backed by research, and the phyto prefix runs through its product names to this day.

The positioning is uncompromising ultra-luxury. Sisley products sit at the top of the price ladder, and the house justifies that openly: concentrated formulas, long development times, and no compromise on ingredient quality.

The USP a therapist must be able to say in one breath: Sisley Paris is a family-owned French house and a pioneer of phyto-cosmetology, offering highly concentrated plant-based skincare and treatments delivered through expert hands. A guest is buying botanical science, French luxury and a family's personal guarantee in the same jar.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Sisley's credibility rests on a small set of icons every therapist on the account must know cold.

Start with the Ecological Compound, the emblem of the house since 1980: a light emulsion built on a blend of revitalising plant extracts, famous for suiting virtually all skin types and for being the product loyal Sisley guests never give up. Then the Black Rose collection, loved for the Black Rose Cream Mask, an instant radiance step guests ask for by name. At the summit sits Sisleÿa, the flagship anti-ageing line led by Sisleÿa L'Intégral Anti-Âge, the house's global icon of complete age care. Around these sit the Phyto families across skincare and make-up, the Eau du Soir fragrance heritage, and Hair Rituel by Sisley, the house's expert hair and scalp range.

The ingredient story follows the philosophy: plant extracts and essential oils, chosen for proven benefit and used at high concentration. Narrate simply during treatment: what it contains, what it does, how it will feel.

Because formulas are concentrated, a little goes a long way, and teaching correct usage amounts is part of honest Sisley retail. Where you are unsure of a specific formulation, never invent it. Learn heroes first, one category at a time, from the house's own materials, and use the key products yourself until conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Sisley treatments live in some of the world's finest hotel spas, and every menu differs, so day one is a reading method. Learn the flagship phyto-aromatic facial first: which products it uses, its duration, and its protocol. Then map the remaining facials by concern, the body treatments, and the enhancements. Ask the senior therapist rather than guessing, and read the protocols the spa holds before your first guest.

Delivery is where Sisley distinguishes itself. The house style is expert, hands-on and unhurried: signature massage techniques doing real work on the face and body, paired with high-concentration phyto-aromatic products, so results are felt and seen without machines doing the talking. Precision matters, because concentrated formulas reward correct quantities and faithful protocol.

Retail is the treatment continued at home. Narrate the icons as you use them, then prescribe two or three products linked to what you found, and teach usage amounts honestly: Sisley's concentration means products last, which is the truthful answer to the price question. The Ecological Compound is the natural first prescription for almost any guest; the Black Rose Cream Mask suits the guest who loved the radiance step; Sisleÿa is the considered recommendation for the guest serious about age care.

Upsell along genuine paths: the facial guest with scalp tension is a Hair Rituel conversation; the sixty-minute guest with real needs benefits from longer. And protect the brand: correct quantities, faithful protocols, immaculate presentation. On a Sisley shift, you are the house.`,
    },
  ],
  quiz: [
    {
      q: 'Sisley Paris was founded...',
      options: [
        'By a dermatologist in Geneva in the 1990s',
        `In Paris in 1976 by Hubert d'Ornano and his family`,
        'By a British aromatherapist in 1993',
        'As a spin-off of a fashion house in the 1960s',
      ],
    },
    {
      q: `Sisley's founding philosophy, phyto-cosmetology, means...`,
      options: [
        'Machine-led facial technology',
        'Fragrance-first formulation',
        'Mineral-only skincare',
        'Plant extracts and essential oils, rigorously selected and used at genuinely effective concentrations, backed by research',
      ],
    },
    {
      q: 'A defining trait of Sisley as a company is that it...',
      options: [
        `Remains privately owned and run by the d'Ornano family`,
        'Is publicly listed on the stock exchange',
        'Licenses its name to third-party manufacturers',
        'Sells only through supermarkets',
      ],
    },
    {
      q: 'The Ecological Compound is famous as...',
      options: [
        'A self-tanning lotion',
        'A foot treatment',
        `The emblem of the house since 1980: a revitalising emulsion built on plant extracts, suiting virtually all skin types`,
        'A hair styling product',
      ],
    },
    {
      q: `Sisley's flagship anti-ageing line is...`,
      options: [
        'Pro-Collagen',
        `Sisleÿa, led by Sisleÿa L'Intégral Anti-Âge`,
        'Optimal Skin',
        'Tri-Enzyme',
      ],
    },
    {
      q: 'The signature style of a Sisley spa treatment relies on...',
      options: [
        'Expert hands-on massage techniques paired with high-concentration phyto-aromatic products',
        'High-frequency machines and LED masks',
        'Silence and product application only, with no massage',
        'A standard routine identical for every guest',
      ],
    },
    {
      q: `The honest, effective answer to a guest questioning Sisley's premium price is...`,
      options: [
        'Offer an unauthorised discount',
        'Agree that it is overpriced but fashionable',
        'Avoid the subject and change the topic',
        'Explain the concentration story: formulas are highly concentrated, a little goes a long way, and products used correctly last - linked to what was used in their treatment',
      ],
    },
    {
      q: 'Your first professional duty on day one in a Sisley spa is...',
      options: [
        'Rearrange the retail display',
        'Improvise treatments from your general training',
        'Learn the treatment menu and protocols, starting with the flagship phyto-aromatic facial, and ask rather than guess',
        'Memorise every ingredient list in the range',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa chose Sisley and she told me the story - a French family house, fifty years of plant science, still run by the founders' children. After that, every product she touched felt like it had a reason to be there."`,
      helpsYou: `Five-star spas carrying Sisley expect therapists who can speak the house's language of family heritage and phyto-cosmetology. Telling the founding story and stating the USP in one confident sentence is what makes an interviewer, or a sceptical guest, relax.`,
      tips: [
        `Learn the one-breath USP: family-owned French house, pioneer of phyto-cosmetology, concentrated plant-based skincare delivered through expert hands`,
        `Remember the anchor facts: founded in Paris in 1976 by Hubert d'Ornano, still family-run today`,
        `Speak the house voice - assured, precise, quietly luxurious, never apologetic about the price`,
      ],
    },
    {
      guestView: `"She used the Black Rose mask and told me in one sentence why my skin would glow, then showed me how little of the cream I actually needed each day. I went home with two products and the sense that nothing had been sold to me at all."`,
      helpsYou: `Hero-product fluency is the fastest credibility you can build on a Sisley account. Knowing the Ecological Compound, Black Rose and Sisleÿa cold, and teaching correct usage amounts, means you can walk onto a Sisley shift and belong within an hour.`,
      tips: [
        `Heroes first: the Ecological Compound, the Black Rose Cream Mask, Sisleÿa L'Intégral Anti-Âge`,
        'Tell ingredient stories simply: what it contains, what it does, how it feels',
        `Teach the concentration story - a little goes a long way, and that honesty answers the price question`,
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The facial massage was the treatment - twenty minutes of skilled hands doing real work, no machines, no rush. At the end she wrote down exactly two products and how much of each to use. I have rebooked every month since."`,
      helpsYou: `Therapists who can deliver Sisley's hands-on signature style, retail through honest prescription and build genuine upgrade paths are the ones luxury hotels rebook and promote - and the ones trusted with the house's most loyal guests.`,
      tips: [
        'Day one: learn the flagship phyto-aromatic facial before anything else',
        'Protect the massage phase - the expert hands ARE the signature, never the part to trim',
        'Prescribe two or three products linked to the treatment, with usage amounts taught',
        'Upsell along natural paths: scalp tension opens the Hair Rituel conversation',
      ],
    },
  ],
}
