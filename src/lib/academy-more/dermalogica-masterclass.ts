// Talent House Academy brand masterclass: Dermalogica. Independent Talent House training - not
// affiliated with or endorsed by Dermalogica. Answer key lives in
// academy-more-answers/dermalogica-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'dermalogica-masterclass',
  title: 'Dermalogica Masterclass',
  tagline: `The skin health house - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Dermalogica is one of the most recognised professional skincare houses in the world, and it began not with a product but with a classroom. Jane Wurwand, a British-trained skin therapist, founded The International Dermal Institute in Los Angeles in 1983 as a postgraduate education centre, because she believed the training available to working therapists fell far short of what real skin needed. Dermalogica itself followed in 1986, created to be the product line that education demanded: a professional range developed by skin therapists, for skin therapists.

The philosophy is captured in the phrase the house is famous for: skin health, not beauty. Dermalogica has never positioned itself as pampering or glamour. It talks about the skin as something to be understood, analysed and improved, and about the therapist as a professional expert rather than a pamperer. The original formulations were built around leaving out common irritants, famously avoiding ingredients such as lanolin, mineral oil, SD alcohol and artificial colours and fragrances.

The USP, stated in one breath: Dermalogica is professional-grade skincare born from therapist education, delivering personalised skin health through expert analysis rather than beauty promises. In a Dermalogica room, the diagnosis is the luxury. A therapist on a Dermalogica account is expected to analyse confidently, prescribe precisely and educate the guest, because education is where the whole house began.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Dermalogica's credibility with guests rests on a set of hero products that many people know by name before they ever meet a therapist.

Start with Daily Microfoliant, the house's iconic rice-based daily powder exfoliant, activated with water in the hands; it is one of the most asked-for products in professional skincare. Then Precleanse, the oil-based first step of the double cleanse Dermalogica championed: it melts away sunscreen, make-up and surface oil so the second cleanser can actually treat the skin. Special Cleansing Gel is the long-standing everyday second cleanse for many skins. Around these sit well-known families: the UltraCalming range for sensitised skin, moisturisers such as Skin Smoothing Cream, daily protection with broad-spectrum SPF, and targeted serums for brightening and ageing concerns.

The ingredient story follows the philosophy. Dermalogica formulates around recognised actives, such as hydroxy acids for exfoliation, vitamin C for brightness, hyaluronic acid for hydration and oat-derived soothers for sensitised skin, while avoiding the irritants the house built its name on excluding. Narrate simply: what it contains, what it does, how the skin will respond.

Where you are not certain of a current formulation, never invent it. Learn the range the professional way: heroes first, then one category at a time, using testers, the brand's own training materials, and the products on your own skin until conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A Dermalogica menu is built around personalisation, so on day one your job is to learn how the spa structures it. Most Dermalogica menus are led by customised professional skin treatments, commonly offered in shorter and longer formats, in which the therapist designs the facial around the analysis rather than selling fixed named facials. Map the menu in layers: the core customised treatments, any advanced or resurfacing options the venue offers, and the add-ons. Note durations, protocols and products used, and ask the senior therapist rather than guessing.

Delivery is diagnostic. The signature of the house is Face Mapping, Dermalogica's zone-by-zone analysis of the face, with findings explained aloud and recorded as a prescription. Analyse first, narrate your findings in plain language, treat what you found, and teach as you go: the guest should leave understanding their skin better than when they arrived.

Retail flows directly from the analysis. Prescribe two or three products linked explicitly to your Face Mapping findings, write the prescription down, and be honest about what not to buy. Upsell paths are natural: the shorter treatment guest with real concerns benefits from the longer format; a skin goal with a timeline suits a course of treatments with home care between.

Finally, protect the house: follow protocols, use correct quantities, report low stock, and never skip the analysis under time pressure. The analysis is the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Dermalogica was founded by...',
      options: [
        'A French pharmacist in Paris',
        'Jane Wurwand, a British-trained skin therapist, in Los Angeles in 1986, three years after she founded The International Dermal Institute',
        'A Swiss laboratory in the 1950s',
        'A Hollywood make-up artist',
      ],
    },
    {
      q: `Dermalogica's core philosophy is best described as...`,
      options: [
        'Pampering and glamour above all',
        'Medical aesthetics and injectables',
        'Skin health, not beauty - the skin analysed, understood and improved by a professional expert',
        'Fragrance-led sensorial luxury',
      ],
    },
    {
      q: 'Face Mapping is...',
      options: [
        `Dermalogica's signature zone-by-zone analysis of the face, with findings explained aloud and recorded as a prescription`,
        'A massage sequence for the face',
        'A retail merchandising layout',
        'A make-up contouring technique',
      ],
    },
    {
      q: `Dermalogica's original formulations were famous for...`,
      options: [
        'Containing the highest possible fragrance levels',
        'Using only marine ingredients',
        'Being mixed fresh in the treatment room',
        'Leaving out common irritants such as lanolin, mineral oil, SD alcohol and artificial colours and fragrances',
      ],
    },
    {
      q: 'Daily Microfoliant is...',
      options: [
        'A heavy overnight cream',
        `The house's iconic rice-based daily powder exfoliant, activated with water in the hands`,
        'A self-tanning lotion',
        'A professional-only peel never sold at retail',
      ],
    },
    {
      q: 'The role of Precleanse is...',
      options: [
        'The oil-based first step of the double cleanse, melting away sunscreen, make-up and surface oil so the second cleanser can treat the skin',
        'A toner used after moisturiser',
        'A scalp treatment',
        'A substitute for SPF',
      ],
    },
    {
      q: 'The strongest way to retail Dermalogica is...',
      options: [
        'Present the full range at the till',
        'Discount whatever is overstocked',
        'Prescribe two or three products linked explicitly to your Face Mapping findings, written down, with honesty about what not to buy',
        'Leave retail entirely to reception',
      ],
    },
    {
      q: 'Under time pressure on a Dermalogica shift, the one thing you must never skip is...',
      options: [
        'The music',
        'The mask phase',
        'The goodbye',
        'The skin analysis - it is the signature of the house and the foundation of the treatment and the prescription',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa used Dermalogica and the therapist told me it was founded by a skin therapist who started with a training school, not a product. That one sentence made me trust every word she said about my skin afterwards."`,
      helpsYou: `Dermalogica accounts hire for diagnostic confidence. Being able to tell the founding story, explain the skin health philosophy and state the USP in one sentence tells an interviewer, or a guest, that you already think the way the house thinks.`,
      tips: [
        'Learn the one-breath USP: professional skincare born from therapist education, delivering skin health through expert analysis',
        'Remember the sequence: The International Dermal Institute in 1983, Dermalogica in 1986',
        'Match the house voice - expert, plain-spoken, educational, never fluffy',
      ],
    },
    {
      guestView: `"She put a little powder in her hands, added water and told me exactly what the rice enzymes were doing as she worked. I went home with the Microfoliant and the Precleanse, and it never once felt like being sold to."`,
      helpsYou: `Hero-product fluency is the fastest credibility in a new house. Knowing Daily Microfoliant, Precleanse and the double cleanse story cold means you can walk onto a Dermalogica shift and answer the questions guests actually ask.`,
      tips: [
        'Heroes first: Daily Microfoliant, Precleanse, Special Cleansing Gel, the UltraCalming family',
        'Tell ingredient stories simply: what it contains, what it does, how the skin responds',
        'Use the heroes on your own skin - guests read conviction in seconds',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"She examined my face zone by zone and explained what she found before a single product touched me. Then she wrote me a prescription of three things and told me not to buy a fourth. I have rebooked every month since."`,
      helpsYou: `Therapists who deliver the analysis-first Dermalogica style, prescribe from findings and build honest upgrade paths are the ones managers trust with the column and the brand's trainers notice on shift.`,
      tips: [
        'Day one: learn how the spa structures its customised skin treatments before anything else',
        'The analysis is the brand - never skip Face Mapping to rescue a late-running column',
        'Prescribe two or three products from findings, written down, with what not to buy',
        'Upsell along natural paths: shorter format to longer, single treatment to a course with home care between',
      ],
    },
  ],
}
