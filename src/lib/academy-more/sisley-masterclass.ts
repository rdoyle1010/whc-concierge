// WHC Academy brand masterclass: Sisley Paris. Independent WHC training -
// not affiliated with or endorsed by Sisley Paris. Answer key lives in
// academy-more-answers/sisley-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'sisley-masterclass',
  title: 'Sisley Paris Masterclass',
  tagline: `The French family house of phyto-cosmetology - its story, its icons, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Sisley Paris is one of the great French houses of prestige skincare, founded in Paris in 1976 by Hubert d'Ornano, a nobleman from a family already steeped in cosmetics, together with his wife Isabelle. Half a century later it remains privately owned and run by the d'Ornano family, with the founders' children carrying the house forward. That continuity is rare at the top of luxury beauty, and it shapes everything: Sisley answers to a family's name, not to a quarterly report.

The founding idea was phyto-cosmetology: the belief that plant extracts and essential oils, selected rigorously and used at genuinely effective concentrations, could deliver serious skincare results. Sisley was among the earliest prestige houses to build itself entirely on botanical actives backed by research, and the phyto prefix runs through its product names to this day.

The positioning is uncompromising ultra-luxury. Sisley products sit at the top of the price ladder, and the house justifies that openly: concentrated formulas, long development times, and no compromise on ingredient quality.

The USP a therapist must be able to say in one breath: Sisley Paris is a family-owned French house and a pioneer of phyto-cosmetology, offering highly concentrated plant-based skincare and treatments delivered through expert hands. A guest is buying botanical science, French luxury and a family's personal guarantee in the same jar.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Sisley's credibility rests on a small set of icons every therapist on the account must know cold.

Start with the Ecological Compound, the emblem of the house since 1980: a light emulsion built on a blend of revitalising plant extracts, famous for suiting virtually all skin types and for being the product loyal Sisley guests never give up. Then the Black Rose collection, loved for the Black Rose Cream Mask, an instant radiance step guests ask for by name. At the summit sits Sisleÿa, the flagship anti-ageing line led by Sisleÿa L'Intégral Anti-Âge, the house's global icon of complete age care. Around these sit the Phyto families across skincare and make-up, the Eau du Soir fragrance heritage, and Hair Rituel by Sisley, the house's expert hair and scalp range.

The ingredient story follows the philosophy: plant extracts and essential oils, chosen for proven benefit and used at high concentration. Narrate simply during treatment: what it contains, what it does, how it will feel.

Because formulas are concentrated, a little goes a long way, and teaching correct usage amounts is part of honest Sisley retail. Where you are unsure of a specific formulation, never invent it. Learn heroes first, one category at a time, from the house's own materials, and use the key products yourself until conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Sisley treatments live in some of the world's finest hotel spas, and every menu differs, so day one is a reading method. Learn the flagship phyto-aromatic facial first: which products it uses, its duration, and its protocol. Then map the remaining facials by concern, the body treatments, and the enhancements. Ask the senior therapist rather than guessing, and read the protocols the spa holds before your first guest.

Delivery is where Sisley distinguishes itself. The house style is expert, hands-on and unhurried: signature massage techniques doing real work on the face and body, paired with high-concentration phyto-aromatic products, so results are felt and seen without machines doing the talking. Precision matters, because concentrated formulas reward correct quantities and faithful protocol.

Retail is the treatment continued at home. Narrate the icons as you use them, then prescribe two or three products linked to what you found, and teach usage amounts honestly: Sisley's concentration means products last, which is the truthful answer to the price question. The Ecological Compound is the natural first prescription for almost any guest; the Black Rose Cream Mask suits the guest who loved the radiance step; Sisleÿa is the considered recommendation for the guest serious about age care.

Upsell along genuine paths: the facial guest with scalp tension is a Hair Rituel conversation; the sixty-minute guest with real needs benefits from longer. And protect the brand: correct quantities, faithful protocols, immaculate presentation. On a Sisley shift, you are the house.`,
    },
  ],
  quiz: [
    {
      q: 'Sisley Paris was founded...',
      options: [
        'By a dermatologist in Geneva in the 1990s',
        `In Paris in 1976 by Hubert d'Ornano and his family`,
        'By a British aromatherapist in 1993',
        'As a spin-off of a fashion house in the 1960s',
      ],
    },
    {
      q: `Sisley's founding philosophy, phyto-cosmetology, means...`,
      options: [
        'Machine-led facial technology',
        'Fragrance-first formulation',
        'Mineral-only skincare',
        'Plant extracts and essential oils, rigorously selected and used at genuinely effective concentrations, backed by research',
      ],
    },
    {
      q: 'A defining trait of Sisley as a company is that it...',
      options: [
        `Remains privately owned and run by the d'Ornano family`,
        'Is publicly listed on the stock exchange',
        'Licenses its name to third-party manufacturers',
        'Sells only through supermarkets',
      ],
    },
    {
      q: 'The Ecological Compound is famous as...',
      options: [
        'A self-tanning lotion',
        'A foot treatment',
        `The emblem of the house since 1980: a revitalising emulsion built on plant extracts, suiting virtually all skin types`,
        'A hair styling product',
      ],
    },
    {
      q: `Sisley's flagship anti-ageing line is...`,
      options: [
        'Pro-Collagen',
        `Sisleÿa, led by Sisleÿa L'Intégral Anti-Âge`,
        'Optimal Skin',
        'Tri-Enzyme',
      ],
    },
    {
      q: 'The signature style of a Sisley spa treatment relies on...',
      options: [
        'Expert hands-on massage techniques paired with high-concentration phyto-aromatic products',
        'High-frequency machines and LED masks',
        'Silence and product application only, with no massage',
        'A standard routine identical for every guest',
      ],
    },
    {
      q: `The honest, effective answer to a guest questioning Sisley's premium price is...`,
      options: [
        'Offer an unauthorised discount',
        'Agree that it is overpriced but fashionable',
        'Avoid the subject and change the topic',
        'Explain the concentration story: formulas are highly concentrated, a little goes a long way, and products used correctly last - linked to what was used in their treatment',
      ],
    },
    {
      q: 'Your first professional duty on day one in a Sisley spa is...',
      options: [
        'Rearrange the retail display',
        'Improvise treatments from your general training',
        'Learn the treatment menu and protocols, starting with the flagship phyto-aromatic facial, and ask rather than guess',
        'Memorise every ingredient list in the range',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa chose Sisley and she told me the story - a French family house, fifty years of plant science, still run by the founders' children. After that, every product she touched felt like it had a reason to be there."`,
      helpsYou: `Five-star spas carrying Sisley expect therapists who can speak the house's language of family heritage and phyto-cosmetology. Telling the founding story and stating the USP in one confident sentence is what makes an interviewer, or a sceptical guest, relax.`,
      tips: [
        `Learn the one-breath USP: family-owned French house, pioneer of phyto-cosmetology, concentrated plant-based skincare delivered through expert hands`,
        `Remember the anchor facts: founded in Paris in 1976 by Hubert d'Ornano, still family-run today`,
        `Speak the house voice - assured, precise, quietly luxurious, never apologetic about the price`,
      ],
    },
    {
      guestView: `"She used the Black Rose mask and told me in one sentence why my skin would glow, then showed me how little of the cream I actually needed each day. I went home with two products and the sense that nothing had been sold to me at all."`,
      helpsYou: `Hero-product fluency is the fastest credibility you can build on a Sisley account. Knowing the Ecological Compound, Black Rose and Sisleÿa cold, and teaching correct usage amounts, means you can walk onto a Sisley shift and belong within an hour.`,
      tips: [
        `Heroes first: the Ecological Compound, the Black Rose Cream Mask, Sisleÿa L'Intégral Anti-Âge`,
        'Tell ingredient stories simply: what it contains, what it does, how it feels',
        `Teach the concentration story - a little goes a long way, and that honesty answers the price question`,
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The facial massage was the treatment - twenty minutes of skilled hands doing real work, no machines, no rush. At the end she wrote down exactly two products and how much of each to use. I have rebooked every month since."`,
      helpsYou: `Therapists who can deliver Sisley's hands-on signature style, retail through honest prescription and build genuine upgrade paths are the ones luxury hotels rebook and promote - and the ones trusted with the house's most loyal guests.`,
      tips: [
        'Day one: learn the flagship phyto-aromatic facial before anything else',
        'Protect the massage phase - the expert hands ARE the signature, never the part to trim',
        'Prescribe two or three products linked to the treatment, with usage amounts taught',
        'Upsell along natural paths: scalp tension opens the Hair Rituel conversation',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'sisley-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Sisley Paris, the family-owned French house that pioneered phyto-cosmetology in prestige skincare. It covers the founding story and philosophy that shape every treatment, the hero products and ingredient stories a therapist must know cold, and the practical craft of the Sisley shift: reading the treatment menu, delivering the expert hands-on signature style, retailing the range through honest prescription and the concentration story, building integrity-led upsell paths, and upholding the standards that protect the house's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by Sisley Paris.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas carrying Sisley Paris across UK luxury hotels, destination spas and premium day spas. It suits therapists interviewing for a Sisley account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving to Sisley from another house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in Sisley spas will also gain a working command of the range and its language.`,
  outcomes: [
    `Tell Sisley's founding story and articulate its philosophy and USP in confident, guest-ready language`,
    'Name the hero products and lines and explain their ingredient stories accurately and honestly',
    `Deliver Sisley's expert hands-on signature style at five-star standard, protecting the massage phase and the protocol`,
    'Retail the range through honest two or three item prescriptions, using the concentration story to answer the price question',
    `Build integrity-led upgrade paths between treatments and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount Sisley's founding story and explain why family ownership shapes the way the house behaves`,
        'Explain phyto-cosmetology and how it differs from ordinary natural skincare claims',
        `Articulate Sisley's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'A family house, founded in Paris',
          body: `Sisley Paris was founded in Paris in 1976 by Hubert d'Ornano, together with his wife Isabelle. The d'Ornano family were not newcomers to beauty: Hubert came from a family with deep roots in the cosmetics industry and had already spent years building prestige brands before creating a house that would carry his own convictions. What makes Sisley genuinely unusual at the top of luxury beauty is what happened next: the company never sold out, never floated, never became a line item in a conglomerate's portfolio. It remains privately owned and run by the d'Ornano family, with the founders' children leading it into its second generation. For a therapist, this is not trivia; it is the answer to the guest who asks what makes the brand different. Decisions at Sisley are made by a family whose name is on the jar, which the house credits for its patience: long development times, no compromise on ingredients, and no pressure to launch for the sake of a season. Family ownership is the culture, and the culture is the brand.`,
        },
        {
          heading: 'Phyto-cosmetology: plants, taken seriously',
          body: `The founding idea of Sisley is phyto-cosmetology, and a therapist should be able to define it precisely, because it is often mistaken for a vague natural claim. Phyto-cosmetology is the disciplined use of plant extracts and essential oils in skincare: ingredients selected for demonstrable benefit, extracted carefully, and used at concentrations high enough to actually deliver the result, with research behind the choices. Sisley built itself on this principle at a time when serious botanical skincare was far from the industry norm, and the phyto prefix that runs through its product names is the philosophy made visible. The distinction to master is this: Sisley's claim is not that plants are gentle or romantic, it is that the right plant actives, at the right concentration, are genuinely effective. That framing changes how you speak in the treatment room. You are not offering a natural alternative to serious skincare; you are offering serious skincare whose actives happen to come from plants, chosen by a house that has spent five decades studying them. Precision of language here is precision of brand.`,
        },
        {
          heading: 'Ultra-luxury positioning, honestly held',
          body: `Sisley sits at the very top of the prestige skincare ladder, and the house has never been shy about it. The positioning is ultra-luxury: concentrated formulas, meticulous development, packaging and presentation to match, and a price that reflects all three. A therapist on a Sisley account must be comfortable with this, because discomfort with the price on your side of the couch creates discomfort on the guest's side. The honest case is straightforward and worth rehearsing. First, concentration: because the formulas are rich in actives, small amounts are used, and products last far longer than their size suggests. Second, development: the house takes years over a formula and declines to compromise on ingredient quality. Third, results: loyal Sisley guests, and there are many who have used the same products for decades, stay because the products keep earning their place. Never apologise for the price and never inflate the claims. State the case plainly, let the treatment demonstrate it, and trust the guest to make an adult decision. That is how ultra-luxury retails itself.`,
        },
        {
          heading: 'The USP in one breath, in the house voice',
          body: `Every therapist on a Sisley account should be able to state the USP in a single sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: Sisley Paris is a family-owned French house and a pioneer of phyto-cosmetology, offering highly concentrated plant-based skincare and treatments delivered through expert hands. Each clause earns its place. Family-owned, because the d'Ornano name is the guarantee behind every jar. Pioneer of phyto-cosmetology, because the house did not follow the botanical trend, it helped create the field. Highly concentrated, because that is the honest answer to the price question. Delivered through expert hands, because in the spa the Sisley signature is skilled massage, not machinery. The house voice matters as much as the content: assured, precise, quietly luxurious, French in its sensibility. It speaks of efficacy and pleasure in the same sentence and never oversells. A therapist who gushes sounds wrong in a Sisley room; a therapist who states, calmly and exactly, sounds like the house itself.`,
        },
      ],
      keyTerms: [
        { term: 'Phyto-cosmetology', definition: `The disciplined use of plant extracts and essential oils in skincare, selected for demonstrable benefit and used at genuinely effective concentrations; the founding science of Sisley Paris.` },
        { term: 'Family house', definition: `A brand privately owned and run by its founding family rather than a corporation; Sisley remains led by the d'Ornano family, which shapes its patience, standards and identity.` },
        { term: 'Ultra-luxury positioning', definition: `Sitting at the very top of the price and quality ladder, justified openly through concentration, development time and ingredient quality rather than discounted or apologised for.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The price question at The Hartwell, Mayfair',
        scenario: `Priya is a senior therapist at The Hartwell, a five-star hotel spa in Mayfair carrying Sisley Paris. Her guest, Mrs Kellerman, is enjoying her facial but raises an eyebrow at the retail shelf on the way in: the prices, she says, are extraordinary, and her dermatologist tells her the actives in far cheaper products are just as good, so what exactly is she paying for beyond the packaging and the Paris address? Priya knows a defensive answer will sound like a script, and an apologetic one will quietly confirm the guest's suspicion that the price is theatre.`,
        insight: `Priya answers in the house voice, calmly and specifically: Sisley is a family-owned house that pioneered phyto-cosmetology, its formulas are concentrated enough that small amounts last for months, and the family has spent five decades refusing to compromise on ingredients because their own name is on the jar. Then she lets the treatment argue for her, showing Mrs Kellerman exactly how little product she is using at each step. The professional lesson: never fight the price question with apology or hype. The concentration story, the family story and the demonstrated ritual are the honest case, and honesty is what ultra-luxury guests are really testing for.`,
      },
      summary: `Sisley Paris was founded in Paris in 1976 by Hubert and Isabelle d'Ornano and remains privately owned and run by the d'Ornano family, a rarity at the top of luxury beauty that shapes its patience and standards. Its founding science is phyto-cosmetology: plant extracts and essential oils selected for proven benefit and used at genuinely effective concentrations. Its positioning is unapologetic ultra-luxury, honestly justified through concentration, development and results. The USP, a family-owned pioneer of concentrated plant-based skincare delivered through expert hands, should live on every therapist's tongue, stated in the house's assured, precise voice.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify Sisley's hero products and lines and describe what each is famous for`,
        `Explain the house's ingredient philosophy of concentrated plant extracts and essential oils in guest-ready language`,
        'Apply a reliable, honest method for learning the range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The Ecological Compound: the emblem of the house',
          body: `Every house has one product that carries its soul, and for Sisley it is the Ecological Compound, an icon since 1980. It is a light emulsion built on a blend of revitalising plant extracts, and its fame rests on two qualities. First, universality: it is celebrated for suiting virtually every skin type, which makes it the rare luxury product a therapist can recommend to almost any guest without caveat. Second, loyalty: it is the product long-standing Sisley guests describe as the one they would never give up, often after decades of daily use, and many discovered the rest of the range through it. For the therapist this makes the Ecological Compound three things at once: the easiest honest first prescription in the range, the natural gateway product for a guest new to Sisley, and a piece of living brand history you should be able to narrate in one sentence. Know how it is applied, where it sits in a routine, and why the house has never needed to replace it. When in doubt about what to recommend first, start here.`,
        },
        {
          heading: 'Black Rose, Sisleÿa and the wider families',
          body: `Beyond the emblem, three territories complete the map. The Black Rose collection is the radiance story, loved above all for the Black Rose Cream Mask, an instant-glow step that guests ask for by name and one of the most giftable icons in prestige skincare. At the summit of the range sits Sisleÿa, the flagship anti-ageing line led by Sisleÿa L'Intégral Anti-Âge, the house's global statement of complete age care and the considered recommendation for the guest who is serious about long-term results. Around these run the Phyto families, where the founding philosophy is visible in the names themselves, extending across skincare and into make-up, alongside a genuine fragrance heritage led by Eau du Soir. The newest territory is Hair Rituel by Sisley, the house's expert range applying its plant science to hair and scalp, which matters in the spa because it turns a scalp massage or a guest's comment about their hair into a natural, credible conversation. Learn one fluent sentence for each territory: what it is, what it is famous for, and who it suits.`,
        },
        {
          heading: 'The concentration story, told honestly',
          body: `Sisley's ingredient story rests on the same pillars as its philosophy: plant extracts and essential oils, selected for proven benefit and used at high concentration. The professional skill is narrating this during treatment, in the moment the guest is experiencing the product, in one sentence covering what it contains, what it does, and how it will feel. That is the most honest advertising in the industry, because the guest's senses verify it in real time. Concentration carries a second, commercially vital truth: because the formulas are rich, correct usage amounts are small, and a jar used properly lasts a long time. Teaching this is part of honest Sisley retail, and it serves everyone. The guest gets better results and better value, the therapist gets the truthful answer to the price question, and the house gets customers who repurchase because the product worked rather than lapse because it was slathered away in a month. Two disciplines keep the storytelling professional: lead with feeling and benefit rather than chemistry, and never claim a specific ingredient or figure you have not verified from the brand's own materials.`,
        },
        {
          heading: 'How to learn the range properly',
          body: `No course can teach you every product on your particular spa's shelf, because ranges evolve and stock lists differ, so the meta-skill matters more than any list: the professional method for learning a house fast and honestly. First, heroes before everything: the Ecological Compound, the Black Rose Cream Mask and Sisleÿa answer most guest questions and anchor most retail. Second, one category at a time: cleansers as a family, then serums, then moisturisers, then body and hair, learning each category's logic rather than memorising isolated items. Third, use the testers and the training materials the spa holds; the house's own words are your safest source for claims, and Sisley's materials are famously precise. Fourth, use the key products on your own skin, sparingly and correctly, because conviction cannot be faked and guests read your certainty within seconds. Fifth, build the habit of the honest gap: when asked something you do not know, say what you do know, offer to check the rest, and then actually check it. A therapist who follows this method can be genuinely fluent on a Sisley account within their first week.`,
        },
      ],
      keyTerms: [
        { term: 'Ecological Compound', definition: `Sisley's emblem product since 1980: a revitalising emulsion built on plant extracts, famous for suiting virtually all skin types and for decades-long guest loyalty.` },
        { term: 'Sisleÿa', definition: `The house's flagship anti-ageing line, led by Sisleÿa L'Intégral Anti-Âge, positioned as complete age care at the summit of the range.` },
        { term: 'Concentration story', definition: `The honest retail narrative that Sisley formulas are rich in actives, so small amounts are used, products last, and the premium price reflects genuine value in use.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The first week at Fenwick Park, the Cotswolds',
        scenario: `Leo has just joined Fenwick Park, a country house hotel spa in the Cotswolds carrying Sisley Paris, moving from a results-led clinical house he knew inside out. His formal brand training is weeks away, but he is on the column from Monday. In his first facial, his guest Mrs Achebe mentions that she has used one Sisley product every day for nearly twenty years and asks, with a knowing smile, whether he can guess which. She then asks whether the new hair range is worth her attention, and whether the black mask her daughter loves would suit her own drier skin.`,
        insight: `Leo's hero-first preparation carries him. He names the Ecological Compound, which delights her, and speaks honestly to its history and universality. On the Black Rose Cream Mask he describes what it is famous for and confirms suitability by what he can see in her skin rather than by bluffing a formulation claim. On Hair Rituel he opens the conversation, says what he knows, and books her a scalp-focused conversation at her next visit after checking the range properly. Mrs Achebe rebooks with him by name. Fluency is a method, not a memory feat, and loyal guests reward honesty over improvisation every time.`,
      },
      summary: `Sisley product mastery starts with the icons: the Ecological Compound, the emblem of the house since 1980 and the rare product recommendable to almost every guest; the Black Rose collection led by its famous Cream Mask; and Sisleÿa, the flagship anti-ageing line, with the Phyto families, Eau du Soir and Hair Rituel completing the map. The ingredient story is concentrated plant extracts and essential oils, told in single honest sentences while the guest experiences them, with the concentration story doubling as the truthful answer to the price question. Beyond any list, the lasting skill is the learning method: heroes first, one category at a time, the house's own materials, personal use, and the honest gap instead of invention.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate a Sisley treatment menu on day one and deliver the house's expert hands-on signature style with confidence`,
        'Retail the range through short, honest prescriptions that teach correct usage and link to the treatment delivered',
        `Build integrity-led upsell paths between treatments and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Sisley treatments appear in some of the finest hotel spas in the world, and each spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the flagship: identify the spa's signature phyto-aromatic facial, the treatment guests most often arrive wanting, and learn it first in full: its duration, its protocol, the products it uses at each step, and who it is for. Then map the rest of the menu in layers: the facials by concern and tier, the body treatments and massages, any scalp and hair rituals drawing on Hair Rituel, and finally the enhancements that can extend or deepen a booking. For each treatment note four things: duration, protocol source, products used, and the guest it suits. Read the protocols the spa holds, shadow a senior therapist where you can, and ask questions before your first guest rather than improvising in front of one. Sisley protocols are precise and the house expects them followed; a therapist who can honestly say I know this menu by the end of day one is rare, and remembered.`,
        },
        {
          heading: 'Delivering the signature style: expert hands',
          body: `The Sisley signature in the treatment room is the primacy of skilled hands. The house's spa reputation is built on treatments in which expert massage techniques do real, structured work on the face and body, paired with high-concentration phyto-aromatic products, so that results are both felt during the hour and visible after it, without machinery carrying the treatment. This has three practical consequences. First, protect the massage phase absolutely: it is the signature, most guests' favourite part, and the last thing a rushed therapist should ever trim, because trimming it removes the brand from the treatment. Second, precision with product: concentrated formulas reward correct quantities and exact sequencing, so follow the protocol's amounts rather than habit from a previous house, and let the guest see the care you take. Third, unhurried authority: the house voice in the room is calm, assured and exact, narrating key products in single sentences at natural moments and otherwise letting the hands speak. Deliver the protocol faithfully, the massage fully and the atmosphere precisely, and you are delivering Sisley; skip them and you are merely using its products.`,
        },
        {
          heading: 'Retail: prescription, usage and the price answered',
          body: `Sisley retail succeeds as prescription, never as pitch, and the mechanics follow the house's own logic. During the treatment, narrate the icons at natural moments while the guest experiences them; the mask they can feel working and the emulsion that suits everyone are already selling themselves honestly. At the close, prescribe two or three products, each linked explicitly to the treatment just delivered and to what you found in the skin. The strongest links are the ones the guest already loves: the Ecological Compound as the near-universal first prescription and gateway to the house; the Black Rose Cream Mask for the guest who glowed at the radiance step; Sisleÿa for the guest serious about long-term age care. Then do the thing that distinguishes Sisley retail: teach usage, showing exactly how little is needed and how long the product should last, because concentration is the honest answer to the price question and correct use is what makes the guest's results, and repurchase, real. Tell them what not to buy as well, write the prescription down, and record it on the guest's history so the next therapist can continue the story.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths on a Sisley menu are natural because the range is a connected landscape. The facial guest who mentions a tight scalp or lacklustre hair opens the Hair Rituel conversation and a scalp ritual next visit. The guest who loved the facial massage and carries real tension genuinely benefits from a longer booking or a body treatment alongside. The guest whose skin concerns have deepened is ready for the considered step up to Sisleÿa, presented as a professional judgement rather than a bigger basket. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill, offered once, warmly, and accepted or declined without a flicker. Alongside selling the house, you protect it. On shift that means correct products in correct quantities, protocols followed faithfully rather than privately varied, testers and retail kept immaculate, low stock reported before it forces substitutions, and the treatment never quietly shortened to rescue a late-running column; flag the schedule instead. Guests experience Sisley only through its therapists. On a Sisley shift, you are the house, and the standard you hold is a family's name in that room.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a house is most famous for on a given menu and the first to master; on a Sisley menu, the signature phyto-aromatic facial built on expert massage and concentrated products.` },
        { term: 'Prescription retail', definition: `Recommending two or three products linked to the treatment delivered and the findings made, with usage amounts taught, rather than presenting the range as a pitch.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely loved or needs, such as a facial guest with scalp tension moving to a Hair Rituel scalp ritual.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct products and quantities, faithful protocols, immaculate presentation, stock reporting and the treatment delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at The Belgrave, Edinburgh',
        scenario: `Hana, an experienced agency therapist, arrives at The Belgrave, a five-star hotel spa in Edinburgh, for her first shift on its Sisley menu. She has forty-five minutes before her first guest, so she asks the head therapist for the menu and protocols, learns the signature phyto-aromatic facial first, and confirms products and quantities for her first two bookings. Her second guest, Mr Danvers, books the sixty-minute facial, sighs on the couch about neck tension from long-haul flying, and admits at the close that the pot of cream he bought last year ran out in six weeks, which rather put him off repurchasing.`,
        insight: `Hana's preparation makes the professional moves available. She delivers the protocol faithfully, gives the massage phase its full time, and at the close teaches usage first: shown how little the cream needs, Mr Danvers realises he was using several times the correct amount, which reframes both the value and the price. She prescribes two products with amounts written down, then opens the honest upgrade path: with his neck tension, the ninety-minute booking or a body treatment alongside his facial next visit, noted on his record. Nothing pushed, a real need answered, and an agency therapist The Belgrave asks for by name.`,
      },
      summary: `Mastering a Sisley shift is a craft with four faces. Read the menu like a professional, flagship phyto-aromatic facial first, noting duration, protocol, products and guest fit for every treatment. Deliver the signature style faithfully: expert hands doing real work, correct quantities of concentrated product, calm and exact atmosphere, the massage phase never trimmed. Retail as prescription: two or three linked products, usage taught, the concentration story answering the price question honestly. And build genuine upgrade paths, from Hair Rituel conversations to Sisleÿa, while protecting the standards, because on shift the therapist carries a family's name.`,
    },
  ],
}
