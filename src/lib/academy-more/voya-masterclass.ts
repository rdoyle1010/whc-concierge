// WHC Academy brand masterclass: VOYA. Independent WHC training - not
// affiliated with or endorsed by VOYA. Answer key lives in
// academy-more-answers/voya-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'voya-masterclass',
  title: 'VOYA Masterclass',
  tagline: `The Irish house of hand-harvested seaweed - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `VOYA is the Irish house of organic seaweed, and its story begins not in a laboratory but on a beach. The brand comes from Strandhill, County Sligo, on the wild Atlantic coast of the west of Ireland, and it was built by the Walton family around a genuinely old tradition: hot seaweed bathing. At its height in the early twentieth century, Ireland had hundreds of seaweed bathhouses, where people soaked in hot seawater and freshly harvested seaweed for aching joints, tired muscles and skin complaints. The tradition all but disappeared, and the Walton family revived it, reopening hot seaweed baths at Strandhill in the early 2000s. The VOYA product house followed in the mid 2000s, taking the bathhouse experience into an organic skincare and body care range.

The philosophy is authenticity from the sea: wild seaweed, hand-harvested sustainably from the Atlantic shoreline so that the plants regrow, formulated into products with certified organic credentials and a deep commitment to sustainability.

The USP, said in one breath: VOYA offers certified organic, seaweed-based skincare and treatments built on hand-harvested wild Irish seaweed and a revived national bathing tradition. No other luxury house can tell that exact story, and the story is what the guest is buying.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `The hero ingredient of the entire house is seaweed itself, so start your product knowledge there. Seaweed is naturally rich in minerals, vitamins, amino acids and antioxidants, and it releases a silky, nourishing gel in warm water that softens and conditions the skin. Species matter: VOYA is famous for its use of hand-harvested wild Atlantic seaweeds such as Fucus serratus, the serrated wrack traditionally used in Irish seaweed baths. Because the seaweed is cut by hand above the base, the plant regrows, which is the heart of the sustainability story.

The most iconic product to know is Lazy Days, VOYA's detoxifying seaweed bath: whole dried seaweed that rehydrates in a hot bath at home, recreating the Strandhill bathhouse experience. It is the purest expression of the brand and one of the easiest honest recommendations in spa retail. Around it sits a full organic face and body range, with the house's characteristically playful product naming.

Where you are unsure of a specific product or formulation, never invent it. Learn any range the professional way: heroes first, one category at a time, the house's own training materials for claims, the testers and your own skin for conviction, and the honest gap, saying what you know and checking the rest, when a guest asks something you cannot yet answer.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A VOYA menu rewards the therapist who reads it properly. On day one in any VOYA spa, learn the signature seaweed experiences first: the seaweed bath where the venue has one, and the treatments in which warm seaweed is applied to the body, such as seaweed wraps and seaweed-based massage and facial rituals. Then map the organic facials, the body treatments and the enhancements. For each, note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is storytelling with your hands. The house style is natural, unhurried and rooted in the sea: guests should feel the warmth, the texture of the seaweed and the calm of an Atlantic ritual, and hear the story told simply, hand-harvested, organic, from Strandhill, as they experience it.

Retail is the shoreline continued at home. Narrate the products as you use them, then prescribe two or three, linked directly to the treatment and its story; Lazy Days is the natural take-home for any guest who loved the seaweed itself. Upsell paths are honest ones: the facial guest curious about the seaweed story is a wrap or bath guest next visit; the sixty-minute guest with real tension benefits from ninety.

Finally, protect the house: correct products, correct quantities, faithful protocols, immaculate presentation, stock reported, and the ritual never trimmed for time. On a VOYA shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'VOYA comes from...',
      options: [
        'A Scottish Highlands estate',
        'Strandhill, County Sligo, on the Atlantic coast of the west of Ireland',
        'A Cornish surf town',
        'A Scandinavian coastal village',
      ],
    },
    {
      q: 'The heritage behind VOYA is...',
      options: [
        'Alpine thermal spa culture',
        'French thalassotherapy clinics',
        'Japanese onsen bathing',
        `The revival of Ireland's traditional hot seaweed bathhouses by the Walton family`,
      ],
    },
    {
      q: `VOYA's USP centres on...`,
      options: [
        'Hand-harvested wild Irish seaweed in certified organic products, built on a revived bathing tradition',
        'Laboratory-grown marine collagen',
        'Diamond-infused anti-ageing facials',
        'High-tech machine-led treatments',
      ],
    },
    {
      q: `VOYA's iconic Lazy Days product is...`,
      options: [
        'A sleep pillow spray',
        'A scented candle',
        'A bath of whole dried seaweed that rehydrates in hot water, recreating the seaweed bath at home',
        'An SPF day moisturiser',
      ],
    },
    {
      q: 'Seaweed earns its place as a spa ingredient because...',
      options: [
        'It is cheap to farm anywhere in the world',
        'It is naturally rich in minerals, vitamins, amino acids and antioxidants, and regrows when hand-cut correctly',
        'It exfoliates more harshly than salt',
        'It removes the need for massage',
      ],
    },
    {
      q: `VOYA's signature treatment style is built around...`,
      options: [
        'Seaweed baths and warm seaweed applied to the body in wraps and rituals, delivered with the Atlantic story',
        'High-frequency electrical machines',
        'Hot stone ceremonies',
        'Paraffin wax therapies',
      ],
    },
    {
      q: 'The strongest way to retail the VOYA range is...',
      options: [
        'Present the whole shelf at the till',
        'Discount whatever is overstocked',
        'Leave retail entirely to reception',
        'Prescribe two or three products linked to the treatment and its story, with Lazy Days as the natural take-home for seaweed lovers',
      ],
    },
    {
      q: 'Your first professional duty on day one in a VOYA spa is...',
      options: [
        'Improvise treatments from your general training',
        'Rearrange the retail wall',
        'Learn the treatment menu, starting with the signature seaweed experiences, and ask rather than guess',
        'Memorise every ingredient list before touching a guest',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa used VOYA and the therapist told me about the seaweed baths in Sligo, the family who brought them back, the hand-harvesting. By the end I did not feel I was buying skincare - I felt I was buying a piece of the Atlantic."`,
      helpsYou: `VOYA is a story-led house, and hiring managers and guests both relax the moment a therapist can tell the founding story and state the USP in one confident sentence. Narrative fluency is what separates a therapist who uses the products from one who represents the brand.`,
      tips: [
        'Learn the one-breath USP: certified organic, hand-harvested wild Irish seaweed, a revived bathing tradition',
        'Anchor the story in place: Strandhill, County Sligo, the Atlantic coast of the west of Ireland',
        `Match the house voice - natural, warm and honest, the sea and sustainability at the centre`,
      ],
    },
    {
      guestView: `"She lifted the seaweed from the water and let me feel the gel on it, then explained the minerals and why it is cut by hand so it grows back. I bought the Lazy Days bath on the way out without her ever asking me to."`,
      helpsYou: `Seaweed fluency is the fastest credibility you can build in this house. If you can explain what seaweed does for skin, why hand-harvesting matters and what Lazy Days is, you can walk onto a VOYA shift and belong within the hour.`,
      tips: [
        'Heroes first: Lazy Days and the seaweed itself are the soul of the range',
        'Tell the ingredient story simply: minerals, vitamins, antioxidants, and the silky gel released in warm water',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; use the honest gap and check the rest',
      ],
    },
    {
      guestView: `"Warm seaweed on my back, the smell of the sea, and a therapist quietly telling me where it was harvested that week. It was the most memorable treatment I have had anywhere, and I booked the full wrap before I left."`,
      helpsYou: `Therapists who can deliver the seaweed rituals faithfully, retail through the story and build honest upgrade paths are the ones VOYA venues rebook, request and promote. The brand lives or dies in your hands on shift, and managers know it.`,
      tips: [
        'Day one: learn the signature seaweed experiences before anything else',
        'Deliver the story with the treatment - hand-harvested, organic, from Strandhill',
        'Prescribe two or three products linked to the treatment; Lazy Days is the natural take-home',
        'Protect the ritual - never trim the seaweed elements to rescue a late column',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'voya-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in VOYA, the Irish organic seaweed house found in luxury hotel spas and destination spas across the UK and Ireland. It covers the founding story and philosophy that shape every treatment, the seaweed science and hero products a therapist must know cold, and the practical craft of the VOYA shift: reading the treatment menu, delivering the natural, story-led signature style, retailing the range by linking products to treatments, building honest upsell paths, and upholding the standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by VOYA.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas that carry VOYA across UK luxury hotels, destination spas and premium day spas. It suits therapists interviewing for a VOYA account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving to VOYA from another house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in VOYA spas will also gain a working command of the range and its story.`,
  outcomes: [
    `Tell VOYA's founding story and articulate its philosophy and USP in confident, guest-ready language`,
    'Explain the seaweed ingredient story, the hand-harvesting method and the organic credentials accurately and honestly',
    `Deliver VOYA's natural, story-led signature style, from seaweed bath to wrap, at five-star standard`,
    'Retail the range by linking products used in treatment to a two or three item home prescription',
    `Build integrity-led upgrade paths between treatments and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount VOYA's founding story, from the Irish seaweed bathhouse tradition to the Walton family's revival at Strandhill`,
        `Explain the house philosophy of hand-harvested wild seaweed, certified organic formulation and sustainability`,
        `Articulate VOYA's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'A tradition rescued from the tide',
          body: `VOYA's story starts long before the brand existed. Hot seaweed bathing is a genuinely old Irish tradition: at its height in the early twentieth century, Ireland had hundreds of seaweed bathhouses along its coast, where people soaked in deep tubs of hot seawater and freshly harvested seaweed for rheumatic aches, tired muscles and troubled skin. Through the twentieth century the tradition faded almost to nothing, surviving in only a handful of places. That near-extinction is the dramatic heart of the story a VOYA therapist tells. In Strandhill, County Sligo, a surf village on the Atlantic coast of the west of Ireland, the Walton family revived the practice, reopening hot seaweed baths in the early 2000s. The baths were a success, and the family saw what visitors kept telling them: their skin felt extraordinary afterwards. The VOYA product house followed in the mid 2000s, created to carry the bathhouse experience into an organic skincare and body care range. For a therapist, this heritage answers the guest's deepest question, why this brand, with something no competitor can copy: a real place, a real family and a real tradition brought back to life.`,
        },
        {
          heading: 'The philosophy: wild, organic, sustainable',
          body: `Three commitments define the VOYA philosophy, and a therapist should be able to explain each one plainly. First, wild rather than farmed or synthetic: the house is built on wild seaweed from the Atlantic shoreline, harvested by hand. Second, organic: VOYA has made certified organic formulation central to its identity, positioning itself as a pioneer of certified organic seaweed-based skincare, and the certification matters because it turns a marketing word into an audited standard a therapist can cite with confidence. Third, sustainable: because the seaweed is cut by hand above the base of the plant, it regrows, meaning the harvest that supplies the house does not strip the shore that inspires it. These are not three separate slogans but one connected idea, authenticity: what the sea actually offers, taken respectfully, presented honestly. That idea should shape how you speak on shift. The VOYA voice is natural, warm and unforced; it talks about the sea, the shore and how the guest will feel, not about laboratory percentages. A therapist who sounds like a chemistry lecture in a VOYA treatment room has missed the house entirely.`,
        },
        {
          heading: 'The USP in one breath',
          body: `Every therapist on a VOYA account should be able to state the house USP in a single sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: VOYA offers certified organic, seaweed-based skincare and treatments built on hand-harvested wild Irish seaweed and a revived national bathing tradition. Each clause earns its place. Certified organic, because it is an audited credential rather than a mood. Seaweed-based, because the hero ingredient is the identity, not a garnish. Hand-harvested and wild, because the sourcing story is what separates VOYA from any brand that simply lists a marine extract. And the revived bathing tradition, because heritage is the part no rival can manufacture. Notice what the sentence lets you do: when a guest compares VOYA with another natural brand, you have an honest, specific answer that elevates the house without disparaging anyone else, which is exactly how luxury speaks. Practise the sentence aloud until it is yours, then practise the follow-up questions it invites: where is Strandhill, what does hand-harvesting mean, why does organic certification matter.`,
        },
        {
          heading: 'Why the story is the product',
          body: `In clinical, results-led houses, the product is the outcome and the story is decoration. In sensorial and natural houses, and VOYA sits firmly among them alongside names like Aromatherapy Associates and Bamford, the story is inseparable from the product: guests are buying the Atlantic, the family, the tradition and the sustainability as much as anything in the jar. This changes your job on shift. The narrative must be woven into the treatment itself, a sentence at a time, at the moments the guest can verify it with their own senses: as the warm seaweed touches their back, as the gel releases, as the scent of the sea rises. It also changes retail, because a guest who has heard the story does not need persuading, only helping to choose. And it raises the stakes of getting details right: a therapist who invents a fact about the harvest or the certification, and is caught by a well-read guest, damages the very authenticity the brand is built on. Learn the story from the house's own materials, tell it simply, and let the treatment prove it.`,
        },
      ],
      keyTerms: [
        { term: 'Seaweed bathhouse', definition: `A traditional Irish bathing establishment offering hot seawater baths filled with freshly harvested seaweed; hundreds existed in the early twentieth century, and their revival is the foundation of the VOYA story.` },
        { term: 'Hand-harvesting', definition: `Cutting wild seaweed by hand above the base of the plant so that it regrows; the sustainable sourcing method at the heart of VOYA's philosophy.` },
        { term: 'Certified organic', definition: `Formulation verified against an audited organic standard by an independent certifying body; central to VOYA's identity and a credential a therapist can cite with confidence.` },
        { term: 'Story-led house', definition: `A product house whose origin story, place and values are part of what the guest is buying; in such houses the narrative must be delivered with the treatment, not left on the website.` },
      ],
      caseStudy: {
        title: 'The comparison question at Fenwick Park, the Cotswolds',
        scenario: `Aisling is a therapist at Fenwick Park, a luxury country hotel spa in the Cotswolds that carries VOYA. Her guest, Mr Halloran, is a well-travelled spa regular who asks her, mid-consultation, why he should care about this brand when his usual city spa uses a famous marine skincare line with laboratory-proven actives. He is not hostile, just genuinely curious, and clearly used to therapists who wilt under the question. Aisling knows that trading clinical claims with a science-led house is a battle VOYA does not need to fight, and that she has a better card to play.`,
        insight: `Aisling answers with the story, in the house voice: VOYA is built on wild seaweed hand-harvested on the Atlantic coast at Strandhill in County Sligo, where the Walton family revived Ireland's old hot seaweed bathing tradition, and the products are certified organic, so what he is about to experience is the sea itself, taken respectfully. She then lets the warm seaweed and the treatment make the rest of the argument. The professional lesson: a story-led house wins on authenticity, place and heritage, never on a spec-sheet fight. Know the story cold, tell it simply, and let the guest's senses verify it.`,
      },
      summary: `VOYA is the Irish house of organic seaweed, born in Strandhill, County Sligo, where the Walton family revived the country's old hot seaweed bathing tradition in the early 2000s and launched the product house in the mid 2000s. Its philosophy joins three commitments, wild hand-harvested seaweed, certified organic formulation and genuine sustainability, into one idea: authenticity from the sea. Its USP, certified organic seaweed skincare built on hand-harvested wild Irish seaweed and a revived bathing tradition, should live on every therapist's tongue, because in this house the story is the product.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Explain what seaweed does for the skin and body, and why VOYA's hand-harvested wild sourcing matters`,
        `Present Lazy Days and the shape of the VOYA range in confident, guest-ready language`,
        'Apply a reliable, honest method for learning any range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'Seaweed: the hero ingredient of the whole house',
          body: `In most houses you learn hero products; in VOYA you must first learn the hero ingredient, because every product and treatment leads back to it. Seaweed is one of the most nutrient-dense plants in nature, naturally rich in minerals, vitamins, amino acids and antioxidants drawn from the seawater it lives in. In a hot bath or warm treatment, seaweed releases a silky, nourishing gel that softens, conditions and soothes the skin, which is why guests emerge from a seaweed bath describing their skin as extraordinary. The species matter to the story: VOYA is famous for its use of hand-harvested wild Atlantic seaweeds such as Fucus serratus, the serrated wrack traditionally used in Irish seaweed baths. Learn to describe the experience as much as the chemistry: the warmth, the texture, the gel between the fingers, the scent of the shore. A therapist who can hand a guest a frond of rehydrated seaweed and explain in two sentences what it is doing for their skin has done more honest selling than any brochure ever will.`,
        },
        {
          heading: 'Lazy Days and the shape of the range',
          body: `The single most important product to know is Lazy Days, VOYA's detoxifying seaweed bath: a package of whole dried seaweed that rehydrates in a hot bath at home, releasing its gel and minerals and recreating the Strandhill bathhouse experience in the guest's own bathroom. It is the purest expression of the brand, the natural gift purchase, and the easiest honest recommendation in the range, because any guest who loved the seaweed element of their treatment can take the exact experience home. Around this icon sits a full certified organic face and body range, cleansers, moisturisers, masks, body oils and washes, carrying the seaweed story into daily skincare, with the house's characteristically playful naming style. Menus and shelves differ from spa to spa and ranges evolve, so treat any list as a starting point: your day one job in a new VOYA venue is to walk the retail wall, identify the heroes your spa actually stocks and the products your treatments actually use, and learn those first, in the order your guests will meet them.`,
        },
        {
          heading: 'Telling the ingredient story honestly',
          body: `The VOYA ingredient story is best told in three simple layers, each verifiable by the guest. Layer one, the source: wild seaweed, hand-harvested on the Atlantic coast of Ireland, cut so the plant regrows. Layer two, the nature of the ingredient: mineral-rich, vitamin-rich, packed with antioxidants, releasing a softening, hydrating gel in warmth. Layer three, the formulation values: certified organic, natural, sustainable. One sentence from each layer, delivered at the moment the guest is experiencing the product, is a complete and honest narration. Two disciplines keep it professional. First, lead with feeling and benefit in the house's natural voice, how the skin will feel comforted, softened, nourished, rather than reciting compound names; the science can support the story, but in this house it never is the story. Second, never claim a specific ingredient, percentage or certification detail you have not verified from the brand's own materials. VOYA's entire identity rests on authenticity, and one invented fact, caught by one well-read guest, undermines the exact quality the guest came to buy.`,
        },
        {
          heading: 'How to learn a range properly',
          body: `No course can teach you every product on your particular spa's shelf, so the meta-skill matters more than any list: the professional method for learning a house fast and honestly. First, heroes before everything: in a VOYA venue that means the seaweed story itself, Lazy Days, and whichever face and body heroes your spa's treatments actually use. Second, one category at a time: cleansers as a family, then moisturisers, then body, learning each category's logic rather than memorising isolated items. Third, use the house's own training materials and the spa's protocols as your only source for claims; they are what the brand has chosen to stand behind. Fourth, use the key products on your own skin and, if you possibly can, take the seaweed bath yourself, because conviction cannot be faked and a therapist who has personally floated in the seaweed describes it in a way no script can match. Fifth, keep the honest gap: when a guest asks something you do not know, say what you do know, offer to check, and actually check. Fluency is a method, not a memory feat.`,
        },
      ],
      keyTerms: [
        { term: 'Fucus serratus', definition: `Serrated wrack, a wild Atlantic seaweed traditionally used in Irish seaweed baths and closely associated with the VOYA story; in warm water it releases a silky, mineral-rich gel.` },
        { term: 'Lazy Days', definition: `VOYA's iconic detoxifying seaweed bath: whole dried seaweed that rehydrates in hot water at home, recreating the bathhouse experience and serving as the range's natural take-home hero.` },
        { term: 'Hero ingredient', definition: `The single ingredient that defines a house's identity and to which every product leads back; for VOYA, hand-harvested wild seaweed.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The well-read guest at The Merrow Hotel, Edinburgh',
        scenario: `Callum has recently joined the spa at The Merrow, a five-star hotel in Edinburgh with a VOYA menu, ahead of his formal brand training. During a body treatment his guest, Dr Okafor, a dermatology registrar on a weekend away, asks precisely which seaweed species is in the wrap, what the active compounds are, and whether the organic certification covers the whole range or only some products. Callum knows roughly half the answers with certainty and feels the familiar pull to smooth over the rest with confident-sounding guesses, especially to a guest who clearly knows her science.`,
        insight: `Callum gives the three-layer story he is sure of, hand-harvested wild Atlantic seaweed, the tradition of Fucus serratus in Irish baths, the mineral and antioxidant richness, and the softening gel she can feel on her skin at that moment. On the certification scope and compound detail he uses the honest gap: he tells her what he knows, says he will confirm the rest from the brand's materials, and hands her the exact answers, checked, with her water after the treatment. Dr Okafor buys the body oil and books a seaweed bath. With an expert guest, honesty is not the safe option; it is the impressive one.`,
      },
      summary: `VOYA product knowledge begins with the hero ingredient: wild Atlantic seaweed, hand-harvested so it regrows, naturally rich in minerals, vitamins, amino acids and antioxidants, releasing a softening gel in warmth. Lazy Days, the whole-seaweed bath for home, is the icon to know first, with the certified organic face and body range carrying the story into daily skincare. Tell the story in three honest layers, source, ingredient, values, in the house's natural voice, and beyond any list, master the learning method: heroes first, one category at a time, the brand's own materials, personal use, and the honest gap instead of invention.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate a VOYA treatment menu on day one and deliver the house's seaweed rituals with confidence`,
        'Retail the range by linking the products used in treatment to a short, honest home prescription',
        `Build integrity-led upsell paths between treatments and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every VOYA spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the signature seaweed experiences, because they are what the house is famous for and what guests arrive wanting: the seaweed bath where the venue has one, and the treatments in which warm seaweed is applied directly to the body, such as seaweed wraps and seaweed-based massage rituals. Learn the flagship of your particular venue first, in full. Then map the rest of the menu in layers: the organic facials and what distinguishes each, the body treatments and massages, and finally the enhancements, the add-ons that can extend or deepen a booking. For each treatment note four things: duration, protocol, products used, and who it is for. Read the protocols the spa holds, shadow a senior therapist where you can, and ask questions before your first guest rather than improvising in front of one. A therapist who can honestly say I know this menu by the end of day one is rare, and remembered.`,
        },
        {
          heading: 'Delivering the signature style',
          body: `A VOYA treatment should feel like the Atlantic shore brought indoors: warm, natural, unhurried and honest. The signature elements are sensory, the warmth and weight of seaweed on the body, the silky gel on the skin, the clean scent of the sea, and your delivery must protect them completely. Prepare the seaweed properly according to protocol, check temperatures with care, and give the guest a moment to register each new sensation rather than rushing between phases. Weave the story through the experience a sentence at a time, in the house's natural voice: where the seaweed comes from, that it is hand-harvested and regrows, what the minerals and gel are doing for the skin. Never lecture; narrate, at the moments the guest can feel the truth of what you are saying. Under time pressure, the seaweed elements and the storytelling are the first things a rushed therapist trims and the last things this house would ever sacrifice, because they are the brand. Deliver the warmth, the seaweed and the story faithfully and you are delivering VOYA; skip them and you are merely using its products.`,
        },
        {
          heading: 'Retail: the shoreline continued at home',
          body: `VOYA retail succeeds when it is framed as the treatment, and the story, going home with the guest. During the treatment, narrate the key products at natural moments, one sentence each, while the guest is experiencing them. At the close, prescribe rather than pitch: two or three products, each linked explicitly to the treatment just delivered and to what you found in consultation. The strongest link in this house is Lazy Days: any guest who loved the seaweed itself can take the authentic bathhouse experience home in a box, and it makes a memorable gift besides, which makes it one of the most natural recommendations in all of spa retail. Beyond it, prescribe from what you used: the body oil that carries the scent of the hour, the cleanser or moisturiser matched to the skin you assessed. Tell the guest what not to buy as well, which builds the trust that compounds over years. Write the prescription down, and record it on the guest's history so the next therapist can continue the story rather than restarting it.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths in a VOYA spa are natural because the menu is a connected landscape. The facial guest who lit up at the seaweed story is a wrap or seaweed bath guest next visit; say so at the close and note it on their record. The sixty-minute massage guest carrying genuine tension benefits from ninety minutes, offered once, warmly, at booking or in consultation. Enhancements let a guest deepen today's booking without changing it. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill. Alongside selling the brand, you protect it. On shift that means using the correct products in the correct quantities, preparing seaweed exactly as the protocol directs, following the house protocol rather than your private variant, keeping retail and testers immaculate, reporting low stock before it forces substitutions, and never quietly shortening the ritual or the story to rescue a late-running column; flag the schedule instead. Guests experience the brand only through its therapists. On a VOYA shift, you are VOYA, and the standard you hold is the brand's reputation in that room.`,
        },
      ],
      keyTerms: [
        { term: 'Signature seaweed experience', definition: `The treatments a VOYA venue is best known for, built around seaweed itself: the seaweed bath where available, and rituals in which warm seaweed is applied to the body, such as wraps.` },
        { term: 'Enhancement', definition: `An add-on that extends or deepens an existing booking, allowing a guest to upgrade the outcome without changing the treatment.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely loved or needs, such as facial to seaweed wrap, or sixty minutes to ninety.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct products and quantities, faithful protocols, immaculate presentation, stock reporting, and the ritual and story delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at Harewell Sands, Devon',
        scenario: `Priya, an experienced agency therapist, arrives at Harewell Sands, a five-star coastal spa hotel in Devon, for her first shift on its VOYA menu. She has forty minutes before her first guest, so she asks the head therapist for the menu and protocols, learns the venue's signature seaweed wrap first, and confirms the seaweed preparation and products for her first two bookings. Her second guest, Mrs Ellery, is a facial regular who says wistfully that she has always wondered what the seaweed treatments are like, but that nobody has ever actually suggested one to her.`,
        insight: `Priya's preparation makes the professional move available. She weaves the Strandhill story into the facial, lets Mrs Ellery feel a frond of rehydrated seaweed, and at the close prescribes the moisturiser she used plus Lazy Days, so the guest can try the seaweed experience at home that same week. Then she opens the honest upgrade path: since the seaweed story is what lit the guest up, the signature wrap is the natural next visit, and Priya notes it on the record for whoever treats her next. Nothing was pushed; a genuine curiosity was heard and answered, and an agency therapist becomes one the venue asks for by name.`,
      },
      summary: `Mastering a VOYA shift is a craft with four faces. Read the menu like a professional, signature seaweed experiences first, and know your venue's flagship before anything else. Deliver the signature style faithfully: warm seaweed, careful temperatures, unhurried flow, and the Strandhill story narrated in the house's natural voice. Retail as the shoreline continued at home, prescribing two or three linked products with Lazy Days as the natural take-home. And build honest upgrade paths while protecting the standards, because on shift the therapist is the brand, and the seaweed and the story are never the things you trim.`,
    },
  ],
}
