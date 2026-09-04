// Talent House Academy brand masterclass: Clarins. Independent Talent House training - not
// affiliated with or endorsed by Clarins. Answer key lives in
// academy-more-answers/clarins-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'clarins-masterclass',
  title: 'Clarins Masterclass',
  tagline: `The French house of plant science and expert touch - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Clarins is one of the great French houses of premium skincare, and its story begins in a treatment room, not a laboratory or a shop. In 1954 Jacques Courtin-Clarins opened his first beauty institute in Paris, offering treatments built around plant-based oils he had developed himself. From the beginning the method was distinctive: he listened closely to the women he treated, invited their feedback, and refined products and techniques around what they actually wanted. That listening culture is still central to how the brand describes itself.

Clarins grew into one of Europe's leading premium skincare companies while remaining a family business, passed through the Courtin-Clarins family, which is rare at its scale. The philosophy rests on two pillars. First, plant science: formulations built on researched plant extracts, drawing on decades of botanical expertise. Second, touch: Clarins professional treatments are famously delivered entirely by hand, using the house's expert manual techniques rather than machines.

The USP a therapist should be able to state in one breath: Clarins offers plant-powered skincare born in a Paris institute in 1954, refined by listening to clients for decades, and delivered through expert, one hundred percent manual touch. A guest can buy a cream anywhere; at a Clarins spa they are buying the trained hands and the plant expertise behind it.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `A therapist's credibility on a Clarins account rests on knowing the icons cold. Start with Double Serum, the house's most famous product: a two-phase anti-ageing serum that combines water-based and oil-based plant extracts in one bottle, reflecting the brand's belief that skin needs both hydric and lipidic care. It is the product guests ask about by name, and the anchor of most Clarins facial retail.

Next, Beauty Flash Balm, a decades-old cult favourite loved as an instant radiance product before a big evening; many guests know it simply as the pick-me-up their mother used. Then the body heroes: Clarins built its name on plant-based body treatment oils, and Tonic Body Treatment Oil, the firming oil from that original tradition, remains a signature, widely loved by guests during and after pregnancy. Around these sit the major facial ranges organised broadly by age and skin need, plus respected suncare and makeup.

The ingredient story is plant science: researched botanical extracts, responsibly sourced, including plants grown and studied at the brand's own alpine estate in France. Where you are unsure of a specific formulation, never invent it. Learn heroes first, one category at a time, using testers, house training materials and your own skin, and say honestly what you have not yet checked.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `On day one in any Clarins spa, read the menu like a professional. Identify the flagship facials and body treatments, note durations, the products each protocol uses and who each treatment suits, and ask the senior therapist rather than guessing. Menus differ by site, so the method matters more than any memorised list.

Delivery is where Clarins is most distinctive. The house style is one hundred percent manual: expert touch techniques, taught in Clarins training, do the work that other houses give to machines. Unhurried, confident hands are the brand. Protect the manual techniques completely; they are the first thing a rushed therapist trims and the very thing the guest is paying for.

Retail is the treatment continued at home. Narrate key products as you use them, then prescribe two or three, linked directly to what you found, with Double Serum the natural anchor for most facial prescriptions. Tell the guest what not to buy as well; that honesty compounds into trust.

Upsell paths are natural: the sixty-minute facial guest with real concerns benefits from the longer protocol; the facial guest who loved your hands is a body treatment guest next visit. Offer once, warmly. And protect the standards on shift: correct products in correct quantities, faithful protocols, immaculate testers, stock reported early. On a Clarins shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Clarins began in 1954 when...',
      options: [
        'A Swiss pharmacist launched a pharmacy skincare line',
        'Jacques Courtin-Clarins opened a beauty institute in Paris built around plant-based treatment oils',
        'A Parisian department store created an own-brand range',
        'A dermatology clinic in Lyon began selling its formulas',
      ],
    },
    {
      q: `The two pillars of the Clarins philosophy are...`,
      options: [
        'Machines and medical peels',
        'Fragrance and fashion',
        'Synthetic actives and clinical trials only',
        'Plant science and expert manual touch, refined by listening to clients',
      ],
    },
    {
      q: 'Clarins professional treatments are famous for being delivered...',
      options: [
        'Entirely by hand, using the expert Clarins touch techniques rather than machines',
        'Primarily with high-tech devices',
        'By self-application guided by the therapist',
        'In express fifteen-minute formats only',
      ],
    },
    {
      q: 'Double Serum is best described as...',
      options: [
        'A single-phase vitamin C booster',
        'A cleansing oil for the body',
        'A two-phase anti-ageing serum combining water-based and oil-based plant extracts in one bottle',
        'A tinted moisturiser with SPF',
      ],
    },
    {
      q: 'Beauty Flash Balm is loved as...',
      options: [
        'An overnight retinol treatment',
        'An instant radiance product, the classic pick-me-up before a big evening',
        'A scalp treatment mud',
        'A firming body oil',
      ],
    },
    {
      q: 'Tonic Body Treatment Oil belongs to...',
      options: [
        `The house's original tradition of plant-based body treatment oils, famous for firming and loved by guests during and after pregnancy`,
        'A discontinued makeup line',
        'A rival French house',
        'The suncare range',
      ],
    },
    {
      q: 'The strongest way to retail the Clarins range after a facial is...',
      options: [
        'Present the full range at the till',
        'Leave retail entirely to reception',
        'Discount whatever is overstocked',
        'Prescribe two or three products linked to what you found, with Double Serum as the natural anchor',
      ],
    },
    {
      q: 'Your first professional duty on day one in a Clarins spa is...',
      options: [
        'Rearrange the retail wall',
        'Improvise treatments from your general training',
        'Learn the treatment menu and house protocols, note products and durations, and ask rather than guess',
        'Ask about commission rates',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa chose Clarins and she told me about the Paris institute in 1954, the plant oils, the listening to clients. It stopped being a counter brand and became a story - and I trusted every word she said after that."`,
      helpsYou: `Clarins accounts sit in some of the best hotel spas and department store Skin Spas in the UK. Being able to tell the founding story and state the USP in one confident sentence is exactly what makes an interviewer, or a sceptical guest, relax.`,
      tips: [
        'Learn the one-breath USP: plant-powered skincare born in a Paris institute, delivered through expert manual touch',
        `Remember the heritage: Clarins grew out of a treatment room and a listening culture, not a retail counter`,
        `Hold the two pillars together: plant science and touch - one without the other is not Clarins`,
      ],
    },
    {
      guestView: `"She used the Double Serum on me and explained, in one sentence, why it comes in two phases. Then she mentioned the Beauty Flash Balm my mum swore by. I went home with both, and it never once felt like selling."`,
      helpsYou: `Hero fluency is the fastest credibility you can build on a Clarins shift. Knowing Double Serum, Beauty Flash Balm and Tonic Body Treatment Oil cold means you can answer the questions guests actually ask within your first hour on the account.`,
      tips: [
        'Heroes first: Double Serum, Beauty Flash Balm, Tonic Body Treatment Oil',
        'Tell the plant story simply: what it contains, what it does, how it feels',
        'Use the heroes on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"No machines, no gadgets - just an hour of the most skilled hands I have ever felt, and two products written down for me at the end. I understood exactly why people stay loyal to this brand for decades."`,
      helpsYou: `Therapists who can deliver the manual Clarins style faithfully, retail from the treatment and build honest upgrade paths are the ones hotels and Skin Spas rebook, request and promote - the touch techniques are a career asset in themselves.`,
      tips: [
        'Day one: map the menu - flagships, durations, products, who each treatment suits',
        'Protect the manual techniques - the hands are the brand, never the bit to trim',
        'Prescribe two or three products, anchored on what you found in the skin',
        'Upsell along natural paths: loved the facial means the longer protocol or a body treatment next visit',
      ],
    },
  ],
}
