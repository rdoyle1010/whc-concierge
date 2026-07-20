// WHC Academy brand masterclass: IMAGE Skincare. Independent WHC training -
// not affiliated with or endorsed by IMAGE Skincare. Answer key lives in
// academy-more-answers/image-skincare-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'image-skincare-masterclass',
  title: 'IMAGE Skincare Masterclass',
  tagline: `The American house of results - its story, its ranges, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `IMAGE Skincare is one of the best-known American professional skincare houses in the modern spa and clinic world. It was founded in the United States in 2003 by Janna Ronert, a working aesthetician who built the company from modest beginnings, turning her treatment-room experience into a range designed for professionals like herself. The brand's clinical credibility deepened through the involvement of Dr Marc Ronert, a board-certified plastic surgeon, giving the house a distinctive pairing of aesthetician instinct and medical oversight.

The philosophy is results-driven clinical skincare: formulations built around proven active ingredients, designed to create visible change in the skin rather than simply a pleasant experience. The brand's famous slogan captures its positive, prevention-first outlook in two words: Age later. The message is not fear of ageing but confidence in healthy skin at every age.

Crucially, IMAGE is a professional-only house. Its products and treatments are sold and delivered through trained, licensed skincare professionals in spas, salons and clinics rather than through supermarkets or general high-street retail. That channel is the USP a therapist must be able to state in one breath: professional-grade, results-driven clinical skincare, created by an aesthetician, developed with medical expertise, and delivered through trained professionals. When you work an IMAGE account, you are not just near the brand's point of difference. You are the point of difference.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `IMAGE organises its skincare into named range families, each built around a skin story, and learning that map is the fastest route to fluency. Vital C is the house's much-loved hydration and radiance family, built around vitamin C, and its hydrating serum is one of the products guests most often know by name. Clear Cell is the family for oily and blemish-prone skin, led by salicylic acid. Ormedic balances organic botanical ingredients with clinical effectiveness, making it the natural home for sensitive and unbalanced skin. Ageless works on visible ageing with alpha hydroxy acids such as glycolic acid. The MAX line represents the house's advanced tier, associated with peptide technology, while Iluma addresses dullness and uneven tone, and Prevention+ provides the daily moisturisers with broad-spectrum SPF that finish every IMAGE routine.

The ingredient story follows the philosophy: recognised, results-driven actives, vitamin C, salicylic acid, AHAs, peptides and daily SPF, formulated to professional strength. Narrate them simply during treatment: what it contains, what it does, how the skin will respond.

Where you are unsure of a specific formulation, never invent it. Learn the range the professional way: hero products first, then one family at a time, using the testers, reading the brand's own training materials, and using the key products on your own skin until your conviction is real.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `An IMAGE menu is read in layers. The house is famous for its professional treatments: results-driven facials and, above all, its family of professional chemical peels, alongside signature experiences such as the O2 Lift oxygen-infused facial. Many spas offer an accessible entry-level vitamin C based treatment, with progressively stronger peels above it. On day one, map the menu: which treatments are facials, which are peels, their durations, the protocols and products each uses, and the contraindications and preparation each requires. Ask the senior therapist rather than guessing.

Delivery is where IMAGE differs from a purely sensorial house. The style is clinical results delivered with luxury hands: a thorough skin analysis, honest consultation about goals and timelines, precise application of actives, and calm, attentive comfort throughout. Never perform an IMAGE peel without completing the brand's professional training for it and following the protocol exactly, including any required patch test and home preparation.

Retail is the result continued at home. Prescribe two or three products linked to your analysis, and almost always include daily SPF, because protecting results is part of the result. Upsell paths are natural: the facial guest with real concerns progresses to a peel, the single peel becomes a course, and home care supports both. Protect the brand on shift: correct products, correct strengths, correct timings, stock reported, protocols honoured.`,
    },
  ],
  quiz: [
    {
      q: 'IMAGE Skincare was founded by...',
      options: [
        'A Swiss pharmaceutical laboratory in the 1980s',
        'Janna Ronert, a working aesthetician, in the United States in 2003',
        'A French fragrance house',
        'A chain of British department stores',
      ],
    },
    {
      q: `The brand's famous two-word slogan is...`,
      options: [
        'Skin first',
        'Forever young',
        'Results now',
        'Age later',
      ],
    },
    {
      q: 'The Vital C range is built around...',
      options: [
        'Vitamin C, for hydration and radiance',
        'Charcoal, for deep cleansing',
        'Retinol only',
        'Marine collagen',
      ],
    },
    {
      q: 'Clear Cell is the IMAGE family designed for...',
      options: [
        'Mature, dry skin',
        'Scalp and hair care',
        'Oily and blemish-prone skin, led by salicylic acid',
        'Sun protection only',
      ],
    },
    {
      q: 'The Ormedic range is best described as...',
      options: [
        'A professional-only chemical peel',
        'Organic botanical ingredients balanced with clinical effectiveness, suited to sensitive and unbalanced skin',
        'A make-up line',
        'A fragrance collection',
      ],
    },
    {
      q: 'IMAGE Skincare is distributed...',
      options: [
        'Through trained, licensed skincare professionals in spas, salons and clinics',
        'Through supermarkets',
        'Through vending machines in gyms',
        'Only online, direct to consumers, with no professional channel',
      ],
    },
    {
      q: `IMAGE's best-known professional treatments include...`,
      options: [
        'Hot stone massage rituals',
        'Hydrotherapy pool circuits',
        'Its family of professional chemical peels and signature facials such as the O2 Lift',
        'Manicures and pedicures',
      ],
    },
    {
      q: 'Before delivering an IMAGE professional peel, a therapist must...',
      options: [
        'Simply read the label on the day',
        'Ask the guest which strength they fancy',
        'Improvise from general facial training',
        `Complete the brand's professional training for that treatment and follow the protocol exactly, including any required patch test`,
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the clinic used IMAGE and the therapist told me: founded by an aesthetician, developed with a surgeon, and only sold through professionals like her. That one sentence made me trust the whole treatment."`,
      helpsYou: `Spas and clinics on an IMAGE account want therapists who can carry the clinical story with confidence. Telling the founding story and stating the professional-only USP in one breath is what makes interviewers, managers and sceptical guests relax.`,
      tips: [
        'Learn the one-breath USP: professional-grade, results-driven, aesthetician-created, medically developed, professionally delivered',
        `Remember the slogan and its spirit: Age later is confidence, not fear`,
        `You are the channel - a professional-only brand is only ever as good as its therapist`,
      ],
    },
    {
      guestView: `"She looked at my skin, named the range that matched it, and explained the vitamin C serum in one plain sentence while I could feel it working. I went home with the serum and the SPF, and it never felt like selling."`,
      helpsYou: `Range-map fluency is the fastest credibility you can build on an IMAGE shift. Knowing which family answers which skin story, and which hero actives drive each, lets you prescribe with the certainty guests pay professionals for.`,
      tips: [
        'Learn the map: Vital C, Clear Cell, Ormedic, Ageless, the MAX, Iluma, Prevention+',
        'Pair each family with its skin story, not just its name',
        'Narrate actives simply: what it contains, what it does, how the skin responds',
        'Never invent a formulation detail - say what you know and check the rest',
      ],
    },
    {
      guestView: `"I wanted the strongest peel on the menu. She explained why we would build up to it, booked me a course, and my skin has never looked better. I would not let anyone else near my face now."`,
      helpsYou: `Therapists who can read a results-driven menu, deliver peels strictly to protocol and convert single treatments into courses are the ones clinics trust, insure and promote - and the ones whose columns fill with returning guests.`,
      tips: [
        `Day one: map facials versus peels, with durations, products and contraindications`,
        'Never deliver a peel without the brand training and the exact protocol, patch test included',
        'Prescribe two or three products and almost always include daily SPF',
        'Upsell along natural paths: facial to peel, single peel to course',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'image-skincare-masterclass',
  aims: `This masterclass gives working spa and clinic therapists genuine professional depth in IMAGE Skincare, the American professional house known for results-driven clinical skincare. It covers the founding story, philosophy and professional-only USP that shape how the brand is sold and delivered, the range families and hero actives a therapist must know cold, and the practical craft of the IMAGE shift: reading a results-led treatment menu, delivering facials and peels safely and to protocol, retailing the ranges by linking products to skin analysis, building honest upsell paths from facials to peel courses, and upholding the standards that protect the brand's name. Where house-specific details vary by venue or evolve over time, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by IMAGE Skincare.`,
  audience: `Spa, salon and clinic therapists working in, or preparing to work in, venues that carry IMAGE Skincare, from luxury hotel spas to aesthetic clinics and premium day spas. It suits therapists interviewing for an IMAGE account who want to arrive fluent, agency and freelance therapists who may meet the brand at short notice, experienced therapists moving to IMAGE from a sensorial house who need to master a more clinical voice, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in IMAGE venues will also gain a working command of the ranges and their language.`,
  outcomes: [
    `Tell IMAGE Skincare's founding story and articulate its philosophy and professional-only USP in confident, guest-ready language`,
    'Map the range families to the skin stories they serve and explain their hero actives accurately and honestly',
    `Read a results-driven treatment menu on day one, distinguishing facials from professional peels and their requirements`,
    'Retail the ranges by linking a two or three product home prescription, including daily SPF, to your skin analysis',
    `Build integrity-led upgrade paths from facials to peels and courses while upholding the brand's safety and protocol standards`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount IMAGE Skincare's founding story and explain why its aesthetician origins matter to guests and employers`,
        `Explain the house philosophy of results-driven clinical skincare and the positive meaning of the slogan Age later`,
        `Articulate the professional-only USP in one confident sentence and explain what it demands of the therapist`,
      ],
      sections: [
        {
          heading: `An aesthetician's company`,
          body: `IMAGE Skincare was founded in the United States in 2003 by Janna Ronert, and the single most important fact about the brand is what she was: a working aesthetician. The company began from modest beginnings and grew into one of the most widely recognised professional skincare houses in the world, but its DNA never changed. This is a range conceived by someone who spent her days with real skin under her hands, frustrated by the gap between gentle spa products that did little and harsh clinical products that ignored the experience of the guest. For a therapist, that origin is not trivia; it is the answer to the guest who asks what makes the brand different. IMAGE was built by a professional, for professionals, to produce visible results in a treatment room. When you present the brand, you are presenting a house that started exactly where you are standing: beside the couch, looking at skin, wanting it to change for the better.`,
        },
        {
          heading: 'Clinical credibility: where the treatment room meets medicine',
          body: `The second strand of the IMAGE story is medical. The brand's development is closely associated with Dr Marc Ronert, a board-certified plastic surgeon, and that pairing, aesthetician instinct plus surgical oversight, defines the house's position in the market. IMAGE sits in the territory often called cosmeceutical: skincare formulated around recognised active ingredients at professional strengths, designed to produce measurable change rather than momentary pleasure. This matters for how you speak. An IMAGE consultation is honest and diagnostic: what the skin shows, what the actives will do, what timeline is realistic. It also matters for how you behave. A results-driven house carries responsibilities a purely sensorial house does not, because stronger actives demand correct selection, correct use and correct aftercare. The medical association is a promise of seriousness, and the therapist honours that promise by being serious too: trained, precise, and honest about what a product can and cannot do. Confidence built on accuracy is the house style.`,
        },
        {
          heading: 'Age later: the philosophy in two words',
          body: `IMAGE's famous slogan is two words long: Age later. Notice what it does not say. It does not promise to stop ageing, reverse time or shame anyone for having skin that shows a life. It promises postponement through skin health, and that framing gives the therapist an unusually graceful script. The philosophy underneath is prevention plus correction: protect the skin daily, most visibly through the house's emphasis on broad-spectrum SPF in its Prevention+ moisturisers, and correct existing concerns with targeted actives and professional treatments. Healthy skin at every age is the goal, and every consultation can be framed that way: not fixing what is wrong with a guest, but investing in how their skin behaves for the next decade. Guests hear the difference immediately. Fear-based selling produces one anxious purchase; health-based framing produces a long relationship. When you speak for IMAGE, speak like the slogan: positive, confident, forward-looking, and centred on skin health rather than on age itself.`,
        },
        {
          heading: 'The professional-only USP, and what it asks of you',
          body: `The USP every therapist on an IMAGE account must be able to state in one breath is this: professional-grade, results-driven clinical skincare, created by an aesthetician, developed with medical expertise, and sold and delivered through trained skincare professionals. The last clause is the commercial heart of the house. IMAGE is a professional-only brand: guests meet it in spas, salons and clinics, through people qualified to analyse skin and match products to it, not on a supermarket shelf. That channel is a gift to the therapist, because it means the brand's point of difference is literally you: your analysis, your training, your honest prescription are part of what the guest is buying. It is also a duty. A professional-only brand delivered casually, without analysis, without training, without accurate advice, has had its USP removed in front of the guest. Own the channel: consult properly, prescribe from findings, and let the guest feel that this product could only have reached them through hands like yours.`,
        },
      ],
      keyTerms: [
        { term: 'Cosmeceutical', definition: `Skincare positioned between cosmetics and clinical treatment, formulated around recognised active ingredients at professional strengths and aimed at measurable results.` },
        { term: 'Professional-only distribution', definition: `A channel in which products are sold and delivered through trained, licensed skincare professionals in spas, salons and clinics rather than through general retail.` },
        { term: 'Results-driven skincare', definition: `A house philosophy that judges every product and treatment by visible change in the skin, demanding honest analysis, correct use of actives and realistic timelines.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The sceptical guest at Fellbridge House, Harrogate',
        scenario: `Priya is a therapist at Fellbridge House, a luxury spa hotel in Harrogate whose skin clinic runs an IMAGE menu. Her guest, Mrs Calloway, arrives for a facial having read about the brand online and opens with a challenge: her department store sells serums with the same headline ingredients, beautifully packaged, so why should she pay a professional venue for IMAGE? Priya feels the pull to argue ingredient lists with a well-read guest. Instead she puts down the consultation card, meets the question directly, and reaches for the founding story and the channel rather than a chemistry contest.`,
        insight: `Priya answers with the USP: IMAGE was created by a working aesthetician in 2003, developed with a board-certified plastic surgeon, and is deliberately sold only through trained professionals, so what Mrs Calloway is buying is not just a formula but an analysis, a matched prescription and a professional watching her skin change over time. Then she demonstrates it, analysing before recommending. The lesson: with a professional-only brand, never argue the bottle. Argue the professional, because the professional is the USP, and you can prove that in the chair.`,
      },
      summary: `IMAGE Skincare is an American house founded in 2003 by aesthetician Janna Ronert, with clinical depth associated with plastic surgeon Dr Marc Ronert, giving it a rare pairing of treatment-room instinct and medical oversight. Its philosophy is results-driven clinical skincare with a positive, prevention-first spirit captured in the slogan Age later. Its USP is the professional-only channel: created by an aesthetician, developed with medical expertise, delivered through trained professionals. On an IMAGE account the therapist is the point of difference, and must consult, prescribe and behave accordingly.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Map IMAGE's range families to the skin stories they serve, from Vital C to Prevention+`,
        `Explain the hero actives behind each family, including vitamin C, salicylic acid, AHAs and peptides, in guest-ready language`,
        'Apply a reliable, honest method for learning any professional range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The range map: one family per skin story',
          body: `IMAGE organises its skincare into named range families, and the professional shortcut is to learn each family as a skin story rather than a list of products. Vital C is the hydration and radiance family, the natural home for dry, dull, stressed or generally depleted skin, and the range guests most often know by name. Clear Cell serves oily and blemish-prone skin. Ormedic balances organic botanical ingredients with clinical effectiveness, making it the house's answer for sensitive and unbalanced skin. Ageless targets the visible signs of ageing. Iluma addresses dullness, uneven tone and the appearance of pigmentation. The MAX line sits at the advanced tier of the house's anti-ageing offer. And Prevention+ is the family of daily moisturisers with broad-spectrum SPF that finishes every IMAGE routine, because protecting skin is half the brand's philosophy. Learn the map this way and consultation becomes translation: hear the guest's skin story, name the family that answers it, then choose products within it.`,
        },
        {
          heading: 'Heroes and their signature actives',
          body: `Each family is driven by recognisable actives, and fluency means pairing them without hesitation. Vital C is built around vitamin C, prized in skincare for supporting radiance and a healthy-looking, hydrated skin appearance; its hydrating serum is one of the house's true icons. Clear Cell leads with salicylic acid, the oil-soluble BHA that works into congested pores, which is why the family belongs to blemish-prone skin. Ageless works with alpha hydroxy acids such as glycolic acid, exfoliating actives associated with smoother texture and fresher surface skin. The MAX is associated with peptide technology, the advanced end of the house's ingredient story. Prevention+ carries broad-spectrum SPF, the daily protection that makes Age later more than a slogan. When you narrate any of these during treatment, keep the sentence honest and simple: what it contains, what it does, how the skin will respond. Lead with benefit and feeling, and never quote a strength or percentage you have not verified from the brand's own current materials.`,
        },
        {
          heading: 'Matching families to faces',
          body: `The range map only earns money and trust when it meets real skin, and real skin rarely reads like a catalogue. The practical discipline is to assess type and condition separately, then let condition lead the prescription. Oily but sensitised skin may need the calm of Ormedic before it can benefit from the full strength of Clear Cell. A mature guest whose real story today is dehydration may get more visible change from Vital C than from diving straight into the advanced anti-ageing tier. Combination skin may take its cleanser from one family and its serum from another, and mixing families around a considered analysis is professional skill, not disloyalty to the map. Two rules keep the matching honest. First, prescribe from what you found and said aloud during analysis, so every product has a reason the guest already understands. Second, when actives are involved, start where the skin can succeed: a guest whose first week goes well returns for more, while an over-ambitious start produces irritation and an empty column.`,
        },
        {
          heading: 'How to learn a professional range properly',
          body: `No course can teach you the exact shelf in your particular venue, because professional ranges evolve and menus differ, so the meta-skill matters more than any list. First, heroes before everything: the products guests ask for by name anchor most conversations and most retail. Second, one family at a time, learning each family's logic, its skin story and lead actives, rather than memorising isolated items. Third, use the brand's own training materials and the venue's product knowledge folders; with a clinical house, the manufacturer's current wording is your only safe source for claims, strengths and usage instructions. Fourth, use the key products on your own skin, because conviction cannot be faked and guests read certainty in seconds. Fifth, keep the habit of the honest gap: when asked something you do not know, say what you do know, offer to check, and actually check. With a results-driven house this is more than good manners; guests act on your advice with active ingredients, so accuracy is a safety behaviour as much as a credibility one.`,
        },
      ],
      keyTerms: [
        { term: 'Range family', definition: `A named group of products organised around one skin story, such as Vital C for hydration and radiance or Clear Cell for blemish-prone skin; the unit in which IMAGE fluency is learned.` },
        { term: 'Active ingredient', definition: `An ingredient included to produce a specific skin effect, such as vitamin C, salicylic acid or glycolic acid; the currency of a results-driven house.` },
        { term: 'AHA', definition: `Alpha hydroxy acid, a family of exfoliating actives including glycolic acid, associated with smoother texture and fresher surface skin; central to the Ageless story.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; essential when guests act on your advice with active ingredients.` },
      ],
      caseStudy: {
        title: 'The complicated skin at Elmsworth Manor, the Cotswolds',
        scenario: `Megan works at Elmsworth Manor, a Cotswolds country house spa carrying IMAGE. Her guest, Ms Okafor, arrives frustrated: her skin is oily and breaking out, but everything she has tried from the chemist has left it red, tight and stinging. She has read about Clear Cell online and wants the strongest of everything, today. Under the magnifying lamp Megan sees congestion, but also a compromised, sensitised barrier that is visibly reactive. She must reconcile what the guest is asking for with what the skin in front of her can actually tolerate, and do it without dismissing the guest's research.`,
        insight: `Megan lets condition lead. She explains, kindly and aloud, that the stinging is the skin asking for calm before correction, and prescribes a bridge: rebalancing care in the Ormedic spirit first, with the Clear Cell story introduced as the planned next chapter once the barrier settles. Ms Okafor leaves with a two-product routine she can succeed with, a review booked, and the feeling of being understood rather than upsold. Matching families to the skin's real condition, not the guest's opening request, is what turns one visit into a programme.`,
      },
      summary: `IMAGE fluency is a map: Vital C for hydration and radiance, Clear Cell for blemish-prone skin, Ormedic for sensitive and unbalanced skin, Ageless for visible ageing, Iluma for uneven tone, the MAX at the advanced tier, and Prevention+ for daily SPF protection. Behind the families sit honest hero actives, vitamin C, salicylic acid, AHAs and peptides, narrated in simple benefit-led sentences. Match families to the skin's real condition, letting condition lead type, and learn any range by the professional method: heroes first, one family at a time, the brand's own materials, personal use, and the honest gap.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Read an IMAGE treatment menu on day one, distinguishing facials from professional peels and their requirements`,
        'Deliver the results-driven house style safely and to protocol, and retail through an analysis-led home prescription',
        `Build integrity-led upsell paths from facials to peels and courses while protecting the brand's standards on shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `IMAGE is famous for its professional treatments: results-driven facials and, above all, its family of professional chemical peels, alongside signature experiences such as the O2 Lift oxygen-infused facial. Menus typically ladder from accessible, gentle treatments, often built around the house's beloved vitamin C story, up to progressively stronger peels for bigger corrective goals. Because exact names, tiers and protocols vary by venue and evolve over time, the day-one discipline is a reading method, not a memorised list. Go through the menu treatment by treatment and record four things for each: is it a facial or a peel; its duration and price position; the protocol and products it uses; and its requirements, meaning contraindications, patch tests, home preparation and aftercare. Then identify the entry point, the treatment most first-time guests should start with, and the ladder above it. Ask the senior therapist to walk you through the flagship protocols before your first guest. A results menu read properly is also a retail and rebooking map, because every rung implies a next step.`,
        },
        {
          heading: 'Delivering the signature style: clinical results, luxury hands',
          body: `The IMAGE style asks the therapist to hold two standards at once. The clinical half: a genuine skin analysis before anything touches the face, narrated aloud so the guest hears the expertise; honest consultation about goals, realistic timelines and what today's treatment will and will not do; and precise, protocol-faithful application of actives, with timings respected to the second. The luxury half: warmth, comfort, unhurried touch and the sensory care that makes a clinical treatment feel like a five-star hour rather than a procedure. Neither half is optional, and safety is the hinge between them. Never deliver an IMAGE professional peel without having completed the brand's training for that treatment, and follow the protocol exactly, including any required patch test, skin preparation and aftercare guidance. Keep the guest informed at transitions, especially where a product may tingle or feel warm, because with active treatments an expected sensation is reassuring and an unexpected one is alarming. Finish as the house finishes: protection, typically an SPF moisturiser, and aftercare that protects the result you just created.`,
        },
        {
          heading: 'Retail: the result continued at home',
          body: `In a results-driven house, retail is not an optional extra bolted onto the treatment; it is the second half of the result. Skin changes over weeks, and the guest is with you for one hour, so what happens at their bathroom sink decides whether your work compounds or evaporates. The mechanics follow the analysis. During treatment, narrate the key products at natural moments, one honest sentence each. At the close, prescribe two or three products, each tied explicitly to a finding the guest already heard you name: the cleanser that suits the skin you described, the serum that addresses the condition you found, and, almost always, daily broad-spectrum SPF from the Prevention+ story, because unprotected results undo themselves and Age later is built on daily protection. Tell the guest what not to buy yet, which builds the trust that fills baskets for years. Write the prescription down, explain the routine in ten seconds, cleanse, treat, protect, and record it all on the guest's history so the next visit continues the programme rather than restarting it.`,
        },
        {
          heading: 'Upsell paths, courses, and protecting the brand on shift',
          body: `Upselling in an IMAGE venue is unusually honest work, because the menu genuinely is a ladder. The facial guest with a real corrective goal progresses naturally to a professional peel. The single peel becomes a course, because progressive treatments are how peels deliver their best results, and explaining that is professional truth-telling, not pressure. Home care supports every rung. Offer each step once, warmly, tied to the guest's own goal, and note declined offers on the record for the future. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill. Alongside selling the brand, you protect it. That means using correct products at correct strengths and timings, never improvising a stronger peel or extending an active's contact time to please an impatient guest, honouring patch tests and contraindications without exception, keeping testers and retail immaculate, reporting low stock before it forces substitutions, and flagging an impossible schedule rather than quietly trimming protocols. Guests experience a professional-only brand entirely through its professionals. On an IMAGE shift, you are IMAGE.`,
        },
      ],
      keyTerms: [
        { term: 'Professional peel', definition: `A chemical exfoliation treatment delivered by a trained professional to strict protocol, with defined contraindications, preparation and aftercare; the treatment family IMAGE is best known for.` },
        { term: 'Treatment ladder', definition: `The progression built into a results-driven menu, from accessible entry facials to progressively stronger peels, which gives every guest an honest next step.` },
        { term: 'Course of treatments', definition: `A planned series of appointments, common with peels, through which progressive professional treatments deliver their best results; sold as professional truth, never as pressure.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct products, strengths and timings, faithful protocols, honoured patch tests, immaculate presentation and stock reporting.` },
      ],
      caseStudy: {
        title: 'The impatient guest at Danebury House, Edinburgh',
        scenario: `Callum is a therapist in the skin clinic at Danebury House, a five-star spa hotel in Edinburgh with an IMAGE menu. His new guest, Mr Whitfield, has a school reunion in three weeks and asks directly for the strongest peel on the menu, today, no build-up. Callum's analysis shows skin that has never had professional treatment, no patch test on file, and a protocol that requires preparation before the stronger peels. The guest is charming, insistent and clearly willing to spend, and the column behind him is fully booked. The easy yes is sitting right there.`,
        insight: `Callum protects the guest and the brand in the same move. He explains the ladder as good news: today, the entry-level treatment his skin can succeed with; then a prepared, patch-tested progression, with the reunion date used to plan backwards honestly. He books the course, prescribes home care with daily SPF to accelerate the result, and records everything. Mr Whitfield leaves with a plan instead of a risk. Refusing the wrong treatment warmly, and selling the right programme instead, is the highest form of upselling a results house has.`,
      },
      summary: `An IMAGE shift is mastered in four moves. Read the menu as a ladder, separating facials from professional peels and recording each treatment's duration, protocol, products and requirements. Deliver the house style with clinical precision and luxury warmth, never performing a peel without the brand's training, the exact protocol and any required patch test. Retail as the result continued at home, prescribing from your analysis and almost always including daily SPF. And build honest upsell paths, facial to peel, peel to course, while protecting the standards, because a professional-only brand is experienced entirely through you.`,
    },
  ],
}
