// WHC Academy brand masterclass: Wildsmith Skin. Independent WHC training -
// not affiliated with or endorsed by Wildsmith Skin. Answer key lives in
// academy-more-answers/wildsmith-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'wildsmith-masterclass',
  title: 'Wildsmith Skin Masterclass',
  tagline: `The gardener's skincare house - its estate-born story, its botanical science, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Wildsmith Skin is one of the most distinctive quiet-luxury names in British skincare, and its story begins in a garden rather than a laboratory. The brand was born at Heckfield Place, a restored Georgian country estate hotel in Hampshire, and takes its name from William Wildsmith, the celebrated Victorian head gardener who tended the estate's grounds in the nineteenth century and was renowned in his era for his horticultural skill.

That inheritance is not decoration; it is the philosophy. Wildsmith approaches skin the way a great gardener approaches a plant: you do not force a bloom, you cultivate the conditions for health, patiently and over time. The house pairs botanical ingredients with modern skincare science, holding that nature and science are partners rather than rivals, and it speaks of skin health rather than quick cosmetic fixes.

The brand's spiritual home remains the spa at Heckfield Place, where treatments are delivered in the calm, grounded, nature-connected style the estate inspires.

The USP, stated in one breath: Wildsmith Skin brings a gardener's philosophy to skincare, an estate-born British house that cultivates long-term skin health by combining botanical actives with modern science, delivered through grounded, unhurried, nature-connected treatments. A guest can buy actives anywhere; here they are buying patience, provenance and cultivation, and the therapist's delivery must embody all three.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Every house has its icons, and a therapist's credibility on a Wildsmith shift rests on knowing them and their stories.

Start with the house's best-known ingredient signature: copper peptides. Wildsmith's Active Repair collection, including its much-discussed Copper Peptide products, built the brand's reputation for pairing serious, science-led actives with its botanical heart. Copper peptides are prized in skincare for supporting the skin's own renewal and repair processes, which fits the house philosophy perfectly: help the skin do its own work better, as a gardener feeds the soil rather than painting the leaves.

Around that signature sits the botanical story. Wildsmith formulates with plant-derived ingredients, reflecting its woodland and garden heritage, alongside modern cosmetic science. When you narrate a product in treatment, tell that double story simply: the plant heritage, the scientific active, and how the guest will feel.

Where you are unsure of a specific formulation, never invent it. The professional method for learning any range is constant across houses: heroes first, then one category at a time, using the spa's testers and the brand's own training materials, and using the key products on your own skin until conviction is genuine. State what you know, check what you do not, and remember that with a knowledgeable quiet-luxury guest, one honest sentence outsells three invented ones.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Menus differ between Wildsmith venues, so day one is about method. Read the treatment menu before your first guest: identify the signature facials and body treatments, note each treatment's duration, protocol, products and ideal guest, learn the flagship first, and ask the senior therapist rather than guessing. A therapist who can honestly say they know the menu by the end of day one is rare and remembered.

Delivery must match the house. The Wildsmith style is grounded, unhurried and nature-connected: calm presence, considered touch, no rush, and language drawn from cultivation and skin health rather than clinical hard-sell. Protect the treatment's quiet openings and closings; under time pressure they are the first thing a rushed therapist trims and the very thing the brand stands for.

Retail is the philosophy continued at home. Narrate key products during treatment, then prescribe two or three items linked directly to what you found and what the guest experienced, the copper peptide hero for renewal, the cleanser they felt working. Explain that cultivation takes consistency, which honestly supports both home care and rebooking.

Upsell paths follow the guest's genuine needs: sixty minutes to ninety for real tension, a facial guest towards the signature experience, enhancements to deepen a booking, offered once and warmly.

Finally, protect the standard: correct products in correct quantities, faithful protocols, immaculate testers, stock reported early, and the ritual never diluted. On a Wildsmith shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Wildsmith Skin takes its name from...',
      options: [
        'A Swiss cosmetic chemist',
        'William Wildsmith, the celebrated Victorian head gardener of Heckfield Place',
        'A fictional character created for marketing',
        'The founder of a London department store',
      ],
    },
    {
      q: 'The brand was born at...',
      options: [
        'A Harley Street clinic',
        'A Cornish coastal resort',
        'Heckfield Place, a restored Georgian country estate hotel in Hampshire',
        'A laboratory in Switzerland',
      ],
    },
    {
      q: `The Wildsmith philosophy is best described as...`,
      options: [
        `A gardener's approach to skin: cultivating long-term skin health by pairing botanical ingredients with modern science`,
        'Aggressive resurfacing for instant results',
        'Fragrance-led pampering with no active ingredients',
        'Medical aesthetics and injectables',
      ],
    },
    {
      q: `The house's best-known ingredient signature is...`,
      options: [
        'Snail mucin',
        'Diamond dust',
        'Marine collagen',
        'Copper peptides, notably in the Active Repair collection, paired with botanical ingredients',
      ],
    },
    {
      q: 'A guest asks about a formulation detail you are not sure of. You should...',
      options: [
        'Invent a plausible answer to protect your credibility',
        'Change the subject',
        'Say what you know, offer to check the rest, and actually check it',
        'Tell them formulations are confidential',
      ],
    },
    {
      q: 'The Wildsmith treatment style is best described as...',
      options: [
        'Fast-paced and results-obsessed, with a clinical hard-sell',
        'Grounded, unhurried and nature-connected, with language of cultivation and skin health',
        'Loud, sociable and entertainment-led',
        'Identical to every other product house',
      ],
    },
    {
      q: 'The strongest way to retail the Wildsmith range is...',
      options: [
        'Present the full range at the till',
        'Leave retail entirely to reception',
        'Discount whatever is overstocked',
        'Prescribe two or three products linked to the treatment just delivered and what you found, explaining that cultivation takes consistency',
      ],
    },
    {
      q: 'Protecting the brand on shift means...',
      options: [
        'Correct products in correct quantities, faithful protocols, stock reported early, and never diluting the ritual under time pressure',
        'Improvising your own protocol variants',
        'Substituting products quietly when stock runs low',
        'Trimming the quiet openings and closings to stay on schedule',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa carried a brand I'd never seen in a department store, and the therapist told me about the Victorian head gardener and the estate it grew from. By the end of the story I understood exactly what I was paying for."`,
      helpsYou: `Quiet-luxury houses hire and rebook therapists who can carry the story. Being able to tell the Heckfield Place origin and state the gardener's philosophy in one confident sentence is precisely what separates a fluent Wildsmith therapist from someone merely using its products.`,
      tips: [
        `Learn the one-breath USP: a gardener's philosophy, estate-born, botanical actives with modern science, cultivating skin health`,
        'Remember the name: William Wildsmith, Victorian head gardener of Heckfield Place',
        'Match the house voice - cultivation, patience, skin health, never quick-fix promises',
      ],
    },
    {
      guestView: `"She told me the copper peptide serum helps my skin do its own repair work, the way a gardener feeds the soil rather than painting the leaves. One sentence, and I bought it without ever feeling sold to."`,
      helpsYou: `Hero fluency is the fastest credibility you can build in a new house. Knowing the copper peptide signature and the botanical story cold, and having an honest method for everything else, lets you walk onto a Wildsmith shift and belong within an hour.`,
      tips: [
        'Heroes first: the Active Repair collection and its copper peptide signature',
        'Tell the double story: plant heritage, scientific active, how it will feel',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; the honest gap outsells the confident bluff',
      ],
    },
    {
      guestView: `"Nothing was rushed. The treatment opened quietly, closed quietly, and she recommended exactly two products, both of which she had already used on me. I rebooked before I left the building."`,
      helpsYou: `Therapists who read a menu properly on day one, deliver the grounded house style faithfully, and retail through honest two or three item prescriptions are the ones quiet-luxury spas request by name and trust with their most valuable regulars.`,
      tips: [
        'Day one: learn the flagship first, then map the menu in layers, asking rather than guessing',
        'Protect the quiet openings and closings - they are the brand, never the bits to trim',
        'Prescribe two or three products linked to the treatment, and frame home care as cultivation',
        'Upsell once and warmly, only where it genuinely improves the outcome',
      ],
    },
  ],
}
