// Talent House Academy brand masterclass: Sothys. Independent Talent House training - not
// affiliated with or endorsed by Sothys. Answer key lives in
// academy-more-answers/sothys-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'sothys-masterclass',
  title: 'Sothys Masterclass',
  tagline: `The Parisian house of the professional treatment - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Sothys is a French skincare and spa house with its roots in Paris. Its first formulas were developed in 1946 under Dr Hotz, whom the brand remembers as a spa treatment visionary and a keen Egyptologist; the name echoes the star the ancient Egyptians called Sothis, the brightest in their sky. In 1966 the Mas family acquired the company, and under Bernard Mas it grew into an international house while remaining in family hands, with the next generation joining the business in 1999.

Two places anchor the story. L'Institut Sothys at 128 rue du Faubourg Saint-Honoré in Paris, opened in 1985 and reopened after a full redesign in 2023, is the brand's showcase. And Les Jardins Sothys at Auriac in Corrèze, created in 2006, is the garden the brand uses as a resource for its plant research, close to its production site.

The philosophy is unusually clear: Sothys describes itself as a house of institute and spa culture, sold through beauty institutes and spas, and it names the beauty therapist as the brand's own ambassador.

The USP in one breath: Sothys is a Parisian family house, built since 1946 around the professional treatment, where trained therapists deliver its own Digi-Esthétique method and prescribe the home routine that continues it.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Sothys has a broad range, so a therapist needs a map rather than a list. Organise it in families, each with its own story.

The hydrating line is built around the Hydrating Intensive serum, which the brand describes as pairing four sources of hyaluronic acid with two of its own patented actives, supported by a plumping mask and youth creams. The sensitive skin line is built on Spa Thermal Water, a spring water the brand sources from the Belgian Ardennes, in products such as the Soothing SOS serum and Soothing velvet cream. The illuminating line uses an organic white nettle extract that the brand grows and harvests in Corrèze. Sothys Organics is a separate range certified organic by Ecocert to the COSMOS standard and described as vegan, with organic birch sap as its signature ingredient. At the summit sits Secrets de Sothys, the prestige line, with Le Sérum and the precious La Crème 128.

Learn the heroes first, tell each ingredient story in one plain sentence, and attribute claims to the brand. Where you are unsure of a formulation, check the training materials rather than guessing.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Sothys is a treatment-first house, and its menu reflects that. On day one, learn the method before the menu: Digi-Esthétique is the brand's flagship application technique, developed for beauty therapists and drawing on acupressure and modelling movements from Eastern and Western traditions. It runs through the intensive facials and much of the body work.

Then map the menu in layers: the seasonal treatment, which Sothys renews every six months for the needs of the season; the intensive facials such as Hydrating and Youth; the prestige Soin Excellence Secrets de Sothys; the Sothys Organics facial; and the signature body journeys such as Indonésie Ancestrale and Sensations Orientales. Check durations, protocols and products against your own spa's menu, because every partner adapts it.

Retail in Sothys language is a prescription. The brand describes its therapist as the person who assesses the skin and recommends a tailored beauty programme, so close every treatment with two or three products linked to what you used and found. Upsell along honest paths, from a seasonal facial to a course of intensives, and protect the protocol on every shift.`,
    },
  ],
  quiz: [
    {
      q: 'Sothys traces its first formulas to...',
      options: [
        'A Swiss clinic in the 1980s',
        'Paris in 1946, under Dr Hotz, with the Mas family acquiring the company in 1966',
        'A British aromatherapist in 1993',
        'A Belgian pharmaceutical group in 1975',
      ],
    },
    {
      q: 'Where is the Sothys flagship institute that the brand treats as its showcase?',
      options: [
        'Place Vendôme, Paris',
        'Avenue Louise, Brussels',
        'Bond Street, London',
        '128 rue du Faubourg Saint-Honoré, Paris',
      ],
    },
    {
      q: 'Digi-Esthétique is best described as...',
      options: [
        `Sothys' own application method, combining acupressure and modelling techniques from Eastern and Western traditions`,
        'A device-led microcurrent facial',
        'A retail display standard',
        'A peel strength scale',
      ],
    },
    {
      q: `The Sothys sensitive skin line is built around...`,
      options: [
        'Dead Sea salt',
        'Volcanic clay from Auvergne',
        'Spa Thermal Water, which the brand sources from the Belgian Ardennes',
        'Organic birch sap',
      ],
    },
    {
      q: `How does the brand describe its Hydrating Intensive serum?`,
      options: [
        'A single high-strength retinol',
        'A mineral oil base with fragrance',
        'Four sources of hyaluronic acid combined with two Sothys patented actives',
        'A blend of essential oils grouped by mood',
      ],
    },
    {
      q: 'The Sothys seasonal treatment is...',
      options: [
        'Renewed every six months to answer the needs of the coming season',
        'The same protocol all year, renamed each quarter',
        'Only offered at Christmas',
        'A retail promotion with no treatment attached',
      ],
    },
    {
      q: `In the Sothys philosophy, retail at the end of a treatment is best framed as...`,
      options: [
        'A discount on whatever is overstocked',
        'A full tour of every range on the shelf',
        'Something reception handles alone',
        'A tailored home prescription of two or three products, linked to what the therapist used and found',
      ],
    },
    {
      q: 'Secrets de Sothys is...',
      options: [
        'A body sun care range',
        `The prestige line, including Le Sérum and La Crème 128`,
        'The certified organic range',
        'The professional-only peel range',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: '',
  lessons: [
    {
      guestView: `"I asked what Sothys actually was and the therapist told me: a Paris house since 1946, still family run, that builds everything around the treatment itself. It explained why the facial felt so precise."`,
      helpsYou: `Interviewers on a Sothys account want therapists who understand that this is a treatment-first, institute-born house. Telling the Paris story and the USP in one calm sentence shows you already belong.`,
      tips: [
        'Learn the anchors: 1946 in Paris, the Mas family from 1966, the Faubourg Saint-Honoré institute',
        'Remember the brand names the beauty therapist as its ambassador, so your hands are the product',
        'Keep the voice precise and elegant: expertise, results, prescription, ritual',
      ],
    },
    {
      guestView: `"She told me the serum held four kinds of hyaluronic acid and the soothing cream used a spring water from the Ardennes. Two sentences, no jargon, and I bought both."`,
      helpsYou: `Sothys has many lines. Therapists who can map the families, hydrating, soothing, illuminating, Organics and Secrets de Sothys, become the person colleagues ask on shift.`,
      tips: [
        'Map the range by family before learning single products',
        'Heroes first: Hydrating Intensive serum, the Spa Thermal Water line, Secrets de Sothys',
        'Attribute claims: "the brand describes it as..."',
        'Never invent an ingredient or a number; check the training file',
      ],
    },
    {
      guestView: `"The pressure points along my jaw and brow were unlike any facial I had had. At the end she wrote down three products and suggested the next seasonal treatment. It felt like a plan, not a sale."`,
      helpsYou: `Spas running Sothys rebook and promote therapists who deliver Digi-Esthétique faithfully, follow the protocol and turn every treatment into an honest prescription.`,
      tips: [
        'Learn Digi-Esthétique before anything else on the menu',
        'Know which seasonal treatment is running now and what replaces it next',
        'Prescribe two or three products, linked to the treatment just delivered',
        'Upsell along natural paths: seasonal facial to a course of intensives',
      ],
    },
  ],
}
