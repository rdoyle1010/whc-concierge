// Talent House Academy brand masterclass: Decleor. Independent Talent House training - not
// affiliated with or endorsed by Decleor. Answer key lives in
// academy-more-answers/decleor-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'decleor-masterclass',
  title: 'Decleor Masterclass',
  tagline: `The Parisian aromatherapy house - its oils, its rituals, and how to deliver them`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Decleor is one of the great names of professional aromatherapy skincare. The house was founded in Paris in 1974, decades before natural beauty became fashionable, by a small group of beauty and aromatherapy professionals convinced that essential oils could be serious skincare actives rather than mere fragrance. That conviction became the brand's identity and never left it.

For most of its life Decleor has been a treatment-room brand first: a professional house whose products were designed to be worked into the skin by trained hands, with retail as the ritual continued at home. It built a devoted following in salons and hotel spas across the UK, and generations of British therapists trained on its protocols. In 2014 the house was acquired by L'Oreal, having previously been owned by Shiseido, placing it inside one of the world's largest beauty groups.

The philosophy is aromatherapy-first: essential oils, chosen for their affinity with a particular skin need, sit at the heart of every formulation, supported by plant oils and botanical extracts. Treatments pair those oils with distinctive hands-on massage technique and conscious breathing.

The USP in one breath: Decleor offers professional aromatherapy skincare, built around essential-oil blends matched to individual skin needs and delivered through expert massage ritual. A guest can buy natural skincare anywhere; at a Decleor spa they are buying aromatherapy practised as a professional discipline.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Decleor's product logic is unusually easy to teach because the whole house follows one organising principle: each range answers a skin need, and each is led by a signature essential oil.

The icon of the house is the Aromessence concept: concentrated oil-serums built from blends of essential and plant oils, designed to be pressed into the skin before moisturiser. Aromessence is the word guests remember and the product family a Decleor therapist must know cold.

Then learn the oils and the needs they serve. Neroli, the essential oil of orange blossom, is the house's most famous signature and leads the hydration story, with the Hydra Floral range its best-known expression. Green mandarin is the oil of glow and youthful radiance. Fine lavender leads the firming and lifting story. Rose speaks to sensitive, easily flushed skin. Ylang ylang serves combination and oily skin in need of purifying balance.

The ingredient narrative is simple and honest: essential oils as targeted actives, supported by nourishing plant oils and botanical extracts, with formulations the house has long promoted as high in natural origin.

Where you are unsure of a specific formulation or claim, never invent it. Learn the range the professional way: heroes first, one category at a time, from the brand's own training materials, using the key products on your own skin until your conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A Decleor menu rewards preparation. On day one, read the menu in layers: identify the facials and which essential-oil range each is built on, the body treatments, and the enhancements that can extend a booking. For every treatment note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is the house's glory. A classic Decleor facial traditionally begins with the brand's renowned tension-releasing back massage, a beloved signature that tells the guest this will be no ordinary facial. Treatments are built on distinctive hands-on massage technique, with the Aromessence oil-serum applied through deliberate, pressure-conscious movements, often paired with guided breathing to settle the nervous system. Protect these signatures completely; they are the brand, and they are the first thing a rushed therapist is tempted to trim.

Retail is the ritual continued at home. Narrate the products as you use them, then prescribe two or three, led by the Aromessence the guest just experienced and linked to the skin need you found in consultation.

Upsell paths are natural: the facial guest who melted during the back massage suits a longer face-and-body booking next time; the sixty-minute guest with real tension benefits from ninety.

Finally, protect the standard. Correct products, correct quantities, faithful protocols, stock reported, and the ritual never diluted under time pressure. On a Decleor shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Decleor was founded...',
      options: [
        'In London in the 1990s as a retail-first brand',
        'In Paris in 1974, as a pioneer of aromatherapy-based professional skincare',
        'In Milan in the 1980s as a fashion-house spin-off',
        'In New York in 2005 as a clinical brand',
      ],
    },
    {
      q: 'The iconic Decleor product concept every therapist must know is...',
      options: [
        'A collagen ampoule system',
        'A machine-led facial technology',
        'Aromessence: concentrated oil-serums built from blends of essential and plant oils',
        'A mineral make-up line',
      ],
    },
    {
      q: `The house's most famous signature essential oil, leading its hydration story, is...`,
      options: [
        'Neroli, the essential oil of orange blossom, best known through the Hydra Floral range',
        'Peppermint',
        'Eucalyptus',
        'Tea tree',
      ],
    },
    {
      q: 'A classic Decleor facial traditionally begins with...',
      options: [
        'A retail presentation of the full range',
        'A steam and extraction sequence',
        'A machine analysis of the skin',
        `The brand's renowned tension-releasing back massage`,
      ],
    },
    {
      q: `Decleor's ranges are organised by...`,
      options: [
        'Price tier only',
        'Skin need, with each range led by a signature essential oil',
        'The year each product launched',
        'Bottle colour',
      ],
    },
    {
      q: 'Since 2014, Decleor has been owned by...',
      options: [
        `L'Oreal, which acquired the house from Shiseido`,
        'A private equity fund',
        'Its original founders',
        'A hotel group',
      ],
    },
    {
      q: 'The strongest way to retail the Decleor range is...',
      options: [
        'Present the whole shelf at the till',
        'Discount whatever is overstocked',
        'Prescribe two or three products, led by the Aromessence used in treatment and linked to the skin need you found',
        'Leave retail entirely to reception',
      ],
    },
    {
      q: 'You are unsure of a specific Decleor formulation detail mid-conversation. The professional move is...',
      options: [
        'Invent something plausible to sound confident',
        'Change the subject',
        'Tell the guest formulations are secret',
        'Say what you know, check the brand materials afterwards, and follow up with the accurate answer',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa used Decleor and the therapist told me the story - Paris, 1974, essential oils treated as serious skincare before anyone else took them seriously. From that moment I stopped seeing bottles and started seeing a philosophy."`,
      helpsYou: `Decleor accounts and heritage salons prize therapists who can tell the founding story and state the USP in one confident sentence. That fluency is what makes an interviewer relax, and what makes a knowledgeable guest trust every recommendation that follows.`,
      tips: [
        'Learn the one-breath USP: professional aromatherapy skincare, essential-oil blends matched to skin needs, delivered through expert massage ritual',
        'Anchor the dates: founded in Paris in 1974, acquired by the L Oreal group in 2014',
        'Match the house voice - warm, sensorial, aromatherapy-led rather than clinical',
      ],
    },
    {
      guestView: `"She pressed the oil-serum into my skin and told me, in one sentence, which essential oil it was built on and why it suited me. When I smelled the neroli I understood the whole brand. I went home with the serum."`,
      helpsYou: `Hero fluency is the fastest credibility in any house. Knowing the Aromessence concept cold, and being able to pair each signature oil with its skin need - neroli for hydration, green mandarin for glow, lavender for firming, rose for sensitivity - lets you belong on a Decleor shift within an hour.`,
      tips: [
        'Aromessence first: the oil-serum concept is the brand in a bottle',
        'Learn the oil-to-need map before any individual product list',
        'Use the heroes on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The facial began with a back massage. A back massage, before a facial! By the time she touched my face I was somewhere else entirely. That opening is why I have never let anyone else near my skin since."`,
      helpsYou: `Therapists who deliver the Decleor signatures faithfully - the back massage opening, the massage-led application, the breathing - and who retail from the treatment with honest upgrade paths are the ones heritage accounts rebook, request by name and promote.`,
      tips: [
        'Day one: map the menu by essential-oil range, flagship facial first',
        'Protect the signatures - the back massage opening is the brand, never the bit to trim',
        'Prescribe two or three products, led by the Aromessence just experienced',
        'Flag schedule pressure rather than quietly shortening the ritual',
      ],
    },
  ],
}
