// WHC Academy brand masterclass: ishga. Independent WHC training - not
// affiliated with or endorsed by ishga. Answer key lives in
// academy-more-answers/ishga-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'ishga-masterclass',
  title: 'ishga Masterclass',
  tagline: `The Hebridean seaweed house - its story, its science, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `ishga is a Scottish luxury skincare house born on the Isle of Lewis in the Outer Hebrides, one of the most remote and unspoilt coastlines in Europe. Founded in 2013, the brand takes its name from the Gaelic word for water, and everything about it flows from that origin: the cold, clean Atlantic waters around the Hebrides, the seaweed that thrives in them, and the island community that harvests it by hand.

The philosophy is natural marine skincare done seriously. ishga is built on sustainably hand-harvested Hebridean seaweed, an ingredient prized for its antioxidants, minerals and vitamins, blended into products designed to protect, condition and restore the skin. The tone of the house is honest, elemental and quietly Scottish: purity, provenance and the power of the sea, rather than glamour or clinical jargon.

Sustainability is not a marketing layer, it is the founding logic. Seaweed is a renewable resource, harvested by hand so the plant regrows, and the brand's identity is inseparable from caring for the environment it comes from.

The USP a therapist must be able to say in one breath: ishga offers natural, sustainable skincare powered by hand-harvested Hebridean seaweed, bringing the purity of Scotland's island waters into the treatment room. A guest can buy marine skincare in many places; with ishga they are buying a genuine place, a genuine plant and a genuinely sustainable story.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `With most houses you learn hero products first. With ishga, the hero is the ingredient itself: Hebridean seaweed, and every product in the range is a different way of delivering it to the skin.

Start there. The cold, nutrient-rich Atlantic waters around the Hebrides support seaweeds that are exceptionally rich in antioxidants, minerals, vitamins and amino acids. In skincare terms that translates to protection against environmental stress, conditioning and hydration, and a soothing, calming quality that suits even sensitive skins. Alongside the seaweed extract, the house draws on pure Hebridean water and other naturally derived ingredients, keeping formulations clean and honest.

Then map the range by category rather than memorising isolated items: facial care, from cleansers through serums and moisturisers; body care, including the salt and seaweed scrubs and body oils that anchor spa treatments; and bath products that bring the seaweed ritual home. For each category, learn which products the treatments use, because in an ishga spa the retail shelf mirrors the treatment menu closely.

Where you are unsure of a specific formulation, never invent it. Use the professional learning method: the ingredient story first, then one category at a time, using testers, the house training materials and the products on your own skin until conviction is real. With ishga, the single sentence that always serves you is the true one: this contains hand-harvested Hebridean seaweed, and here is what it will do for your skin.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `An ishga menu is built around the seaweed, and reading it is your first duty on day one. Identify the flagship treatment the spa promotes hardest, learn it in full, then map the rest in layers: the facials and what distinguishes each, the massages and which oils they use, the body rituals such as scrubs and wraps where the seaweed story is most vivid, and the enhancements that can extend a booking. For each, note duration, protocol, products used and who it is for, and ask the senior therapist rather than guessing.

Delivery is where the brand lives. The ishga style is elemental and unhurried: let the marine scent, the warmth of the oils and the texture of salt and seaweed do the storytelling, and narrate the provenance simply, one sentence at a time. A guest who learns mid-treatment that the seaweed on their skin was hand-harvested from Hebridean shores is experiencing the USP, not hearing it.

Retail is the ritual continued at home. Prescribe two or three products linked directly to the treatment just delivered, tell the guest what not to buy, write it down and record it.

Upsell paths are natural: the facial guest who loved the marine scent suits a full body ritual next visit; the sixty-minute massage guest with real tension benefits from ninety.

Finally, protect the house: correct products in correct quantities, protocols followed, stock reported, and the ritual never trimmed under time pressure. On an ishga shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'ishga originates from...',
      options: [
        'The west coast of Ireland',
        'The Isle of Lewis in the Outer Hebrides, Scotland',
        'The Norwegian fjords',
        'Cornwall, in the south west of England',
      ],
    },
    {
      q: 'The name ishga derives from...',
      options: [
        'The Gaelic word for water',
        `The founder's surname`,
        'A Norse word for island',
        'The Latin name of a seaweed species',
      ],
    },
    {
      q: `The hero ingredient at the heart of the ishga range is...`,
      options: [
        'Alpine herbs',
        'Diamond dust',
        'Sustainably hand-harvested Hebridean seaweed',
        'Volcanic clay',
      ],
    },
    {
      q: 'Seaweed earns its place in skincare because it is...',
      options: [
        'Brightly coloured and photogenic',
        'Cheap to farm intensively',
        'A strong exfoliant that strips the skin',
        'Rich in antioxidants, minerals and vitamins that protect and condition the skin',
      ],
    },
    {
      q: `ishga's approach to sustainability is best described as...`,
      options: [
        'A recent marketing campaign',
        'Founding logic: seaweed is a renewable resource, harvested by hand so the plant regrows',
        'Limited to recyclable boxes',
        'Not part of the brand story',
      ],
    },
    {
      q: 'Your first duty on day one in an ishga spa is...',
      options: [
        'Learn the treatment menu, flagship first, and ask rather than guess',
        'Rearrange the retail shelf',
        'Improvise treatments from your general training',
        'Memorise every ingredient list in the range',
      ],
    },
    {
      q: 'The strongest way to retail the ishga range is...',
      options: [
        'Present the full range at reception',
        'Discount whatever is overstocked',
        'Leave retail entirely to the front desk',
        'Prescribe two or three products linked directly to the treatment just delivered',
      ],
    },
    {
      q: 'Protecting the brand on an ishga shift means...',
      options: [
        'Adding your own favourite techniques to the protocol',
        'Using less product to save stock',
        'Correct products in correct quantities, protocols followed, stock reported, ritual never trimmed',
        'Only treating guests who already know the brand',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked where the products came from and the therapist told me about an island in the Outer Hebrides, seaweed cut by hand, and a name that means water in Gaelic. I stopped comparing it with anything else on my shelf after that."`,
      helpsYou: `Spas that carry ishga chose it for the story as much as the formulations, and they hire and rebook therapists who can tell that story in one confident breath. Provenance fluency is the fastest credibility you can build with this house.`,
      tips: [
        'Learn the one-breath USP: natural, sustainable skincare powered by hand-harvested Hebridean seaweed',
        'Remember the name: ishga comes from the Gaelic word for water',
        `Match the house voice - elemental, honest words like purity, provenance and the sea`,
      ],
    },
    {
      guestView: `"She told me, in one sentence, that the serum contained hand-harvested Hebridean seaweed and what it would do for my skin. I could smell the sea in it. I went home with two products and never once felt sold to."`,
      helpsYou: `With ishga the hero is the ingredient, which means one true, well-told story carries you across the whole range. Master the seaweed narrative and the category map, and you can walk onto an ishga shift and belong within an hour.`,
      tips: [
        'The hero is the ingredient: Hebridean seaweed, rich in antioxidants, minerals and vitamins',
        'Learn the range one category at a time - facial, body, bath',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The scrub smelt of salt and the sea, and while she worked she mentioned the seaweed had been harvested by hand off Hebridean shores. By the end I understood I had not just had a treatment, I had visited a place."`,
      helpsYou: `Therapists who can read an ishga menu on day one, deliver the elemental style faithfully, retail from the treatment and build honest upgrade paths are the ones coastal spas and five-star hotels ask for by name.`,
      tips: [
        'Day one: find the flagship treatment and learn it in full before anything else',
        'Let the marine scent and textures tell the story - narrate provenance in single sentences',
        'Prescribe two or three products linked to the treatment just delivered',
        'Protect the ritual - never trim the seaweed story to rescue a late column',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'ishga-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in ishga, the Scottish marine skincare house from the Isle of Lewis. It covers the founding story, the philosophy of sustainable Hebridean seaweed skincare and the USP that every therapist should be able to state in one breath; the ingredient science and range knowledge that make recommendations honest and confident; and the practical craft of the ishga shift: reading the treatment menu, delivering the elemental signature style, retailing the range by linking products to treatments, building integrity-led upsell paths, and upholding the standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by ishga.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas that carry ishga, from Scottish coastal and country house hotels to city day spas across the UK. It suits therapists interviewing for an ishga account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving to ishga from another house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in ishga spas will also gain a working command of the range and its story.`,
  outcomes: [
    `Tell ishga's founding story and articulate its philosophy and USP in confident, guest-ready language`,
    'Explain the Hebridean seaweed ingredient story accurately and map the range by category',
    `Deliver ishga's elemental signature style, letting provenance, scent and texture carry the treatment`,
    'Retail the range by linking products used in treatment to a two or three item home prescription',
    `Build integrity-led upgrade paths between treatments and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount ishga's origin on the Isle of Lewis and explain why provenance is the brand's foundation`,
        'Explain the house philosophy of natural, sustainable marine skincare built on hand-harvested seaweed',
        `Articulate ishga's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'An island house from the edge of the Atlantic',
          body: `ishga was founded in 2013 on the Isle of Lewis in the Outer Hebrides, a chain of islands off the north west coast of Scotland facing the open Atlantic. The name comes from the Gaelic word for water, and that single fact tells you most of what you need to know about the brand's identity: it is a house of place. The Hebrides offer some of the cleanest coastal waters in Europe, and the seaweed that grows in them is the foundation of every ishga formulation. Where many luxury brands are born in laboratories or marketing departments and later reach for a story, ishga's story came first: an island, its waters, its seaweed and the people who harvest it by hand. For a therapist, this is the answer to the guest who asks what makes the brand different. You are not selling a texture or a scent; you are offering the guest an hour somewhere most of them will never visit, delivered through their skin. Few houses can make that offer honestly, and it is why coastal and Scottish spas in particular treasure the brand.`,
        },
        {
          heading: 'The philosophy: purity, provenance and the sea',
          body: `The heart of ishga is natural marine skincare taken seriously. The house holds that the sea, and specifically the seaweed of the Hebrides, provides everything skin needs to be protected, conditioned and restored, and its formulations are built around that conviction: seaweed extract at the core, supported by pure Hebridean water and other naturally derived ingredients, with nothing in the jar that fights the story on the label. The tone that follows is distinctive. ishga does not speak in clinical percentages or glamour; its voice is elemental, honest and quietly Scottish, full of words like purity, provenance, restore and the sea. A therapist who delivers an ishga treatment with laboratory language has missed the brand as surely as one who delivers it carelessly. The philosophy also shapes the guest experience the house expects: treatments that feel like weather and water, marine scents allowed to speak, textures of salt and seaweed presented without apology, and a therapist who can name the place it all came from. The product is inseparable from where it is from, and the philosophy is the place.`,
        },
        {
          heading: 'Sustainability as founding logic',
          body: `Many brands added sustainability to their story in recent years; ishga's story never existed without it. Seaweed is a naturally renewable resource: harvested correctly, by hand, the plant is cut so that it regrows, and the shoreline it comes from is left as it was found. That harvesting method is slower and costlier than mechanical alternatives, and the brand's willingness to bear that cost is one of the most persuasive proofs of its values a therapist can cite. Sustainability at ishga is therefore not a certification badge to point at but the operating logic of the whole house: take only what the sea can replace, by methods that protect it, from waters clean enough to deserve protection. For guests this matters more every year. Increasing numbers of spa guests actively choose treatments and products that align with their values, and a therapist who can explain, accurately and without preachiness, that the seaweed in their treatment was hand-harvested sustainably from Hebridean shores is giving those guests exactly the reassurance they came looking for. Tell it as fact, not as sermon, and it sells itself.`,
        },
        {
          heading: 'The USP in one breath',
          body: `Every therapist on an ishga account should be able to state the house USP in a single sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: ishga offers natural, sustainable skincare powered by hand-harvested Hebridean seaweed, bringing the purity of Scotland's island waters into the treatment room. Each clause earns its place. Natural, because the formulations are built on naturally derived marine ingredients. Sustainable, because the hand-harvesting method and the renewable nature of seaweed are the founding logic, not an afterthought. Hand-harvested Hebridean seaweed, because that is the hero ingredient and the provenance in five words. The purity of Scotland's island waters, because place is the product. When a guest compares ishga with another marine brand, you now have an honest, specific answer: plenty of houses use seaweed, but very few can name the shore it came from, the hands that cut it and the method that lets it regrow. Deliver that in the house's calm, elemental voice, elevate the brand without disparaging any other, and you sound like a resident of the house rather than a visitor.`,
        },
      ],
      keyTerms: [
        { term: 'Provenance', definition: `The verifiable origin of an ingredient or product; ishga's provenance, the Hebridean shoreline, is the core of its identity and its strongest selling story.` },
        { term: 'Hebrides', definition: `The island chains off Scotland's west coast; the Outer Hebrides, including the Isle of Lewis where ishga was founded, face the open Atlantic and enjoy exceptionally clean coastal waters.` },
        { term: 'Hand-harvesting', definition: `Gathering seaweed manually so the plant is cut in a way that allows regrowth, protecting the shoreline; slower and costlier than mechanical methods, and central to ishga's sustainability.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The comparison shopper at Craigfarne Lodge, the Scottish Highlands',
        scenario: `Eilidh is a therapist at Craigfarne Lodge, a five-star Highland estate hotel whose spa runs an ishga menu. Her guest, Mr Whitmore, is a well-travelled spa regular who mentions during consultation that his home spa in London uses a famous marine skincare house, and asks, pleasantly but pointedly, why he should rate this Scottish brand he has never heard of against one with global name recognition. Eilidh knows the competitor's products are excellent, and she feels the pull to either criticise them or apologise for ishga's smaller profile. She does neither, and reaches instead for the one thing the bigger house cannot match.`,
        insight: `Eilidh answers with provenance, in the house voice: the seaweed in his treatment grew in the waters around the Outer Hebrides, was harvested by hand so it regrows, and the brand is named from the Gaelic for water because the place is the product. She invites him to smell the oil and place the scent on that shoreline, then lets the treatment finish the argument. The professional lesson: never fight a fame battle or run down a rival. A smaller house with a true story beats a bigger house with a familiar one, provided the therapist can tell the story specifically, calmly and as fact.`,
      },
      summary: `ishga is a Scottish house founded in 2013 on the Isle of Lewis in the Outer Hebrides, named from the Gaelic word for water, and built entirely on its place of origin. Its philosophy is natural marine skincare with sustainability as founding logic: hand-harvested Hebridean seaweed, a renewable resource cut so it regrows, blended with pure island water into honest formulations. Its USP, natural sustainable skincare powered by hand-harvested Hebridean seaweed, should live on every therapist's tongue, delivered in the house's calm, elemental, quietly Scottish voice.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Explain why Hebridean seaweed is the hero of the ishga range and what it does for the skin`,
        'Map the ishga range by category and connect the retail shelf to the treatment menu',
        'Apply a reliable, honest method for learning any range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The hero is the ingredient',
          body: `Most product houses ask you to learn hero products first: the icons guests request by name. ishga inverts that logic, because its hero is the ingredient itself, and every product in the range is a different vehicle for delivering it. Hebridean seaweed thrives in cold, clean, nutrient-rich Atlantic waters, and seaweeds grown in such conditions are exceptionally rich in antioxidants, minerals, vitamins and amino acids. In skincare terms those riches translate into three benefits a therapist should be able to narrate without notes: protection, because antioxidants help defend skin against environmental stress; conditioning and hydration, because the minerals and natural moisturising elements support the skin's own function; and soothing, because seaweed's calming character suits even sensitive and stressed skins. This inversion is a gift to the learning therapist. Master one true story, the seaweed story, and you carry credibility across the entire range, because the honest answer to what is in this product always begins the same way: hand-harvested Hebridean seaweed, and here is what it will do for your skin.`,
        },
        {
          heading: 'Mapping the range by category',
          body: `With the ingredient story secure, learn the range as a map rather than a list, one category at a time. Facial care runs from cleansers through toners, serums, facial oils and moisturisers, each pairing the seaweed core with supporting naturals for its specific job; learn which products your spa's facials actually use, in what order, because those are the ones guests will ask about. Body care is where the seaweed story is most vivid: salt and seaweed scrubs, body oils and creams that anchor the spa's massages and body rituals. Bath products carry the ritual home, letting a guest recreate something of the treatment in their own bathroom, which makes them one of the easiest honest recommendations in the range. Two practical disciplines complete the map. First, notice that in an ishga spa the retail shelf mirrors the treatment menu closely, so learning the treatments teaches you the retail and vice versa. Second, for every category learn one product deeply rather than five thinly: the one your treatments use most, presented in a single fluent sentence covering what it is, what it does and who it suits.`,
        },
        {
          heading: 'Telling the ingredient story honestly',
          body: `The seaweed story sells itself when it is told simply, at the right moment, and truthfully. The right moment is during the treatment, while the guest's senses are verifying every word: as the scrub meets their skin, as the marine scent of the oil rises, one sentence of provenance and one of benefit. What it is, what it does, how it will feel. Lead with feeling and benefit rather than chemistry, because that is the house voice; your skin will feel deeply conditioned and calm serves better than a recitation of mineral content. The truthfulness discipline is absolute. Never claim a specific ingredient, percentage or certification you have not verified from the brand's own materials, because an invented detail that unravels in front of a knowledgeable guest costs more credibility than a modest true one ever earns. When asked something you do not know, use the honest gap: say what you do know, offer to check the rest, and then actually check it. With ishga you always hold a true sentence that satisfies most questions: this contains sustainably hand-harvested Hebridean seaweed, rich in antioxidants, minerals and vitamins.`,
        },
        {
          heading: 'How to learn a range properly',
          body: `No course can teach you every product on your particular spa's shelf, because ranges evolve and menus differ, so the meta-skill matters more than any list: the professional method for learning a house fast and honestly. First, the hero story before everything; with ishga that is the seaweed narrative, which answers most guest questions on its own. Second, one category at a time: facial, then body, then bath, learning each category's logic rather than memorising isolated items. Third, use the testers and the training materials the spa holds; the house's own words are your safest source for claims, especially around sustainability, where precision matters and exaggeration embarrasses everyone. Fourth, use the key products on your own skin and in your own bath, because conviction cannot be faked and guests read your certainty accurately within seconds; a therapist whose own skin has felt the seaweed bath describes it differently, and guests hear the difference. Fifth, keep the honest gap as a permanent habit. A therapist who follows this method can walk into an unfamiliar ishga spa and be genuinely fluent within their first week, and fluent without a single invented claim.`,
        },
      ],
      keyTerms: [
        { term: 'Hero ingredient', definition: `The single ingredient a house's identity rests on; for ishga, sustainably hand-harvested Hebridean seaweed, the honest first sentence of every product story.` },
        { term: 'Antioxidants', definition: `Compounds that help defend skin against environmental stress; seaweed grown in cold Atlantic waters is a naturally rich source, central to ishga's protective benefits.` },
        { term: 'Category map', definition: `Learning a range as families with shared logic, facial, body and bath, rather than as a list of isolated products; the fastest honest route to range fluency.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The knowledgeable guest at The Marram House, East Lothian',
        scenario: `Tomás has just joined The Marram House, a luxury coastal hotel spa in East Lothian running an ishga account, and his formal brand training is still two weeks away. In his first body treatment, his guest Dr Lindqvist, a marine biologist on holiday, asks with genuine curiosity which seaweed species the scrub uses, how it is harvested, and whether the antioxidant claims hold up. Tomás knows the ingredient story and the harvesting method but not the species detail, and he feels the familiar pull to round his knowledge up into a confident guess for a guest who would enjoy the detail.`,
        insight: `Tomás holds the line. He tells her, accurately, what he knows: the seaweed is hand-harvested from Hebridean shores so the plants regrow, and seaweeds from those cold Atlantic waters are naturally rich in antioxidants, minerals and vitamins. On the species question he uses the honest gap, promising to check the brand's own materials, and after the treatment he brings her the answer at reception with the product in hand. Dr Lindqvist buys the scrub, telling him the checking impressed her more than a fluent guess would have. In front of an expert, honesty is not the safe option; it is the impressive one.`,
      },
      summary: `ishga's hero is its ingredient: Hebridean seaweed from cold, clean Atlantic waters, rich in antioxidants, minerals, vitamins and amino acids, delivering protection, conditioning and soothing calm to the skin. Learn the range as a category map, facial, body and bath, noticing that the retail shelf mirrors the treatment menu, and learn one product deeply per category. Tell the ingredient story in single honest sentences while the guest experiences the product, and never invent a claim; the true sentence about hand-harvested seaweed answers most questions, and the honest gap handles the rest.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate an ishga treatment menu on day one and deliver the house's elemental signature style with confidence`,
        'Retail the range by linking the products used in treatment to a short, honest home prescription',
        `Build integrity-led upsell paths between treatments and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every ishga spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start by identifying the flagship: the treatment the spa promotes hardest, features in its marketing and expects guests to arrive asking for, and learn it in full before anything else. Then map the rest of the menu in layers. The facials, and what distinguishes each tier. The massages, and which body oils each uses. The body rituals, scrubs, wraps and seaweed-based experiences, where the house story is at its most vivid and which often make an ishga menu distinctive. Finally the enhancements, the add-ons that can extend or deepen a booking. For each treatment note four things: duration, protocol source, products used, and who it is for. Read the protocols the spa holds, shadow a senior therapist where you can, and ask questions before your first guest rather than improvising in front of one. A therapist who can honestly say I know this menu by the end of day one is rare, and remembered, and on an agency shift that discipline is the whole difference between belonging and blagging.`,
        },
        {
          heading: 'Delivering the signature style',
          body: `An ishga treatment should feel like the place it comes from: elemental, unhurried and honest. The house's materials are sensory gifts, and the style is to let them speak. The marine scent of the oils, the texture of salt and seaweed in a scrub, the enveloping warmth of a wrap; present each without rush and without apology, because for the guest these are the Hebrides arriving through their skin. Around the sensory delivery runs a thread of quiet narration: single sentences of provenance placed at natural moments, the seaweed in this scrub was harvested by hand from Hebridean shores, so that the guest experiences the USP rather than being lectured on it. The pacing is calm and generous; a rushed ishga treatment contradicts everything the brand stands for, because nothing about an island shoreline is hurried. Personalise within the protocol, adapting pressure, temperature and focus to the consultation, but keep the protocol's shape faithfully: openings, sequences and finishing touches are the house's choreography, not suggestions. Deliver the senses, the story and the calm together and you are delivering ishga; deliver only the products and you are merely using them.`,
        },
        {
          heading: 'Retail: the ritual continued at home',
          body: `ishga retail succeeds when it is framed as the treatment going home with the guest, and the house makes this unusually easy because the retail shelf mirrors the treatment menu. During the treatment, narrate the key products at natural moments, one sentence each, while the guest's senses verify every word. At the close, prescribe rather than pitch: two or three products, each linked explicitly to the treatment just delivered and to what you found in consultation. The strongest links are the ones the guest already loves. The body oil, because it carries the marine scent and the memory of the hour. The scrub they felt working, because it recreates the ritual's most tactile moment. The bath products, because they extend the seaweed experience into the guest's own bathroom, the closest thing to taking the treatment home whole. Tell the guest what not to buy as well, which builds the trust that compounds over years and visits. Write the prescription down, because a written card converts far better than a verbal mention at a busy desk, and record it on the guest's history so the next therapist can continue the story.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths in an ishga spa follow the menu's own logic. The facial guest who loved the marine scent and the seaweed story is a natural candidate for a full body ritual next visit; say so at the close, warmly and once, and note it on their record. The sixty-minute massage guest carrying genuine tension benefits from ninety minutes, offered at booking or in consultation where it ties to their own words. Enhancements let a guest deepen today's booking without changing it. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill, and a declined offer is accepted without a flicker. Alongside selling the brand, you protect it. On shift that means using the correct products in the correct quantities, following the protocol rather than a private variant, keeping retail and testers immaculate, reporting low stock before it forces substitutions, and never quietly shortening a ritual to rescue a late-running column; flag the schedule to the coordinator instead, because protecting the standard is the professional's job and fixing the diary is management's. Guests experience the brand only through its therapists. On an ishga shift, you are ishga, and the standard you hold is the brand's reputation in that room.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a spa promotes hardest and guests most often arrive wanting; the first thing to learn in full on any new menu, before the rest is mapped in layers.` },
        { term: 'Enhancement', definition: `An add-on that extends or deepens an existing booking, allowing a guest to upgrade the outcome of today's treatment without changing it.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely loved or needs, such as facial to full body ritual, or sixty minutes to ninety.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct products and quantities, faithful protocols, immaculate presentation, stock reporting and the ritual delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at The Dunlin, Edinburgh',
        scenario: `Priya, an experienced agency therapist, arrives at The Dunlin, a five-star Edinburgh hotel spa, for her first shift on its ishga menu, with forty minutes before her first guest. She asks the head therapist for the menu and protocols, identifies the flagship body ritual, learns its structure in full and confirms the products for her first two bookings. Her second guest, Mrs Carragher, is a facial regular who sighs during consultation that she always means to try one of the body treatments but nobody has ever suggested which, and mentions she loves the smell of the oils more than anything.`,
        insight: `Priya's preparation makes the professional move available. She delivers the facial faithfully, narrating the seaweed provenance in single sentences at natural moments. At the close she prescribes the cleanser she used and the body oil whose scent Mrs Carragher loved, then opens the upgrade path: since the marine scent is her favourite part, the flagship body ritual is the natural next visit, and Priya notes it on the guest's record for whoever treats her next. Nothing was pushed; a stated preference was heard and answered. One shift, one honest upsell path, one guest given a reason to return, and an agency therapist The Dunlin asks for by name.`,
      },
      summary: `Mastering an ishga shift is a craft with four faces. Read the menu like a professional, flagship first, mapping facials, massages, body rituals and enhancements with duration, protocol, products and audience for each. Deliver the elemental signature style: unhurried pace, senses allowed to speak, provenance narrated in single honest sentences. Retail as the ritual continued at home, prescribing two or three products linked to the treatment, written down and recorded. And build integrity-led upgrade paths while protecting the standards, because on shift the therapist is the brand, and the ritual is never the thing you trim.`,
    },
  ],
}
