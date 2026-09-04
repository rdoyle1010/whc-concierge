// Talent House Academy brand masterclass: Bamford. Independent Talent House training - not
// affiliated with or endorsed by Bamford. Answer key lives in
// academy-more-answers/bamford-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'bamford-masterclass',
  title: 'Bamford Masterclass',
  tagline: `The English organic house of countryside calm - its story, its botanicals, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Bamford is one of the most distinctive British houses in luxury wellness, and its story begins on a farm rather than in a laboratory. The brand was created by Carole Bamford, the founder of Daylesford Organic, the celebrated organic farm in the Cotswolds. Long before wellness became fashionable, she championed organic farming and a slower, more considered way of living, and Bamford grew directly out of that conviction.

That origin shapes everything. Where many houses lead with clinical actives or marine science, Bamford leads with the English countryside: botanically led body care and skincare made with organic and natural ingredients, and a deep commitment to sustainability and craftsmanship. The house's wellbeing philosophy is genuinely holistic, connecting mind, body and spirit through touch, breath and nature, and its spa spaces have grown from the Haybarn spa at Daylesford into Bamford wellness spas within luxury hotels.

The tone of voice is quiet, grounded and natural. Bamford speaks of nurture, balance, nature and mindfulness, never of aggressive results or percentages.

The USP a therapist should be able to state in one breath: Bamford offers organic, botanically led skincare and body care born from an English organic farm, delivered through mindful, holistic treatments that reconnect guests with nature. A guest can buy natural products in many places; at a Bamford spa they are buying provenance, integrity and calm they can feel.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `A Bamford therapist earns credibility through the heroes, the products guests remember and ask for by name.

Start with the Geranium All Rounder, the house's much-loved multi-purpose balm, a do-everything product for dry patches, hands, lips and anywhere skin needs comfort. It is one of the easiest honest recommendations in the range because almost every guest has a use for it.

Next, learn the mood-led aromatherapy collections. The B Silent range is designed for night-time and sleep, traditionally including favourites such as a pillow mist and a temple balm, and it gives you a natural answer for the guest who mentions poor sleep in consultation. The B Vibrant collection sits at the opposite pole, created to uplift and energise. Alongside these sit the botanic bath and body oils that carry the brand's aromatherapy heart.

The ingredient story is the philosophy in a bottle: organic and natural botanicals, essential oils chosen for mind as well as skin, and formulations developed with genuine care for sourcing and sustainability. Many Bamford formulations carry independent organic certification from the Soil Association, and the wider business holds B Corp certification, credentials worth knowing because discerning guests increasingly ask.

Where you are unsure of a specific formulation, never invent it. Learn heroes first, one category at a time, use the testers and the house's own materials, and use the key products yourself until your conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Every Bamford spa's menu differs in detail, so the day one discipline is a method. Learn the signature treatment first, because it is the purest expression of the house: Bamford treatments are traditionally holistic and deeply mindful, drawing on flowing massage, breathwork and grounding touch rather than machine-led results. Then map the facials, the body treatments and the enhancements, noting duration, protocol, products used and who each suits. Read the protocols the spa holds and ask the senior therapist rather than guessing in front of a guest.

Delivery is where the brand lives. The Bamford style is slow, present and nature-connected: unhurried openings, attention to breath, generous flowing bodywork and a calm, grounded manner throughout. Never rush a Bamford ritual to rescue a late column; the calm is the product.

Retail is the countryside taken home. Narrate key products during treatment, then prescribe two or three at the close, linked to what the guest experienced and what they told you: the B Silent pillow mist for the guest who mentioned sleepless nights, the Geranium All Rounder as the everyday companion, the body oil that scented their hour of calm.

Upsell paths are natural and honest: the facial guest who melted during the massage phases suits the fuller signature body experience next visit; the sixty-minute guest carrying real tension benefits from ninety.

Finally, protect the standards: correct products in correct quantities, faithful protocols, immaculate testers, stock reported early. On a Bamford shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Bamford was founded by...',
      options: [
        'A Swiss cosmetic chemist',
        'Carole Bamford, the founder of Daylesford Organic',
        'A Parisian perfumer in the 1950s',
        'A hotel group seeking an own-label range',
      ],
    },
    {
      q: `The roots of the Bamford brand lie in...`,
      options: [
        'Marine research on the Irish coast',
        'A department store beauty counter',
        'English organic farming at Daylesford in the Cotswolds',
        'A medical aesthetics clinic',
      ],
    },
    {
      q: `Bamford's philosophy is best described as...`,
      options: [
        'Connection to nature: organic, botanically led products and holistic wellbeing for mind, body and spirit',
        'Clinical technology and machine-led results',
        'Maximum-strength actives at mass-market prices',
        'Fragrance first, skincare second',
      ],
    },
    {
      q: `The house's famous multi-purpose balm, loved for dry patches, hands and lips, is...`,
      options: [
        'The Marine Cream',
        'The Pink Scalp Mud',
        'The Tri-Enzyme Balm',
        'The Geranium All Rounder',
      ],
    },
    {
      q: 'The B Silent collection is designed for...',
      options: [
        'Morning energy',
        'Night-time and sleep, traditionally including a pillow mist and a temple balm',
        'Post-gym recovery',
        'Sun protection',
      ],
    },
    {
      q: `Which certifications support Bamford's organic and ethical claims?`,
      options: [
        'Soil Association organic certification on many formulations, and B Corp certification of the business',
        'A Michelin star',
        'FDA drug approval',
        'None - the claims are purely marketing',
      ],
    },
    {
      q: 'Your first professional duty on day one in a Bamford spa is...',
      options: [
        'Rearrange the retail wall to your taste',
        'Improvise treatments from your general training',
        'Learn the menu starting with the signature treatment, read the protocols, and ask rather than guess',
        'Memorise every ingredient list before touching a guest',
      ],
    },
    {
      q: 'The strongest way to retail the Bamford range is...',
      options: [
        'Present the full range at the till',
        'Discount whatever is overstocked',
        'Leave retail entirely to reception',
        'Prescribe two or three products linked to the treatment delivered and what the guest told you, such as B Silent for the poor sleeper',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1590490360836-2e3b067c082b?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa chose Bamford and the therapist told me about the farm - a brand that began with organic fields in the Cotswolds, not a lab. Everything about the treatment suddenly made sense, and I believed every word she said afterwards."`,
      helpsYou: `Bamford spas hire and rebook therapists who can tell the provenance story with quiet confidence. Being able to state the farm-to-treatment-room heritage and the one-breath USP is what makes an interviewer, and a sceptical guest, relax.`,
      tips: [
        'Learn the one-breath USP: organic, botanically led, born from an English organic farm, delivered mindfully',
        'Remember the origin: Daylesford Organic and the Cotswolds countryside, not a retail counter',
        'Match the house voice - quiet, grounded words like nurture, balance and nature',
      ],
    },
    {
      guestView: `"She used the balm on my hands and said, this is the one everyone keeps in their bag. Then she noticed I'd mentioned bad sleep and showed me the pillow mist. I went home with both, and it never once felt like being sold to."`,
      helpsYou: `Hero fluency is the fastest credibility in any new house. Knowing the Geranium All Rounder, the B Silent night-time collection and the botanic oils cold means you can walk onto a Bamford shift and belong within an hour.`,
      tips: [
        'Heroes first: the Geranium All Rounder, B Silent, B Vibrant and the botanic bath and body oils',
        'Map moods to guests: B Silent for the poor sleeper, B Vibrant for the depleted',
        'Know the credentials guests ask about: Soil Association organic certification and B Corp',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"Nothing was rushed. She moved slowly, asked me to breathe, and the whole hour felt like lying in a field in summer. At the end she wrote down two products and told me not to buy a third. I rebooked before I left."`,
      helpsYou: `Therapists who can deliver the mindful Bamford style, retail from the treatment and build honest upgrade paths are the ones hotels rebook, promote and trust with their most discerning wellness guests.`,
      tips: [
        'Day one: learn the signature treatment before anything else, and ask rather than guess',
        'Protect the calm - slow openings and breathwork are the brand, never the bits to trim',
        'Prescribe two or three products linked to the treatment and the consultation',
        'Upsell along natural paths: loved the massage phases means the fuller signature experience next visit',
      ],
    },
  ],
}
