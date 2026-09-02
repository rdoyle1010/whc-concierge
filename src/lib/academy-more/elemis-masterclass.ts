// Elemis Masterclass - a WHC Academy brand masterclass pack.
// Independent WHC training; not affiliated with or endorsed by Elemis.

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'elemis-masterclass',
  title: 'Elemis Masterclass',
  tagline: `The British house of results-driven naturals - speak it like a native`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Elemis is one of the great British skincare success stories: a house founded in London in 1989 and built, unusually, by people from the therapy room rather than the boardroom. Co-founder Noella Gabriel is a therapist by background, and that origin still defines the brand. Elemis treatments are famous for serious, skilled hands-on work, and its products were designed to be used by professionals on real skin before they ever reached a shelf.

The philosophy is a deliberate marriage of nature and science. Elemis builds its formulas around marine and plant actives, then frames them in the confident, clinical language of visible results and independent testing. Where some houses sell ritual and escape, Elemis sells outcomes you can see in the mirror, delivered with the warmth and touch of a therapist-led brand.

That positioning is the USP: results-driven natural skincare, delivered through touch. Elemis grew through luxury hotel spas and a long association with spas at sea, joined the L'Occitane group in 2019, and welcomes guests at its House of ELEMIS flagship in Mayfair. For a therapist, fluency in this house means holding both halves at once: talk results with confidence, and deliver them with genuinely exceptional hands.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Elemis organises its skincare into ranges built around skin concerns, and learning that architecture is the fastest route to fluency. Pro-Collagen is the anti-ageing flagship, the family guests ask for by name; its icons include the Marine Cream and the cult Cleansing Balm. Dynamic Resurfacing is the smoothing, texture-refining range built on gentle enzyme technology. Superfood is the glow and nourishment story, rich in nutrient-dense plant ingredients with a prebiotic angle. On the body side, the frangipani monoi collection is a signature scent guests remember for years.

The most famous ingredient story in the house belongs to Pro-Collagen: Padina pavonica, a Mediterranean algae, is the marine active at the heart of the range, and telling that story well is a core Elemis retail skill. Guests do not remember ingredient lists; they remember a therapist who explained why a marine plant earned its place in a luxury cream.

Where you are unsure of a specific claim, never improvise one. The professional method is to learn the range architecture, use the heroes yourself, tell the ingredient stories you know to be true, and take the brand's own training for depth. Confident, accurate knowledge sells; invented detail eventually embarrasses you in front of a guest who knows better.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Your first task in any Elemis spa is to study the treatment menu and map every treatment to its range: which facial belongs to Pro-Collagen, which to Superfood or Dynamic Resurfacing, and which sit in the technology tier. Elemis is known for pairing skilled hands-on facials with machine-assisted options, the concept it made famous with BIOTEC, so know which treatments are touch-led and which add technology.

Delivering the signature style means two things at once: hands that work deeply and beautifully, and language that is warm but outcome-led. An Elemis guest expects a visible result, named confidently.

Retail follows the treatment. Narrate the heroes as you use them, then prescribe two or three products from the same range as the facial, linked to what you found. The upsell paths are natural: from a classic facial to its advanced or technology version, from face to body with a scalp or back addition, and from a one-off visit to a course that matches the skin's renewal cycle.

Finally, protect the house on shift: follow the trained protocol and dosages exactly, keep the retail wall and testers immaculate, report low stock rather than substituting, and never freelance a protocol you were not trained in. The brand's reputation is in your hands, literally.`,
    },
  ],
  quiz: [
    {
      q: 'Elemis is best described as...',
      options: [
        'A French pharmacy brand focused on minimalist dermatology',
        'A British house of results-driven natural skincare, pairing marine and plant actives with confident, clinically framed language',
        'A medical aesthetics clinic chain',
        'A budget high-street range',
      ],
    },
    {
      q: `The most famous Elemis product family is...`,
      options: [
        'Diamond Lift',
        'Optimal Skin',
        'Pro-Collagen, including the Marine Cream and the Cleansing Balm',
        'Seaweed Bath',
      ],
    },
    {
      q: 'The signature marine active at the heart of Pro-Collagen is...',
      options: [
        'Padina pavonica, a Mediterranean algae',
        'Dead Sea salt',
        'Spirulina',
        'Hand-harvested Irish seaweed',
      ],
    },
    {
      q: 'The BIOTEC concept is known for...',
      options: [
        'Machine-only facials with no hands-on work',
        'Aromatherapy massage rituals',
        'A waxing technique',
        'Pairing skilled hands-on facial work with technology',
      ],
    },
    {
      q: `A defining fact about the founding of Elemis is that...`,
      options: [
        'It was founded by a dermatologist in Paris',
        'It was co-founded in London in 1989 with a therapist, Noella Gabriel, at its heart - a therapist-led heritage',
        'It began as a cruise line',
        'It started as a fragrance house',
      ],
    },
    {
      q: 'When retailing Elemis, the strongest link is between...',
      options: [
        'The products you used in the treatment and what you found in the guest’s skin',
        'Whatever is on promotion this month',
        'The most expensive item in the cabinet',
        'Products the guest already owns',
      ],
    },
    {
      q: 'Your first task on day one in an Elemis spa is to...',
      options: [
        'Rearrange the retail wall to your taste',
        'Learn the till system and nothing else',
        'Study the treatment menu and map each treatment to its range, its heroes and its upgrade options',
        'Improvise your own version of the facials',
      ],
    },
    {
      q: 'Protecting the brand’s standards on shift means...',
      options: [
        'Improvising protocols when busy',
        'Substituting products freely when stock runs low',
        'Skipping the brand training if you are experienced',
        'Following trained protocols and dosages exactly, keeping displays immaculate, and reporting stock issues rather than substituting',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa chose Elemis and she told me the story - founded by a therapist, British, obsessed with results you can see. By the end I trusted the brand because I trusted her."`,
      helpsYou: `Spas that carry Elemis want therapists who can speak the house fluently on day one. Knowing the founding story, the philosophy and the USP is exactly what hiring managers and agency coordinators listen for.`,
      tips: [
        'Learn the one-sentence USP: results-driven natural skincare, delivered through touch',
        'Remember the therapist-led heritage - it explains everything about the brand',
        'Match your tone to the house: warm, confident and outcome-led',
      ],
    },
    {
      guestView: `"She told me about the Mediterranean algae in the Marine Cream while she was massaging it in. I could feel the product and hear the story at the same time. I bought it on the way out."`,
      helpsYou: `Hero-product fluency is the difference between a therapist who retails and one who hopes. Guests ask about Pro-Collagen by name - being ready with the range map and the ingredient story turns questions into sales.`,
      tips: [
        'Learn the range architecture first: Pro-Collagen, Dynamic Resurfacing, Superfood, the body collections',
        'Master the Padina pavonica story - it is the house’s most famous ingredient tale',
        'Use the heroes yourself; conviction is audible',
        'Never invent a claim - say what you know and take the brand training for depth',
      ],
    },
    {
      guestView: `"After my facial she recommended the cream from the same range she had used, showed me my skin in the mirror, and mentioned the longer version with technology for next time. None of it felt like selling."`,
      helpsYou: `Menu mapping, linked retail and clean upsell paths are what let you walk into any Elemis spa, including agency shifts, and perform like a house-trained therapist from your first guest.`,
      tips: [
        'Day one: map every treatment on the menu to its range and its upgrade',
        'Prescribe two or three products from the range you just used, linked to findings',
        'Know the natural upgrades: classic to advanced, face to body, visit to course',
        'Protect the standard: exact protocols, exact dosages, report stock issues - never substitute',
      ],
    },
  ],
}
