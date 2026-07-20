// WHC Academy brand masterclass: Aromatherapy Associates. Independent WHC
// training - not affiliated with or endorsed by Aromatherapy Associates.
// Answer key lives in academy-more-answers/aromatherapy-associates-masterclass.ts
// (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'aromatherapy-associates-masterclass',
  title: 'Aromatherapy Associates Masterclass',
  tagline: `The London house that made aromatherapy a luxury - its story, its oils, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Aromatherapy Associates is the British house that turned aromatherapy itself into a luxury spa category. It was founded in London in 1985 by Geraldine Howard and Sue Beechey, two practising aromatherapists who had trained under Micheline Arcier, one of the pioneers who brought clinical aromatherapy to Britain. The brand grew out of their treatment practice: the oils came first, blended for real clients, and the products followed.

That origin explains everything about the house. Where most skincare brands add fragrance to formulations, Aromatherapy Associates builds entire products around therapeutic-grade essential oil blends, chosen for their effect on mood, sleep, stress and energy as much as on the skin. The range is famously organised by how the guest wants to feel rather than by skin type, in wellbeing families such as Relax, Deep Relax, De-Stress and Revive.

The USP a therapist must be able to say in one breath: Aromatherapy Associates offers genuine, expertly blended aromatherapy, created by practising aromatherapists in London and delivered as personalised rituals in the world's finest spas. The guest is not buying a scented product; they are buying the considered use of essential oils to change how they feel, prescribed through consultation and continued at home in the bath. Few houses can claim that authority, and none wear it more quietly.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `The heart of the Aromatherapy Associates range is the Bath and Shower Oil collection, and the most famous of all is Deep Relax, a blend built around vetivert, camomile and sandalwood, created to ease the mind towards sleep. Guests ask for it by name, luxury hotels place it on bathside trays, and many therapists consider it the single most recognisable bath oil in the industry. Around it sit the other wellbeing families: Relax, De-Stress for mind and body, Revive for mornings and travel, Support blends for breathing and resilience, and Inner Strength, a blend created by co-founder Geraldine Howard during her own experience of cancer, which the house has long linked to charitable support.

The formulation story is simple to tell: high concentrations of expertly blended essential oils, carried in nourishing base oils, designed so that a capful in a warm bath becomes a treatment in itself. The skincare range, including the well-loved rose-based products, carries the same aromatic intelligence into facial care.

Where you are unsure of a specific formulation, never invent it. Learn any range the professional way: heroes first, one family at a time, smell every blend until you can describe it with your eyes closed, read the house training materials, and use the key oils yourself. With this house above all others, your nose is your product knowledge.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `On day one in an Aromatherapy Associates spa, read the menu in layers. Start with the flagship: the Ultimate Aromatherapy Experience, the house's renowned full-body massage, is the treatment most guests know the brand for, and its defining moment comes before a hand is laid on the guest, when they smell the oils and choose the blend their body responds to. Then map the facials, the targeted body treatments and the enhancements, noting duration, protocol, products used and who each treatment suits. Ask the senior therapist rather than guessing.

Delivery is where the house lives. The signature style is aromatic and ritual-led: the guided inhalation of the chosen blend, unhurried flow, pressure and focus personalised through consultation, and a calm, attentive presence throughout. The blend the guest chose is the thread; reference it from first breath to aftercare.

Retail is the ritual continued in the guest's own bathroom. The strongest prescription is the bath oil version of the blend they chose, plus one or two products linked to what you found, written down. Upsell paths are natural: the massage guest who slept badly is a Deep Relax guest at home; the sixty-minute guest carrying real tension benefits from ninety.

Finally, protect the brand: correct oils in correct quantities, protocols followed faithfully, testers immaculate, low stock reported, and the ritual never trimmed under time pressure. On shift, you are the house.`,
    },
  ],
  quiz: [
    {
      q: 'Aromatherapy Associates was founded by...',
      options: [
        'A Swiss laboratory in the 1960s',
        'Geraldine Howard and Sue Beechey in London in 1985',
        'A Parisian perfumer in 1990',
        'A hotel group seeking its own spa brand',
      ],
    },
    {
      q: 'The founders trained under...',
      options: [
        'A dermatology professor in Zurich',
        'A Japanese skincare master',
        'Micheline Arcier, a pioneer of clinical aromatherapy in Britain',
        'The perfume houses of Grasse',
      ],
    },
    {
      q: `The house's most famous hero products are...`,
      options: [
        'The Bath and Shower Oils, led by Deep Relax',
        'A collagen serum range',
        'A mineral make-up line',
        'A seaweed body wrap kit',
      ],
    },
    {
      q: 'Deep Relax is built around which signature notes?',
      options: [
        'Peppermint, lemon and eucalyptus',
        'Rose, jasmine and neroli',
        'Tea tree, lavender and mint',
        'Vetivert, camomile and sandalwood',
      ],
    },
    {
      q: 'The range is famously organised by...',
      options: [
        'Price tier',
        'How the guest wants to feel, in wellbeing families such as Relax, De-Stress and Revive',
        'Skin type only',
        'Season of the year',
      ],
    },
    {
      q: `The defining moment of the Ultimate Aromatherapy Experience is...`,
      options: [
        'A high-frequency machine pass',
        'A retail presentation before the massage',
        'The guest smelling the oils and choosing the blend their body responds to',
        'A cold plunge ritual',
      ],
    },
    {
      q: 'The strongest retail prescription after a treatment is...',
      options: [
        'The bath oil version of the blend the guest chose, plus one or two linked products, written down',
        'The full range presented at the till',
        'Whatever is on promotion that week',
        'Leaving retail entirely to reception',
      ],
    },
    {
      q: 'Protecting the brand on shift means...',
      options: [
        'Improvising protocols to save time',
        'Substituting products quietly when stock runs low',
        'Trimming the opening ritual when the column runs late',
        'Correct oils in correct quantities, faithful protocols, stock reported, and the ritual delivered in full',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa used this brand and she told me about two aromatherapists blending oils in London in the eighties. Suddenly it wasn't a product line - it was a practice, and I trusted every drop after that."`,
      helpsYou: `Spas running Aromatherapy Associates want therapists who can carry the house's quiet authority. Telling the founding story and stating the USP in one confident sentence is what makes an interviewer, or a sceptical guest, relax.`,
      tips: [
        'Learn the one-breath USP: genuine expert aromatherapy, blended by practising aromatherapists, delivered as personalised ritual',
        `Remember the origin: the oils came first, blended for real clients - the products followed`,
        `Speak the house language of feeling: relax, restore, revive, breathe`,
      ],
    },
    {
      guestView: `"She held three oils under my nose and asked which one my body wanted. I chose without thinking. A capful of the same oil is now in my bath every Sunday night - and I sleep like I did on that couch."`,
      helpsYou: `Hero fluency in this house means knowing the Bath and Shower Oils cold, above all Deep Relax, and being able to describe each blend by scent and purpose. That fluency lets you walk onto any Aromatherapy Associates shift and belong within the hour.`,
      tips: [
        'Heroes first: the Bath and Shower Oils, led by Deep Relax with vetivert, camomile and sandalwood',
        'Learn the wellbeing families: Relax, Deep Relax, De-Stress, Revive, Support, Inner Strength',
        'Smell every blend until you can describe it with your eyes closed',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"The treatment began with me breathing in the oil I had chosen. An hour later she wrote down that same oil for my bath at home. It never felt like selling - it felt like being prescribed something that already worked on me."`,
      helpsYou: `Therapists who can deliver the aromatic ritual faithfully, retail the chosen blend as the natural continuation of the treatment, and build honest upgrade paths are the ones luxury hotels rebook, promote and request by name.`,
      tips: [
        'Day one: learn the flagship Ultimate Aromatherapy Experience before anything else',
        'The chosen blend is the thread - reference it from first inhalation to aftercare',
        'Prescribe the bath oil of the blend they chose, plus one or two linked products, written down',
        'Never trim the opening ritual under time pressure - flag the schedule instead',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'aromatherapy-associates-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Aromatherapy Associates, the London house that established aromatherapy as a luxury spa category. It covers the founding story and philosophy that shape every blend, the hero products and wellbeing families a therapist must know cold, and the practical craft of the shift: reading the treatment menu, delivering the aromatic ritual-led signature style, retailing the range by linking the chosen blend to a short home prescription, building honest upsell paths, and upholding the standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by Aromatherapy Associates.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas that carry Aromatherapy Associates across UK luxury hotels, destination spas and premium day spas. It suits therapists interviewing for an account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving from another product house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in these spas will also gain a working command of the range and its language.`,
  outcomes: [
    `Tell the Aromatherapy Associates founding story and articulate its philosophy and USP in confident, guest-ready language`,
    'Name the hero products and wellbeing families and explain their blend stories accurately and honestly',
    `Deliver the house's aromatic, ritual-led signature style, from the guided inhalation to the close, at five-star standard`,
    'Retail the range by linking the blend chosen in treatment to a written two or three item home prescription',
    `Build integrity-led upgrade paths between treatments and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount the founding story of Aromatherapy Associates and explain why its practitioner heritage sets it apart`,
        `Explain the house philosophy of genuine aromatherapy organised around how the guest wants to feel`,
        `Articulate the house USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'Two aromatherapists in London, 1985',
          body: `Aromatherapy Associates was founded in London in 1985 by Geraldine Howard and Sue Beechey, two practising aromatherapists who had trained under Micheline Arcier, one of the pioneers who brought clinical aromatherapy from continental Europe to Britain. That lineage matters, because it places the house inside a genuine therapeutic tradition rather than a marketing one. The founders were treating real clients with essential oil blends long before there was a brand; the products grew out of the practice, blend by blend, because clients wanted to take the effects home. Most beauty brands begin with a product and later write a story; this house began with a treatment couch and clients whose sleep, stress and energy the founders were working on directly. For a therapist, this heritage is the answer to the guest who asks what makes the brand different. These are not scented products; they are an aromatherapist's working blends, refined over decades, that happen to be beautiful. Very few houses in luxury spa can honestly make that claim.`,
        },
        {
          heading: 'The philosophy: how do you want to feel?',
          body: `The organising idea of the house is disarmingly simple: begin with how the guest feels, and how they want to feel, rather than with their skin type or age. The celebrated Bath and Shower Oils are arranged in wellbeing families with names that are promises: Relax, Deep Relax, De-Stress, Revive, Support. Essential oils sit at the centre of every formulation, chosen and blended for their effect on mood, sleep, stress and energy as much as on the skin, and carried in nourishing bases so that the product delivers skin benefit alongside the aromatic work. This philosophy transforms the consultation. Instead of interrogating a skin concern, the therapist asks about sleep, workload, travel and mood, then lets the guest smell blends and notice which one their body reaches for. It also gives the house its distinctive voice: calm, warm, sensory and honest, speaking of how a guest will feel tonight and tomorrow morning as readily as how their skin will look. A therapist who talks only in skincare mechanics has missed the brand entirely.`,
        },
        {
          heading: 'The USP in one breath',
          body: `Every therapist on an Aromatherapy Associates account should be able to state the house USP in a single sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: Aromatherapy Associates offers genuine, expertly blended aromatherapy, created by practising aromatherapists in London and delivered as personalised rituals in the world's finest spas. Each clause earns its place. Genuine aromatherapy, because the essential oils are the product, not a fragrance added to one. Expertly blended, because the founders' training under Micheline Arcier and decades of practice stand behind every formula. Created by practising aromatherapists, because the brand grew out of a working treatment practice, which is its deepest point of difference. Delivered as personalised rituals, because the guest chooses the blend their body responds to, and the treatment is built around that choice. When a guest compares the house with a cheaper scented oil, you now have an honest, specific answer that elevates the brand without disparaging anything else, which is exactly how luxury speaks.`,
        },
        {
          heading: 'Where the house lives: bathrooms and five-star spas',
          body: `Understanding where the brand sits commercially sharpens how you present it. Aromatherapy Associates built its reputation in two places at once: the treatment rooms of luxury hotel and destination spas, and the bathrooms of guests who discovered that a capful of oil in a warm bath could genuinely change an evening. The bath is central to the house in a way that is true of almost no other brand; the founders held that bathing with the right blend is a treatment in itself, and the miniature bath oil collections that guests buy as gifts have introduced the house to generations of new devotees. For the therapist this means two practical things. First, your retail conversation has a natural, honest destination: the guest's own bath, tonight, with the blend they chose today. Second, the brand's presence in world-class spas means guests often arrive already loyal, sometimes carrying years of history with a particular blend. Ask. A guest's existing relationship with Deep Relax is consultation gold, and honouring it is the fastest trust you will ever build.`,
        },
      ],
      keyTerms: [
        { term: 'Product house', definition: `A brand that supplies a spa's products, treatment protocols, training and much of its identity; luxury spas partner with a house rather than simply stocking its products.` },
        { term: 'Clinical aromatherapy', definition: `The therapeutic discipline of using essential oils for specific effects on body and mind, in which both founders trained under pioneer Micheline Arcier before creating the brand.` },
        { term: 'Wellbeing family', definition: `A group of products organised by the feeling they are designed to create, such as Relax, De-Stress or Revive, rather than by skin type or age concern.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The comparison question at Fellbrook Manor, the Cotswolds',
        scenario: `Priya is a therapist at Fellbrook Manor, a luxury country house spa in the Cotswolds running an Aromatherapy Associates menu. During consultation her guest Mr Whitfield, booked in by his wife, says he does not really believe in aromatherapy and asks why the spa uses such an expensive brand when supermarket lavender oil costs a few pounds. Priya knows that a defensive lecture on essential oil quality will bounce off him, and that he has forty-five minutes on her couch in which the house can make its own argument if she sets it up properly.`,
        insight: `Priya answers briefly in the house voice: the brand was founded in 1985 by two practising aromatherapists trained in the clinical tradition, and every blend is a working formula refined on real clients, not a fragrance. Then she moves the argument from words to senses, offering him the blends to smell and letting him choose. He picks De-Stress without prompting, and by the close he asks what it was. The professional lesson: with a sceptic, state the heritage once, calmly, then let the nose and the treatment carry the case. Authority whispers; it never argues.`,
      },
      summary: `Aromatherapy Associates is a London house founded in 1985 by Geraldine Howard and Sue Beechey, practising aromatherapists trained under Micheline Arcier, and its deepest point of difference is that the blends came before the brand, refined on real clients in a working practice. Its philosophy begins with how the guest wants to feel, organising the range into wellbeing families and placing genuine essential oil blends at the centre of every product. Its USP, expert aromatherapy delivered as personalised ritual, should live on every therapist's tongue, spoken in the house's calm, sensory voice.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify the house's hero products and wellbeing families and describe what each is famous for`,
        `Explain the blend stories, led by Deep Relax with vetivert, camomile and sandalwood, in guest-ready language`,
        'Apply a reliable, honest method for learning an aromatic range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The Bath and Shower Oils: the soul of the house',
          body: `In any house a small number of products carry the reputation, and here the answer is singular: the Bath and Shower Oil collection is the soul of Aromatherapy Associates, and Deep Relax is its most famous member. Built around vetivert, camomile and sandalwood, Deep Relax was created to ease an overactive mind towards sleep, and it has become one of the most recognisable bath oils in the world, the bottle guests photograph on hotel bathside trays and ask for by name. Around it sit the other families: Relax for gentler evening unwinding, De-Stress blends for mind and body, Revive for mornings, travel and flagging afternoons, and Support blends for breathing and resilience. Learn these as characters, not stock items: each has a purpose, a scent profile and a natural guest. The professional standard is to present any of them in one fluent sentence covering what it is, what it is for, and how it is used, typically a capful in a warm bath, breathed deeply, as a treatment in itself.`,
        },
        {
          heading: 'Inner Strength and the human story',
          body: `One blend deserves particular respect. Inner Strength was created by co-founder Geraldine Howard during her own experience of cancer, blended to bring clarity and calm strength through the hardest of times, and the house has long linked it to charitable support for people affected by cancer. For a therapist this is more than product knowledge; it is a story to handle with care and honesty. Some guests will know it and love the brand more for it; others may be living through something similar themselves, and a quiet, accurate sentence about the blend's origin can land with real meaning. Never dramatise it, never use it as a sales lever, and never guess at details you have not verified from the house's own materials. The wider lesson is that in a founder-led aromatherapy house, the human stories are part of the range. Guests are buying decades of practice, personal history and conviction in a bottle, and telling those stories truthfully, at the right moments, is a professional skill in itself.`,
        },
        {
          heading: 'From bath to face: the wider range',
          body: `Although the bath oils carry the fame, the house extends the same aromatic intelligence across body and facial care. The body range continues the wellbeing families into oils, creams and washes, so a guest who loves a blend can live inside it from shower to sleep. The skincare range brings essential oils and botanicals into facial care, with rose holding a specially loved place in the house's repertoire, prized for its affinity with the skin and its quietly luxurious scent. The formulation story you narrate is consistent everywhere: high concentrations of expertly blended essential oils, carried in nourishing bases, designed to work on mood and skin together. When presenting any product, follow the house logic by leading with feeling and purpose, then touch on skin benefit: this is the blend you chose for your tension, and used in the bath tonight it will carry the treatment on, beats any recital of ingredients. Where a menu includes treatments or products you have not yet learned, say so honestly and check; never improvise a claim in front of a guest.`,
        },
        {
          heading: 'Learning an aromatic range: your nose is your knowledge',
          body: `No course can teach every product on your particular spa's shelf, because ranges evolve and menus differ, so the meta-skill matters more than any list. With this house the method has a distinctive centre: smell everything, repeatedly, until you can describe each blend with your eyes closed. Aromatic fluency cannot be read; it must be breathed. Beyond the nose, the method is the professional standard for any house. Heroes first: the Bath and Shower Oils, led by Deep Relax, answer most guest questions and anchor most retail. Then one family at a time, learning each family's purpose rather than memorising isolated items. Use the spa's testers and the house's own training materials, which are your safest source for claims. Use the key oils yourself, in your own bath, because conviction cannot be faked and guests read certainty in seconds. And keep the habit of the honest gap: when asked something you do not know, say what you do know, offer to check, and actually check. A therapist who works this method is genuinely fluent within a week.`,
        },
      ],
      keyTerms: [
        { term: 'Hero product', definition: `An iconic product that carries a house's reputation and that guests ask for by name; here, above all, the Deep Relax Bath and Shower Oil with its vetivert, camomile and sandalwood blend.` },
        { term: 'Blend story', definition: `The short, honest narrative of a blend: its key notes, the feeling it was created for, and how it is used; the unit of product knowledge in an aromatherapy house.` },
        { term: 'Inner Strength', definition: `The blend created by co-founder Geraldine Howard during her own experience of cancer, long linked by the house to charitable support; a story to tell accurately and with care.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The bathside bottle at The Aldergate, Mayfair',
        scenario: `Tomas has recently joined the spa at The Aldergate, a five-star hotel in Mayfair, from a clinical skincare house. His aromatic knowledge is thin and his formal brand training is three weeks away. Before a body treatment, his guest Mrs Ellison mentions that she has used a blue-labelled bath oil from the hotel's bathrooms for years, that it is the only thing that helps her sleep when travelling, and asks him what is actually in it and whether there is a daytime version she could use before board meetings. Tomas feels the pull to bluff.`,
        insight: `Tomas has done his hero work. He recognises Deep Relax from the description, names its vetivert, camomile and sandalwood story, and explains why those notes settle an overactive mind. For the daytime question he reaches for the family logic rather than a guess: the Revive and De-Stress families exist for exactly that need, and he invites her to smell both after the treatment and choose. She leaves with a Revive oil beside her beloved Deep Relax. Heroes first, families second, the nose as referee: the method answered both questions honestly.`,
      },
      summary: `Product mastery begins with the Bath and Shower Oils, above all Deep Relax with its vetivert, camomile and sandalwood blend, then extends across the wellbeing families: Relax, De-Stress, Revive, Support and Inner Strength. The same aromatic intelligence runs through the body and facial ranges, with rose specially loved in skincare. The formulation story is high concentrations of expertly blended essential oils in nourishing bases, told in single honest sentences. Beyond any list, the lasting skill is the method: heroes first, one family at a time, your own nose and bath, and the honest gap instead of invention.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate an Aromatherapy Associates treatment menu on day one and deliver the house's aromatic signature style with confidence`,
        'Retail the range by linking the blend chosen in treatment to a short, written home prescription',
        `Build integrity-led upsell paths between treatments and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the flagship: the Ultimate Aromatherapy Experience, the house's renowned full-body massage, is the treatment guests most often know the brand for, and its defining feature is that it begins with choice, the guest smelling the oils and selecting the blend their body responds to before any hands-on work begins. Learn it first, in full. Then map the rest of the menu in layers: the facials and what distinguishes each, the targeted body treatments, and the enhancements that can extend or deepen a booking. For each treatment note four things: duration, protocol source, products used, and who it is for. Read the protocols the spa holds, shadow a senior therapist where you can, and ask questions before your first guest rather than improvising in front of one. A therapist who can honestly say I know this menu by the end of day one is rare, and remembered, and it is the single fastest way to earn a coordinator's trust.`,
        },
        {
          heading: 'Delivering the signature style',
          body: `An Aromatherapy Associates treatment is recognisable before a single stroke is delivered, because the house style is aromatic from the first minute. The consultation asks how the guest feels and how they want to feel; the guest smells and chooses their blend; and a guided inhalation of that blend traditionally marks the boundary between their day and their treatment, settling the nervous system before touch begins. Honour these openings completely. Under time pressure they are the first thing a rushed therapist trims and the last thing the house would ever sacrifice, because the choosing and the breathing are the brand. Through the treatment, the standard is unhurried flow, pressure and focus personalised to the consultation, and the chosen blend as the connecting thread: name it as you work, and let its scent carry the hour. Close gently, never abruptly, and connect the aftercare to the blend: how to use it at home, and what the guest should notice tonight. Deliver the choice, the breath and the thread faithfully and you are delivering the house; skip them and you are merely giving a massage with expensive oil.`,
        },
        {
          heading: 'Retail: the ritual continued in the bath',
          body: `Retail in this house has the most natural logic in the industry, because the treatment's centrepiece is already a retail product: the blend the guest chose. The strongest prescription is the Bath and Shower Oil of that blend, because it lets the guest re-create the heart of the treatment in their own bath tonight, and because it carries the scent memory of the hour in which they finally relaxed, one of the most powerful purchase motivations that exists. Around that anchor, prescribe no more than one or two further products linked to what you found: the matching body product for a guest who loved the oil on their skin, the rose skincare for the facial guest whose skin drank it in. Narrate products in single sentences during the treatment while the guest is experiencing them, prescribe at the close, and write the prescription down; a card with two named products converts far better than a verbal mention at a busy desk. Tell the guest what not to buy as well, which builds the trust that compounds over years, and record the blend and prescription on the guest's history so the next therapist can continue the story.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths in an Aromatherapy Associates spa follow the guest's own feelings, which makes them honest by design. The massage guest who mentioned broken sleep is a Deep Relax guest at home and a candidate for the fuller aromatherapy experience next visit; say so at the close and note it on their record. The sixty-minute guest carrying real tension genuinely benefits from ninety minutes, offered once, warmly, at booking or in consultation. Enhancements let a guest deepen today's booking without changing it. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill. Alongside selling the brand, you protect it. On shift that means using the correct oils in the correct quantities, following the protocol rather than your private variant, keeping testers and the retail wall immaculate, reporting low stock before it forces substitutions, and never quietly shortening the ritual to rescue a late-running column; flag the schedule instead. Guests experience the brand only through its therapists. On this shift you are the house, and the standard you hold is its reputation in that room.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a house is most famous for and the first one to master on any new menu; here, the Ultimate Aromatherapy Experience, defined by the guest's choice of blend.` },
        { term: 'Guided inhalation', definition: `The signature opening in which the guest breathes their chosen blend deeply before touch begins, settling the nervous system and marking the start of the ritual.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely feels and needs, such as sixty minutes to ninety, or a massage to the full aromatherapy experience.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct oils and quantities, faithful protocols, immaculate presentation, stock reporting and the ritual delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at Harewater Spa, Edinburgh',
        scenario: `Leah, an experienced agency therapist, arrives at Harewater Spa, a five-star hotel spa in Edinburgh, for her first shift on its Aromatherapy Associates menu, with fifty minutes before her first guest. She asks the head therapist for the menu and protocols, learns the structure of the Ultimate Aromatherapy Experience first, and confirms the oils and quantities for her first two bookings. Her second guest, Ms Petrova, books the same sixty-minute massage every month, mentions in consultation that she has barely slept for a fortnight, and chooses the Deep Relax blend within seconds of smelling it.`,
        insight: `Leah's preparation makes the professional move available. She delivers the ritual in full, the guided inhalation included, and keeps Deep Relax as the thread of the hour. At the close she prescribes the Deep Relax Bath and Shower Oil for the fortnight of bad nights, writes it down, and opens one honest upgrade path: with tension at this level, the ninety-minute experience next month would let her work the shoulders properly. She notes both on the guest's record. Nothing was pushed; a real need was heard and answered, and Harewater asks the agency for Leah by name.`,
      },
      summary: `Mastering an Aromatherapy Associates shift is a craft with four faces. Read the menu like a professional, flagship first, and know the Ultimate Aromatherapy Experience before anything else. Deliver the signature style faithfully: the guest's choice of blend, the guided inhalation, unhurried personalised flow, and the chosen scent as the thread of the hour. Retail as the ritual continued in the bath, anchored on the blend they chose, prescribed in writing. And build honest upgrade paths while protecting the standards, because on shift the therapist is the house, and the ritual is never the thing you trim.`,
    },
  ],
}
