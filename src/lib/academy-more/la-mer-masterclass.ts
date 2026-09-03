// Talent House Academy brand masterclass: La Mer. Independent Talent House training - not
// affiliated with or endorsed by La Mer. Answer key lives in
// academy-more-answers/la-mer-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'la-mer-masterclass',
  title: 'La Mer Masterclass',
  tagline: `The house of the Miracle Broth - its legend, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `La Mer is one of the most storied names at the very top of luxury skincare, and its origin story is told and retold because it is genuinely remarkable. The house begins not with a beauty company but with a scientist: Dr Max Huber, an aerospace physicist who, after suffering burns in an accident, set out to heal his own skin. By the brand's own account he spent around twelve years and thousands of experiments before perfecting Crème de la Mer in the 1960s, built around a fermented sea kelp elixir he called the Miracle Broth.

After Huber's death, The Estée Lauder Companies acquired La Mer in the mid-1990s and grew it from a single legendary cream into a complete house of skincare, carried by the world's most exclusive retailers and five-star hotel spas.

The philosophy is renewal drawn from the sea: nutrient-rich marine ingredients, slow fermentation, and a belief that skin responds to care delivered as ritual, most famously the warming of the cream between the fingertips before it is pressed into the skin.

The USP in one breath: La Mer offers transformative, sea-derived skincare built around the fermented Miracle Broth, born from one scientist's quest to heal his own skin, and delivered as an unhurried ritual at the summit of luxury. Guests are not buying a moisturiser; they are buying the legend, the broth and the ritual together.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Every La Mer product carries the Miracle Broth, the fermented heart of the house. Its central ingredient is nutrient-rich sea kelp, hand-harvested and fermented slowly over a period of months with other natural ingredients. When you narrate it in treatment, keep the story simple: the sea, the slow fermentation, the renewal it supports.

The icon is Crème de la Mer, the Moisturizing Cream, the original rich formula guests simply call the cream. The house offers its moisturiser in a family of textures, including the Soft Cream and the lighter Moisturizing Gel Cream, so different skin types and preferences can find their match while every version carries the broth.

Beyond the cream, learn the heroes guests ask for by name: The Concentrate, the house's famous soothing serum beloved for stressed and sensitised skin; The Treatment Lotion, the liquid first step of the ritual; The Eye Concentrate; and The Renewal Oil. Present each in one fluent sentence: what it is, what it is famous for, and who it suits.

Where you are unsure of a specific formulation detail, never invent it. The method for learning any range is constant: heroes first, one category at a time, the house's own training materials as your source of claims, the products on your own skin until conviction is real, and the honest gap, saying what you know and checking the rest, instead of bluffing in front of a guest who may know the range intimately.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `La Mer treatments live in a small number of the world's finest spas, so menus vary by venue. The day one discipline is a reading method: identify the flagship facial first, then map the tiers above and below it, the durations, the products each protocol uses, and the enhancements available. Read the protocols the spa holds and ask the senior therapist rather than guessing; at this price tier improvisation is unforgivable.

Delivery is high-touch and sensorial. A La Mer facial is massage-led and unhurried, and the house's signature gesture belongs in every treatment: warming the cream between the fingertips until it turns translucent, then pressing it gently into the skin. Narrate the Miracle Broth story softly as the guest experiences it, and never rush a ritual the guest has paid a premium to feel.

Retail is the ritual continued at home. Prescribe two or three products linked directly to the treatment, and teach the warming ritual at the counter so the guest can repeat the experience every morning. Natural upsell paths follow the menu: the classic facial guest moves to the longer or more advanced experience next visit; the cream devotee adds The Concentrate when skin is stressed; textures switch with the seasons.

Finally, protect the house: correct products in correct quantities, faithful protocols, immaculate testers and retail, stock reported early, and the ritual delivered in full even on a late-running column. On a La Mer shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Crème de la Mer was originally created by...',
      options: [
        'A dermatologist at a Paris clinic',
        'Dr Max Huber, an aerospace physicist, seeking to heal his own skin after suffering burns in an accident',
        'A marine biologist working for a Japanese cosmetics group',
        'An in-house laboratory team in the 1980s',
      ],
    },
    {
      q: 'The heart of every La Mer formula is the Miracle Broth, whose central ingredient is...',
      options: [
        'Alpine glacier water',
        'Crushed pearl powder',
        'Rose otto essential oil',
        'Nutrient-rich sea kelp, hand-harvested and slowly fermented',
      ],
    },
    {
      q: 'Since the mid-1990s, La Mer has been part of...',
      options: [
        'The Estée Lauder Companies',
        'A private Swiss pharmaceutical group',
        'An independent family trust',
        'A luxury fashion conglomerate',
      ],
    },
    {
      q: 'The signature way to apply Crème de la Mer is to...',
      options: [
        'Rub it in briskly until fully absorbed',
        'Apply it cold, straight from the jar, with a spatula only',
        'Warm it between the fingertips until translucent, then press it gently into the skin',
        'Mix it with water into a lighter lotion first',
      ],
    },
    {
      q: 'La Mer offers its moisturiser in several textures, such as the Soft Cream and the Moisturizing Gel Cream, because...',
      options: [
        'Each texture contains a different core complex',
        'The textures are seasonal limited editions',
        'Different skin types and preferences suit different textures, while every version carries the Miracle Broth',
        'The original cream has been discontinued',
      ],
    },
    {
      q: 'Your first professional duty on day one in a spa offering La Mer treatments is to...',
      options: [
        'Learn the treatment menu and house protocols, starting with the flagship facial, and ask rather than guess',
        'Improvise treatments from your general facial training',
        'Rearrange the retail display to your own taste',
        'Memorise every ingredient list before touching a guest',
      ],
    },
    {
      q: 'The strongest way to retail the La Mer range is to...',
      options: [
        'Present the full range at the till and let the guest choose',
        'Discount whatever the spa has overstocked',
        'Leave all retail conversations to reception',
        'Prescribe two or three products linked to the treatment, and teach the warming ritual so the guest can repeat it at home',
      ],
    },
    {
      q: `Protecting La Mer's standards on shift means...`,
      options: [
        'Substituting cheaper products when stock runs low',
        'Correct products in correct quantities, faithful protocols, immaculate presentation, and never trimming the ritual under time pressure',
        'Inventing impressive claims to justify the price',
        'Shortening treatments quietly when the column runs late',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the cream cost what it costs, and she told me the story - the physicist, the burns, the years of experiments, the broth fermented from sea kelp. By the end I understood I was not buying a jar; I was buying a legend that happens to work."`,
      helpsYou: `At this tier of luxury, guests expect their therapist to know the story cold. Telling the Max Huber legend and stating the USP in one confident breath is what separates a therapist trusted with a La Mer account from one who merely applies expensive product.`,
      tips: [
        `Learn the one-breath USP: transformative sea-derived skincare, built on the fermented Miracle Broth, born from one scientist's quest to heal his own skin`,
        'Anchor the story: Max Huber, the accident, years of experiments, the 1960s cream, Estée Lauder from the mid-1990s',
        'Speak the house voice: renewal, the sea, ritual, transformation - never bargain language',
      ],
    },
    {
      guestView: `"She warmed the cream between her fingertips until it went translucent, pressed it into my skin, and quietly told me about the kelp and the months of fermentation. I could feel the difference and hear the reason at the same time. I bought the cream and The Concentrate on the way out."`,
      helpsYou: `Hero-product fluency is your fastest credibility in a house where a single jar can cost more than a treatment. Knowing the cream, the texture family, The Concentrate and the Miracle Broth story means you can answer the questions wealthy, well-read guests actually ask.`,
      tips: [
        'Heroes first: Crème de la Mer, the Soft Cream and Gel Cream textures, The Concentrate, The Treatment Lotion, The Eye Concentrate',
        'Tell the broth story simply: sea kelp, hand-harvested, fermented slowly over months',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; use the honest gap and check the rest',
      ],
    },
    {
      guestView: `"The facial was almost entirely hands - slow, warm, unhurried - and every product arrived as a small ceremony. At the end she showed me how to warm the cream myself each morning. Now my bathroom shelf feels like the treatment room."`,
      helpsYou: `Therapists who can read a La Mer menu on day one, deliver the sensorial house style faithfully, and retail through the ritual are the ones five-star spas trust with their most valuable guests - and their most valuable stock.`,
      tips: [
        'Day one: identify the flagship facial and learn it fully before anything else',
        'The warming ritual belongs in every treatment - never rush it',
        'Prescribe two or three products and teach the ritual at the counter',
        'Protect the brand: correct quantities, faithful protocols, stock reported early',
      ],
    },
  ],
}
