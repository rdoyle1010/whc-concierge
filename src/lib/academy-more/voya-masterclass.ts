// Talent House Academy brand masterclass: VOYA. Independent Talent House training - not
// affiliated with or endorsed by VOYA. Answer key lives in
// academy-more-answers/voya-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'voya-masterclass',
  title: 'VOYA Masterclass',
  tagline: `The Irish house of hand-harvested seaweed - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `VOYA is the Irish house of organic seaweed, and its story begins not in a laboratory but on a beach. The brand comes from Strandhill, County Sligo, on the wild Atlantic coast of the west of Ireland, and it was built by the Walton family around a genuinely old tradition: hot seaweed bathing. At its height in the early twentieth century, Ireland had hundreds of seaweed bathhouses, where people soaked in hot seawater and freshly harvested seaweed for aching joints, tired muscles and skin complaints. The tradition all but disappeared, and the Walton family revived it, reopening hot seaweed baths at Strandhill in the early 2000s. The VOYA product house followed in the mid 2000s, taking the bathhouse experience into an organic skincare and body care range.

The philosophy is authenticity from the sea: wild seaweed, hand-harvested sustainably from the Atlantic shoreline so that the plants regrow, formulated into products with certified organic credentials and a deep commitment to sustainability.

The USP, said in one breath: VOYA offers certified organic, seaweed-based skincare and treatments built on hand-harvested wild Irish seaweed and a revived national bathing tradition. No other luxury house can tell that exact story, and the story is what the guest is buying.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `The hero ingredient of the entire house is seaweed itself, so start your product knowledge there. Seaweed is naturally rich in minerals, vitamins, amino acids and antioxidants, and it releases a silky, nourishing gel in warm water that softens and conditions the skin. Species matter: VOYA is famous for its use of hand-harvested wild Atlantic seaweeds such as Fucus serratus, the serrated wrack traditionally used in Irish seaweed baths. Because the seaweed is cut by hand above the base, the plant regrows, which is the heart of the sustainability story.

The most iconic product to know is Lazy Days, VOYA's detoxifying seaweed bath: whole dried seaweed that rehydrates in a hot bath at home, recreating the Strandhill bathhouse experience. It is the purest expression of the brand and one of the easiest honest recommendations in spa retail. Around it sits a full organic face and body range, with the house's characteristically playful product naming.

Where you are unsure of a specific product or formulation, never invent it. Learn any range the professional way: heroes first, one category at a time, the house's own training materials for claims, the testers and your own skin for conviction, and the honest gap, saying what you know and checking the rest, when a guest asks something you cannot yet answer.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A VOYA menu rewards the therapist who reads it properly. On day one in any VOYA spa, learn the signature seaweed experiences first: the seaweed bath where the venue has one, and the treatments in which warm seaweed is applied to the body, such as seaweed wraps and seaweed-based massage and facial rituals. Then map the organic facials, the body treatments and the enhancements. For each, note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is storytelling with your hands. The house style is natural, unhurried and rooted in the sea: guests should feel the warmth, the texture of the seaweed and the calm of an Atlantic ritual, and hear the story told simply, hand-harvested, organic, from Strandhill, as they experience it.

Retail is the shoreline continued at home. Narrate the products as you use them, then prescribe two or three, linked directly to the treatment and its story; Lazy Days is the natural take-home for any guest who loved the seaweed itself. Upsell paths are honest ones: the facial guest curious about the seaweed story is a wrap or bath guest next visit; the sixty-minute guest with real tension benefits from ninety.

Finally, protect the house: correct products, correct quantities, faithful protocols, immaculate presentation, stock reported, and the ritual never trimmed for time. On a VOYA shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'VOYA comes from...',
      options: [
        'A Scottish Highlands estate',
        'Strandhill, County Sligo, on the Atlantic coast of the west of Ireland',
        'A Cornish surf town',
        'A Scandinavian coastal village',
      ],
    },
    {
      q: 'The heritage behind VOYA is...',
      options: [
        'Alpine thermal spa culture',
        'French thalassotherapy clinics',
        'Japanese onsen bathing',
        `The revival of Ireland's traditional hot seaweed bathhouses by the Walton family`,
      ],
    },
    {
      q: `VOYA's USP centres on...`,
      options: [
        'Hand-harvested wild Irish seaweed in certified organic products, built on a revived bathing tradition',
        'Laboratory-grown marine collagen',
        'Diamond-infused anti-ageing facials',
        'High-tech machine-led treatments',
      ],
    },
    {
      q: `VOYA's iconic Lazy Days product is...`,
      options: [
        'A sleep pillow spray',
        'A scented candle',
        'A bath of whole dried seaweed that rehydrates in hot water, recreating the seaweed bath at home',
        'An SPF day moisturiser',
      ],
    },
    {
      q: 'Seaweed earns its place as a spa ingredient because...',
      options: [
        'It is cheap to farm anywhere in the world',
        'It is naturally rich in minerals, vitamins, amino acids and antioxidants, and regrows when hand-cut correctly',
        'It exfoliates more harshly than salt',
        'It removes the need for massage',
      ],
    },
    {
      q: `VOYA's signature treatment style is built around...`,
      options: [
        'Seaweed baths and warm seaweed applied to the body in wraps and rituals, delivered with the Atlantic story',
        'High-frequency electrical machines',
        'Hot stone ceremonies',
        'Paraffin wax therapies',
      ],
    },
    {
      q: 'The strongest way to retail the VOYA range is...',
      options: [
        'Present the whole shelf at the till',
        'Discount whatever is overstocked',
        'Leave retail entirely to reception',
        'Prescribe two or three products linked to the treatment and its story, with Lazy Days as the natural take-home for seaweed lovers',
      ],
    },
    {
      q: 'Your first professional duty on day one in a VOYA spa is...',
      options: [
        'Improvise treatments from your general training',
        'Rearrange the retail wall',
        'Learn the treatment menu, starting with the signature seaweed experiences, and ask rather than guess',
        'Memorise every ingredient list before touching a guest',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa used VOYA and the therapist told me about the seaweed baths in Sligo, the family who brought them back, the hand-harvesting. By the end I did not feel I was buying skincare - I felt I was buying a piece of the Atlantic."`,
      helpsYou: `VOYA is a story-led house, and hiring managers and guests both relax the moment a therapist can tell the founding story and state the USP in one confident sentence. Narrative fluency is what separates a therapist who uses the products from one who represents the brand.`,
      tips: [
        'Learn the one-breath USP: certified organic, hand-harvested wild Irish seaweed, a revived bathing tradition',
        'Anchor the story in place: Strandhill, County Sligo, the Atlantic coast of the west of Ireland',
        `Match the house voice - natural, warm and honest, the sea and sustainability at the centre`,
      ],
    },
    {
      guestView: `"She lifted the seaweed from the water and let me feel the gel on it, then explained the minerals and why it is cut by hand so it grows back. I bought the Lazy Days bath on the way out without her ever asking me to."`,
      helpsYou: `Seaweed fluency is the fastest credibility you can build in this house. If you can explain what seaweed does for skin, why hand-harvesting matters and what Lazy Days is, you can walk onto a VOYA shift and belong within the hour.`,
      tips: [
        'Heroes first: Lazy Days and the seaweed itself are the soul of the range',
        'Tell the ingredient story simply: minerals, vitamins, antioxidants, and the silky gel released in warm water',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; use the honest gap and check the rest',
      ],
    },
    {
      guestView: `"Warm seaweed on my back, the smell of the sea, and a therapist quietly telling me where it was harvested that week. It was the most memorable treatment I have had anywhere, and I booked the full wrap before I left."`,
      helpsYou: `Therapists who can deliver the seaweed rituals faithfully, retail through the story and build honest upgrade paths are the ones VOYA venues rebook, request and promote. The brand lives or dies in your hands on shift, and managers know it.`,
      tips: [
        'Day one: learn the signature seaweed experiences before anything else',
        'Deliver the story with the treatment - hand-harvested, organic, from Strandhill',
        'Prescribe two or three products linked to the treatment; Lazy Days is the natural take-home',
        'Protect the ritual - never trim the seaweed elements to rescue a late column',
      ],
    },
  ],
}
