import type { CourseContent } from '../academy-types'

// Split out of the pack beside it so a course title can be imported
// without dragging every lesson of every course along with it.

export const content: CourseContent = {
  slug: 'la-mer-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in La Mer, one of the most prestigious product houses in world skincare. It covers the founding legend and philosophy that justify the house's position at the summit of luxury, the hero products and the Miracle Broth story a therapist must know cold, and the practical craft of a La Mer shift: reading the treatment menu, delivering the high-touch sensorial signature style, retailing the range through the warming ritual, building honest upsell paths, and upholding the exacting standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by La Mer.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, the small number of five-star hotel spas, destination spas and flagship retail environments that carry La Mer treatments in the UK. It suits therapists interviewing for a La Mer account who want to arrive fluent, agency and freelance therapists who may be trusted with the house at short notice, experienced facialists moving up from other premium houses, and spa managers or head therapists who coach brand standards at the ultra-luxury tier. Reception and retail colleagues in La Mer spas will also gain a working command of the range, its story and its language.`,
  outcomes: [
    `Tell La Mer's founding legend and articulate its philosophy and USP in confident, guest-ready language`,
    'Name the hero products and textures and explain the Miracle Broth story accurately and honestly',
    `Deliver the house's high-touch sensorial signature style, including the warming ritual, at five-star standard`,
    'Retail the range by linking products used in treatment to a short home prescription taught as a ritual',
    `Build integrity-led upgrade paths between treatments and uphold the brand's exacting standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount the Max Huber founding legend and explain why it remains the brand's most powerful asset`,
        `Explain the house philosophy of renewal drawn from the sea, slow fermentation and skincare delivered as ritual`,
        `Articulate La Mer's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'The physicist and the burn: a founding legend',
          body: `La Mer begins with a story so unusual it sounds invented, which is precisely why every therapist must be able to tell it accurately. Dr Max Huber was an aerospace physicist, not a beauty executive, and after suffering burns in an accident he turned his scientific training on a personal problem: healing his own skin. By the brand's own account he worked for around twelve years, through thousands of experiments, before perfecting the formula he launched in the 1960s as Crème de la Mer. At its heart was a fermented elixir of sea kelp he named the Miracle Broth, and around it grew a mystique that has never faded. For a therapist, the legend is not decoration. It is the answer to the hardest question in luxury retail: why does this cost what it costs? A cream born from one man's obsessive quest to heal himself, built on a slow natural fermentation, is a different proposition from a product developed to fill a market gap, and guests feel that difference when the story is told well.`,
        },
        {
          heading: 'From one jar to a house: the Estée Lauder era',
          body: `Max Huber died in 1991, and in the mid-1990s The Estée Lauder Companies acquired La Mer and set about turning a single legendary cream into a complete house of skincare. This chapter matters to therapists for two reasons. First, it explains the brand's reach: under Estée Lauder stewardship, La Mer became a global name carried by the world's most exclusive department stores and a select circle of five-star hotel spas, while protecting its scarcity and mystique rather than chasing volume. Second, it explains the range you now work with. The original Moisturizing Cream was joined over the years by textures, serums, eye care and treatment products, every one formulated to carry the Miracle Broth, so the house could serve a complete routine without diluting its identity. When a guest asks whether La Mer is still the original formula's company, the honest answer is that the broth and the legend were preserved and the house around them was built to world standard. Continuity of story, expansion of range: that is the shape of the modern brand.`,
        },
        {
          heading: 'The philosophy: renewal from the sea, delivered as ritual',
          body: `Every serious product house has a philosophy that explains its formulations and its treatments, and La Mer's is renewal drawn from the sea. The house believes in the regenerative richness of marine ingredients, above all the nutrient-dense sea kelp at the centre of the Miracle Broth, and in slow, patient processes: the broth is created by fermentation over a period of months, not by rapid synthesis. The second half of the philosophy is just as important for a therapist: La Mer holds that how skincare is applied matters almost as much as what is applied. The most famous expression of this is the signature gesture of warming the cream between the fingertips until it becomes translucent, then pressing it gently into the skin rather than rubbing. Care delivered as ritual, unhurried and sensorial, is the house's native register. A therapist who understands this stops seeing the rituals as marketing theatre and starts seeing them as the philosophy made visible, which is exactly how the brand intends its treatments to be experienced.`,
        },
        {
          heading: 'The USP in one breath, in the house voice',
          body: `At the ultra-luxury tier, hesitation reads as fraud, so every therapist on a La Mer account should hold the USP as a single practised sentence. A reliable version: La Mer offers transformative, sea-derived skincare built around the fermented Miracle Broth, born from one scientist's quest to heal his own skin, and delivered as an unhurried ritual at the summit of luxury. Each clause earns its place: the sea and the broth carry the formulation story, the Huber legend carries authenticity no competitor can copy, and the ritual carries the experience the guest actually feels. Delivery matters as much as content. The La Mer voice is hushed, assured and sensorial; its natural words are renewal, transformation, the sea, ritual, indulgence. It never argues on price, never compares itself to other brands, and never over-claims, because scarcity and confidence are the register of the tier it occupies. Practise saying the USP aloud until it sounds like something you believe rather than something you memorised, because guests at this level can tell the difference in a single sentence.`,
        },
      ],
      keyTerms: [
        { term: 'Founding legend', definition: `The origin story a luxury house is built on; for La Mer, Dr Max Huber's years of experiments to heal his own burned skin, culminating in Crème de la Mer in the 1960s.` },
        { term: 'Miracle Broth', definition: `The fermented sea kelp elixir at the heart of every La Mer formula, created through a slow fermentation over months and central to the house's renewal philosophy.` },
        { term: 'Ultra-luxury tier', definition: `The very top of the skincare market, where scarcity, story and ritual justify the price and where hesitant or bargain language from staff damages the brand.` },
        { term: 'House voice', definition: `The characteristic vocabulary and tone of a brand; La Mer's is hushed, assured and sensorial, speaking of renewal, the sea, transformation and ritual.` },
      ],
      caseStudy: {
        title: 'The price question at The Hartwell, Mayfair',
        scenario: `Priya is a senior therapist at The Hartwell, a five-star hotel spa in Mayfair whose facial menu is built on La Mer. Her guest, Mrs Rothwell, is a successful barrister who books the spa's flagship facial as an anniversary gift to herself, then asks over the consultation form, with genuine curiosity rather than hostility: what exactly am I paying for with this brand? I have read that a moisturiser is a moisturiser. Priya knows a defensive ingredient lecture would sound rehearsed, and that at this tier the wrong answer costs the spa a guest who spends generously every quarter.`,
        insight: `Priya answers with the legend and the philosophy, not a chemistry debate: the aerospace physicist, the burns, the twelve years of experiments, the sea kelp fermented slowly into the Miracle Broth, and a house that has protected that story ever since. She then promises Mrs Rothwell will feel the philosophy in the treatment itself, in the warmth, the pace and the ritual. The lesson: at the summit of luxury, story and delivered experience are the honest answer to the price question. A therapist who can tell the legend fluently turns scepticism into fascination, which is where loyalty at this tier begins.`,
      },
      summary: `La Mer was born from a genuine legend: Dr Max Huber, an aerospace physicist burned in an accident, spent years and thousands of experiments perfecting Crème de la Mer in the 1960s around his fermented sea kelp Miracle Broth. Acquired by The Estée Lauder Companies in the mid-1990s, the single jar became a complete ultra-luxury house without losing its mystique. The philosophy is renewal from the sea delivered as unhurried ritual, and the USP, sea-derived transformation built on the broth and the legend, should live on every therapist's tongue in the house's hushed, assured voice.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify La Mer's hero products and textures and describe what each is famous for`,
        'Explain the Miracle Broth story and the sea-sourced ingredient philosophy in guest-ready language',
        'Apply a reliable, honest method for learning an ultra-luxury range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The cream: the icon everything else orbits',
          body: `Start where every guest starts: Crème de la Mer, the Moisturizing Cream, the original rich formula that made the house and that guests around the world simply call the cream. It is the single most important product for a therapist to know, because it carries the whole legend in one jar: Huber's years of work, the Miracle Broth, and the signature application ritual of warming it between the fingertips until translucent before pressing it into the skin. Present it in one fluent sentence: the original La Mer, a deeply rich moisturiser built on the fermented broth, famous for comforting dry and stressed skin, applied as a ritual rather than rubbed in. Around the icon sits the texture family, which answers the most common objection to the original. Guests who find the classic cream too rich can be guided to the Soft Cream or the lighter Moisturizing Gel Cream, so different skin types, climates and preferences all have a match, while every version carries the broth. Texture guidance, honestly given, is one of the most valuable services a La Mer therapist provides.`,
        },
        {
          heading: 'The wider heroes: what guests ask for by name',
          body: `Beyond the cream, a working command of the house means fluency in the heroes guests mention unprompted. The Concentrate is the most famous: a soothing serum with a devoted following, reached for when skin is stressed, sensitised or recovering, and often described by loyalists as the product they would keep if they could keep only one. The Treatment Lotion is the liquid first step of the La Mer routine, applied after cleansing to prepare the skin for everything that follows; knowing where it sits in the order of use lets you teach the routine, not just sell items. The Eye Concentrate serves the delicate eye area, and The Renewal Oil offers the broth in a silken oil format for face and body. For each hero, build the same one-sentence presentation: what it is, what it is famous for, who it suits. Do not attempt to memorise the full catalogue in week one. A therapist who commands the cream, the textures and these named heroes can hold an expert conversation with the vast majority of La Mer guests they will ever meet.`,
        },
        {
          heading: 'The Miracle Broth: telling the ingredient story honestly',
          body: `The ingredient story of La Mer is really one story told with variations: the Miracle Broth. Its central ingredient is nutrient-rich sea kelp, hand-harvested and then fermented slowly, over a period of months, together with other natural ingredients, in a process the house treats with near-ceremonial care. Every product in the range carries the broth, which is why the brand's identity survives across textures, serums and oils. In the treatment room, tell the story in the moment the guest is experiencing the product, and keep it to three beats: the sea, the slow fermentation, the renewal the guest will feel. Resist the urge to decorate the story with specifics you have not verified. At this tier your guests include collectors and connoisseurs who read interviews with the brand and know the folklore better than many counter staff; an invented percentage or a garbled detail in front of such a guest is a credibility wound that never fully heals. The rule is simple: the true story, simply told, while the skin confirms it. That is the most persuasive advertising the house owns.`,
        },
        {
          heading: 'Learning an ultra-luxury range: the professional method',
          body: `No course can hand you every product on your particular spa's shelf, so the lasting skill is the method for learning a range fast and honestly, and at La Mer prices the method must be exact. First, heroes before everything: the cream, the textures, The Concentrate, The Treatment Lotion. They anchor most guest questions and most retail. Second, learn one category at a time, understanding each family's logic, from the cleansing and lotion steps through moisturisers to targeted serums, rather than memorising isolated jars. Third, treat the house's own training materials as your only source of claims; at this tier, approximate knowledge is worse than admitted ignorance. Fourth, get the key products onto your own skin, through training allocations, testers used correctly and time at the counter, because conviction cannot be faked and wealthy guests read certainty within seconds. Fifth, practise the honest gap: when a guest asks something you cannot verify, say what you know, promise to check, and check. A therapist who works this method can be genuinely fluent within a fortnight, and trusted for a career.`,
        },
      ],
      keyTerms: [
        { term: 'Hero product', definition: `An iconic product that carries a house's reputation and that guests ask for by name; for La Mer, Crème de la Mer above all, alongside The Concentrate, The Treatment Lotion and The Eye Concentrate.` },
        { term: 'Texture family', definition: `The versions of the La Mer moisturiser at different weights, including the original cream, the Soft Cream and the Moisturizing Gel Cream, letting every skin type carry the Miracle Broth.` },
        { term: 'Fermentation', definition: `The slow natural process, running over months, by which sea kelp and other natural ingredients become the Miracle Broth; central to both the formulation and the story.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; non-negotiable in front of connoisseur guests at the ultra-luxury tier.` },
      ],
      caseStudy: {
        title: 'The connoisseur at Elmsleigh Manor, the Cotswolds',
        scenario: `Tom has just joined Elmsleigh Manor, a Cotswolds country house spa that recently added La Mer facials to its menu, and his formal brand training is still a fortnight away. His third guest, Ms Okafor, arrives carrying a decade of devotion to the brand: she has used the original cream since her thirties, has strong opinions about the Soft Cream, and asks Tom directly which texture he would move her to for the winter, and whether The Concentrate is genuinely different from the serums she already owns. Tom realises she may currently know the range better than he does.`,
        insight: `Tom works his method instead of bluffing. He had learned the heroes and the texture family first, so he can speak honestly about the richer original for cold months and confirm The Concentrate's reputation as the house's famous soothing serum for stressed skin. Where her questions pass his verified knowledge, he uses the honest gap, checks the spa's training materials after the treatment, and calls her the next day with the exact answer. She rebooks with him by name. With connoisseur guests, method and honesty outperform improvised expertise every single time.`,
      },
      summary: `La Mer product mastery begins with the icon, Crème de la Mer, and its texture family, the Soft Cream and Moisturizing Gel Cream, then extends to the named heroes: The Concentrate, The Treatment Lotion, The Eye Concentrate and The Renewal Oil. Every formula carries the Miracle Broth, sea kelp hand-harvested and fermented slowly over months, and its story is told in three beats: the sea, the fermentation, the renewal. Above any list stands the method: heroes first, one category at a time, the house's own materials, personal conviction, and the honest gap instead of invention.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate a La Mer treatment menu on day one and deliver the house's high-touch sensorial style with confidence`,
        'Retail the range by linking the products used in treatment to a short home prescription taught as a ritual',
        `Build integrity-led upsell paths between treatments and uphold the brand's exacting standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `La Mer treatments live in a deliberately small circle of the world's finest spas, and each venue's menu differs, so the day one skill is a reading method rather than a memorised list. Begin with the flagship: identify the facial the spa positions at the heart of its La Mer offer, the one guests arrive asking for, and learn it completely, from protocol and duration to every product used at every step. Then map outwards in layers: the tiers above and below the flagship and what genuinely distinguishes them, any body or eye-focused experiences, and the enhancements that can extend or deepen a booking. For each treatment record four things: duration, protocol source, products used, and who it is for. Read the written protocols the spa holds, shadow the senior therapist if the diary allows, and ask every question before your first guest rather than improvising in front of one. At this price tier a guest is often paying more for an hour than many spas charge for a full day, and improvisation is not resourcefulness; it is a breach of what they bought.`,
        },
        {
          heading: 'Delivering the signature style',
          body: `A La Mer treatment should be recognisable blindfolded. The house style is high-touch, massage-led and profoundly unhurried: skilled hands doing sustained, sensorial work, with every product arriving as a small ceremony rather than an application. The signature gesture belongs in every treatment: warm the cream between your fingertips until it becomes translucent, then press it gently into the skin, and let the guest feel the ritual the brand is famous for. Narrate softly and sparingly, telling the Miracle Broth story in a sentence at the moment the guest experiences it, then returning to silence; at this tier, calm is the luxury. Pace is a standard in itself. Nothing in a La Mer treatment should feel efficient: transitions are smooth, removal is warm and luxurious, and the closing minutes slow rather than tidy up. Where your venue's protocol includes specific rituals of its own, honour them exactly as written, because at the summit of luxury the choreography is the product. Trim the ritual and you have not saved time; you have removed the thing the guest paid for.`,
        },
        {
          heading: 'Retail: the ritual continued at home',
          body: `La Mer retail is won or lost on whether the guest can take the experience home, so frame every recommendation as the ritual continued. During the treatment, narrate the key products at natural moments, one soft sentence each, while the guest's own skin verifies your words. At the close, prescribe rather than pitch: two or three products, each linked explicitly to the treatment just delivered and to what you found in the skin, with the cream or its correct texture almost always at the centre. Then do the thing that separates La Mer retail from every other counter conversation: teach the ritual. Show the guest the warming gesture, the translucence, the press rather than the rub, and let them practise it once at the counter. A guest who leaves knowing the ritual re-creates the treatment every morning, and the jar on the shelf becomes a daily memory of the hour they loved. Tell them honestly what not to buy as well; at these prices, restraint builds a trust that compounds over years. Write the prescription down and record it on the guest's history so the story continues at the next visit.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths on a La Mer menu are natural because the menu is a ladder of depth. The classic facial guest who loved the experience is a candidate for the longer or more advanced tier next visit; say so warmly at the close, once, and note it on the record. The cream devotee whose skin is stressed or sensitised has an honest reason to add The Concentrate. Texture guidance creates seasonal moments: richer for winter, lighter for summer, each a genuine service. Enhancements deepen today's booking without changing it. The integrity rule is absolute at this tier: every upgrade must improve the guest's outcome, never merely the bill, because a pressured guest at these prices is lost forever. Alongside selling the brand, you guard it. Use correct products in correct quantities, and treat wastage seriously, because at this tier every gram is stock the spa has paid heavily for. Follow protocols faithfully, keep testers and retail immaculate, report low stock before it forces substitutions, and never quietly trim the ritual to rescue a late column; flag the schedule instead. On a La Mer shift, you are La Mer.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a venue positions at the heart of its La Mer offer and the first one to master on any new menu; learn its protocol, duration and products completely before day two.` },
        { term: 'The warming ritual', definition: `La Mer's signature gesture: warming the cream between the fingertips until translucent, then pressing it into the skin; delivered in treatment and taught to guests for home use.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment or product to a richer one, built on what the guest genuinely loved or needs, such as classic facial to advanced tier, or cream to cream plus The Concentrate.` },
        { term: 'Brand standards', definition: `The practices that protect an ultra-luxury house on shift: correct quantities, faithful protocols, immaculate presentation, early stock reporting and the ritual delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at The Caledon, Edinburgh',
        scenario: `Marisol, an experienced agency facialist, is booked at short notice by The Caledon, a five-star Edinburgh hotel whose spa carries La Mer, after a team illness. She arrives ninety minutes early, asks the head therapist for the written protocols, learns the flagship facial completely, and confirms products and quantities for each of her bookings. Her afternoon guest, Lady Airlie, is a devoted user of the original cream who mentions during consultation that her skin has felt tight and reactive since a recent flight schedule, and that nobody has ever shown her how she should actually be applying the cream she has bought for years.`,
        insight: `Marisol's preparation converts directly into service. She delivers the flagship faithfully, warms and presses the cream in the signature gesture, and at the close teaches Lady Airlie the warming ritual at the counter until she performs it herself. She prescribes only two items: the guest's own cream, now correctly applied, and The Concentrate for the stressed, reactive spell her skin is in, noting both on the record. Nothing was pushed, stock was used exactly to protocol, and the spa asks the agency for Marisol by name. Preparation, ritual and restraint are the whole craft at this tier.`,
      },
      summary: `A La Mer shift is a craft with four faces. Read the menu like a professional: flagship first, four facts per treatment, protocols read and questions asked before the first guest. Deliver the signature style faithfully: high-touch, massage-led, unhurried, with the warming ritual in every treatment and calm as the luxury. Retail as the ritual continued at home, prescribing two or three linked products and teaching the warming gesture at the counter. And build honest upgrade paths while guarding the standards, because at the summit of luxury the therapist in the room is the brand itself.`,
    },
  ],
}
