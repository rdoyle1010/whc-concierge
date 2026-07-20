// WHC Academy brand masterclass: Biologique Recherche. Independent WHC
// training - not affiliated with or endorsed by Biologique Recherche.
// Answer key lives in academy-more-answers/biologique-recherche-masterclass.ts
// (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'biologique-recherche-masterclass',
  title: 'Biologique Recherche Masterclass',
  tagline: `The Parisian clinical house of Skin Instants - its story, its icons, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Biologique Recherche is one of the most revered names in professional skincare, a French family house founded in Paris in the late 1970s by Yvan Allouche, a biologist, and Josette Allouche, a physiotherapist. Their son, Dr Philippe Allouche, a physician, later joined the company and has long led its creative and scientific direction. The house remains family-run, and that continuity shapes everything about it.

From the start the brand set itself against the perfumed, marketing-led mainstream. Its formulations are famously clinical: highly concentrated in active ingredients, free of added fragrance, and processed cold wherever possible to preserve the integrity of those actives. Even the austere bottles signal the philosophy - this is skincare that behaves like a clinical protocol, not a cosmetic indulgence.

The intellectual heart of the house is the concept of the Skin Instant: the idea that skin is a living, changing organ whose condition varies with stress, climate, hormones and lifestyle, so a professional should assess and treat the skin as it is today rather than filing it under a fixed skin type. The flagship of the brand is its Ambassade de la Beaute in Paris, on the Champs-Elysees, and distribution is deliberately selective, favouring elite spas, medi-spas and five-star hotels.

The USP in one breath: personalised clinical skincare, built on Skin Instant assessment and a rigorous methodology, with raw, concentrated, fragrance-free formulations trusted by the world's most demanding facialists.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `No product in professional skincare has a cult following quite like Lotion P50. First created in 1970 and refined since, it is an exfoliating, balancing lotion often described as a facial in a bottle: applied after cleansing, it gently exfoliates, helps rebalance the skin's pH and prepares the skin to receive everything that follows. The name is widely explained by the brand as a reference to the roughly fifty-day epidermal renewal period the lotion works across. P50 comes in a family of versions formulated for different Skin Instants, which is why the consultation, not habit, decides which one a guest receives.

Beyond P50, learn the heroes guests ask for: the Masque VIP O2, the house's celebrated oxygenating mask, and the concentrated targeted serums that let a facial be built precisely for the Skin Instant in front of you.

The ingredient story follows the philosophy: high concentrations of biological, botanical and marine actives, no added fragrance, and cold processing wherever possible so the actives arrive intact. When narrating a product, keep it clinical and simple: what it contains, what it does, and why it was chosen for this guest today.

Where a specific formulation detail is not certain, never invent it. Learn heroes first, one category at a time, from the house's own training materials, and use the honest gap: say what you know, check the rest.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `A Biologique Recherche menu rewards method. On day one, learn how the spa performs its Skin Instant assessment, because every treatment begins there, and then map the facials, the body treatments and the enhancements: durations, protocols, products used and who each suits. Ask the senior therapist rather than guessing; this is a house where improvisation is visible immediately.

Treatments follow the brand's three-stage methodology: an initialisation stage of assessment and preparation, built around cleansing and the correct P50; a treatment stage where concentrated products target the Skin Instant; and a finishing stage that seals and protects the work. Delivery is precise, unhurried and hands-led, with famously sculpting manual techniques, and many spas add the house's celebrated tools: the Remodeling Face machine, which uses gentle currents to tone and sculpt, and cryo-sticks, chilled tools used in lifting massage. Use tools only where trained.

Retail here is prescription. The assessment gives you the diagnosis; prescribe two or three products matched to today's Skin Instant, with P50 as the natural gateway product, and record what you prescribed.

Upsell paths are honest and clinical: a course of treatments to change a Skin Instant over time, machine and cryotherapy enhancements for the guest chasing visible lift, and the step from a single facial to a programme. Protect the standard on every shift: correct products, correct quantities, full protocols, stock reported, and never a shortcut under time pressure.`,
    },
  ],
  quiz: [
    {
      q: 'Biologique Recherche was founded...',
      options: [
        'In New York by a dermatologist in the 1990s',
        'In Paris in the late 1970s by Yvan Allouche, a biologist, and Josette Allouche, a physiotherapist',
        'In Milan by a fashion house',
        'In London as a hotel spa brand',
      ],
    },
    {
      q: `The house's concept of the Skin Instant means...`,
      options: [
        'A quick express facial under thirty minutes',
        'A photograph taken before treatment',
        'The four classic skin types: dry, oily, combination and normal',
        `The skin's condition at a given moment, which changes constantly and is assessed and treated instead of a fixed skin type`,
      ],
    },
    {
      q: `The brand's cult hero product, often described as a facial in a bottle, is...`,
      options: [
        'Lotion P50, an exfoliating, balancing lotion applied after cleansing',
        'A retinol night cream',
        'A vitamin C powder',
        'A rose-scented facial mist',
      ],
    },
    {
      q: `Biologique Recherche's formulation approach is best described as...`,
      options: [
        'Lightly fragranced and mass-market',
        'Organic-certified and food-grade only',
        'Highly concentrated actives, no added fragrance, and cold processing wherever possible',
        'Technology-first with minimal actives',
      ],
    },
    {
      q: `The three stages of the house's treatment methodology are...`,
      options: [
        'Consultation, massage, retail',
        'Initialisation (assessment and preparation), treatment, and finishing',
        'Steam, extraction, mask',
        'Cleanse, tone, moisturise',
      ],
    },
    {
      q: 'The Remodeling Face is...',
      options: [
        'A surgical procedure offered in the Paris flagship',
        'A firming night cream',
        'A machine that uses gentle currents to tone and sculpt the face',
        'A jade roller sold at reception',
      ],
    },
    {
      q: 'The strongest way to retail the Biologique Recherche range is...',
      options: [
        'Prescribe two or three products matched to the Skin Instant found in assessment, with P50 as the natural gateway',
        'Recommend the same bestsellers to every guest',
        'Present the full range at the till',
        'Leave recommendations to the website',
      ],
    },
    {
      q: 'On day one in a Biologique Recherche spa, your first professional duty is...',
      options: [
        'Rearrange the retail display',
        'Improvise treatments from your general facial training',
        'Memorise every ingredient list before touching a guest',
        'Learn the Skin Instant assessment, the menu and the protocols, starting with the flagship treatments, and ask rather than guess',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the bottles looked so plain and the therapist smiled and told me the story - a family of scientists in Paris who refused fragrance and marketing and put everything into the formulas. I have never trusted a brand faster."`,
      helpsYou: `Spas that carry Biologique Recherche are among the most selective employers in the industry. Being able to tell the founding story, explain the Skin Instant idea and state the USP in one sentence marks you out immediately in an interview or on a trial shift.`,
      tips: [
        'Learn the one-breath USP: personalised clinical skincare built on Skin Instant assessment, with raw, concentrated, fragrance-free formulas',
        `Remember the family story: a biologist, a physiotherapist and later their physician son`,
        `Match the house voice - clinical, precise and personal, never perfumed or vague`,
      ],
    },
    {
      guestView: `"She explained why my P50 was a different one from my sister's - because our skin is different this month, not just different in general. Then the oxygen mask. I left with both and I understood exactly why."`,
      helpsYou: `P50 fluency is the fastest credibility you can earn in this house. Knowing the P50 family, the Masque VIP O2 and the logic of the targeted serums means you can walk onto a Biologique Recherche shift and sound like you belong within an hour.`,
      tips: [
        'Heroes first: the Lotion P50 family, Masque VIP O2, then the targeted serums',
        'Explain P50 simply: exfoliates, rebalances, prepares the skin for everything that follows',
        'The consultation, not habit, chooses which P50 version a guest receives',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The facial felt like a clinical consultation and a work of art at once - my skin assessed, every product explained, the sculpting massage, the cool metal sticks at the end. My jawline looked different when I sat up."`,
      helpsYou: `Therapists who can deliver the assessment-led methodology, the sculpting hands-on style and an honest clinical prescription are the ones elite spas fight to keep - and this house's spas talk to each other about who is good.`,
      tips: [
        'Day one: learn the Skin Instant assessment and the flagship protocols before anything else',
        'Respect the three stages: initialisation, treatment, finishing - never trim the preparation',
        `Prescribe two or three products matched to today's assessment, with P50 as the gateway`,
        'Use the Remodeling Face and cryo-sticks only where trained, and follow protocols exactly',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'biologique-recherche-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Biologique Recherche, the Parisian clinical house whose methodology and formulations command a devoted following among the world's most discerning facialists and guests. It covers the founding story and the Skin Instant philosophy that shape every treatment, the hero products and formulation principles a therapist must know cold, and the practical craft of the shift: reading the treatment menu, delivering the assessment-led, three-stage signature style, retailing the range as clinical prescription, building honest upsell paths into courses and enhancements, and upholding the exacting standards that protect the brand's name. Where house-specific details vary by spa or evolve over time, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by Biologique Recherche.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas and medi-spas that carry Biologique Recherche across UK luxury hotels, destination spas and premium city clinics. It suits therapists interviewing for an account with the house who want to arrive fluent, agency and freelance therapists who may be asked to work alongside the range at short notice, experienced facialists moving from a mainstream house to a clinical one, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in these spas will also gain a working command of the range, its language and its prescription-led selling style.`,
  outcomes: [
    `Tell the Biologique Recherche founding story and articulate its philosophy and USP in confident, guest-ready language`,
    `Explain the Skin Instant concept and why the house assesses and treats the skin's condition today rather than a fixed skin type`,
    'Name the hero products, led by the Lotion P50 family, and explain their roles and formulation principles accurately and honestly',
    `Describe the three-stage methodology of initialisation, treatment and finishing and deliver an assessment-led facial in the house style`,
    `Retail the range as a clinical prescription, build integrity-led upgrade paths and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount the founding story of Biologique Recherche and explain why its family and clinical roots set it apart`,
        `Explain the Skin Instant philosophy and the formulation principles of concentration, no added fragrance and cold processing`,
        `Articulate the house USP to a guest in one confident, accurate sentence, using the brand's clinical tone of voice`,
      ],
      sections: [
        {
          heading: 'A family of scientists in Paris',
          body: `Biologique Recherche was founded in Paris in the late 1970s by a husband and wife team: Yvan Allouche, a biologist, and Josette Allouche, a physiotherapist. From that pairing of laboratory science and hands-on bodywork comes the house's whole character, formulas built like clinical preparations and treatments built around skilled, purposeful touch. Their son, Dr Philippe Allouche, a physician, later joined the company and has long led its creative and scientific direction, and the house remains family-run to this day. That continuity matters in an industry where most prestige brands have passed through several corporate owners: the philosophy has never been diluted by a marketing department. The company began by formulating for skincare professionals who were dissatisfied with what was commercially available, and it has never lost that professional-first orientation. Its treatments and products reached guests through the treatment rooms of demanding facialists before they were ever retail propositions, which is the right way round, and a story worth telling any guest who asks.`,
        },
        {
          heading: 'The Skin Instant: condition, not type',
          body: `The intellectual signature of the house is the Skin Instant. Where most brands sort guests into fixed skin types, dry, oily, combination, normal, Biologique Recherche insists that skin is a living organ in constant change. Stress, sleep, hormones, season, climate, travel and lifestyle all alter its condition, so the skin in front of you today is not the skin that sat in the same chair last month. The Skin Instant is precisely that: the skin's condition at this moment, and it, rather than a permanent label, is what the professional assesses and treats. The practical consequences run through everything. Consultation becomes genuine assessment rather than a box-ticking exercise. Product selection is made fresh at every visit, which is why the same guest may receive different products in different seasons. And retail becomes re-prescription over time rather than a one-off sale. For a therapist, the Skin Instant is also a gift of language: it lets you explain, honestly and simply, why personalisation is not a luxury flourish here but the entire method.`,
        },
        {
          heading: 'Formulation as philosophy',
          body: `The products themselves preach the doctrine. Biologique Recherche formulations are famously concentrated in active ingredients, to degrees unusual even in professional skincare, and they contain no added fragrance: the house takes the view that perfume serves marketing, not skin, and can irritate the very conditions a treatment is trying to calm. Wherever possible the formulations are processed cold, because heat can degrade delicate biological actives, and preserving their integrity matters more than manufacturing convenience. Some products, as a result, have textures and natural scents that are frankly unusual, and the therapist should present this proudly rather than apologetically: the strangeness is the proof of the principle. Even the packaging carries the message. The bottles are austere, almost pharmaceutical, closer to a laboratory dispensary than a perfumery counter. When a guest remarks on the plain labels or an unexpected smell, that is not an awkward moment, it is the perfect opening: everything in this house is spent on what the formula does, and nothing on how it flatters the shelf.`,
        },
        {
          heading: 'The Ambassade, the distribution and the USP',
          body: `The brand's flagship is its Ambassade de la Beaute in Paris, on the Champs-Elysees, a destination address where devotees travel for assessment-led treatments, and the word Ambassade, embassy, tells you how the house sees its best locations: not shops but outposts of a methodology. Distribution is deliberately selective. You will find Biologique Recherche in elite spas, medi-spas and five-star hotels rather than department stores, and that scarcity is part of the promise: the products are intended to be prescribed by trained professionals, not picked off a shelf. All of this condenses into a USP every therapist on the account should be able to state in one breath: personalised clinical skincare, built on Skin Instant assessment and a rigorous methodology, with raw, concentrated, fragrance-free formulations trusted by the world's most demanding facialists. Deliver that sentence in the house voice, precise, calm and clinical, and you have answered the guest's real question, which is always some version of: why this brand, and why does it need you?`,
        },
      ],
      keyTerms: [
        { term: 'Skin Instant', definition: `The house's core concept: the skin's condition at a given moment, shaped by stress, climate, hormones and lifestyle, which is assessed and treated in place of a fixed skin type.` },
        { term: 'Cold processing', definition: `Formulating without heat wherever possible so that delicate biological and botanical actives arrive in the jar intact; a signature Biologique Recherche principle.` },
        { term: 'Ambassade de la Beaute', definition: `The brand's flagship in Paris on the Champs-Elysees, the model for its assessment-led treatment destinations worldwide.` },
        { term: 'Selective distribution', definition: `The deliberate strategy of placing a professional brand only in elite spas, medi-spas and hotels so that products are prescribed by trained hands rather than self-selected.` },
      ],
      caseStudy: {
        title: 'The connoisseur at The Hartley, Mayfair',
        scenario: `Elena is a facialist at The Hartley, a five-star hotel spa in Mayfair carrying Biologique Recherche. Her guest, Mr Okafor, is a well-travelled skincare connoisseur who opens the consultation with a challenge: he has been assessed at the Paris Ambassade, he says, and he wants to know whether a London hotel spa can really deliver the same method or whether he is buying the name on the door. Elena knows the treatment room behind her is excellent, but she also knows that a defensive answer, or a vague one, will lose this guest in the first two minutes.`,
        insight: `Elena answers with the method itself. She explains that the house's whole point is the Skin Instant: his skin today, in London, after a flight, is not his skin in Paris, so the assessment she is about to perform is not an imitation of the Ambassade but the same discipline applied to a new moment. She then conducts the assessment with visible rigour and selects products aloud, reasoning as she goes. The professional lesson: with a clinical house, the most persuasive answer to scepticism is never reassurance, it is the methodology performed well in front of the guest.`,
      },
      summary: `Biologique Recherche is a family-run Parisian house founded in the late 1970s by biologist Yvan Allouche and physiotherapist Josette Allouche, later shaped by their physician son Dr Philippe Allouche. Its philosophy is the Skin Instant: skin is a changing organ, assessed and treated as it is today rather than typed for life. Its formulations are concentrated, fragrance-free and cold-processed wherever possible, its bottles austere, its distribution selective, its flagship the Ambassade de la Beaute in Paris. Its USP: personalised clinical skincare, rigorously assessed, trusted by the world's most demanding facialists.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Present Lotion P50 accurately: what it does, why it is iconic, and why the consultation chooses the version`,
        `Name the other hero products and explain the house's formulation principles in guest-ready language`,
        'Apply a reliable, honest method for learning the range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'Lotion P50: the icon',
          body: `Every house has heroes; very few have a cult. Lotion P50, first created in 1970 and refined in the decades since, is arguably the most talked-about single product in professional skincare. It is an exfoliating, balancing lotion applied after cleansing: it gently exfoliates, helps rebalance the skin's pH and acid mantle, and prepares the skin to receive the treatment products that follow, which is why devotees describe it as a facial in a bottle. The name is widely explained by the brand as a reference to the roughly fifty-day epidermal renewal period across which the lotion does its work. Guests who know the brand will ask for P50 by name, and many will have strong opinions about it, including affection for its famously assertive natural scent. A therapist must be able to present it in one fluent, honest sentence: what it is, what it does, and why it earned its reputation. If you learn one product to complete mastery before a Biologique Recherche shift, it is this one.`,
        },
        {
          heading: 'One name, many Skin Instants',
          body: `P50 is not a single product but a family, with versions formulated for different Skin Instants, from more resilient skin to more delicate and reactive conditions, and this is where the house philosophy becomes daily practice. Which version a guest receives is decided by assessment at each visit, not by habit, not by what they bought last time, and not by what their friend uses. The same discipline governs the wider range: cleansers, masks, serums and creams are selected fresh against the condition in front of you. For the therapist this is a genuine professional elevation. You are not matching products to a static label on a record card; you are re-reading skin every time and adjusting the prescription, exactly as the methodology intends. It also transforms the conversation with knowledgeable guests: when someone asks why you have chosen a different version from the one they expected, the answer is the brand's own logic, your skin is different today, and that answer, delivered calmly, deepens rather than dents their confidence.`,
        },
        {
          heading: 'The wider heroes and the formulation story',
          body: `Beyond the P50 family, learn the products guests ask for by name. The Masque VIP O2 is the house's celebrated oxygenating mask, a favourite before events for the fresh, awakened look guests describe. The range of concentrated targeted serums lets a facial be composed precisely for the Skin Instant, layering specific actives where they are needed, and the creams that finish a treatment are chosen with the same specificity. The formulation story underneath is consistent and easy to narrate: high concentrations of biological, botanical and marine actives; no added fragrance, ever; and cold processing wherever possible so the actives arrive intact. Narrate it clinically and briefly while the guest experiences the product: what it contains, what it is doing, and why it was chosen for them today. Resist the temptation to promise percentages or mechanisms you have not verified from the house's own materials. In a brand built on scientific credibility, one invented detail in front of a knowledgeable guest costs more than a hundred modest, true sentences earn.`,
        },
        {
          heading: 'Learning the range without bluffing',
          body: `No course can hand you every product on a particular spa's shelf, because the range is deep, menus differ and formulations evolve, so the lasting skill is the method for learning a clinical house fast and honestly. First, heroes before everything: P50 to mastery, then the Masque VIP O2 and the serums your spa uses most, because these answer the majority of guest questions. Second, one category at a time, learning each category's logic, what the cleansers share, how the serums divide by purpose, rather than memorising isolated items. Third, treat the house's own training materials and your spa's protocols as the only safe source for claims; this brand's guests include people who read ingredient lists for pleasure. Fourth, experience the key products on your own skin, because a therapist who has felt P50 can speak about it with a conviction no script provides. Fifth, keep the honest gap: when asked something you do not know, say what you do know, offer to check, and check. In a clinical house, visible honesty is itself a professional credential.`,
        },
      ],
      keyTerms: [
        { term: 'Lotion P50', definition: `The house's cult exfoliating and balancing lotion, applied after cleansing to exfoliate, rebalance and prepare the skin; produced in a family of versions matched to different Skin Instants.` },
        { term: 'Masque VIP O2', definition: `The brand's celebrated oxygenating mask, loved for the fresh, awakened look it gives and often requested by name before events.` },
        { term: 'Targeted serums', definition: `Concentrated serums selected and layered to address the specific Skin Instant found at assessment, letting each facial be composed rather than standardised.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The P50 devotee at Fernleigh Manor, the Cotswolds',
        scenario: `Priya has recently joined Fernleigh Manor, a country house spa in the Cotswolds, and is early in her Biologique Recherche training. Her guest, Ms Laurent, is a devoted P50 user who travels with her bottle and opens the facial by announcing exactly which version she uses and asking, a little sharply, why the therapist has set out a different one after the skin assessment. Priya can feel the pull of the easy exit: swap the bottles, agree with the guest, and avoid the conversation entirely, even though her assessment genuinely pointed the other way.`,
        insight: `Priya holds her ground with the brand's own logic. She explains the Skin Instant: Ms Laurent's skin, after a dry winter and a stressful month, is presenting differently from the condition her usual version suits, and the assessment, not the habit, chooses the product. She shows her findings as she explains, then invites the guest to feel the difference after the treatment. Ms Laurent leaves intrigued rather than affronted, and rebooks. The lesson: in this house, respectfully re-prescribing against a guest's habit, with the assessment as your evidence, is not a risk to the relationship, it is the brand working as designed.`,
      },
      summary: `Product mastery in this house begins with Lotion P50, the cult exfoliating and balancing lotion created in 1970, named for the roughly fifty-day epidermal renewal cycle it works across, and produced in versions matched to different Skin Instants chosen by assessment, never habit. Around it sit the Masque VIP O2 and the concentrated targeted serums that let facials be composed rather than standardised. The formulation story is constant: concentrated biological, botanical and marine actives, no added fragrance, cold processing wherever possible. Learn heroes first, category by category, from the house's own materials, and keep the honest gap instead of inventing.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate a Biologique Recherche treatment menu on day one and deliver the assessment-led, three-stage methodology`,
        'Retail the range as a clinical prescription linked to the Skin Instant found in assessment',
        `Build integrity-led upsell paths into courses and enhancements while protecting the brand's standards on shift`,
      ],
      sections: [
        {
          heading: 'Reading the menu: assessment first, always',
          body: `Every Biologique Recherche spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the assessment, because in this house every treatment begins there: learn how your spa evaluates the Skin Instant, whether through structured consultation and close examination or, in some locations, with dedicated diagnostic instruments, and learn how the findings translate into product selection. Then map the menu in layers: the facials and what distinguishes each tier, the body treatments, and the enhancements that can extend or deepen a booking. For each treatment note four things: duration, protocol source, products used, and who it suits. Read the spa's protocols in full, shadow a senior therapist where you can, and ask before your first guest rather than improvising in front of one. This is a house whose regulars often know the method intimately; a therapist who skips the assessment or garbles the sequence will be noticed by the guest before any manager. Arriving fluent in the menu's logic is the fastest respect you can earn.`,
        },
        {
          heading: 'Delivering the signature style: three stages, sculpting hands',
          body: `Biologique Recherche treatments follow a three-stage methodology, and honouring it is what makes the treatment recognisably the brand's. The initialisation stage assesses and prepares: cleansing and the correct P50 for the Skin Instant, readying the skin so everything afterwards works harder. The treatment stage does the targeted work, with concentrated serums, masks and techniques chosen against the assessment. The finishing stage seals and protects, completing the work with the appropriate creams and finishing products. Never trim the initialisation under time pressure; in this methodology the preparation is not a preamble, it is the foundation the whole result stands on. The delivery style is precise, unhurried and hands-led, with the sculpting, lifting manual techniques the house's facialists are famous for, and many spas extend the work with the brand's celebrated tools: the Remodeling Face machine, which uses gentle currents to tone and sculpt, and cryo-sticks, chilled tools used in lifting massage that guests remember for the cool, tightening sensation. Use tools only where you are trained, and follow the protocol exactly; precision is the brand.`,
        },
        {
          heading: 'Retail as prescription',
          body: `Retail in a Biologique Recherche spa is the clinical logic continued at home, and the assessment has already done the selling. You examined the skin, reasoned aloud, and chose products against the Skin Instant; the home prescription simply extends that reasoning past the spa door. Prescribe two or three products, each linked explicitly to what you found today: the P50 version the assessment selected, because it is the natural gateway into the method and the product most likely to bring the guest back; the serum that addressed the condition you treated; the cream that finishes the routine. Explain the order of use in ten seconds and be honest about timelines, because a house built on skin cycles should never promise overnight transformation. Tell the guest what not to buy yet, which in a range this deep builds enormous trust. Then write the prescription down and record it on the guest's history, because the next assessment should begin from this one, and re-prescription over time, as the Skin Instant changes, is precisely how this brand builds its famously loyal following.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths in this house are naturally clinical, which makes them easy to offer honestly. The single facial becomes a course of treatments, because changing a Skin Instant takes time and repetition, and saying so is truth, not tactics. The guest chasing visible lift is a genuine candidate for the Remodeling Face or cryotherapy enhancements, offered once, warmly, with the outcome leading. The engaged first-timer becomes a programme guest, reassessed at each visit. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill. Alongside selling the brand, you protect it. That means correct products in correct quantities, protocols followed rather than privately adapted, contraindications and patch requirements respected without exception, testers and retail kept immaculate, low stock reported before it forces substitutions, and never a quietly shortened treatment to rescue a late-running column; flag the schedule instead. A clinical brand's reputation is a chain of precise deliveries, and on shift you are the link the guest actually meets. Hold the standard as if the founders were watching, because the guest effectively is.`,
        },
      ],
      keyTerms: [
        { term: 'Three-stage methodology', definition: `The house's treatment architecture: initialisation (assessment and preparation, including cleansing and the correct P50), treatment (targeted concentrated work), and finishing (sealing and protecting the result).` },
        { term: 'Remodeling Face', definition: `The brand's machine treatment using gentle currents to tone and sculpt the face; a signature enhancement delivered only by trained therapists.` },
        { term: 'Cryo-sticks', definition: `Chilled tools used in lifting facial massage, remembered by guests for the cool, tightening sensation; part of the house's toolkit alongside its manual techniques.` },
        { term: 'Course of treatments', definition: `A planned series of visits, reassessed each time, through which a Skin Instant is changed over weeks rather than in a single appointment; the honest backbone of upselling in a clinical house.` },
      ],
      caseStudy: {
        title: 'The trial shift at One Royal Terrace, Edinburgh',
        scenario: `Marta, an experienced facialist, arrives for a trial shift at One Royal Terrace, a luxury town house spa in Edinburgh carrying Biologique Recherche. She has an hour before her first guest and knows the house only from this course. She asks the spa director for the protocols, learns the assessment procedure and the flagship facial first, and confirms the products for her bookings. Her guest, Mrs Whitfield, is a regular who loves her facials but admits she has never bought products because the range feels bewildering, and mentions in passing that her jawline bothers her in photographs.`,
        insight: `Marta's preparation converts both openings honestly. At the close she prescribes just two products from her assessment, the P50 version she used and one serum, written down with the order of use, telling Mrs Whitfield to ignore the rest of the shelf for now, which visibly relaxes her. On the jawline she opens an upgrade path rather than a hard sell: the Remodeling Face enhancement with a trained colleague, noted on the record for next visit. One trial shift, one modest prescription, one clinical upsell path, and a spa director who has just watched an agency therapist deliver the house's method faithfully.`,
      },
      summary: `A Biologique Recherche shift is mastered in four moves. Read the menu assessment-first, learning how your spa evaluates the Skin Instant and how findings drive every protocol. Deliver the three-stage methodology faithfully, initialisation, treatment and finishing, with sculpting hands and, where trained, the Remodeling Face and cryo-sticks. Retail as prescription: two or three products matched to today's assessment, P50 as the gateway, recorded for next time. And upsell clinically, courses and enhancements that genuinely change outcomes, while protecting the standards, because in a clinical house precision is the brand and the therapist is its final link.`,
    },
  ],
}
