import type { CourseContent } from '../academy-types'

// Split out of the pack beside it so a course title can be imported
// without dragging every lesson of every course along with it.

export const content: CourseContent = {
  slug: 'natura-bisse-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Natura Bisse, the Barcelona-born luxury skincare house celebrated for the finest facials in five-star spa. It covers the founding story and science-meets-luxury philosophy that shape every protocol, the collection map and hero ingredient stories a therapist must know cold, and the practical craft of the Natura Bisse shift: reading the treatment menu, delivering the meticulous couture-style protocols, retailing the range by linking collections to treatments, building honest upsell paths, and upholding the standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent Talent House training and is not affiliated with or endorsed by Natura Bisse.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, Natura Bisse spas across UK luxury hotels, city day spas and destination spas. It suits facialists interviewing for a Natura Bisse account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving to Natura Bisse from another house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in Natura Bisse spas will also gain a working command of the collections and their language.`,
  outcomes: [
    `Tell Natura Bisse's founding story and articulate its philosophy and USP in confident, guest-ready language`,
    'Map the major collections and match each to the skin concerns it addresses, accurately and honestly',
    `Deliver the house's meticulous, couture-style treatment standard, protocol-faithful from first step to last`,
    'Retail the range by prescribing two or three products linked to the collection used in treatment',
    `Build integrity-led upgrade paths into the Diamond tier and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount Natura Bisse's founding story and explain why the amino acid discovery still defines the house`,
        'Explain the philosophy that joins science-led formulation with couture-level sensorial luxury',
        `Articulate Natura Bisse's USP to a guest in one confident, accurate sentence, in the house's own tone`,
      ],
      sections: [
        {
          heading: 'Barcelona, 1979: a second-act founding story',
          body: `Natura Bisse was founded in Barcelona in 1979 by Ricardo Fisas, and the story deserves telling properly because guests love it and interviewers expect it. Fisas was in his fifties, at a point where most careers are winding down, when he encountered laboratory research from his previous working life showing that free amino acids, the building blocks of proteins, had remarkable regenerating effects on the skin. He built his first professional formulas around that discovery and founded the company with his family. That family character endures: Natura Bisse remains family-owned, with the founding family still leading the business, and the house tells its own story with visible pride. For a therapist, the founding story does two jobs. It explains the science-first identity, because the house began with an ingredient discovery rather than a marketing concept. And it gives you a warm, human answer to the guest who asks where the brand comes from: a Spanish family house, born from a scientific insight and a second chance, that grew into the facial brand of choice for the world's finest spas.`,
        },
        {
          heading: 'The philosophy: clinical rigour, couture delivery',
          body: `Most houses pick a side. The clinical brands lead with actives and results and can feel cold; the sensorial brands lead with scent and ritual and can feel vague. Natura Bisse's philosophy is the refusal to choose. On one side sits rigorous, science-led formulation, inherited from the amino acid founding story and carried through every collection. On the other sits unapologetic luxury: rich textures, meticulous multi-step protocols, and treatments composed with the care of couture tailoring. The professional consequence is a distinctive standard of delivery. A Natura Bisse facial is layered and precise, with every step earning its place and performed exactly as the protocol describes, yet the guest experiences it as indulgence rather than procedure. The therapist's craft is holding both at once: the discipline of a clinician and the touch of a five-star host. This is why the house is so beloved of luxury city spas, where guests want visible results and refuse to sacrifice the experience, and it is why sloppy shortcuts damage this brand faster than almost any other.`,
        },
        {
          heading: 'The reputation: the facialist of the five-star world',
          body: `Every house has a centre of gravity, and for Natura Bisse it is unmistakably the facial. The brand built its name on facial treatments at the very top of the market, and it is the house that luxury city spas and five-star hotels reach for when they want their facial menu to be beyond argument. Within the spa industry the brand has been repeatedly honoured for the quality of its treatments, and its flagship experiences, above all the Diamond Experience facials, are the kind of treatment guests travel for and talk about afterwards. The house has also shown a taste for genuine innovation in the treatment environment itself, famously creating a pure air bubble concept, a controlled clean-air space in which treatments could be delivered. For a therapist, the reputation sets the bar. Guests arriving for a Natura Bisse facial arrive with the highest expectations in the industry, often having paid at the top of the menu. Meeting that expectation is the job; exceeding it is the career.`,
        },
        {
          heading: 'The USP in one breath, and the house voice',
          body: `Every therapist on a Natura Bisse account should be able to state the USP in one sentence. A reliable version: Natura Bisse offers diamond-tier, science-led luxury facials, born from amino acid research in Barcelona and delivered with haute couture precision. Each clause earns its place. Diamond-tier signals where the house sits in the market and echoes its flagship collection. Science-led is the founding story made present tense. Luxury facials names the centre of gravity, the thing the brand is genuinely famous for. Haute couture precision describes the delivery standard that separates the house from both clinical coldness and vague pampering. The house voice matches: polished, precise, quietly confident, speaking of results and of experience in the same breath. Practise translating your knowledge into it: not this contains actives, but this facial is built on the amino acid science the house was founded on, and every step has been designed for your skin today. When a guest compares the price with a high street facial, that sentence, delivered calmly, is the honest answer.`,
        },
      ],
      keyTerms: [
        { term: 'Product house', definition: `A brand that supplies a spa's products, treatment protocols, training and much of its identity; luxury spas partner with a house rather than simply stocking its products.` },
        { term: 'Free amino acids', definition: `The building blocks of proteins, whose skin-regenerating effects inspired Ricardo Fisas's first formulas and remain the founding science of the house.` },
        { term: 'Haute couture delivery', definition: `The Natura Bisse standard of treatment: meticulous, layered, protocol-faithful work delivered with the precision and personal attention of couture tailoring.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The price question at The Marlowe, Mayfair',
        scenario: `Priya is a facialist at The Marlowe, a five-star hotel spa in Mayfair running a Natura Bisse menu. Her guest, Mrs Ellison, has booked the top facial on the menu as a birthday gift to herself, and as the consultation ends she says, half joking, that her daughter thinks she is mad to pay this much when the chemist sells vitamin C serums for a fraction of the price. Priya senses that the question is real beneath the joke: Mrs Ellison wants to feel that her choice was intelligent, not extravagant, before she can relax into the treatment.`,
        insight: `Priya answers with the house story rather than a chemistry debate: a family house founded in Barcelona in 1979 on amino acid research, chosen by the world's finest spas precisely because its facials pair that science with couture-level delivery, and what her daughter cannot buy at the chemist is the trained protocol about to be performed on her skin. Then she lets the meticulous treatment finish the argument. The lesson: at this tier, the founding story, the reputation and the delivered precision are the honest justification of the price, and the therapist who can voice them calmly sells nothing yet convinces completely.`,
      },
      summary: `Natura Bisse is a Spanish family house founded in Barcelona in 1979 by Ricardo Fisas, built on research into free amino acids and still led by the founding family. Its philosophy refuses to choose between science and luxury: rigorous formulation delivered through meticulous, couture-standard facial protocols. Its reputation is the facial itself, honoured across the industry and trusted by five-star spas at the very top of the market. Its USP, diamond-tier science-led luxury facials delivered with haute couture precision, should live on every therapist's tongue, spoken in the house's polished, quietly confident voice.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        'Map the major Natura Bisse collections and state what each is for in one fluent sentence',
        `Explain the house's founding ingredient story and tell it in guest-ready language during treatment`,
        'Apply a reliable, honest method for learning the range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The collection map: the fastest route to fluency',
          body: `Natura Bisse organises its skincare into named collections, each addressing a territory of skin concern, and the single most valuable thing a new therapist can memorise is the map. The Diamond Collection is the flagship: the house's most luxurious anti-ageing family, the name guests know, and the tier the whole brand is associated with. The C+C Vitamin line is built around vitamin C, the classic radiance and antioxidant ingredient, and is the natural home for dull, tired, city-worn skin. The Inhibit collection is the house's targeted answer to expression lines and wrinkles, for the guest whose concern is lines of movement. The Oxygen collection purifies and revitalises congested skin. NB Ceutical is the sensitive skin collection, where comfort and tolerance lead every formulation choice. Hold that map and you can place almost any product a guest mentions, match a collection to the concern in front of you, and speak about the range with the structural confidence of the house's own trainers. Learn the map before you learn a single ingredient list.`,
        },
        {
          heading: 'The founding ingredient story, told simply',
          body: `Every house has an ingredient story, and Natura Bisse's begins at its beginning: free amino acids, the building blocks of the proteins that make up skin, whose regenerating effects on the skin inspired Ricardo Fisas's first professional formulas in 1979. That science-first identity still shapes how the house develops and talks about its products, and it gives the therapist a beautifully simple narrative to use in the treatment room. The skill is telling it in one guest-ready sentence at a natural moment: this house was founded on the science of amino acids, the building blocks your skin is made of, and that thinking runs through everything I am using today. Said once, calmly, while the guest is experiencing the product, it does more than any brochure. Two disciplines keep the storytelling professional. Lead with what the guest will feel and see, because this is still a luxury treatment and not a lecture. And keep the science honest: the founding story is established fact, but specific formulation claims belong to the house's own training materials, not to your improvisation.`,
        },
        {
          heading: 'Matching collections to the skin in front of you',
          body: `The collection map only earns money when it meets your skin analysis. The discipline is to diagnose first and prescribe second, exactly as in any professional facial: assess skin type and current condition, narrate your findings aloud, and then reach for the collection whose territory matches. Dullness and early photo-damage point towards the vitamin C radiance of C+C. Expression lines that bother the guest when they frown or smile point towards Inhibit. Congested, city-stressed skin points towards Oxygen. Reactive, easily-upset skin points towards NB Ceutical, and the guest seeking the most luxurious anti-ageing experience the house can offer belongs with Diamond. Never prescribe across collections at random; a coherent recommendation from one or two collections reads as expertise, while a scatter of products from five families reads as commission-hunting. And remember that the guest's own priority wins: a guest with three textbook concerns but one that genuinely bothers her should hear her concern answered first. The map serves the analysis, and the analysis serves the guest.`,
        },
        {
          heading: 'How to learn the range properly',
          body: `No course can teach every product on your particular spa's shelf, because ranges evolve and menus differ, so the meta-skill matters more than any list. First, the map before the detail: know the collections and their territories cold, as in this lesson. Second, one collection at a time, starting with whichever your spa's treatment menu leans on most, which on a Natura Bisse account is very often the Diamond family. Third, use the house's own sources: the testers on the retail wall, the spa's protocol documents and the brand training materials are your only safe basis for specific claims. Fourth, use key products on your own skin where you can, because conviction cannot be faked and guests read certainty within seconds. Fifth, practise the honest gap: when a guest asks something you do not know, say what you do know, offer to check the rest, and actually check it, bringing the answer to reception before the guest leaves. A therapist who follows this method can join a Natura Bisse account and be genuinely fluent within the first week, without ever once inventing a claim.`,
        },
      ],
      keyTerms: [
        { term: 'Collection', definition: `A named product family within the Natura Bisse range addressing a territory of skin concern, such as Diamond, C+C Vitamin, Inhibit, Oxygen or NB Ceutical.` },
        { term: 'Vitamin C', definition: `The classic radiance and antioxidant skincare ingredient, and the organising active of the C+C Vitamin line for dull, tired skin.` },
        { term: 'Coherent prescription', definition: `A retail recommendation drawn from one or two collections matched to the analysis, rather than scattered products from across the range.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The enthusiast at Harewood Manor, the Cotswolds',
        scenario: `Elena has recently joined Harewood Manor, a luxury country house spa in the Cotswolds with a Natura Bisse menu, and her formal brand training is still a fortnight away. Her guest, Ms Okafor, is a skincare enthusiast who arrives quoting ingredients from her favourite online reviewers and asks Elena directly which collection she should invest in: she is worried about dullness after a punishing work season, mentions the frown line she dislikes in photographs, and admits her skin reacts badly to strong actives. Three concerns, one budget, and a guest who will instantly detect waffle.`,
        insight: `Elena uses the map instead of bluffing detail. She analyses first, narrates what she finds, then places each concern in its collection: the dullness belongs to the vitamin C territory of C+C, the frown line to Inhibit, and her reactivity means introducing one thing at a time, gently. She asks which concern bothers Ms Okafor most, prescribes coherently from that collection, and uses the honest gap on a formulation question she cannot yet answer, checking it before the guest leaves. Ms Okafor buys two products and books a facial course. Fluency is structure plus honesty, not memorised ingredient lists.`,
      },
      summary: `Natura Bisse fluency starts with the collection map: Diamond as the flagship luxury anti-ageing family, C+C Vitamin for radiance built on vitamin C, Inhibit for expression lines, Oxygen for congested skin and NB Ceutical for sensitivity. Beneath the map sits the founding science of free amino acids, a story worth telling in one calm sentence during treatment. Match collections to your analysis, prescribe coherently rather than scattering, and learn the range by the professional method: map first, one collection at a time, the house's own materials, personal use, and the honest gap instead of invention.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate a Natura Bisse treatment menu on day one and identify the flagship experiences to master first`,
        `Deliver the house's meticulous couture-style protocols faithfully, and retail by linking collections to treatments`,
        `Build integrity-led upsell paths into the Diamond tier and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every Natura Bisse spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the flagship: the Diamond Experience facials are the treatments most guests associate with the house, the ones they arrive already wanting, so learn your spa's version first and in full. Then map the rest of the facial menu by collection, because the menu usually mirrors the retail map: vitamin C radiance facials, treatments targeting expression lines, purifying and oxygenating treatments, and gentle protocols for sensitive skin. For each treatment note four things: duration, protocol source, products used, and who it is for. Ask about any signature concepts your venue offers, because the house has a history of innovating in the treatment experience itself, famously creating a pure air bubble environment in which treatments could be delivered. Read the protocol documents the spa holds, shadow a senior therapist where you can, and ask before your first guest rather than improvising in front of one. Precision is this house's identity, and it begins with how precisely you learn the menu.`,
        },
        {
          heading: 'Delivering the couture standard',
          body: `The Natura Bisse style is meticulous, and the meticulousness is the ritual. Protocols are typically layered and multi-step, composed so that each phase prepares the next, and the house standard is to perform every step precisely as written: correct products, correct order, correct quantities, correct timings. Resist the instinct, learned in more improvisational houses, to freestyle; on this account, protocol fidelity is the craft, and your artistry lives in the quality of your touch, the smoothness of your transitions and the personal attention you fold around the structure. Under time pressure the temptation is to trim steps quietly, and it must be refused: a shortened protocol is a different treatment sold under the same name, which at this price tier is a breach of trust as well as of standards. If the column is running late, flag it to the coordinator rather than cutting. Throughout, hold both halves of the philosophy in your hands: clinical precision in what you do, five-star warmth in how it feels to receive it. The guest should sense enormous rigour and experience only luxury.`,
        },
        {
          heading: 'Retail: the facial continued at home',
          body: `Natura Bisse retail succeeds when it flows from the treatment just delivered. During the facial, narrate key products at natural moments, one sentence each, while the guest is experiencing them; at this tier guests are genuinely curious about what is touching their skin, and honest narration answers the question before it is asked. At the close, prescribe rather than pitch: two or three products, linked explicitly to the collection you treated with and to what your analysis found. Coherence is the luxury signature: a Diamond facial guest is a Diamond retail guest, a C+C facial guest goes home with vitamin C, and a scatter of unrelated products undoes the impression of expertise the protocol just built. Tell the guest what not to buy as well, which at high price points builds more trust than any recommendation. Write the prescription down, explain the order of use in ten seconds, and record what you prescribed on the guest's history so the next therapist can continue the story rather than restart it. Retail here is not an add-on to the facial; it is the facial, continued at the guest's own basin.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths on a Natura Bisse menu are natural because the menu is tiered. The classic facial guest whose skin and curiosity are ready moves up to the Diamond tier, offered once, warmly, as a genuine recommendation rather than a price ladder. The sixty-minute booking extends when the analysis honestly supports it. And because professional skin results come from a series, the single facial becomes a course, planned around the skin's renewal cycle and the guest's own goals. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill, and at this price tier a pushed upgrade costs trust that never returns. Alongside selling the brand, you protect it. On shift that means the correct products in the correct quantities, protocols followed in full, testers and retail immaculate, low stock reported before it forces substitutions, and the treatment standard held even when the schedule is brutal. Guests experience Natura Bisse only through its therapists. On this account you are the house, and the precision you hold in an unwatched treatment room is the brand's entire reputation in that hour.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a house is most famous for and the first to master on any new menu; for Natura Bisse, the Diamond Experience facials at the top of the menu.` },
        { term: 'Protocol fidelity', definition: `Performing every step of a treatment exactly as the house protocol describes: correct products, order, quantities and timings, with no quiet trimming under time pressure.` },
        { term: 'Tiered menu', definition: `A treatment menu arranged in ascending levels of depth and luxury, creating natural, honest upgrade paths such as classic facial to Diamond tier.` },
        { term: 'Course of facials', definition: `A planned series of treatments spaced around the skin's renewal cycle, the honest professional route to lasting results and the natural long-term booking pattern.` },
      ],
      caseStudy: {
        title: 'The agency shift at The Redcliffe, Edinburgh',
        scenario: `Tomasz, an experienced agency facialist, arrives at The Redcliffe, a five-star hotel spa in Edinburgh, for his first shift on its Natura Bisse menu. He has under an hour before his first guest. He asks the head therapist for the menu and protocol documents, learns the structure of the spa's Diamond Experience facial first, and confirms products, quantities and timings for his two morning bookings. His second guest, Mrs Carmichael, is a regular who books the same classic radiance facial every month, mentions she has a milestone birthday approaching, and lingers wistfully over the Diamond page of the menu while they talk.`,
        insight: `Tomasz's preparation makes the professional move available. He delivers her usual facial with full protocol fidelity, narrating the vitamin C products as he works. At the close he prescribes two products from the collection he used, then answers what she has already half-asked: with her birthday approaching, the Diamond Experience would be the natural next visit, and he notes the suggestion on her record for whoever treats her next. Nothing pushed, a real wish heard and honoured. One shift, one honest upgrade path, and an agency therapist The Redcliffe asks for by name.`,
      },
      summary: `Mastering a Natura Bisse shift is a craft with four faces. Read the menu like a professional, flagship first, and know your spa's Diamond Experience facial before anything else. Deliver the couture standard: full protocol fidelity, layered precision, and five-star warmth wrapped around clinical rigour. Retail as the facial continued at home, prescribing two or three products coherently from the collection you treated with. And build honest upgrade paths, classic to Diamond and single facial to course, while protecting the standards, because on this account the therapist is the house and precision is never the thing you trim.`,
    },
  ],
}
