// WHC Academy brand masterclass: 111SKIN. Independent WHC training - not
// affiliated with or endorsed by 111SKIN. Answer key lives in
// academy-more-answers/111skin-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: '111skin-masterclass',
  title: '111SKIN Masterclass',
  tagline: `The surgeon-founded house of clinical luxury - its story, its science, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `111SKIN is one of the defining names in clinical luxury skincare, and its story begins in an operating theatre rather than a marketing meeting. The house was founded by Dr Yannis Alexandrides, a plastic surgeon practising at 111 Harley Street in London, together with co-founder Eva Alexandrides. The name itself comes from that address: 111 Harley Street, one of the most famous medical streets in the world.

The origin is genuinely medical. Dr Yannis developed a healing formula to support the skin of his own patients as they recovered after surgery, built around an antioxidant complex the brand calls NAC Y2, based on N-Acetyl Cysteine. The results he saw on post-procedure skin convinced him the formula deserved a life beyond the clinic, and the skincare house grew from that serum.

The brand's most famous story reaches even further than Harley Street: its formulation drew on research concerned with protecting skin in the extreme conditions of space, and that space-science thread remains part of how the house talks about resilience and repair.

The USP a therapist must be able to state in one breath: 111SKIN is surgeon-founded clinical skincare, born at 111 Harley Street, bringing clinic-grade repair and visible results into the luxury spa. Guests are buying medical heritage delivered with five-star polish.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Credibility with 111SKIN starts with the heroes. The Y Theorem Repair Serum is the heart of the house, the direct descendant of the original post-surgical healing formula, carrying the signature NAC Y2 antioxidant complex built around N-Acetyl Cysteine. If you learn one product cold, learn this one, because it is the founding story in a bottle.

The Celestial Black Diamond collection is the house's flagship luxury line, famous for its rich anti-ageing formulations and for the Celestial Black Diamond Cream that many guests know by name. The Rose Gold line carries the radiance story, and its Rose Gold Brightening Facial Treatment Mask is one of the most recognisable sheet masks in luxury skincare. Masks matter enormously to this brand: 111SKIN is celebrated for its high-performance facial and eye masks, loved by facialists and often seen in red-carpet preparation, and they are among the easiest honest recommendations in the range.

The ingredient narrative pairs the medical with the luxurious: the NAC Y2 repair complex at the core, supported by clinically minded actives presented with genuine glamour. Where you are unsure of a specific formulation, never invent it. Learn heroes first, one collection at a time, use the brand's own training materials and testers, try the key products yourself, and say what you know while checking the rest. Guests hear the difference between memorised copy and real conviction.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `On day one in any spa carrying 111SKIN, read the menu like a professional. Every venue's menu differs, so learn the flagship facial first, in full: its duration, protocol, the collection it draws on and the products it uses. Then map the rest in layers, noting which collection each treatment belongs to and which masks and serums it features. Ask the senior therapist rather than guessing, and shadow a treatment if you can.

Delivery is clinical luxury. The house style is precise, results-led and protocol-driven: careful analysis, purposeful product layering, masks treated as centrepiece moments rather than pauses, and a visible result the guest can see at the end. Speak the brand's confident, scientific language, always with five-star warmth, and never freestyle a protocol.

Retail is the clinic continued at home. Narrate key products during treatment, then prescribe two or three, linked directly to what you found and used, and write the prescription down. The mask a guest loved on the couch is the easiest honest sale in the range.

Upsell paths are natural: the guest who saw a visible result books the course of facials that sustains it; the sixty-minute guest with real concerns benefits from the advanced version; masks extend any booking.

Finally, protect the brand: correct products, correct quantities, faithful protocols, immaculate presentation, low stock reported. On a 111SKIN shift, you are the brand's clinical promise in the room.`,
    },
  ],
  quiz: [
    {
      q: '111SKIN was founded by...',
      options: [
        'A French pharmacy group in the 1990s',
        'Dr Yannis Alexandrides, a plastic surgeon, with co-founder Eva Alexandrides',
        'A Swiss cosmetics laboratory',
        'A high-street beauty retailer',
      ],
    },
    {
      q: 'The name 111SKIN comes from...',
      options: [
        'The number of ingredients in the first formula',
        'The founding year of the company',
        'A code name from a space programme',
        `The address of the founder's clinic at 111 Harley Street, London`,
      ],
    },
    {
      q: 'The original formula behind the brand was created to...',
      options: [
        `Support the skin of Dr Yannis's patients as they recovered after surgery`,
        'Compete with high-street moisturisers on price',
        'Replace sun protection products',
        'Treat hair and scalp conditions',
      ],
    },
    {
      q: 'NAC Y2 is...',
      options: [
        'A facial massage technique',
        'The name of a treatment room standard',
        `The brand's signature antioxidant complex built around N-Acetyl Cysteine, developed for skin repair`,
        'A booking system used in 111SKIN spas',
      ],
    },
    {
      q: `A famous part of the 111SKIN formulation story involves research into...`,
      options: [
        'Deep-sea marine biology',
        'Protecting skin in the extreme conditions of space',
        'Alpine plant harvesting',
        'Ancient herbal remedies',
      ],
    },
    {
      q: 'Which of these is a 111SKIN hero product carrying the founding story?',
      options: [
        'The Y Theorem Repair Serum, with the NAC Y2 complex',
        'The Pro-Collagen Marine Cream',
        'The Pink Hair and Scalp Mud',
        'The Tri-Enzyme Resurfacing Cleanser',
      ],
    },
    {
      q: 'The strongest way to retail the range after a 111SKIN facial is...',
      options: [
        'Present the full range at reception',
        'Discount whatever is overstocked',
        'Leave retail entirely to the retail team',
        'Prescribe two or three products used in the treatment, linked to what you found, and write it down',
      ],
    },
    {
      q: 'Your first professional duty on day one with a 111SKIN menu is...',
      options: [
        'Rearrange the retail displays',
        'Improvise treatments from your general training',
        'Learn the flagship facial and its protocol in full, asking rather than guessing',
        'Memorise every ingredient list in the range',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why this brand cost what it did and the therapist told me the story - a Harley Street surgeon, a serum made for healing skin after surgery, even the space research. By the end I understood exactly what I was paying for."`,
      helpsYou: `Spas carrying 111SKIN want therapists who can carry its clinical story with confidence. Telling the founding story and stating the USP in one clean sentence is what convinces an interviewer, a manager or a sceptical guest that you belong on the account.`,
      tips: [
        'Learn the one-breath USP: surgeon-founded clinical skincare, born at 111 Harley Street, delivering clinic-grade results in the spa',
        `Remember the origin: a healing formula created for post-surgical skin, not a marketing concept`,
        `Match the house voice - confident, scientific and precise, delivered with five-star warmth`,
      ],
    },
    {
      guestView: `"She used the repair serum and told me, in one sentence, where it came from and what the complex in it does. Then the rose gold mask I had seen everywhere. I went home with both and it never felt like selling."`,
      helpsYou: `Hero-product fluency is the fastest credibility you can build in a clinical house. Knowing the Y Theorem Repair Serum, the Celestial Black Diamond line and the famous masks cold means you can walk onto a 111SKIN shift and sound like a resident within an hour.`,
      tips: [
        'Heroes first: Y Theorem Repair Serum, Celestial Black Diamond Cream, the Rose Gold mask',
        'Tell the NAC Y2 story simply: an antioxidant repair complex born in post-surgical care',
        'Use the key products yourself - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The facial felt like a clinic and a spa at once - precise, layered, and the mask moment felt like an event. At the end she showed me my own skin in the mirror and I could see the difference. I booked the course on the spot."`,
      helpsYou: `Therapists who can deliver clinical luxury faithfully, retail from the treatment and build honest upgrade paths are the ones results-led spas trust with their best bookings - and the ones brand trainers notice and name.`,
      tips: [
        'Day one: learn the flagship facial and its protocol in full before anything else',
        'Treat masks as centrepiece moments, never as pauses to leave the room',
        'Prescribe two or three products linked to your findings, and write it down',
        'Protect the protocol - never freestyle a clinical house under time pressure',
      ],
    },
  ],
}
