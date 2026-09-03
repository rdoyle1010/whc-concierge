// Talent House Academy brand masterclass: Valmont. Independent Talent House training - not
// affiliated with or endorsed by Valmont. Answer key lives in
// academy-more-answers/valmont-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'valmont-masterclass',
  title: 'Valmont Masterclass',
  tagline: `The Swiss house of cellular cosmetics - its story, its science, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Valmont is one of the great Swiss houses of luxury skincare, and its story begins long before the products. The name descends from the Clinique Valmont, a celebrated clinic opened in 1905 at Glion, above Montreux on the Swiss Riviera, where an elite international clientele came for pioneering health and wellness care. The modern skincare house was born in Switzerland in 1985, carrying that clinical heritage into cosmetics, and since the early 1990s it has been owned and led by the Guillon family, who kept it fiercely independent and family-run.

The philosophy is cellular cosmetics: skincare built on cellular science and Swiss precision, aimed above all at visible anti-ageing results. The house styles itself in the language of time, presenting its experts as magicians of time who help skin recapture its youthful behaviour. Everything is made in Switzerland, and Swissness, rigour, purity, alpine nature, is central to the identity.

The second pillar is art. The Guillon family are collectors, the house speaks of the meeting of art and beauty, and the Fondation Valmont exhibits art in its own right. Treatments are framed as haute couture for the skin.

The one-breath USP: Valmont offers Swiss cellular cosmetics with a clinical heritage, anti-ageing expertise delivered as an haute couture experience where science meets art.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Valmont's credibility with guests rests on a distinctive ingredient story, and a therapist should be able to tell it in plain, confident sentences.

The science pillar is its cellular actives: the house is famous for formulating with DNA and RNA macromolecules, the biological molecules it presents as the heart of its anti-ageing performance. The nature pillar is Swiss: glacial spring water from the Alps is the signature water of the formulations, joined by extracts from alpine plants. Science from the cell, purity from the mountain - that is the story in one line.

The hero every therapist must know is the Prime Renewing Pack, the house's famous mask, adored for the fresh, rested, visibly smoothed effect guests describe after a single application; it is one of the most asked-for products in luxury spa. Hydration is another signature territory, led by the Hydra3 collection, and at the very top sits l'Elixir des Glaciers, the ultra-luxury tier of the house.

Where a specific formulation detail is not in front of you, never invent it. Learn any range the professional way: heroes first, then one category at a time, using testers, house training materials and your own skin, and keeping the honest gap, say what you know, check what you do not.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Valmont menus differ from spa to spa, so day one is about method. Read the menu in layers: find the flagship anti-ageing facial first, because that is what the house is known for, then map the hydration and radiance facials, the body treatments and the enhancements. For each, note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is precise. Valmont facials are known for meticulous, choreographed massage work, performed with the discipline of Swiss craft; the exact choreography belongs to house training, so learn it from the trainers and protocols and never improvise a signature gesture in front of a guest. The tone is refined, unhurried, quietly confident, haute couture rather than theatrical.

Retail is the treatment continued at home. Narrate hero products as you use them, then prescribe two or three, linked to what you found; the Prime Renewing Pack, experienced on the guest's own skin, is among the most natural recommendations in spa.

Upsell paths follow results: the hydration guest with ageing concerns moves toward the anti-ageing flagship, the sixty-minute guest with real needs benefits from the longer ritual, and l'Elixir des Glaciers awaits the guest ready for the summit.

Protect the standard: correct products, correct quantities, faithful protocols, immaculate presentation, stock reported. On a Valmont shift, you are the house.`,
    },
  ],
  quiz: [
    {
      q: `Valmont's heritage traces back to...`,
      options: [
        'A Parisian perfumery of the 1920s',
        'The Clinique Valmont, a celebrated Swiss clinic opened in 1905 above Montreux, with the modern house born in Switzerland in 1985',
        'A Californian dermatology practice',
        'An Italian fashion house',
      ],
    },
    {
      q: `Valmont describes its anti-ageing experts with the phrase...`,
      options: [
        'The alchemists of light',
        'The guardians of youth',
        'Magicians of time',
        'The sculptors of skin',
      ],
    },
    {
      q: `The two pillars of Valmont's ingredient story are...`,
      options: [
        'Cellular actives such as DNA and RNA macromolecules, and Swiss nature such as glacial spring water and alpine plants',
        'Marine collagen and volcanic ash',
        'Fruit acids and clay',
        'Synthetic peptides and gold leaf',
      ],
    },
    {
      q: `The Valmont hero product famous for a fresh, visibly smoothed effect after one application is...`,
      options: [
        'The Alpine Cleansing Balm',
        'The Glacier Mist',
        'The Midnight Recovery Oil',
        'The Prime Renewing Pack',
      ],
    },
    {
      q: `L'Elixir des Glaciers is...`,
      options: [
        'A budget diffusion line',
        'The ultra-luxury tier at the very top of the house',
        'A discontinued fragrance',
        'A machine-based facial system',
      ],
    },
    {
      q: 'Beyond science, the distinctive second pillar of the Valmont identity is...',
      options: [
        'Art - the Guillon family are collectors, the house pairs art with beauty, and the Fondation Valmont exhibits art',
        'Sport sponsorship',
        'Celebrity endorsement',
        'Organic certification',
      ],
    },
    {
      q: 'On day one with a Valmont menu you should...',
      options: [
        'Deliver your usual routine under the Valmont name',
        'Focus only on retail products',
        'Read the menu in layers starting with the flagship anti-ageing facial, note durations, protocols and products, and ask rather than guess',
        'Wait for guests to explain the treatments to you',
      ],
    },
    {
      q: `Valmont's signature massage choreography should be...`,
      options: [
        'Improvised from your general training',
        'Skipped to save time',
        'Replaced with your own favourite techniques',
        'Learned from house trainers and protocols, and never improvised in front of a guest',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why this brand cost what it did, and the therapist told me the story - a Swiss house descended from a 1905 clinic, family-owned, obsessed with cellular science and art. By the end I understood I was not buying a cream, I was buying Switzerland in a jar."`,
      helpsYou: `Five-star spas carrying Valmont look for therapists who can speak the house's language of Swiss precision, clinical heritage and art. Telling the story and stating the USP in one confident sentence is what wins the interview and settles the sceptical guest.`,
      tips: [
        'Learn the one-breath USP: Swiss cellular cosmetics with clinical heritage, delivered as haute couture where science meets art',
        `Anchor the story: Clinique Valmont 1905 above Montreux, the modern house born in Switzerland in 1985, family-owned since the early 1990s`,
        `Use the house's own language of time: magicians of time, recapturing the skin's youthful behaviour`,
      ],
    },
    {
      guestView: `"She explained the mask in one sentence - cellular science and glacial water - and I could feel my skin tightening as she spoke. I left with the Prime Renewing Pack and I have repurchased it ever since."`,
      helpsYou: `Hero fluency is the fastest credibility in a new house. Knowing the Prime Renewing Pack, the Hydra3 hydration story and the l'Elixir des Glaciers tier cold means you can walk onto a Valmont shift and belong within the hour.`,
      tips: [
        `Heroes first: the Prime Renewing Pack, the Hydra3 collection, l'Elixir des Glaciers at the summit`,
        'Tell the two-pillar story in one line: cellular actives from science, glacial water and alpine plants from Swiss nature',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"Every movement of the facial felt rehearsed, deliberate, almost like watching a craftsman. Nothing was rushed and nothing was random. That precision is why I only book Valmont facials now."`,
      helpsYou: `Therapists who respect the house choreography, retail from the treatment and build honest upgrade paths are the ones Valmont accounts rebook, request and promote - precision and discretion are exactly what these spas are hiring for.`,
      tips: [
        'Day one: read the menu in layers, flagship anti-ageing facial first',
        'Learn the signature choreography from house training - never improvise it in front of a guest',
        'Prescribe two or three products linked to the treatment, with the Prime Renewing Pack as the natural hero',
        'Protect the standard: faithful protocols, correct quantities, stock reported, ritual never trimmed',
      ],
    },
  ],
}
