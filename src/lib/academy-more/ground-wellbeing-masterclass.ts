// Talent House Academy brand masterclass: Ground Wellbeing. Independent Talent House training -
// not affiliated with or endorsed by Ground Wellbeing. Answer key lives in
// academy-more-answers/ground-wellbeing-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'ground-wellbeing-masterclass',
  title: 'Ground Wellbeing Masterclass',
  tagline: `The Irish house of slow, grounding ritual - its story, its range, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Ground Wellbeing is one of the most talked-about newer houses in luxury spa. It was founded in 2020 in Cork, Ireland, by Peigín Crowley, a spa professional who had spent roughly two decades creating, leading and developing spas for luxury hotels before building a brand of her own. Like ESPA a generation earlier, Ground grew out of the treatment room rather than a retail counter, and it shows in everything the house does.

The philosophy is in the name. Ground exists to help people feel grounded: to slow down, breathe, and come back into their bodies. Where most houses organise themselves around skin types or anti-ageing claims, Ground organises itself around how people actually feel, creating aromatherapy-led products and rituals for real human states such as poor sleep, stress and depleted energy. Formulations are natural, essential-oil based and made in Ireland.

The house has also become known for genuinely inclusive wellbeing, developing products and adapted treatments intended to be suitable for people living with and beyond cancer, and for those moving through menopause, groups traditional spa menus often quietly excluded.

The USP in one breath: an Irish house, created by a career spa professional, offering slow, grounding aromatherapy rituals organised around how guests feel rather than how they look, with a menu that welcomes people other brands turn away.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Ground's range reads differently from a conventional skincare house, and understanding its logic is the fastest route to fluency.

The organising principle is the need state. Products are grouped by the state they serve, sleep, calm, energy and recovery among them, rather than by skin type or age. The formats carry the aromatherapy heart of the brand: body oils and balms are the core of the range, supported by bath salts and soaks, candles and facial care. A guest does not ask Ground for a moisturiser for combination skin; they ask for something to help them sleep, and the consultation begins there.

The ingredient story is natural and essential-oil led. Blends are built from essential oils chosen for their effect on the nervous system and mood, in naturally derived bases, made in Ireland. When you narrate a product in treatment, tell that story simply: which state it serves, what it contains in broad honest terms, and how the guest will feel.

Because every spa's shelf differs and ranges evolve, learn any Ground account by the professional method rather than memorised lists: identify the house's current heroes from the spa's own training materials and bestselling lines, master them first, learn one need-state family at a time, use the key products on your own skin, and never invent a formulation detail you have not verified. Say what you know, check the rest, and come back with the answer.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A Ground menu rewards slow reading. On day one in any Ground spa, get the menu and protocols from the senior therapist and learn the signature rituals first: the treatments the spa itself leads with, usually built around a need state such as sleep or calm. For each, note duration, protocol, products used and who it is for, and ask rather than guess.

Delivery is where Ground lives or dies. The house style is slow, unhurried and grounding: rituals typically make deliberate space for breath, stillness and grounding touches such as work on the feet, and the pace itself is the product. A rushed Ground treatment is a contradiction in terms. Guests carrying grief, illness, menopause or burnout may book this brand precisely because it promises gentleness; hold that standard.

Retail is the ritual continued at home. Narrate products as you use them, then prescribe two or three, linked to the state the guest came in with: the sleep oil for the guest who cannot switch off, the bath soak that extends tonight what your hands began today.

Upsell paths follow need, never price: the guest who melted into the grounding foot work suits the longer ritual next visit; the stressed sixty-minute guest genuinely benefits from ninety.

Finally, protect the house: correct products, correct quantities, full protocols, stock reported, and the slow ritual never trimmed to rescue a late column. On a Ground shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Ground Wellbeing was founded...',
      options: [
        'By a Parisian cosmetics group in the 1980s',
        'In 2020 in Cork, Ireland, by Peigín Crowley',
        'By a dermatologist in London',
        'By an international hotel chain',
      ],
    },
    {
      q: `Ground's philosophy is best described as...`,
      options: [
        'Clinical anti-ageing results, measured and technical',
        'Glamour and cosmetic transformation',
        'Machine-led facial technology',
        'Grounding and slowing down: aromatherapy-led wellbeing for real human states such as poor sleep, stress and low energy',
      ],
    },
    {
      q: 'The Ground range is organised primarily by...',
      options: [
        'Need state, such as sleep, calm, energy and recovery, rather than skin type or age',
        'Skin type: dry, oily and combination',
        'Age bracket',
        'Price tier',
      ],
    },
    {
      q: 'Ground has become particularly known for inclusive wellbeing, including...',
      options: [
        'Treatments for professional athletes only',
        'A members-only club model',
        'Products and adapted treatments intended for people living with and beyond cancer, and for menopause',
        'Children-only spa menus',
      ],
    },
    {
      q: `Before founding the brand, Peigín Crowley's background was...`,
      options: [
        'Fashion retail buying',
        'Around two decades creating, leading and developing spas for luxury hotels',
        'Pharmaceutical research',
        'Restaurant management',
      ],
    },
    {
      q: `The signature Ground delivery style is...`,
      options: [
        'Slow and unhurried, with deliberate space for breath, stillness and grounding touches such as work on the feet',
        'Fast and efficient to maximise bookings',
        'Talk-led coaching throughout the hour',
        'Identical scripted delivery for every guest',
      ],
    },
    {
      q: 'The strongest way to retail the Ground range is...',
      options: [
        'Present the full range at the till',
        'Discount whatever is overstocked',
        'Leave retail entirely to reception',
        'Prescribe two or three products linked to the need state the guest came in with, framed as the ritual continued at home',
      ],
    },
    {
      q: 'Protecting the brand on a Ground shift means...',
      options: [
        'Adapting protocols freely to your own style',
        'Trimming the slow opening rituals when the column runs late',
        'Correct products in correct quantities, full protocols, stock reported, and the slow ritual never cut for time',
        'Focusing on retail targets above the treatment',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist about the brand and she told me the story - an Irish house built by a spa director who wanted people to slow down, with treatments even my mum could have during her chemotherapy. I trusted the whole menu from that moment."`,
      helpsYou: `Ground accounts are growing across UK and Irish luxury spas, and managers hiring for them look for therapists who can tell the founding story and state the USP without notes. One confident sentence about Peigín Crowley and the grounding philosophy marks you as fluent before your first treatment.`,
      tips: [
        'Learn the one-breath USP: Irish, founded by a career spa professional, slow grounding rituals organised around how guests feel',
        `Remember the heritage: Ground grew out of the treatment room, founded in 2020 in Cork`,
        `Match the house voice - slow, warm words like ground, breathe, rest and restore`,
        'Know the inclusivity story: adapted offerings for oncology and menopause guests',
      ],
    },
    {
      guestView: `"I told her I had not slept properly in months. She did not ask about my skin type at all - she reached for the sleep blend, explained it in one sentence, and by the end I had bought the oil and the bath soak. It felt like care, not commerce."`,
      helpsYou: `Understanding that Ground is organised by need state, not skin type, changes how you consult, treat and retail on the account. Therapists who master the heroes fast and speak the aromatherapy story honestly are the ones spas keep on the Ground column.`,
      tips: [
        'Think in need states first: sleep, calm, energy, recovery',
        'Core formats: body oils and balms, then bath soaks, candles and facial care',
        'Tell ingredient stories simply: the state it serves, what it broadly contains, how it will feel',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"Nothing was rushed. There was a moment just to breathe at the start, warm hands on my feet, and long silences that felt deliberate. I walked out feeling like I had been somewhere, not just had something done."`,
      helpsYou: `Delivering the slow Ground style faithfully, retailing it as the ritual continued at home and building need-led upgrade paths is what turns one shift on a Ground menu into a standing request. Spas protect this brand fiercely; the therapist who protects it with them becomes indispensable.`,
      tips: [
        'Day one: learn the signature rituals the spa leads with before anything else',
        'The pace IS the product - never trim the breath, stillness or foot work for time',
        'Prescribe two or three products linked to the need state the guest arrived with',
        'Upsell by need, never price: the stressed sixty-minute guest genuinely suits ninety',
      ],
    },
  ],
}
