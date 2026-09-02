// WHC Academy brand masterclass: ila Spa. Independent WHC training - not
// affiliated with or endorsed by ila Spa. Answer key lives in
// academy-more-answers/ila-spa-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'ila-spa-masterclass',
  title: 'ila Spa Masterclass',
  tagline: `The beyond-organic British house of energy and touch - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `ila Spa is one of the most distinctive natural houses in luxury spa. It was founded in England by Denise Leicester, a former nurse, aromatherapist and yoga teacher whose conviction was simple and radical: true beauty flows from the wellbeing of body, mind and spirit together, and skincare should honour all three. The name comes from Sanskrit, a word associated with the earth, and the products are blended by hand at the brand's home in the Cotswolds countryside.

The philosophy is often summed up as beyond organic. For ila, organic certification is a starting point, not the destination. The house seeks purity beyond the certificate: wild-harvested and artisan-sourced ingredients gathered from remote regions of the world, chosen as much for their natural energy and the integrity of the people who produce them as for their chemistry, then blended gently by hand to protect that vitality.

The USP, the sentence a therapist must be able to say in one breath, is this: ila offers beyond-organic, hand-blended skincare and energy-led treatments, created by a healer rather than a marketer, for guests who want transformation as well as results. A guest can buy natural skincare in any pharmacy; at an ila spa they are buying purity, provenance and an experience designed to restore energy as well as skin.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Every house has its icons, and a therapist's credibility rests on knowing them cold. For ila, start with the ingredients, because the ingredient story is the brand.

Three stand at the centre. Damask rose otto, one of the most precious essential oils in the world, carries the heart of ila's aromatic identity. Himalayan salt crystals, rich in minerals, are the signature of the brand's famous bath salts and body treatments. And argan oil, sourced from women's co-operatives in Morocco, embodies the ethical sourcing story: ila buys from artisan producers whose livelihoods the purchase supports.

The product families follow the philosophy: face oils and treatment products built around precious botanicals, nourishing body balms and body oils, and bath salts that turn a bathtub into a treatment. Each is designed to work on the senses and the spirit as much as the skin, and each carries a provenance story worth telling in a single sentence.

Where you are unsure of a specific formulation, never invent it. The professional method for learning any range is constant: heroes first, then one category at a time, using the testers, reading the house training materials, and using the key products on your own skin until conviction is real. With ila, add one discipline: learn the origin story of each hero ingredient, because with this house the story is half the product.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `An ila menu rewards the therapist who reads it properly. On day one in any ila spa, learn the flagship first: the Kundalini Back Massage is the treatment the house is most famous for, an energy-led ritual working up the spine with marma point therapy and the chakras to release deep tension. Then map the facials, the body rituals and the enhancements, noting durations, protocols and products, and ask the senior therapist rather than guessing.

Delivery is where ila lives or dies. The house style is slow, meditative and energy-led: treatments draw on traditions such as marma therapy, chakra balancing, sound and breath, and the therapist's own calm presence is considered part of the treatment. Ground yourself before the guest arrives, keep the pace unhurried, and honour the ritual openings and closings completely, because they are the brand.

Retail is the ritual continued at home. Narrate the products as you use them, telling the provenance story in one sentence, then prescribe two or three linked directly to the treatment: the bath salts that extend the body ritual, the face oil the guest felt melting in. Upsell paths are natural: the facial guest who loved the back work is a Kundalini Back Massage guest next visit.

Finally, protect the house. Follow the protocols faithfully, use correct products and quantities, report low stock, flag schedule pressure rather than trimming the ritual. On an ila shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'ila Spa was founded by...',
      options: [
        'A Swiss laboratory group',
        'Denise Leicester, a former nurse, aromatherapist and yoga teacher',
        'A Parisian perfumer in the 1950s',
        `A hotel chain's in-house development team`,
      ],
    },
    {
      q: 'The name ila comes from...',
      options: [
        `The founder's initials`,
        'An Italian island',
        'A Norse goddess',
        'Sanskrit, a word associated with the earth',
      ],
    },
    {
      q: `ila's philosophy of beyond organic means...`,
      options: [
        'Purity beyond certification: wild-harvested and artisan-sourced ingredients, chosen for their natural energy and blended by hand',
        'Organic certification is the only thing that matters',
        'Synthetic actives boosted with a few organic extracts',
        'Organic packaging around conventional formulas',
      ],
    },
    {
      q: 'Ingredients closely associated with ila include...',
      options: [
        'Petrolatum and mineral oil',
        'Marine collagen and caffeine',
        `Damask rose otto, Himalayan salt crystals and argan oil from women's co-operatives`,
        'Retinol and glycolic acid peels',
      ],
    },
    {
      q: `ila's treatment style draws on...`,
      options: [
        'High-frequency machines and microdermabrasion',
        'Energy-led traditions such as marma point therapy, chakra balancing, sound and breath',
        'Sports massage techniques only',
        'Express treatments of under thirty minutes',
      ],
    },
    {
      q: 'The Kundalini Back Massage, a famous ila signature, centres on...',
      options: [
        'The spine, working with marma points and the chakras to release deep tension and restore energy flow',
        'The feet and lower legs',
        'A machine-led back peel',
        'A fifteen-minute seated shoulder rub',
      ],
    },
    {
      q: 'The strongest way to retail the ila range is...',
      options: [
        'Present the full range at the till',
        'Discount whatever is overstocked',
        'Leave retail entirely to reception',
        'Prescribe two or three products linked to the ritual just delivered, telling each provenance story in one sentence',
      ],
    },
    {
      q: 'Protecting the ila brand on shift means...',
      options: [
        'Improvising your own version of the protocols',
        'Trimming the opening ritual when running late',
        'Following protocols faithfully, using correct products and quantities, reporting low stock and flagging schedule pressure rather than cutting the ritual',
        `Substituting another brand's products when stock runs low`,
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist what made ila different and she told me about the founder, a nurse who believed skin and spirit heal together, and the Cotswolds room where everything is blended by hand. I stopped comparing prices and started listening."`,
      helpsYou: `Spas that carry ila choose therapists who can carry its story. Being able to tell the founding story and state the beyond-organic USP in one calm sentence is what convinces an interviewer, a spa director or a sceptical guest that you belong to the house.`,
      tips: [
        'Learn the one-breath USP: beyond-organic, hand-blended, energy-led, created by a healer',
        'Remember the name: ila is Sanskrit, a word associated with the earth',
        'Match the house voice - words like purity, energy, restore and transformation',
      ],
    },
    {
      guestView: `"She told me the rose oil in one sentence - where it comes from, why it is precious, how it would feel - and then I felt exactly what she had described. I bought it before I reached reception."`,
      helpsYou: `With ila, the provenance story is half the product, and therapists who can tell it honestly outsell those who memorise ingredient lists. Hero fluency in the rose otto, the Himalayan salts and the argan story lets you walk onto an ila shift and belong within an hour.`,
      tips: [
        `Heroes first: damask rose otto, Himalayan salt crystals, argan oil from women's co-operatives`,
        'Tell provenance in one sentence: where it comes from, what it does, how it feels',
        'Use the heroes on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The treatment moved up my spine so slowly I lost track of time, and the therapist's stillness was part of it. Afterwards she suggested the bath salts so I could keep a little of it at home. I keep a jar by the bath now."`,
      helpsYou: `Therapists who can deliver the ila energy-led style, retail from the treatment and build honest upgrade paths are the ones luxury spas rebook and promote - and calm, grounded delivery is a skill that follows you to every house you ever work for.`,
      tips: [
        'Day one: learn the flagship Kundalini Back Massage before anything else',
        'Ground yourself before each guest - your presence is part of the treatment',
        'Prescribe two or three products, linked to the ritual just delivered',
        'Protect the ritual: flag schedule pressure, never trim the openings',
      ],
    },
  ],
}
