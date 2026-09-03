// Talent House Academy brand masterclass: Murad. Independent Talent House training - not
// affiliated with or endorsed by Murad. Answer key lives in
// academy-more-answers/murad-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'murad-masterclass',
  title: 'Murad Masterclass',
  tagline: `The dermatologist's house of clinical skincare - its science, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Murad is one of the original doctor-led skincare houses. It was founded in Los Angeles in 1989 by Dr Howard Murad, a board-certified dermatologist who also trained as a pharmacist, and who built the brand directly out of his own clinical practice. Where many houses began at a perfume counter, Murad began in a doctor's treatment room, formulating products to solve the real skin concerns his patients brought him.

Dr Murad is widely credited as a pioneer of clinical skincare, and in particular as one of the first to bring alpha hydroxy acids, notably glycolic acid, into modern skincare formulation. That science-first heritage still defines the house.

The philosophy, however, is bigger than the bottle. Murad teaches that skin health reflects whole-body health: what you eat, how you manage stress, how you sleep and how hydrated your cells are all show on your face. Dr Murad's well-known book The Water Secret argues that hydration should come from within, famously advising people to eat their water through water-rich raw fruits and vegetables.

The USP a therapist must be able to say in one breath: Murad is clinical skincare created by a practising dermatologist, organised around real skin concerns, built on proven ingredient science, and delivered with a whole-person view of health. Results you can see, from a doctor's understanding of why skin behaves as it does.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `The first thing to understand about the Murad range is how it is organised: by skin concern, not by skin type or price tier. The house groups its products around the problems guests actually present with, such as blemishes and breakouts, visible ageing, uneven tone and pigmentation, dehydration and redness. This concern-led architecture makes the range easy to navigate once you think like a diagnostician: identify the concern first, then walk to the family that answers it.

Among the best-known products guests ask for by name are the Clarifying Cleanser from the blemish family, the Retinol Youth Renewal Night Serum, the Essential-C range built around vitamin C for environmentally stressed skin, and the Hydro-Dynamic Ultimate Moisture for deep hydration. Learn the heroes of whichever families your spa stocks first, because they anchor most guest questions and most retail.

The ingredient story follows the science. Murad's signature actives are the workhorses of evidence-based skincare: glycolic and salicylic acids for exfoliation and clarity, retinol for skin renewal, vitamin C for brightness and environmental defence, and hyaluronic acid for hydration. Narrate them simply: what it is, what the evidence says it does, and what the guest will notice.

Where you are unsure of a specific formulation, never invent it. Use the house's own training materials, use the testers, use the heroes on your own skin, and say what you know while checking the rest.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A Murad menu rewards a therapist who reads it like a clinician. On day one in any Murad spa, learn the flagship personalised facial first, then map the concern-led facials that mirror the product families, the professional-strength exfoliation or peel treatments where the spa offers them, and the boosters or enhancements that can be added to a booking. For each treatment note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is where the house identity lives. The Murad style is clinical yet caring: a proper skin analysis before anything touches the face, evidence-led narration in plain language as you work, a personalised prescription at the close, and whole-person advice that reflects the philosophy, such as hydration from water-rich foods and managing stress. A guest should leave feeling they have seen a skin professional, not just enjoyed a pleasant hour.

Retail is the treatment plan going home. Prescribe two or three products matched to the concern you diagnosed, ideally ones the guest just experienced, and write them down. Upsell paths are natural: the guest with pigmentation or congestion genuinely benefits from a course of treatments rather than a one-off, and a targeted booster or an upgrade to a professional exfoliation, where you are trained to deliver it, answers a diagnosed need.

Finally, protect the brand: follow protocols exactly, respect patch-test and contraindication rules around active ingredients, report low stock, and never freelance with professional-strength products.`,
    },
  ],
  quiz: [
    {
      q: 'Murad was founded by...',
      options: [
        'A French cosmetics conglomerate in the 1960s',
        'Dr Howard Murad, a board-certified dermatologist, in Los Angeles in 1989',
        'A celebrity make-up artist in New York',
        'A pharmacy chain in London',
      ],
    },
    {
      q: `Murad's core philosophy holds that...`,
      options: [
        'Skin should be treated in isolation from the rest of the body',
        'Only professional treatments matter; home care is secondary',
        'Skin health reflects whole-body health, including diet, hydration and stress',
        'Natural ingredients should never be combined with clinical actives',
      ],
    },
    {
      q: 'Dr Murad is widely credited as a pioneer of...',
      options: [
        'Bringing alpha hydroxy acids, notably glycolic acid, into modern skincare',
        'Inventing aromatherapy massage',
        'The first waterproof mascara',
        'Hot stone treatments',
      ],
    },
    {
      q: `The advice to eat your water, from The Water Secret, means...`,
      options: [
        'Drinking eight glasses of water with every meal',
        'Avoiding all cooked food',
        'Taking hydration supplements daily',
        'Getting hydration from water-rich raw fruits and vegetables so cells hydrate from within',
      ],
    },
    {
      q: 'The Murad range is organised primarily by...',
      options: [
        'Price tier',
        'Skin concern, such as blemishes, visible ageing, pigmentation and dehydration',
        'Fragrance family',
        'Guest age bracket',
      ],
    },
    {
      q: 'The Murad house voice in the treatment room is best described as...',
      options: [
        'Clinical yet caring: evidence-led, plain-language and results-focused',
        'Mystical and ritual-centred',
        'Salesy and promotion-driven',
        'Silent, with no product narration',
      ],
    },
    {
      q: 'Your first move on day one with an unfamiliar Murad menu is...',
      options: [
        'Rearranging the retail shelves',
        'Improvising treatments from general training',
        'Learning the flagship personalised facial first, then mapping the concern-led menu, asking rather than guessing',
        'Memorising every ingredient list in the range',
      ],
    },
    {
      q: 'The strongest way to retail the Murad range is...',
      options: [
        'Presenting the full range at the till',
        'Discounting whatever is overstocked',
        'Leaving retail entirely to reception',
        'Prescribing two or three products matched to the concern you diagnosed, linked to the treatment, and writing them down',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa carried Murad and the therapist told me it was founded by a practising dermatologist who built the products for his own patients. From that moment I treated her advice like a consultation, not a sales pitch."`,
      helpsYou: `Spas running a doctor-led house want therapists who can carry its clinical credibility. Telling the founding story and stating the USP in one confident sentence is what convinces an interviewer, a manager or a sceptical guest that you belong on the account.`,
      tips: [
        'Learn the one-breath USP: clinical skincare by a practising dermatologist, concern-led, science-backed, whole-person',
        `Remember the heritage: Murad grew out of a doctor's clinic, not a perfume counter`,
        `Know the philosophy: skin health reflects whole-body health, including hydration, diet and stress`,
        `Be able to explain eat your water: hydration from water-rich raw fruits and vegetables`,
      ],
    },
    {
      guestView: `"She looked at my breakouts, walked straight to one shelf, and explained the salicylic acid in one plain sentence. No waffle, no ten-product routine. I bought both things she suggested and they worked."`,
      helpsYou: `Concern-led fluency is the fastest credibility in a clinical house. Knowing the hero products and the signature actives, and being able to explain each in one honest sentence, lets you walk onto a Murad shift and diagnose, prescribe and retail like a resident.`,
      tips: [
        'Think concern first: identify the problem, then go to the family that answers it',
        'Heroes first: learn the icons of the families your spa actually stocks',
        'Master the actives: glycolic and salicylic acids, retinol, vitamin C, hyaluronic acid',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"It felt like seeing a skin specialist. Proper analysis, everything explained as she worked, and I left with a written plan of three products and a course of treatments. My pigmentation is visibly fading and I have rebooked every month since."`,
      helpsYou: `Therapists who deliver the clinical-yet-caring style, prescribe from a genuine diagnosis and build honest course-of-treatment paths are the ones who lift retail and rebooking together, and that pairing is exactly what managers promote.`,
      tips: [
        'Day one: learn the flagship personalised facial before anything else',
        'Analyse before you apply: the skin analysis is the treatment earning its price',
        'Prescribe two or three concern-matched products and write them down',
        'Respect the actives: patch tests, contraindications and exact protocols are non-negotiable',
      ],
    },
  ],
}
