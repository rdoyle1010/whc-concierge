// Talent House Academy brand masterclass: myBlend. Independent Talent House training - not
// affiliated with or endorsed by myBlend. Answer key lives in
// academy-more-answers/myblend-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'myblend-masterclass',
  title: 'MyBlend Masterclass',
  tagline: `The Clarins family's personalised skin house - its science, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `myBlend is the second brand of the Clarins Group, the family-owned French beauty house founded in Paris in 1954 by Jacques Courtin-Clarins. myBlend was first launched by the group in 2007 and was rebuilt from the ground up in 2022 under Dr Olivier Courtin, a physician and one of Jacques Courtin-Clarins' sons, who is also a general manager of the group. The brand presents him as its founder, and partner spas often style him Dr Olivier Courtin-Clarins.

So myBlend is not Clarins under another label. It shares a family and a group, but it has its own formulas, its own spas and its own point of view.

That point of view is epigenetics. The brand's position, drawn from Dr Courtin's medical work, is that how skin ages is shaped far more by lifestyle and environment than by the genes we are born with, and that skincare should respond to the person's life, not just their age.

The USP, in one breath: myBlend is personalised skin care that works as one ecosystem, Nutri, Derma and Tech, guided by a doctor's view of epigenetics and delivered after a precise skin diagnosis. A guest is not buying a cream; they are buying a plan built around them.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `myBlend organises everything around three pillars that are meant to work together. Derma is the skincare. Nutri is the food supplement range, such as Nutri Glow. Tech is the beauty technology, led by the myLEDmask.

In skincare, start with the heroes. The Superserums are targeted, concentrated serums, each built for one concern: Hydra+ for hydration, Radiance (Éclat) for dull skin, Dark Spot (Taches) for pigmentation and Blemishes (Imperfections) for breakouts and shine. The Revitalizing Pre-Serum pairs an antioxidant ampoule of fermented turmeric and vitamin E with an essence. La Crème Régénérante, the Revitalizing Cream, is the house's anti-ageing cream, with a lighter Fluide and a richer version.

The ingredient story is science-led. The brand speaks of its exclusive peptide complex, of named actives such as hyaluronic acid, vitamin C derivatives and gentle exfoliating acids, and of respecting the skin barrier, as with its soap-free enzymatic cleansers.

Tell those stories in the brand's own terms and never invent a figure. Learn the heroes, then one category at a time, from the house's own materials.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A myBlend treatment starts before anyone touches the skin. The brand describes its spa treatments as built on a digital skin diagnosis and a real conversation with the therapist, so consultation is the treatment's foundation, not a form to rush.

The menu pairs skilled hands with technology. The Essential is a sixty-minute facial combining the CellSynergy device with lifting and sculpting hand movements. The Expert is the ninety-minute, most advanced protocol, adding intensified manual massage and LED. Spas also use technologies the brand names, such as radiofrequency and cold, but menus and names vary by location, so learn your spa's current menu and protocols on day one and ask rather than guess.

Retail follows the diagnosis. Prescribe two or three products that answer what you found, usually a cleanser, the right Superserum and a cream, and explain how they fit together. Nutri and Tech are natural next steps for the right guest, never a reflex. Supplement questions from a guest with a health condition, on medication or pregnant belong with their GP or pharmacist.

Protect the house: correct products and quantities, devices used exactly as trained, honest claims in the brand's own words.`,
    },
  ],
  quiz: [
    {
      q: 'What is the relationship between myBlend and Clarins?',
      options: [
        'myBlend is an independent brand that licenses the Clarins name',
        'myBlend belongs to the Clarins Group; it was first launched in 2007 and rebuilt in 2022 under Dr Olivier Courtin, a son of the Clarins founder',
        'myBlend is the new name for the Clarins skincare range',
        'myBlend was bought from Clarins by an American group',
      ],
    },
    {
      q: `myBlend's approach is built on three pillars working together. They are...`,
      options: [
        'Cleanse, tone and moisturise',
        'Aromatherapy, marine extracts and massage',
        'Retail, membership and gifting',
        'Nutri, Derma and Tech: supplements, skincare and beauty technology',
      ],
    },
    {
      q: `The scientific idea at the heart of myBlend's philosophy is...`,
      options: [
        'Epigenetics: the view that lifestyle and environment shape how skin ages more than the genes we inherit',
        'Ayurvedic dosha typing',
        'Fixed skin types that never change',
        'Medical injectables as the first step',
      ],
    },
    {
      q: 'The myBlend Superserums are best described as...',
      options: [
        'A single all-in-one serum for every skin',
        'Body oils grouped by mood',
        'Targeted, concentrated serums each built for one concern, such as Hydra+, Radiance, Dark Spot and Blemishes',
        'Food supplements taken with meals',
      ],
    },
    {
      q: 'According to the brand, a myBlend spa treatment is built on...',
      options: [
        'Whatever the therapist prefers on the day',
        'The most expensive products on the shelf',
        'A digital skin diagnosis and a real conversation with the therapist',
        'A standard routine identical for every guest',
      ],
    },
    {
      q: 'On a myBlend menu, The Expert is...',
      options: [
        'The ninety-minute, most advanced protocol combining technologies, intensified manual massage and LED',
        'A quick express cleanse',
        'A body wrap',
        'A retail consultation with no treatment',
      ],
    },
    {
      q: 'A guest who is pregnant asks whether she should start the Nutri Glow supplement. You...',
      options: [
        'Recommend a double dose for faster results',
        'Tell her supplements are always safe because they are natural',
        'Sell it and say nothing',
        'Share what the brand says about the product and suggest she checks with her GP or pharmacist before starting it',
      ],
    },
    {
      q: 'The strongest way to retail myBlend after a facial is...',
      options: [
        'Present every product in the range',
        'Prescribe two or three products that answer what the diagnosis found, and explain how they work together',
        'Lead with the LED mask for every guest',
        'Leave retail to reception',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: '',
  lessons: [
    {
      guestView: `"I assumed it was just Clarins in a different box. The therapist explained it was the family's own doctor-led brand, built around how my life affects my skin. That changed how I listened to everything she said next."`,
      helpsYou: `Guests and interviewers often confuse myBlend with Clarins. Being able to explain the relationship accurately, and state the epigenetics-led USP in one calm sentence, marks you out as someone who genuinely knows the house.`,
      tips: [
        'Get the relationship right: Clarins Group brand, launched 2007, rebuilt 2022 under Dr Olivier Courtin',
        'Learn the one-breath USP: personalised, Nutri plus Derma plus Tech, guided by epigenetics',
        'Attribute the science to the brand: "the brand believes", not "it is proven"',
      ],
    },
    {
      guestView: `"She showed me why I needed the Hydra+ serum and not the one my friend uses, and how it sat between the cleanser and the cream. For the first time my routine made sense as a system."`,
      helpsYou: `myBlend guests are often well read on skincare. Knowing the Superserums, the Pre-Serum and La Crème Régénérante cold, and explaining how they fit together, gives you credibility with exactly the guests who are hardest to impress.`,
      tips: [
        'Heroes first: the four Superserums, the Revitalizing Pre-Serum, La Crème Régénérante',
        'Know which Superserum answers which concern before your first facial',
        'Never quote a percentage or a result the brand has not given you in writing',
        'Remember the three pillars: Nutri, Derma, Tech',
      ],
    },
    {
      guestView: `"The diagnosis came first, then the facial felt designed for my skin that day. At the end she wrote down three products and why. No pressure at all, and I bought all three."`,
      helpsYou: `Therapists who can run a proper consultation, use the house technology exactly as trained and prescribe from the diagnosis are the ones myBlend spas trust with their most loyal guests.`,
      tips: [
        'Day one: learn your spa\'s current menu, starting with The Essential and The Expert',
        'Treat the diagnosis as the treatment\'s foundation, never a box to tick',
        'Prescribe two or three products linked to what you found',
        'Supplement questions with a health condition, medication or pregnancy go to the GP or pharmacist',
      ],
    },
  ],
}
