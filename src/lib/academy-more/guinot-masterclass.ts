// Talent House Academy brand masterclass: Guinot. Independent Talent House training - not
// affiliated with or endorsed by Guinot. Answer key lives in
// academy-more-answers/guinot-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'guinot-masterclass',
  title: 'Guinot Masterclass',
  tagline: `The French salon institution - its science, its machines, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Guinot is one of the great French professional skincare houses, and its story begins in the treatment room. The brand was founded in France in the 1960s by René Guinot, a chemist whose defining invention was a facial that used gentle electrical currents to carry active ingredients into the skin. That treatment, originally known as Cathiodermie and later renamed Hydradermie, became one of the best-known salon facials in the world and remains the beating heart of the brand.

The house was later acquired and led by Jean-Daniel Mondin, a doctor of pharmacy, under whom Guinot grew into an international group with its own laboratories in France and a sister brand, Mary Cohr. That pharmacy-led ownership shaped the house's identity: scientific, methodical and proudly professional.

The philosophy is that beauty is a profession. Guinot has always distributed through trained beauty salons, institutes and spas rather than supermarkets or ordinary high-street shelves, because the house believes real skin results come from a qualified therapist delivering a precise method, supported by professional products at home.

The USP in one breath: Guinot offers methodical, machine-assisted and manual French facial treatments, developed in its own laboratories, delivered exclusively by trained professionals, with results a guest can see. Where some houses sell atmosphere, Guinot sells visible outcomes achieved through technique.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Guinot credibility starts with the treatment serums and the retail icons, because guests meet the house through both.

In the treatment room, Hydradermie works with personalised treatment gels, chosen for the guest's skin during consultation and driven into the skin by gentle ionisation. This personalisation is central: the machine is the method, but the choice of actives is the prescription.

On the retail shelf, start with the icons. Longue Vie Cellulaire, often called the youth cream of the house, is famous for its Cellular Life Complex of 56 active ingredients drawn from cell biology, including amino acids and coenzymes. Crème Hydrazone is a much-loved hydration hero. The Age Summum and Lift Summum families carry the anti-ageing story, with ingredients such as pure vitamin C and hyaluronic acid that also star in the professional facials of the same names.

The ingredient philosophy is scientific rather than botanical romance: Guinot speaks of actives, concentrations and mechanisms, formulated in its own French laboratories. Narrate products in that spirit: what the active is, what it does, and what the guest will see.

Where a specific formulation detail is not certain, never invent it. Learn heroes first, one category at a time, use the house training materials and testers, and try the key products yourself. Honest fluency beats confident guessing every time.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `On day one in a Guinot salon or spa, learn the flagship first: Hydradermie, the machine facial the house is famous for, with its ionisation and high-frequency stages and personalised gels. Then map the rest of the menu in layers: Hydradermie Lift, which uses gentle currents to stimulate the facial muscles for a lifted look; the manual facials, led by Age Summum with its pure vitamin C and hyaluronic acid; radiance treatments such as the double-peel Beauté Neuve; and the body and aromatic treatments. For each, note duration, protocol, machine settings where relevant, and the products used - and ask the senior therapist rather than guessing.

Delivery is precise. The Guinot style is methodical and results-led: correct protocol order, correct machine technique, correct timings. Machines must be checked, cleaned and maintained, because a therapist fumbling with rollers destroys the confidence the method is built on.

Retail is the prescription that continues the result. Link two or three products directly to the treatment and the skin you analysed, with the matching retail lines, such as the Hydrazone or Age Summum creams after their namesake concerns, as your most natural links.

Upsell paths follow results: a single facial guest becomes a course-of-treatments guest, and a manual facial guest with ageing concerns is a natural Hydradermie Lift or Age Summum guest. Protect the brand on every shift: full protocols, correct quantities, maintained machines, reported stock, and never a shortened method to rescue a late column.`,
    },
  ],
  quiz: [
    {
      q: 'Guinot was founded...',
      options: [
        'In Italy by a fashion designer',
        'In France in the 1960s by René Guinot, a chemist',
        'In the USA by a dermatologist in the 1990s',
        'In Switzerland by a hotel group',
      ],
    },
    {
      q: `A defining part of Guinot's USP is that its products are...`,
      options: [
        'Sold mainly through supermarkets',
        'Available only online',
        'Sold in duty-free shops first',
        'Distributed through trained professional salons, institutes and spas, because beauty is treated as a profession',
      ],
    },
    {
      q: `Guinot's famous machine facial, Hydradermie, was originally known as...`,
      options: [
        'Cathiodermie',
        'Beauté Neuve',
        'Age Summum',
        'Hydra Peeling',
      ],
    },
    {
      q: 'The Hydradermie method works by...',
      options: [
        'Steam and manual extractions only',
        'Chemical peeling with strong acids',
        'Using gentle ionisation and high-frequency currents to carry personalised treatment gels into the skin',
        'Microneedling the skin surface',
      ],
    },
    {
      q: 'Age Summum is best described as...',
      options: [
        'A body wrap',
        'A manual anti-ageing facial featuring pure vitamin C and hyaluronic acid',
        'A scalp treatment',
        'A self-tanning service',
      ],
    },
    {
      q: 'Longue Vie Cellulaire is famous for...',
      options: [
        'Its Cellular Life Complex of 56 active ingredients drawn from cell biology',
        'Being fragrance-led rather than active-led',
        'Containing hand-harvested seaweed',
        'Being a professional-only product with no retail version',
      ],
    },
    {
      q: 'The strongest way to retail the Guinot range is...',
      options: [
        'Offer a discount on whatever is overstocked',
        'Present the full shelf at reception',
        'Prescribe two or three products linked directly to the treatment delivered and the skin you analysed',
        'Leave recommendations to the guest',
      ],
    },
    {
      q: 'Protecting the Guinot brand on shift means...',
      options: [
        'Improvising your own version of the protocols',
        'Skipping machine stages when running late',
        'Using more product than the protocol states to impress guests',
        'Full protocols, correct quantities, maintained machines, reported stock and never a shortened method',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the salon carried Guinot and the therapist told me about the chemist who invented a machine facial in the 1960s, and why the brand only sells through professionals. I stopped seeing a cream and started seeing a method."`,
      helpsYou: `Guinot salons and spas hire for method and precision. Being able to tell the founding story, explain the professional-only philosophy and state the USP in one sentence marks you out instantly at interview and with knowledgeable guests.`,
      tips: [
        'Learn the one-breath USP: methodical French treatments, laboratory-developed, professional-only, visible results',
        `Remember the heritage: the house grew from a treatment invented by a chemist, not from a retail counter`,
        'Match the house voice - scientific, precise and confident about results',
      ],
    },
    {
      guestView: `"She explained the gel she had chosen for my skin and why, then named the cream with the 56 actives when I asked what to use at home. Every answer was specific. I bought it because she clearly knew it."`,
      helpsYou: `Hero-product fluency is the fastest credibility in a new house. Knowing Longue Vie Cellulaire, Hydrazone and the Summum families, and the personalised gels of Hydradermie, lets you walk onto a Guinot column and belong within an hour.`,
      tips: [
        'Heroes first: Longue Vie Cellulaire, Crème Hydrazone, the Age Summum and Lift Summum families',
        'Tell ingredient stories in the house spirit: the active, what it does, what the guest will see',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The machine work was seamless - she never fumbled, never hesitated, and my skin looked visibly brighter in the mirror afterwards. Then she wrote down two products and booked my next visit in the same breath."`,
      helpsYou: `Therapists who deliver the Guinot method precisely, retail from genuine analysis and build honest course-of-treatments paths are the ones salons trust with machines, regulars and promotion.`,
      tips: [
        'Day one: learn Hydradermie first, then map the menu in layers',
        'Precision is the brand - protocol order, machine technique and timings, never improvised',
        'Prescribe two or three products, linked to the treatment and your analysis',
        'Upsell along natural paths: single facial to course, manual facial to Hydradermie Lift where ageing is the concern',
      ],
    },
  ],
}
