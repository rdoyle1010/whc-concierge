// WHC Academy brand masterclass: Comfort Zone. Independent WHC training -
// not affiliated with or endorsed by Comfort Zone. Answer key lives in
// academy-more-answers/comfort-zone-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'comfort-zone-masterclass',
  title: 'Comfort Zone Masterclass',
  tagline: `The Italian house of conscious skin science - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Comfort Zone is the professional skincare house of the Davines Group, founded in 1996 in Parma, Italy, by Davide Bollati. The Bollati family business began as a research laboratory creating formulas for others before building brands of its own, and that laboratory heritage still shapes the house: Comfort Zone speaks of science-based conscious formulas, and it means both words.

The philosophy joins three threads that few competitors hold together. First, science: formulas developed in the company's own laboratories, with published lists of ingredients the house chooses to formulate without. Second, sustainability: the Davines Group is a certified B Corporation, committed to using business as a force for good, and the company's Parma headquarters was designed around that ethic. Third, holistic wellbeing: treatments built to calm the mind and nervous system as well as improve the skin, most famously through the Tranquillity concept.

The USP a therapist should be able to say in one breath: Comfort Zone offers science-based conscious skincare from an Italian family laboratory, delivered through treatments that care for the person and the planet at once. A guest who cares about results, a guest who cares about ethics, and a guest who simply wants to deeply relax can each hear their own reason to choose this house, and all three reasons are true.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Comfort Zone organises its skincare into named ranges, each answering a skin need, and fluency starts with knowing which range answers which guest.

Tranquillity is the soul of the brand: an aromatic range built around the signature Tranquillity Blend of essential oils, with its celebrated body oil at the centre, designed for relaxation and rest. Sublime Skin addresses the visible signs of ageing. Hydramemory answers dehydration. Remedy is formulated with sensitive and fragile skin in mind. Sacred Nature is the house's natural range with certified formulations. Body Strategist covers body care and contouring concerns. Learn these range names and their one-line purposes first; they are the map of the entire retail wall.

The ingredient story follows the philosophy: naturally derived ingredients and scientifically supported actives in the same formula, with the house publishing what it leaves out as proudly as what it puts in. When narrating a product, keep the sentence honest and simple: what it contains, what it does, how it will feel.

Where a specific formulation detail is not certain in your memory, never invent it. Use the professional learning method: heroes first, one range at a time, the brand's own training materials as your source of claims, the products on your own skin, and the honest gap, saying what you know and checking the rest.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `On day one in any Comfort Zone spa, read the menu in layers. Start with the treatment the house is most famous for: the Tranquillity Pro-Sleep Massage, an aromatherapy ritual using the Tranquillity Blend and soft brushes, with techniques drawn from Indonesian tradition, designed to guide the guest towards deep rest. Then map the facials by range, the body treatments, and the enhancements. For each, note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is where the brand lives. The Comfort Zone style pairs scientific precision, correct products, correct quantities, faithful protocol, with genuine calm: unhurried flow, considered touch, and the sensorial elements such as aroma and breath honoured in full, never trimmed for time.

Retail is the treatment continued at home. Narrate key products during the treatment, then prescribe two or three at the close, each linked to what you found and what the guest felt. The sustainability story is a retail strength: guests who care about conscious choices are buying the ethic as well as the jar.

Upsell paths are natural: the stressed massage guest is a Tranquillity Pro-Sleep guest next visit; the facial guest with real concerns benefits from a course. And protect the standards on every shift: on a Comfort Zone column, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Comfort Zone was founded...',
      options: [
        'In Paris in the 1920s by a perfumer',
        'In 1996 in Parma, Italy, by Davide Bollati, within the Davines Group',
        'In California by a dermatologist',
        'In London as a hotel spa brand',
      ],
    },
    {
      q: `Comfort Zone's philosophy is best described as...`,
      options: [
        'Medical aesthetics and injectables',
        'Fragrance-led luxury with no scientific claims',
        'Budget skincare for the mass market',
        'Conscious skin science: laboratory-developed formulas, sustainability and holistic wellbeing together',
      ],
    },
    {
      q: 'The Tranquillity range is built around...',
      options: [
        'A signature aromatic blend of essential oils, with its celebrated body oil at the centre, designed for relaxation and rest',
        'Retinol-based resurfacing products',
        'Sun protection only',
        'Men’s grooming products',
      ],
    },
    {
      q: 'A guest concerned about the visible signs of ageing maps to which range?',
      options: [
        'Remedy',
        'Hydramemory',
        'Sublime Skin',
        'Body Strategist',
      ],
    },
    {
      q: 'The Tranquillity Pro-Sleep Massage is famous for...',
      options: [
        'High-intensity sports recovery work',
        'Guiding the guest towards deep rest using the aromatic blend, soft brushes and techniques drawn from Indonesian tradition',
        'A machine-led facial protocol',
        'A cold plunge ritual',
      ],
    },
    {
      q: 'Which sustainability credential belongs to the house?',
      options: [
        'It owns a chain of organic farms in Scotland',
        'It only sells products in glass',
        'The Davines Group is a certified B Corporation, committed to using business as a force for good',
        'It has never published anything about its ingredients',
      ],
    },
    {
      q: 'The strongest way to retail the Comfort Zone range is...',
      options: [
        'Prescribe two or three products at the close, each linked to what you found and what the guest felt in the treatment',
        'Present the full range at the till',
        'Discount whatever is overstocked',
        'Leave retail entirely to reception',
      ],
    },
    {
      q: 'Your first professional duty on day one in a Comfort Zone spa is...',
      options: [
        'Improvise treatments from your general training',
        'Rearrange the retail wall',
        'Ask about commission rates',
        'Read the menu in layers starting with the Tranquillity Pro-Sleep Massage, and ask rather than guess',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa had chosen this brand and she told me about the family laboratory in Parma and the B Corp certification. I came in for a facial and left feeling I had chosen well twice - for my skin and for my values."`,
      helpsYou: `Spas that carry Comfort Zone increasingly choose it for the ethics as much as the formulas, and they hire therapists who can tell that story fluently. Being able to state the science, sustainability and wellbeing threads in one confident sentence is interview gold on any Comfort Zone account.`,
      tips: [
        'Learn the one-breath USP: science-based conscious skincare from an Italian family laboratory',
        'Remember the three threads: laboratory science, B Corp sustainability, holistic wellbeing',
        'Match the house voice - warm, precise and conscious, never preachy',
      ],
    },
    {
      guestView: `"She told me my dehydrated skin needed the hydration range, not the anti-ageing one I had assumed, and explained why in one sentence. When someone maps your skin to the right shelf that confidently, you buy what they say and nothing else."`,
      helpsYou: `Range fluency is the fastest credibility you can build in this house, because the ranges are the map of the menu and the retail wall at once. Knowing which range answers which guest lets you consult, treat and prescribe with the same vocabulary the brand trains.`,
      tips: [
        'Learn the range names and their one-line purposes before individual products',
        'Tranquillity for rest, Sublime Skin for ageing, Hydramemory for dehydration, Remedy for sensitivity',
        'Tell ingredient stories simply: what it contains, what it does, how it feels',
        'Never invent a formulation detail - use the honest gap and check',
      ],
    },
    {
      guestView: `"The massage began with the scent of the blend and I remember the soft brushes, then almost nothing until she woke me gently. I have chased that feeling ever since - and I drove forty minutes back to that spa to find it."`,
      helpsYou: `Therapists who can deliver the Tranquillity ritual faithfully, retail from the treatment and build honest upgrade paths are the ones Comfort Zone spas rebook, promote and put in front of their most valuable guests. The signature sleep-led experience is a genuine differentiator on any CV.`,
      tips: [
        'Day one: learn the Tranquillity Pro-Sleep Massage before anything else',
        'Protect the sensorial elements - aroma, breath and brushwork are the brand, never the bits to trim',
        'Prescribe two or three products linked to what the guest just felt',
        'Upsell along natural paths: the stressed guest is a Pro-Sleep guest next visit',
      ],
    },
  ],
}
