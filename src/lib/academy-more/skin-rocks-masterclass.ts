// Talent House Academy brand masterclass: Skin Rocks. Independent Talent House training - not
// affiliated with or endorsed by Skin Rocks. Answer key lives in
// academy-more-answers/skin-rocks-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'skin-rocks-masterclass',
  title: 'Skin Rocks Masterclass',
  tagline: `The British skincare house that makes skincare make sense - its story, its heroes, and how to recommend it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Skin Rocks is a young British skincare brand founded by Caroline Hirons, an aesthetician, author and former shop-floor consultant who became one of the best-known skincare voices in the UK. Her career ran through the counters of London's department stores and Space NK before her blog, started in 2010, and her bestselling book Skincare: The Ultimate No-Nonsense Guide made her a household name among skincare enthusiasts.

The brand began as advice before it was product. The Skin Rocks app launched in July 2022 as a guide to understanding skincare, and the first products followed in November 2022, starting with two retinoids. The brand's own line sums up the intent: it wants to make skincare make sense.

The philosophy is education first. Products sit inside a clear, step-by-step routine, starting with cleansing, with plain-spoken guidance on what to use, when and why. In 2025 the brand added Skin Rocks Pro, a professional-only line with its own facial protocols and training.

The USP in one breath: Skin Rocks is no-nonsense, routine-led skincare created by a working aesthetician, built to help people understand their skin and use active ingredients properly.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Guests who know Skin Rocks often know it in detail, because many of them followed Caroline Hirons long before the brand existed. Your credibility depends on knowing the heroes accurately.

Start with the cleansers. The Cream Cleanser, which the brand describes as suitable for all skin types, features amino acids, squalane and jojoba seed oil. The Gel Cleanser is built on a blend of six plant oils, and there is a fragrance-free version. Cleansing is the foundation of the house's routine teaching.

Then the actives. Retinoid 1 and Retinoid 2 launched the brand. The brand positions Retinoid 1 for beginners and those with sensitivity, and Retinoid 2 for people already using a retinoid. The Antioxidant is a multi-ingredient serum whose vitamin C is an oil-soluble form the brand chose for stability. Gentle Acid sits in the tone step of the beginner routine.

Around these sit The Amplifier essence, The Hyperpigmentation Serum, The Rich Moisturiser, The Eye Cream and The Support Oil. Several heroes come with refills. Where you are unsure of a formulation, check the brand's own product page rather than guessing.`,
    },
    {
      title: 'Treatments, retail and recommending with standards',
      content: `Skin Rocks arrived in professional skin care through Skin Rocks Pro, launched in 2025 for salons, clinics and skin therapists. The initial menu announced six facials, Amplified, Control, Hydration, Hyperpigmentation, Regenerative and Support, each personalised and each including a signature lifting or lymphatic massage. Line-ups vary by provider and training is delivered by the brand, so check your own spa's current menu and protocols rather than assuming.

Many hotel spas will meet Skin Rocks as a retail brand rather than a treatment house. That makes the therapist's job one of recommendation: understanding the guest's current routine, identifying one or two gaps and explaining the reason in plain language, exactly as the brand itself teaches.

Retail with actives carries responsibility. Introduce one new active at a time, follow the brand's guidance on starting levels, advise a patch test as the brand recommends, and pair any active with daily sun protection.

Finally, protect the house. Use the brand's language accurately, never overstate results, keep testers clean and in date, and refer anything beyond cosmetic skincare to a medical professional.`,
    },
  ],
  quiz: [
    {
      q: 'Skin Rocks was founded by...',
      options: [
        'A Parisian pharmacy group in the 1990s',
        'Caroline Hirons, a British aesthetician, author and former shop-floor consultant',
        'A Korean skincare laboratory',
        'A London hotel spa operator',
      ],
    },
    {
      q: 'Which came first in the Skin Rocks story?',
      options: [
        'A flagship day spa in Mayfair',
        'A fragrance collection',
        'A range of body oils',
        'The Skin Rocks app, launched in July 2022, followed by the first products in November 2022',
      ],
    },
    {
      q: `The brand's own line describing its purpose is that it wants to...`,
      options: [
        'Make skincare make sense',
        'Replace every product in your bathroom',
        'Deliver the most ingredients in one bottle',
        'Bring medical aesthetics to the high street',
      ],
    },
    {
      q: 'The first two Skin Rocks products to launch were...',
      options: [
        'A cleanser and a face mist',
        'An eye cream and a body lotion',
        'Retinoid 1 and Retinoid 2',
        'A sunscreen and a lip balm',
      ],
    },
    {
      q: 'The brand positions Retinoid 1 for...',
      options: [
        'Only people already using strong prescription retinoids',
        'Body use only',
        'Beginners and those with concerns around sensitivity',
        'Use straight after a peel',
      ],
    },
    {
      q: 'The six facials first announced for Skin Rocks Pro each include...',
      options: [
        'A signature lifting or lymphatic massage, with each treatment personalised',
        'A hot stone back massage',
        'A paraffin hand wrap',
        'A scalp mud finish',
      ],
    },
    {
      q: 'A guest wants to start using a new active from the range. The most professional advice is...',
      options: [
        'Start several actives at once for faster results',
        'Skip sun protection while the skin adjusts',
        'Use it every day at the strongest level available',
        'Introduce one active at a time, follow the brand guidance on starting levels, patch test, and wear daily sun protection',
      ],
    },
    {
      q: 'Your spa stocks Skin Rocks for retail but you are unsure whether it offers Skin Rocks Pro facials. Your first step is...',
      options: [
        'Improvise a Skin Rocks facial using the retail products',
        'Check the current menu and protocols with your spa manager and recommend only what the spa offers',
        'Tell the guest the spa offers every Skin Rocks Pro facial',
        'Refer the guest to another spa',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: '',
  lessons: [
    {
      guestView: `"I already follow Caroline Hirons, so I was half testing the therapist. She knew the story, the app and why the brand started with retinoids, and she explained it in plain English. That is exactly what I hoped for."`,
      helpsYou: `Skin Rocks guests are often unusually well informed. Being able to tell the founding story and state the USP in one sentence shows you respect that knowledge, and it is what makes a manager trust you with an engaged, curious clientele.`,
      tips: [
        'Learn the one-breath USP: no-nonsense, routine-led skincare created by a working aesthetician',
        'Remember the order: advice and the app first, then products, then the professional line',
        'Match the house voice - plain, direct, educational, never inflated',
      ],
    },
    {
      guestView: `"I asked whether I was ready for the stronger retinoid. The therapist asked what I was using now, said the brand suggests starting with Retinoid 1 for sensitive skin, and told me to patch test first. I trusted her more for not pushing the bigger bottle."`,
      helpsYou: `Knowing the heroes and where each sits in a routine lets you answer detailed questions calmly. That accuracy is what separates a therapist a well-read guest respects from one they quietly correct.`,
      tips: [
        'Heroes first: The Cream Cleanser, The Gel Cleanser, Retinoid 1 and 2, The Antioxidant',
        'Place every product in its step of the routine, from cleansing onwards',
        'Explain why a product suits the guest, not just what it contains',
        'Never quote a strength or ingredient you have not checked on the brand page',
      ],
    },
    {
      guestView: `"She didn't try to sell me a whole routine. She looked at what I already used, suggested one product to fill the gap and told me how to start it slowly. I went back for the second one a month later."`,
      helpsYou: `Spas that carry Skin Rocks want therapists who recommend responsibly. Honest, routine-based advice builds repeat retail and protects the spa from complaints about over-selling actives.`,
      tips: [
        'Check whether your spa offers Skin Rocks Pro facials before mentioning them',
        'One new active at a time, with patch testing and daily sun protection',
        'Recommend one or two products that fill a real gap in the guest routine',
        'Point refill-minded guests to the refills the brand offers for several heroes',
      ],
    },
  ],
}
