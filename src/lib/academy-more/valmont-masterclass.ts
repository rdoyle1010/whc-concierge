// WHC Academy brand masterclass: Valmont. Independent WHC training - not
// affiliated with or endorsed by Valmont. Answer key lives in
// academy-more-answers/valmont-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'valmont-masterclass',
  title: 'Valmont Masterclass',
  tagline: `The Swiss house of cellular cosmetics - its story, its science, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Valmont is one of the great Swiss houses of luxury skincare, and its story begins long before the products. The name descends from the Clinique Valmont, a celebrated clinic opened in 1905 at Glion, above Montreux on the Swiss Riviera, where an elite international clientele came for pioneering health and wellness care. The modern skincare house was born in Switzerland in 1985, carrying that clinical heritage into cosmetics, and since the early 1990s it has been owned and led by the Guillon family, who kept it fiercely independent and family-run.

The philosophy is cellular cosmetics: skincare built on cellular science and Swiss precision, aimed above all at visible anti-ageing results. The house styles itself in the language of time, presenting its experts as magicians of time who help skin recapture its youthful behaviour. Everything is made in Switzerland, and Swissness, rigour, purity, alpine nature, is central to the identity.

The second pillar is art. The Guillon family are collectors, the house speaks of the meeting of art and beauty, and the Fondation Valmont exhibits art in its own right. Treatments are framed as haute couture for the skin.

The one-breath USP: Valmont offers Swiss cellular cosmetics with a clinical heritage, anti-ageing expertise delivered as an haute couture experience where science meets art.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Valmont's credibility with guests rests on a distinctive ingredient story, and a therapist should be able to tell it in plain, confident sentences.

The science pillar is its cellular actives: the house is famous for formulating with DNA and RNA macromolecules, the biological molecules it presents as the heart of its anti-ageing performance. The nature pillar is Swiss: glacial spring water from the Alps is the signature water of the formulations, joined by extracts from alpine plants. Science from the cell, purity from the mountain - that is the story in one line.

The hero every therapist must know is the Prime Renewing Pack, the house's famous mask, adored for the fresh, rested, visibly smoothed effect guests describe after a single application; it is one of the most asked-for products in luxury spa. Hydration is another signature territory, led by the Hydra3 collection, and at the very top sits l'Elixir des Glaciers, the ultra-luxury tier of the house.

Where a specific formulation detail is not in front of you, never invent it. Learn any range the professional way: heroes first, then one category at a time, using testers, house training materials and your own skin, and keeping the honest gap, say what you know, check what you do not.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Valmont menus differ from spa to spa, so day one is about method. Read the menu in layers: find the flagship anti-ageing facial first, because that is what the house is known for, then map the hydration and radiance facials, the body treatments and the enhancements. For each, note duration, protocol, products used and who it suits, and ask the senior therapist rather than guessing.

Delivery is precise. Valmont facials are known for meticulous, choreographed massage work, performed with the discipline of Swiss craft; the exact choreography belongs to house training, so learn it from the trainers and protocols and never improvise a signature gesture in front of a guest. The tone is refined, unhurried, quietly confident, haute couture rather than theatrical.

Retail is the treatment continued at home. Narrate hero products as you use them, then prescribe two or three, linked to what you found; the Prime Renewing Pack, experienced on the guest's own skin, is among the most natural recommendations in spa.

Upsell paths follow results: the hydration guest with ageing concerns moves toward the anti-ageing flagship, the sixty-minute guest with real needs benefits from the longer ritual, and l'Elixir des Glaciers awaits the guest ready for the summit.

Protect the standard: correct products, correct quantities, faithful protocols, immaculate presentation, stock reported. On a Valmont shift, you are the house.`,
    },
  ],
  quiz: [
    {
      q: `Valmont's heritage traces back to...`,
      options: [
        'A Parisian perfumery of the 1920s',
        'The Clinique Valmont, a celebrated Swiss clinic opened in 1905 above Montreux, with the modern house born in Switzerland in 1985',
        'A Californian dermatology practice',
        'An Italian fashion house',
      ],
    },
    {
      q: `Valmont describes its anti-ageing experts with the phrase...`,
      options: [
        'The alchemists of light',
        'The guardians of youth',
        'Magicians of time',
        'The sculptors of skin',
      ],
    },
    {
      q: `The two pillars of Valmont's ingredient story are...`,
      options: [
        'Cellular actives such as DNA and RNA macromolecules, and Swiss nature such as glacial spring water and alpine plants',
        'Marine collagen and volcanic ash',
        'Fruit acids and clay',
        'Synthetic peptides and gold leaf',
      ],
    },
    {
      q: `The Valmont hero product famous for a fresh, visibly smoothed effect after one application is...`,
      options: [
        'The Alpine Cleansing Balm',
        'The Glacier Mist',
        'The Midnight Recovery Oil',
        'The Prime Renewing Pack',
      ],
    },
    {
      q: `L'Elixir des Glaciers is...`,
      options: [
        'A budget diffusion line',
        'The ultra-luxury tier at the very top of the house',
        'A discontinued fragrance',
        'A machine-based facial system',
      ],
    },
    {
      q: 'Beyond science, the distinctive second pillar of the Valmont identity is...',
      options: [
        'Art - the Guillon family are collectors, the house pairs art with beauty, and the Fondation Valmont exhibits art',
        'Sport sponsorship',
        'Celebrity endorsement',
        'Organic certification',
      ],
    },
    {
      q: 'On day one with a Valmont menu you should...',
      options: [
        'Deliver your usual routine under the Valmont name',
        'Focus only on retail products',
        'Read the menu in layers starting with the flagship anti-ageing facial, note durations, protocols and products, and ask rather than guess',
        'Wait for guests to explain the treatments to you',
      ],
    },
    {
      q: `Valmont's signature massage choreography should be...`,
      options: [
        'Improvised from your general training',
        'Skipped to save time',
        'Replaced with your own favourite techniques',
        'Learned from house trainers and protocols, and never improvised in front of a guest',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why this brand cost what it did, and the therapist told me the story - a Swiss house descended from a 1905 clinic, family-owned, obsessed with cellular science and art. By the end I understood I was not buying a cream, I was buying Switzerland in a jar."`,
      helpsYou: `Five-star spas carrying Valmont look for therapists who can speak the house's language of Swiss precision, clinical heritage and art. Telling the story and stating the USP in one confident sentence is what wins the interview and settles the sceptical guest.`,
      tips: [
        'Learn the one-breath USP: Swiss cellular cosmetics with clinical heritage, delivered as haute couture where science meets art',
        `Anchor the story: Clinique Valmont 1905 above Montreux, the modern house born in Switzerland in 1985, family-owned since the early 1990s`,
        `Use the house's own language of time: magicians of time, recapturing the skin's youthful behaviour`,
      ],
    },
    {
      guestView: `"She explained the mask in one sentence - cellular science and glacial water - and I could feel my skin tightening as she spoke. I left with the Prime Renewing Pack and I have repurchased it ever since."`,
      helpsYou: `Hero fluency is the fastest credibility in a new house. Knowing the Prime Renewing Pack, the Hydra3 hydration story and the l'Elixir des Glaciers tier cold means you can walk onto a Valmont shift and belong within the hour.`,
      tips: [
        `Heroes first: the Prime Renewing Pack, the Hydra3 collection, l'Elixir des Glaciers at the summit`,
        'Tell the two-pillar story in one line: cellular actives from science, glacial water and alpine plants from Swiss nature',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"Every movement of the facial felt rehearsed, deliberate, almost like watching a craftsman. Nothing was rushed and nothing was random. That precision is why I only book Valmont facials now."`,
      helpsYou: `Therapists who respect the house choreography, retail from the treatment and build honest upgrade paths are the ones Valmont accounts rebook, request and promote - precision and discretion are exactly what these spas are hiring for.`,
      tips: [
        'Day one: read the menu in layers, flagship anti-ageing facial first',
        'Learn the signature choreography from house training - never improvise it in front of a guest',
        'Prescribe two or three products linked to the treatment, with the Prime Renewing Pack as the natural hero',
        'Protect the standard: faithful protocols, correct quantities, stock reported, ritual never trimmed',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'valmont-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Valmont, the Swiss house of cellular cosmetics found in many of the world's finest hotel spas. It covers the clinical heritage and family story behind the brand, the philosophy of Swiss cellular science and art that shapes every treatment, the hero products and ingredient stories a therapist must know cold, and the practical craft of the Valmont shift: reading the treatment menu, delivering the house's precise signature style, retailing the range by linking products to treatments, building honest upsell paths, and upholding the standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by Valmont.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas that carry Valmont across UK luxury hotels, destination spas and premium day spas. It suits therapists interviewing for a Valmont account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving to Valmont from another house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in Valmont spas will also gain a working command of the range and its language.`,
  outcomes: [
    `Tell Valmont's story, from the 1905 Clinique Valmont to the modern family-owned Swiss house, in confident guest-ready language`,
    `Explain the philosophy of cellular cosmetics and articulate the house USP, where Swiss science meets art, in one sentence`,
    'Name the hero products and tiers and tell the two-pillar ingredient story of cellular actives and Swiss alpine nature accurately',
    `Read a Valmont treatment menu on day one and deliver the house's precise, choreographed signature style at five-star standard`,
    'Retail the range by linking products used in treatment to a two or three item home prescription',
    `Build integrity-led upgrade paths between treatments and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount Valmont's heritage, from the Clinique Valmont of 1905 to the family-owned modern house, and explain why it matters to guests`,
        `Explain the philosophy of cellular cosmetics, Swiss precision and the meeting of science and art`,
        `Articulate Valmont's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'From an alpine clinic to a skincare house',
          body: `Valmont's story begins not with a cream but with a clinic. In 1905 the Clinique Valmont opened at Glion, in the hills above Montreux on the Swiss Riviera, and became one of Europe's most celebrated destinations for health and wellness care, drawing an elite international clientele to the shores of Lake Geneva. That clinical, medical-adjacent heritage is the root of the brand's authority. The modern skincare house was born in Switzerland in 1985, translating the clinic's spirit of rigorous Swiss care into cosmetics, and since the early 1990s it has been owned and led by the Guillon family. Family ownership matters to the story: Valmont has remained independent in an industry of conglomerates, and the house presents itself as a maison in the old sense, a family enterprise with a personal signature. For a therapist, this history is the answer to the guest who asks what makes the brand different. Valmont did not begin as a marketing exercise; it descends from a place where wellbeing was treated with clinical seriousness, and the products still carry that posture.`,
        },
        {
          heading: 'Cellular cosmetics and the language of time',
          body: `The heart of the Valmont philosophy is cellular cosmetics: the conviction that visible anti-ageing results come from working at the level of the skin's own cellular biology, with formulations built on cellular science and manufactured with Swiss precision. Anti-ageing is not one category among many for this house, it is the house's declared expertise, and Valmont frames it in the language of time. Its experts are presented as magicians of time, and its promise is that skin can be helped to recapture its youthful behaviour rather than merely be decorated. Swissness runs through everything: the products are made in Switzerland, and the identity draws constantly on alpine nature, glacial purity and the discipline of Swiss craft. When you speak for the brand, borrow this vocabulary honestly. Talk about time, precision, performance and Swiss rigour rather than vague pampering. A Valmont guest is typically results-focused and discerning; the philosophy gives you a serious, specific story that meets that guest at their level, which is exactly what luxury conversation should do.`,
        },
        {
          heading: 'Where art meets beauty',
          body: `The second pillar of Valmont's identity is art, and it is genuinely unusual among product houses. The Guillon family are committed art collectors, and the house deliberately pairs art with beauty: it speaks of treatments as haute couture for the skin, presents its craft as artistry as much as science, and through the Fondation Valmont exhibits art in its own right, giving the brand a cultural life far beyond the treatment room. For a therapist this is not decoration, it is positioning you can use. The art story explains the brand's aesthetic seriousness, its prices and its presence in the world's most beautiful hotels, and it gives you a second register for guests who respond more to beauty and craft than to cellular science. It also sets the tone for delivery: a house that thinks of itself as an atelier expects its treatments performed with composure, precision and a sense of occasion. When you describe a Valmont facial as a couture experience, tailored, exacting, finished to a standard most skincare never attempts, you are speaking exactly as the house intends.`,
        },
        {
          heading: 'The USP in one breath',
          body: `Every therapist on a Valmont account should be able to state the house USP in a single sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: Valmont offers Swiss cellular cosmetics with a genuine clinical heritage, anti-ageing expertise delivered as an haute couture experience where science meets art. Each clause earns its place. Swiss cellular cosmetics, because cellular science and Swiss manufacture are the brand's technical spine. Clinical heritage, because the 1905 clinic above Montreux is a point of difference almost no competitor can claim. Anti-ageing expertise, because that is the territory the house has made its own, in the language of time and its magicians. And where science meets art, because the family's collecting, the Fondation and the couture framing are what make Valmont feel like no other house on the spa menu. Practise the sentence aloud until it is yours. When a guest compares Valmont with another premium brand, you now have an honest, specific answer that elevates the house without disparaging anything else, which is how luxury speaks.`,
        },
      ],
      keyTerms: [
        { term: 'Cellular cosmetics', definition: `Valmont's founding idea: skincare formulated around the skin's own cellular biology, built on cellular science and aimed at visible anti-ageing performance.` },
        { term: 'Clinique Valmont', definition: `The celebrated Swiss clinic opened in 1905 at Glion above Montreux, whose clinical wellness heritage the modern house, born in 1985, carries into cosmetics.` },
        { term: 'Maison', definition: `A house in the couture sense: a family-owned enterprise with a personal signature; Valmont has been owned and led by the Guillon family since the early 1990s.` },
        { term: 'Fondation Valmont', definition: `The house's art foundation, expressing the family's collecting and the brand's pairing of art with beauty; part of what makes the Valmont identity unique among product houses.` },
      ],
      caseStudy: {
        title: 'The comparison question at Thornleigh Park, the Cotswolds',
        scenario: `Amara is a senior therapist at Thornleigh Park, a five-star manor house spa in the Cotswolds that carries Valmont at the top of its menu. Her guest, Mrs Whitfield, is a loyal client of another premium Swiss brand and asks directly: both houses are Swiss, both talk about science, so why should I pay this much more for Valmont? Amara knows a features battle would sound defensive and could disparage a brand the guest clearly loves. She needs an answer that is specific, honest and elevating, and she has about thirty seconds of the guest's patience in which to give it.`,
        insight: `Amara answers with the story only Valmont can tell: a house descended from a 1905 clinic above Montreux, still family-owned, formulating cellular cosmetics made in Switzerland, and framing the whole experience as couture where science meets art. She then invites the treatment to finish the argument, delivered with the precision the house expects. Mrs Whitfield books the flagship facial. The professional lesson: never fight a comparison by criticising the other house. Answer with heritage, philosophy and delivery, the three things no competitor can copy, and let the experience do the rest.`,
      },
      summary: `Valmont is a family-owned Swiss house whose authority descends from the Clinique Valmont, opened in 1905 above Montreux, with the modern brand born in Switzerland in 1985 and led by the Guillon family since the early 1990s. Its philosophy is cellular cosmetics: Swiss-made, cellular-science skincare devoted to anti-ageing, spoken in the language of time by its self-styled magicians of time. Its second pillar is art, from the couture framing of treatments to the Fondation Valmont. The one-breath USP joins all of it: Swiss cellular cosmetics with clinical heritage, delivered where science meets art.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify Valmont's hero products and tiers and describe what each is famous for`,
        `Explain the house's two-pillar ingredient story of cellular actives and Swiss alpine nature in guest-ready language`,
        'Apply a reliable, honest method for learning any range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The two-pillar ingredient story',
          body: `Valmont's formulation story is best told as two pillars, and a therapist should be able to narrate both in a single fluent line. The first pillar is cellular science: the house is famous for formulating with DNA and RNA macromolecules, the biological molecules it places at the heart of its anti-ageing performance, presented as working with the skin's own cellular machinery rather than sitting on its surface. The second pillar is Swiss nature: glacial spring water from the Alps is the signature water of the formulations, joined by extracts from alpine plants, so that the purity of the mountains runs through the range as literally as the science does. Science from the cell, purity from the glacier, that is the one-line version, and it is honest, memorable and distinctively Valmont. When narrating during treatment, keep the register sensory and benefit-led: what the product contains, what it does, and how the guest's skin will feel. Save deeper technical detail for the guest who asks for it, and always draw specifics from the house's own materials rather than memory or guesswork.`,
        },
        {
          heading: 'The hero: the Prime Renewing Pack',
          body: `Every house has one product that carries its reputation into rooms it has never entered, and for Valmont that is the Prime Renewing Pack. This famous mask is loved for the effect guests describe after a single application: skin that looks fresher, rested and visibly smoothed, as if a poor night's sleep has been erased. It has become one of the most asked-for products in luxury spa, the kind of icon guests mention by name at the reception desk, and it is often the first Valmont product a new client ever buys. For the therapist, the Prime Renewing Pack is a gift three times over. It is the easiest honest recommendation in the range, because the guest can see its effect in the mirror before any words are needed. It is the natural finishing note of a treatment before a guest returns to a dinner or an event. And it is the perfect first rung of a guest's Valmont journey, a single-product introduction that earns trust for everything you recommend afterwards. Know it cold: what it is, what it is famous for, and how to present it in one sentence.`,
        },
        {
          heading: 'Hydration, and the summit of the house',
          body: `Beyond the icon, orient yourself by territory. Hydration is a signature Valmont territory, led by the Hydra3 collection, the house's dedicated answer to thirsty, dehydrated skin; since dehydration is among the most common conditions a spa therapist ever diagnoses, this family will anchor a large share of your honest prescriptions. Anti-ageing territories address lines, firmness and radiance across the wider range, and the house training at your spa will map the current collections precisely. At the very top of the maison sits l'Elixir des Glaciers, the ultra-luxury tier, the house's most precious formulations and the summit of its menu and retail wall. Understand its role: it is not simply a more expensive shelf, it is the flagship expression of everything the brand claims, and the tier a devoted Valmont guest aspires to. Present it with quiet reverence rather than pressure, introduce it when a guest's commitment and results justify it, and let the spa's senior team guide protocols around it. Knowing the tiers, everyday heroes, signature territories, and the summit, lets you place any guest accurately within the range.`,
        },
        {
          heading: 'How to learn a range properly',
          body: `No course can teach you every product on your particular spa's shelf, because ranges evolve and menus differ, so the meta-skill matters more than any list: the professional method for learning a house fast and honestly. First, heroes before everything: the Prime Renewing Pack, the Hydra3 hydration story and the shape of the tiers up to l'Elixir des Glaciers answer most guest questions and anchor most retail. Second, one category at a time: cleansers as a family, then masks, then serums and creams, learning each category's logic rather than memorising isolated items. Third, use the testers and the training materials your spa holds; the house's own words are your safest source for any claim, especially for a science-led brand whose guests may know the range intimately. Fourth, use the key products on your own skin, because conviction cannot be faked and guests read certainty in seconds. Fifth, keep the honest gap: when asked something you do not know, say what you do know, offer to check the rest, and actually check it. A therapist who follows this method is genuinely fluent within a week.`,
        },
      ],
      keyTerms: [
        { term: 'DNA and RNA macromolecules', definition: `The biological molecules at the heart of Valmont's cellular science story, presented as the engine of the house's anti-ageing performance.` },
        { term: 'Glacial spring water', definition: `The signature Swiss alpine water of Valmont formulations, carrying the purity of the mountains through the range alongside alpine plant extracts.` },
        { term: 'Prime Renewing Pack', definition: `Valmont's famous hero mask, loved for the fresh, rested, visibly smoothed effect after a single application and often a guest's first Valmont purchase.` },
        { term: `L'Elixir des Glaciers`, definition: `The ultra-luxury tier at the summit of the house: Valmont's most precious formulations, presented with reverence and introduced when a guest's journey justifies it.` },
      ],
      caseStudy: {
        title: 'The knowledgeable guest at The Harrington, Mayfair',
        scenario: `Priya has recently joined The Harrington, a Mayfair hotel spa with a full Valmont menu, and her formal brand training is still a fortnight away. Her afternoon facial guest, Ms Lindqvist, is a devoted Valmont client from Stockholm who knows the range better than most therapists. Mid-treatment she asks Priya exactly which actives are in the serum being applied, and whether the spa stocks the l'Elixir des Glaciers line her home spa uses. Priya feels the familiar pull to bluff two confident answers rather than reveal that she is new to the house in front of its most loyal kind of guest.`,
        insight: `Priya holds the honest gap. She tells the two-pillar story she knows is true, cellular actives and Swiss glacial water, describes what the serum is doing and how it will feel, and says she will confirm the precise actives from the house materials after the treatment rather than guess. On l'Elixir des Glaciers she answers accurately, checks availability at reception, and has the answer waiting with a written prescription. Ms Lindqvist, who has heard therapists bluff before, books her next facial with Priya by name. With expert guests, honesty is not a fallback, it is the credential.`,
      },
      summary: `Valmont product mastery starts with the two-pillar story, cellular actives such as DNA and RNA macromolecules from science, glacial spring water and alpine plants from Swiss nature, told in one fluent, benefit-led line. Know the heroes: the famous Prime Renewing Pack, the Hydra3 hydration collection, and l'Elixir des Glaciers at the ultra-luxury summit, each placed correctly within the tiers of the house. Beyond any list, the lasting skill is the learning method: heroes first, one category at a time, the house's own materials, personal use, and the honest gap instead of invention.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate a Valmont treatment menu on day one and deliver the house's precise signature style with confidence`,
        'Retail the range by linking the products used in treatment to a short, honest home prescription',
        `Build integrity-led upsell paths between treatments and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every Valmont spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the flagship: identify the anti-ageing facial the spa presents as its signature Valmont experience, because anti-ageing is the house's declared expertise and that treatment is the one guests most often arrive wanting. Learn it first, in full. Then map the rest in layers: the hydration and radiance facials and what distinguishes each tier, any treatments built on the l'Elixir des Glaciers line, the body treatments, and finally the enhancements that can extend or deepen a booking. For each treatment note four things: duration, protocol source, products used, and who it is for. Read the protocols the spa holds, shadow a senior therapist where you can, and ask questions before your first guest rather than improvising in front of one. Confirm the details that vary by site, timings, product quantities, order of phases, because guessing at a precision house is the one unforgivable shortcut. A therapist who can honestly say I know this menu by the end of day one is rare, and remembered.`,
        },
        {
          heading: 'Delivering the signature style',
          body: `Valmont's delivery standard follows directly from its identity: this is a house of Swiss precision and couture craft, and its facials are known for meticulous, choreographed massage work in which every gesture is deliberate, rehearsed and placed. The specific choreography is the property of house training, taught by Valmont's own trainers and protocols, so the professional rule is absolute: learn the signature techniques from the source and never improvise a house gesture in front of a guest, because a regular Valmont guest knows the real choreography by feel and will recognise an imitation instantly. Around the technique, match the tone. The Valmont room is composed, unhurried and quietly confident; think atelier rather than theatre. Speak less and more precisely than you might in a holistic house, narrate in the language of time, performance and Swiss craft, and let the exactness of your hands carry the brand. Precision extends to everything the guest can perceive: product quantities measured as the protocol states, phases in the correct order and time, immaculate trolley and linen. In a couture house, sloppiness anywhere reads as sloppiness everywhere.`,
        },
        {
          heading: 'Retail: the results continued at home',
          body: `Valmont retail succeeds when it is framed as the treatment's results continued at home, and the mechanics reward restraint. During the treatment, narrate the key products at natural moments, one sentence each, while the guest is experiencing them: the mask they can feel firming, the serum chosen for what your analysis found. At the close, prescribe rather than pitch: two or three products, each linked explicitly to the treatment just delivered and to the guest's own concerns. The Prime Renewing Pack is the natural hero of many prescriptions, because the guest has seen its effect in the mirror minutes earlier and it makes a perfect first Valmont purchase; the Hydra3 story answers the dehydrated guest; and the summit of the range waits for the client whose journey has earned it. Tell the guest what not to buy as well, which at Valmont prices builds extraordinary trust and protects the long relationship the house depends on. Write the prescription down, and record it on the guest's history so the next therapist can continue the story rather than restart it.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths in a Valmont spa follow results. The hydration facial guest whose real concern is ageing moves naturally toward the flagship anti-ageing experience next visit; say so at the close and note it on their record. The sixty-minute guest with genuine needs benefits from the longer ritual, offered once, warmly, at booking or in consultation. The devoted regular whose commitment and results justify it may be ready for the l'Elixir des Glaciers tier, introduced with reverence, never pressure. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill, and at this price level a single pushed sale can end a relationship worth years. Alongside selling the brand, you protect it. On shift that means using the correct products in the exact quantities the protocol states, following the choreography as trained rather than your private variant, keeping retail and testers immaculate, reporting low stock before it forces substitutions, and never quietly trimming a ritual to rescue a late-running column; flag the schedule instead. Guests experience Valmont only through its therapists. In that room, you are the maison.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a house is most famous for and the first to master on any new menu; on a Valmont menu, the signature anti-ageing facial the spa presents at the top of its offer.` },
        { term: 'House choreography', definition: `The precise, trained massage gestures that define a Valmont facial; learned from house trainers and protocols, and never improvised in front of a guest.` },
        { term: 'Prescription close', definition: `Ending a treatment by prescribing two or three products linked to findings and the treatment delivered, written down and recorded, rather than pitching the range.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: exact quantities, faithful protocols and choreography, immaculate presentation, stock reporting and the ritual delivered in full.` },
      ],
      caseStudy: {
        title: 'The tight column at The Belgrave, Edinburgh',
        scenario: `Fern is covering a busy Saturday at The Belgrave, a five-star Edinburgh hotel spa with a Valmont menu, and a late arrival has pushed her column twenty minutes behind. Her next guest, Mrs Okafor, is booked for the spa's signature anti-ageing facial, a protocol Fern knows demands its full choreography and exact timings. The obvious rescue is to trim quietly: shorten the massage phases, skip a step, compress the mask time, and hope the guest never notices. Mrs Okafor is a regular who has had this facial four times before, with the spa's head therapist, and knows precisely how it should feel.`,
        insight: `Fern refuses the quiet trim. She flags the delay to the coordinator, who adjusts the following booking, and offers Mrs Okafor an honest choice: a slightly later start with the full ritual, delivered completely. The guest chooses the full experience, receives every phase and the true choreography, and leaves with the Prime Renewing Pack and a rebooking. The professional lesson: at a precision house the ritual is the brand, and a regular guest is a walking audit. Protecting the protocol under pressure, and fixing the schedule openly instead, is what brand standards actually mean on shift.`,
      },
      summary: `Mastering a Valmont shift is a craft with four faces. Read the menu like a professional, flagship anti-ageing facial first, noting duration, protocol, products and audience. Deliver the signature style faithfully: the trained house choreography, Swiss precision in quantities and timings, and the composed couture tone, never an improvised gesture. Retail as the results continued at home, prescribing two or three linked products with the Prime Renewing Pack as the natural hero. And build honest upgrade paths toward the flagship and the summit of the range while protecting the standards, because in the room the therapist is the maison.`,
    },
  ],
}
