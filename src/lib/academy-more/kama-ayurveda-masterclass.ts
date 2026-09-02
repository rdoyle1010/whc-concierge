// WHC Academy brand masterclass: Kama Ayurveda. Independent WHC training -
// not affiliated with or endorsed by Kama Ayurveda. Answer key lives in
// academy-more-answers/kama-ayurveda-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'kama-ayurveda-masterclass',
  title: 'Kama Ayurveda Masterclass',
  tagline: `The luxury Ayurvedic house - its heritage, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Kama Ayurveda is one of the most respected luxury Ayurvedic beauty houses in the world. It was founded in New Delhi, India, in 2002 by Vivek Sahni and his co-founders, with a mission that was radical in its restraint: to bring authentic Ayurveda to modern luxury beauty without diluting it into a marketing theme.

Ayurveda is the ancient Indian system of holistic wellbeing, and the word itself is usually translated from Sanskrit as the knowledge or science of life. It understands health as balance, classically described through three doshas, Vata, Pitta and Kapha, and it treats the whole person: skin, body, mind and daily ritual together.

What sets the house apart is authenticity. Many of its formulations follow recipes recorded in classical Ayurvedic texts, and its classical products are made in collaboration with Arya Vaidya Pharmacy, a long-established Ayurvedic institution in southern India. Natural ingredients, traditional methods and modern luxury presentation sit together in one brand, which has grown from Delhi into an international house with a presence in the UK.

The USP, the sentence a therapist must be able to say in one breath, is this: Kama Ayurveda offers authentic Ayurvedic beauty, made to classical recipes with natural ingredients, and presented with genuine modern luxury. A guest can buy natural skincare anywhere; here they are buying a living tradition, delivered with respect.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Every product house has its icons, and a therapist's credibility on a Kama Ayurveda menu rests on knowing them cold.

Start with the most famous: Kumkumadi Miraculous Beauty Fluid, a saffron-based facial oil made to a classical Ayurvedic recipe, traditionally used at night and prized for bringing radiance to the skin. It is the product guests ask for by name. Next, Bringadi Intensive Hair Treatment, a hair and scalp oil rooted in a classical recipe and built around bhringraj, amla and indigo, three of Ayurveda's most celebrated hair herbs. Third, Pure Rose Water, steam-distilled from roses grown in Kannauj, India's historic home of rose distillation, and used as a gentle toner and refresher.

The wider ingredient story follows the philosophy: saffron for radiance, sandalwood and vetiver for calm, turmeric for glow, sesame oil as a classical carrier, rose and jasmine for the senses. When you narrate a product in treatment, tell the story simply: what it contains, where the tradition comes from, and how the guest will feel.

Where you are unsure of a specific formulation, never invent it. Learn any range the professional way: heroes first, then one category at a time, using testers, reading the house materials, and using the key products yourself until conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Menus vary between spas carrying Kama Ayurveda, so your day one discipline is a method, not a memorised list. Identify the flagship ritual first, learn it in full, then map the facials, the warm-oil body treatments and the enhancements. For each, note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is where the house lives or dies. The signature style is rooted in Ayurvedic ritual: an unhurried consultation that asks about the whole person, warm oils prepared properly, rhythmic and generous massage in the spirit of abhyanga, the classical Ayurvedic warm-oil massage, and a calm, respectful pace throughout. Where a menu includes traditions such as shirodhara, the slow pouring of warm oil over the forehead, deliver them only with proper training.

Retail is the ritual continued at home. Narrate products as you use them, then prescribe two or three, linked directly to the treatment: the Kumkumadi night ritual for the facial guest, Bringadi as a weekly hair ritual for the guest who loved the scalp work.

Upsell paths are natural: the facial guest who melted at the scalp massage is a candidate for a fuller ritual next visit; the sixty-minute guest with real tension benefits from ninety. Finally, protect the brand: correct products, correct quantities, faithful protocols, stock reported, and Ayurveda always presented with respect, never as a gimmick.`,
    },
  ],
  quiz: [
    {
      q: 'Kama Ayurveda was founded...',
      options: [
        'In London in the 1990s by a hotel group',
        'In New Delhi, India, in 2002, by Vivek Sahni and his co-founders',
        'In Paris as a perfume house',
        'In California as a wellness start-up',
      ],
    },
    {
      q: 'The word Ayurveda is usually translated as...',
      options: [
        'The art of massage',
        'The path of beauty',
        'The golden ritual',
        'The knowledge or science of life',
      ],
    },
    {
      q: 'Kumkumadi Miraculous Beauty Fluid is best described as...',
      options: [
        'A saffron-based facial oil made to a classical Ayurvedic recipe, traditionally used at night',
        'A foaming morning cleanser',
        'A clinical retinol serum',
        'A tinted SPF moisturiser',
      ],
    },
    {
      q: 'The three doshas of classical Ayurveda are...',
      options: [
        'Saffron, sandalwood and turmeric',
        'Body, mind and spirit',
        'Vata, Pitta and Kapha',
        'Morning, noon and night',
      ],
    },
    {
      q: 'Bringadi Intensive Hair Treatment is built around...',
      options: [
        'Marine collagen and seaweed',
        'Bhringraj, amla and indigo, celebrated Ayurvedic hair herbs',
        'Keratin and silicones',
        'Peppermint and menthol',
      ],
    },
    {
      q: `The house's classical formulations are made in collaboration with...`,
      options: [
        'Arya Vaidya Pharmacy, a long-established Ayurvedic institution in southern India',
        'A Swiss cosmetics laboratory',
        'A French pharmacy chain',
        'An in-house robotics facility',
      ],
    },
    {
      q: 'On day one at a spa carrying Kama Ayurveda, your first duty is to...',
      options: [
        'Rearrange the retail display',
        'Improvise treatments from general training',
        'Memorise every ingredient list before your first guest',
        'Learn the flagship ritual and menu protocols, and ask the senior therapist rather than guess',
      ],
    },
    {
      q: 'The strongest way to retail the range is...',
      options: [
        'Present the full range at the till',
        'Discount whatever is overstocked',
        'Prescribe two or three products linked directly to the treatment the guest just experienced',
        'Leave retail entirely to reception',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist what made this brand different and she told me the story - classical recipes, a century-old Ayurvedic pharmacy, real tradition presented beautifully. I stopped seeing products and started seeing a heritage. I trusted every word after that."`,
      helpsYou: `Spas that carry Kama Ayurveda choose it for its authenticity, and they hire therapists who can voice that authenticity convincingly. Telling the founding story and stating the USP in one confident sentence is what makes an interviewer, or a sceptical guest, relax.`,
      tips: [
        'Learn the one-breath USP: authentic Ayurvedic beauty, classical recipes, natural ingredients, modern luxury',
        `Know the meaning of Ayurveda - the knowledge or science of life - and say it with respect`,
        `Remember the three doshas, Vata, Pitta and Kapha, as the classical language of balance`,
        'Speak the house voice: balance, ritual, tradition, wellbeing - never clinical jargon',
      ],
    },
    {
      guestView: `"She used the saffron oil on me and told me, in one sentence, the centuries-old recipe behind it. Then the rose water from Kannauj. I went home with both, and it never once felt like selling - it felt like being let in on something."`,
      helpsYou: `Hero-product fluency is the fastest credibility you can build in a new house. Knowing Kumkumadi, Bringadi and the Pure Rose Water cold, plus the ingredient stories behind them, means you can walk onto a Kama Ayurveda shift and belong within an hour.`,
      tips: [
        'Heroes first: Kumkumadi Miraculous Beauty Fluid, Bringadi Intensive Hair Treatment, Pure Rose Water',
        'Tell ingredient stories simply: what it contains, where the tradition comes from, how it feels',
        'Use the heroes on your own skin and hair - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The whole treatment felt like a ritual - warm oil, unhurried hands, a pace that respected the tradition it came from. At the end she suggested one night oil and one hair ritual, both from the treatment itself. I rebooked before I left."`,
      helpsYou: `Therapists who can read an Ayurvedic menu on day one, deliver the warm-oil ritual style faithfully, retail from the treatment and build honest upgrade paths are the ones luxury spas rebook, request and promote.`,
      tips: [
        'Day one: learn the flagship ritual first, and ask rather than guess',
        'Protect the ritual - warmth, rhythm and pace are the brand, never the bits to trim',
        'Prescribe two or three products linked to the treatment just delivered',
        'Deliver specialist traditions such as shirodhara only with proper training',
      ],
    },
  ],
}
