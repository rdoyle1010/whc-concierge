// WHC Academy brand masterclass: Thalgo. Independent WHC training - not
// affiliated with or endorsed by Thalgo. Answer key lives in
// academy-more-answers/thalgo-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'thalgo-masterclass',
  title: 'Thalgo Masterclass',
  tagline: `The French marine beauty expert - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Thalgo is the great French house of marine beauty. It was founded in France in 1964 by André Bouclet, a pharmacist fascinated by the therapeutic power of the sea, and its very name tells its story: a fusion of thalassotherapy, the treatment tradition built on seawater and marine climate, and algae, the seaweed at the heart of its formulas.

The defining breakthrough came early. Thalgo developed and patented the micronisation of marine algae, a process that grinds seaweed so finely that its minerals, trace elements and actives become available to the skin. That patented micronised marine algae became the foundation of the professional body wraps that made the brand's name in salons and spas, and marine intelligence has driven the house ever since.

The philosophy follows naturally: the ocean is the origin of life and an unmatched source of skin-compatible nutrients, and Thalgo's role is to harvest, refine and deliver that richness responsibly through professional treatments and homecare.

The USP a therapist must be able to state in one breath: Thalgo is the French marine beauty expert, offering professional skincare and spa treatments powered by algae and marine actives, born from thalassotherapy and delivered through trained hands in spas and salons worldwide. Guests can buy skincare anywhere; at a Thalgo spa they are buying the sea, made usable by science.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Thalgo's credibility rests on its marine larder, and a therapist should know its pillars cold. Micronised marine algae is the founding hero: the patented fine-ground seaweed rich in minerals and trace elements, famous in the professional body wrap. Around it sit marine actives the house returns to again and again, including marine collagen, hyaluronic acid, spirulina and targeted algae extracts, each chosen for a specific skin story.

The facial ranges are organised by skin need, so learn them as a map. Source Marine is the hydration family for thirsty, dulled skin. Cold Cream Marine comforts dry and sensitive skin, a name guests remember and ask for. Silicium is the firming and wrinkle-correction family for skin losing bounce, and Spiruline Boost brings antioxidant energy to skin dulled by urban life and fatigue. At the summit sits Prodige des Océans, the premium anti-ageing line, the house's most luxurious expression of marine intelligence.

Where your spa's exact shelf differs, apply the professional learning method rather than guesswork: heroes first, one range at a time, the brand's own training materials for any claim, and the key products on your own skin until conviction is real. Narrate products in single honest sentences: what it contains, what it does, how it will feel. The sea does most of the selling if you tell its story simply.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `On day one in any Thalgo spa, read the menu like a professional. Find the marine classics first: the micronised marine algae body wrap is the treatment the house built its name on, and the facial menu will map onto the ranges, a Source Marine hydration facial, a Silicium firming facial, and a top-tier experience built on Prodige des Océans. Many spas also carry Thalgo's multi-sensory rituals, such as the Indocéane journey; learn whichever your venue offers, in full, before your first guest. Note durations, protocols and products for each, and ask the senior therapist rather than guessing.

Delivery is marine storytelling. The house style pairs professional, results-focused technique with the sensory pleasure of the sea: the scent of the products, the warmth of a wrap, the story of the algae told in a sentence at the right moment. Unhurried flow and clean, confident technique are the standard.

Retail is the ocean continued at home. Prescribe two or three products linked to the treatment just delivered and the skin you actually analysed, and write them down. Upsell paths are natural: the facial guest with dehydration signs benefits from a course; the massage guest curious about the algae scent is a body wrap guest next visit.

Finally, protect the brand: correct products, correct quantities, faithful protocols, low stock reported, and the ritual never trimmed for time. On a Thalgo shift, you are the house.`,
    },
  ],
  quiz: [
    {
      q: 'Thalgo was founded...',
      options: [
        'In California in the 1980s by a dermatologist',
        'In France in 1964 by André Bouclet, a pharmacist',
        'In Italy in the 1990s by a fragrance house',
        'In Japan in the 1970s by a seaweed farming cooperative',
      ],
    },
    {
      q: `The name Thalgo comes from...`,
      options: [
        'The founder family surname',
        'A Breton word for the tide',
        'Thalassotherapy and algae - sea therapy and seaweed, the two roots of the house',
        'A Greek goddess of beauty',
      ],
    },
    {
      q: `Thalgo's defining patented breakthrough was...`,
      options: [
        'The micronisation of marine algae, grinding seaweed so finely its actives become available to the skin',
        'Synthetic marine fragrance',
        'The first waterproof mascara',
        'Freeze-dried seawater tablets',
      ],
    },
    {
      q: 'The Cold Cream Marine range is best suited to...',
      options: [
        'Oily, congested skin',
        'Mature skin needing firming',
        'Skin dulled by urban fatigue',
        'Dry and sensitive skin in need of comfort',
      ],
    },
    {
      q: 'Prodige des Océans is...',
      options: [
        'A slimming body range',
        `The premium anti-ageing line at the summit of Thalgo's ranges`,
        'A suncare family',
        'A men-only grooming line',
      ],
    },
    {
      q: 'The professional body treatment the house built its name on is...',
      options: [
        'The micronised marine algae body wrap',
        'A hot stone massage',
        'A paraffin cocoon',
        'A dry flotation session',
      ],
    },
    {
      q: 'The strongest way to retail the Thalgo range is...',
      options: [
        'Present the full range at the till',
        'Leave retail entirely to reception',
        'Prescribe two or three products linked to the treatment delivered and the skin you analysed, and write them down',
        'Recommend whatever is on promotion',
      ],
    },
    {
      q: 'Your first professional duty on day one in a Thalgo spa is...',
      options: [
        'Improvise treatments from your general training',
        'Reorganise the retail shelves',
        'Memorise every ingredient list before touching a guest',
        'Learn the treatment menu and protocols, starting with the marine classics, and ask rather than guess',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa used Thalgo and the therapist told me about the pharmacist, the seaweed and the patent. Suddenly the whole menu felt like science with a story, and I trusted every product she touched me with."`,
      helpsYou: `Spas on a Thalgo account want therapists who can tell the marine story with confidence. Stating the founding story and the one-breath USP fluently is what convinces an interviewer, a manager or a sceptical guest in under a minute.`,
      tips: [
        'Learn the one-breath USP: the French marine beauty expert, powered by algae and marine actives, born from thalassotherapy',
        'Remember the origin: founded in France in 1964 by a pharmacist, named for thalassotherapy and algae',
        `The patented micronisation of marine algae is the house's defining breakthrough - know it cold`,
      ],
    },
    {
      guestView: `"She told me in one sentence why the algae mattered, matched a range to what my skin actually needed, and never once sounded like a script. I left with the cream and came back for the serum."`,
      helpsYou: `Range fluency is the fastest credibility you can build in a marine house. Knowing which family answers which skin need means every consultation ends with an honest, confident prescription instead of an awkward pause at the till.`,
      tips: [
        'Map the ranges by need: Source Marine hydrates, Cold Cream Marine comforts, Silicium firms, Prodige des Océans is the summit',
        'Tell ingredient stories simply: what it contains, what it does, how it feels',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The wrap was warm, the room smelt of the sea, and afterwards she wrote down exactly two products and told me why. It felt like a treatment plan from an expert, not a sales pitch."`,
      helpsYou: `Therapists who can read a Thalgo menu on day one, deliver the marine style faithfully and build honest upgrade paths are the ones spas rebook, request by name and put in front of their best guests.`,
      tips: [
        'Day one: learn the marine classics first, starting with the algae body wrap and the facial tiers',
        'Protect the ritual - the sensory marine story is the brand, never the part you trim for time',
        'Prescribe two or three products linked to the treatment just delivered, and write them down',
        'Upsell along natural paths: dehydrated skin means a facial course; curiosity about the algae means the wrap next visit',
      ],
    },
  ],
}
