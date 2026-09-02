import type { CourseContent } from '../academy-types'

// Split out of the pack beside it so a course title can be imported
// without dragging every lesson of every course along with it.

export const content: CourseContent = {
  slug: 'ila-spa-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in ila Spa, one of the most distinctive beyond-organic houses in luxury wellness. It covers the founding story and philosophy that shape every treatment, the hero ingredients and provenance stories a therapist must know cold, and the practical craft of the ila shift: reading the treatment menu, delivering the slow, energy-led signature style, retailing the range by linking products to rituals, building honest upsell paths, and upholding the standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by ila Spa.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas that carry ila across UK luxury hotels, destination spas and premium day spas. It suits therapists interviewing for an ila account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving to ila from a results-led clinical house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in ila spas will also gain a working command of the range and its language.`,
  outcomes: [
    `Tell ila's founding story and articulate its beyond-organic philosophy and USP in confident, guest-ready language`,
    'Name the hero ingredients and product families and tell their provenance stories accurately and honestly',
    `Deliver ila's slow, energy-led signature style, from grounded presence to faithful ritual openings and closings, at five-star standard`,
    'Retail the range by linking products used in treatment to a two or three item home prescription',
    `Build integrity-led upgrade paths between treatments and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount ila's founding story and explain why its healer-founder heritage sets it apart from conventional skincare brands`,
        'Explain the beyond-organic philosophy of purity, provenance, natural energy and hand blending',
        `Articulate ila's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'A house founded by a healer',
          body: `ila Spa was founded in England by Denise Leicester, and her background explains the brand better than any tagline. Before creating ila she was a nurse, and alongside that clinical grounding she trained as an aromatherapist and yoga teacher, spending years immersed in healing traditions from around the world. The brand she built reflects all of it: skincare conceived not as cosmetics but as an extension of care, made to restore the whole person. The name itself signals the intent, coming from Sanskrit, a word associated with the earth, and the products are blended by hand at the brand's home in the Cotswolds countryside rather than manufactured on an industrial line. For a therapist, this founding story is not decoration. When a guest asks what makes ila different from the natural skincare in their bathroom cabinet, the honest answer begins with the founder: this is a house created by a healer rather than a marketer, and everything else about it follows from that.`,
        },
        {
          heading: 'Beyond organic: purity, provenance and energy',
          body: `The phrase most often attached to ila is beyond organic, and it repays careful unpacking because it is the philosophy in miniature. For ila, organic certification is a floor, not a ceiling. The house looks past the certificate to the whole life of an ingredient: where it grew, how it was harvested, who produced it and under what conditions, and how gently it was handled on its way into the jar. Many ingredients are wild-harvested or sourced from small artisan producers in remote regions, chosen for vitality and integrity rather than price. Then comes the part that most distinguishes ila from its peers: the belief that ingredients carry a natural energy, a vibrancy that harsh processing destroys, which is why blending is done by hand, in small batches, with deliberate care. A therapist does not need to share every belief to represent the house honestly; you need to understand the claim, respect it, and tell it accurately, because guests who choose ila are usually choosing exactly this.`,
        },
        {
          heading: 'The USP in one breath',
          body: `Every therapist on an ila account should be able to state the house USP in a single sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: ila offers beyond-organic, hand-blended skincare and energy-led treatments, created by a healer, for guests who want transformation as well as results. Each clause earns its place. Beyond organic, because purity past the certificate is the formulation story. Hand-blended, because the Cotswolds craft production is a genuine, verifiable point of difference in an industry of contract manufacturing. Energy-led, because ila treatments work with traditions such as marma therapy, sound and the chakras rather than machines. Created by a healer, because the founder's nursing and healing background is the brand's deepest credential. And transformation as well as results, because the house promises a shift in how the guest feels, not only how their skin looks. Delivered calmly, without disparaging any other house, this sentence answers almost every comparison a guest will ever raise.`,
        },
        {
          heading: 'Speaking ila: the house voice',
          body: `A product house is also a vocabulary, and using the wrong one is as jarring as using the wrong products. The ila voice is gentle, grounded and quietly spiritual. Its natural words are purity, energy, restore, nourish, transformation, stillness. It speaks readily of the spirit and the senses, and it is comfortable with silence in a way that faster, results-led houses are not. Contrast this with a clinical house, where the voice trades in percentages, trials and visible outcomes; neither voice is superior, but each belongs to its own brand, and a therapist who talks actives and concentrations in an ila treatment room sounds like a visitor rather than a resident. Practise translating your knowledge into the house voice: not this oil is rich in essential fatty acids, but this blend will deeply nourish your skin while the rose settles your nervous system. The voice matters most on agency shifts, where a regular guest of the spa will notice within minutes whether you speak their house's language, and it matters in interviews, where fluency in the voice signals fluency in the brand.`,
        },
      ],
      keyTerms: [
        { term: 'Beyond organic', definition: `ila's core philosophy: treating organic certification as a starting point and seeking purity across an ingredient's whole life, from wild harvest and artisan sourcing to gentle hand blending.` },
        { term: 'Hand blending', definition: `Small-batch production by hand at the brand's Cotswolds home, intended to protect the vitality of ingredients; a genuine point of difference from industrially manufactured skincare.` },
        { term: 'Energy-led treatment', definition: `A treatment designed to restore the guest's energy as well as their body, drawing on traditions such as marma point therapy, chakra balancing, sound and breath.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The comparison question at Fernleigh Manor, the Cotswolds',
        scenario: `Priya is a therapist at Fernleigh Manor, a country house hotel spa in the Cotswolds that carries ila. Her guest Mr Whitfield, booked in by his wife, is polite but openly doubtful: he has seen the retail wall prices and asks why a natural face oil should cost several times what his chemist charges, adding that organic just means a sticker these days. Priya knows a defensive ingredient-by-ingredient argument will sound like sales patter, and that Mr Whitfield has, without knowing it, asked exactly the question the house was built to answer. She sets down the consultation form and decides to tell him the story instead.`,
        insight: `Priya answers in the house voice: ila was created by a former nurse and healer, its ingredients are wild-harvested or sourced from artisan producers and chosen for purity beyond any certificate, and every product is blended by hand in small batches in the Cotswolds, a few miles from where they are sitting. She then lets the treatment finish the argument, from the first breath of rose to the stillness at the close. The professional lesson: with a provenance house, the story is the answer. Told accurately and calmly, it converts sceptics without a single defensive word.`,
      },
      summary: `ila Spa is a British house founded by Denise Leicester, a former nurse, aromatherapist and yoga teacher, and its products are blended by hand at its Cotswolds home. Its name comes from Sanskrit, a word associated with the earth, and its philosophy is beyond organic: purity past certification, wild-harvested and artisan-sourced ingredients, and the belief that natural energy must be protected by gentle craft. Its USP, beyond-organic hand-blended skincare and energy-led treatments created by a healer, should live on every therapist's tongue, delivered in the house's gentle, grounded voice.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify ila's hero ingredients and product families and describe what each is known for`,
        'Tell the provenance story of a hero ingredient in one accurate, guest-ready sentence',
        'Apply a reliable, honest method for learning any range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'Ingredients first: the heroes that carry the house',
          body: `Most houses are known by their hero products; ila is known first by its hero ingredients, and mastering their stories gives you most of your credibility for a fraction of the effort. Three stand at the centre. Damask rose otto is one of the most precious essential oils in the world, requiring an extraordinary quantity of petals for a tiny yield, and it carries the heart of ila's aromatic identity: guests who know the brand know its rose. Himalayan salt crystals, rich in minerals, are the signature of the brand's celebrated bath salts and salt-based body work, turning a bath into a treatment and a scrub into a ritual. Argan oil, sourced from women's co-operatives in Morocco, is the emblem of the ethical sourcing story: the purchase itself supports the artisan producers who make it. Learn these three until you can present each in one fluent sentence covering where it comes from, what it does and how it feels, because with this house the provenance is the pitch.`,
        },
        {
          heading: 'The product families and how they think',
          body: `The range follows the philosophy, and understanding the logic beats memorising the list. The face collection is built around precious botanicals, with nourishing face oils at its heart, formulated to feed the skin gently rather than strip or force it. The body collection centres on rich balms and body oils designed to work on the senses and the nervous system as much as the skin, extending the feeling of treatment into daily life. The bath collection, led by the famous salts, exists to send the spa home with the guest: a bath drawn with ila salts is the closest thing to a treatment a guest can give themselves. Across all families the intent is consistent: every product should nourish skin, settle the senses and carry a story of pure origin. When you present any ila product, honour that triad in your language, because a guest buying ila is buying all three at once, and a therapist who mentions only the skin benefit is telling a third of the truth.`,
        },
        {
          heading: 'Telling provenance stories that sell themselves',
          body: `The professional skill with ila retail is the one-sentence provenance story, told during the treatment in the moment the guest is experiencing the product. The shape is always the same: where it comes from, what it does, how it will feel. The rose in this blend is damask rose otto, one of the most precious oils in the world, and you will feel it settle you as it nourishes the skin. These salts are mineral-rich Himalayan crystals; in your bath at home they will ease your muscles the way this scrub is doing now. Said once, quietly, at the right moment, this is the most honest advertising in the industry, because the guest's own senses verify it in real time. Two disciplines keep it professional. Lead with feeling and origin rather than chemistry, because that is the house voice. And never claim a source, an ingredient or a certification you have not verified from the brand's own materials: with a provenance house above all others, an invented detail that unravels destroys the very thing the guest is paying for.`,
        },
        {
          heading: 'How to learn a range properly',
          body: `No course can teach you every product on your particular spa's shelf, because ranges evolve and menus differ, so the meta-skill matters more than any list: the professional method for learning a house fast and honestly. First, heroes before everything: the rose, the salts, the argan story and the products that carry them answer most guest questions and anchor most retail. Second, one category at a time: face, then body, then bath, learning each family's logic rather than memorising isolated items. Third, use the testers and the training materials the spa holds; the house's own words are your safest source for claims, and with ila the origin stories are documented by the brand itself. Fourth, use the key products on your own skin and in your own bath, because conviction cannot be faked and guests read your certainty within seconds. Fifth, keep the habit of the honest gap: when asked something you do not know, say what you do know, offer to check the rest, and then actually check it. A therapist who follows this method can walk into an unfamiliar ila spa and be genuinely fluent within their first week.`,
        },
      ],
      keyTerms: [
        { term: 'Hero ingredient', definition: `A signature ingredient that carries a house's identity and story; for ila, think of damask rose otto, Himalayan salt crystals and argan oil from women's co-operatives in Morocco.` },
        { term: 'Provenance story', definition: `The one-sentence account of where an ingredient comes from, what it does and how it feels, told during treatment; the core retail skill in a sourcing-led house.` },
        { term: 'Rose otto', definition: `The precious essential oil of the damask rose, requiring vast quantities of petals for a tiny yield; the heart of ila's aromatic identity.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The knowledgeable guest at The Elderbrook, Mayfair',
        scenario: `Sofia has just joined The Elderbrook, a five-star hotel spa in Mayfair carrying ila, from a clinical results-led house. Her formal brand training is three weeks away, but she is on the column now. Her first body treatment guest, Mrs Okafor, is a long-time ila devotee who buys the bath salts wherever she travels. Mid-treatment she asks Sofia where the salts actually come from, and whether the body balm she has seen online is made in the same place as everything else. Sofia knows one of the answers with certainty and half-knows the other, and feels the familiar pull to round both up to confident.`,
        insight: `Sofia gives the full answer where she has it, telling the Himalayan salt story in one sentence while the scrub is doing its work, and uses the honest gap for the balm: she shares what she knows, that ila blends its products by hand at its Cotswolds home, offers to confirm the specific product's details, and has the answer waiting at reception with the salts Mrs Okafor always buys. A devotee guest is a test you cannot bluff. Sofia passes it by knowing her heroes cold and refusing to invent the rest, which is exactly the standard the house itself would ask for.`,
      },
      summary: `ila product mastery starts with the hero ingredients: damask rose otto at the aromatic heart of the house, mineral-rich Himalayan salt crystals in the famous bath salts, and argan oil from Moroccan women's co-operatives carrying the ethical sourcing story. The families follow the philosophy: face oils, body balms and bath salts that nourish skin, settle the senses and carry pure origins. The core retail skill is the one-sentence provenance story, told while the guest experiences the product. The lasting skill is the learning method: heroes first, category by category, the brand's own materials, personal use, and the honest gap.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate an ila treatment menu on day one and deliver the house's slow, energy-led signature style with confidence`,
        'Retail the range by linking the products used in treatment to a short, honest home prescription',
        `Build integrity-led upsell paths between treatments and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every ila spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the flagship: the Kundalini Back Massage is the treatment the house is most famous for, an energy-led ritual working up the spine with marma point therapy and the chakras to release deep-held tension, and it is the treatment guests most often arrive already wanting. Learn it first, in full. Then map the rest of the menu in layers: the facials and what distinguishes each, the body rituals and where the salts and balms appear, and the enhancements that can extend or deepen a booking. For each treatment note four things: duration, protocol source, products used, and who it is for. Read the protocols the spa holds, shadow a senior therapist where you can, and ask questions before your first guest rather than improvising in front of one. Because ila protocols carry energy work that generic training does not cover, asking is not a weakness here; it is the only professional option.`,
        },
        {
          heading: 'Delivering the signature style',
          body: `An ila treatment is recognisable before a single product touches the skin, because the house style begins with the therapist's own state. This is a house that treats the therapist's presence as part of the treatment: arrive grounded, breathe before you begin, and let stillness be part of your touch, because a rushed or distracted therapist contradicts the brand with every stroke. The style itself is slow, meditative and energy-led, drawing on traditions such as marma point therapy, chakra balancing, sound and breath. Honour the ritual openings and closings completely; under time pressure they are the first thing a rushed therapist trims and the last thing this house would ever sacrifice, because they are the brand. Keep the pace unhurried throughout, let silence do its work rather than filling it, and bring the guest back gently at the close, never abruptly. A technically excellent massage delivered at conventional spa pace is, in an ila room, the wrong treatment. Deliver the stillness, the slowness and the energy work faithfully and you are delivering ila; skip them and you are merely using its products.`,
        },
        {
          heading: 'Retail: the ritual continued at home',
          body: `ila retail succeeds when it is framed as the treatment going home with the guest, and the mechanics follow the house's own logic. During the treatment, narrate the key products at natural moments, one provenance sentence each, while the guest is experiencing them; the rose blend they can smell and the salts easing their muscles are already selling themselves honestly. At the close, prescribe rather than pitch: two or three products, each linked explicitly to the ritual just delivered and to what you found. The strongest links are the ones the guest already loves: the bath salts, because a bath at home is the nearest thing to repeating the body ritual; the face oil you used, because each evening it re-creates the close of the facial; the body balm, for the guest who sank into the nourishing body work. Tell them what not to buy as well, which builds the trust that compounds over years. Write the prescription down, and record it on the guest's history so the next therapist can continue the story rather than starting it again.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths in an ila spa are natural because the menu is a connected landscape. The facial guest who loved the back and shoulder work is a Kundalini Back Massage guest next visit; say so at the close and note it on their record. The sixty-minute guest carrying deep tension genuinely benefits from the longer ritual, offered once, warmly, at booking or in consultation. Enhancements let a guest deepen today's booking without changing it. The integrity rule is absolute, and doubly so in a house built on healing: every upgrade must improve the guest's outcome, not merely the bill, and pressure of any kind is a direct contradiction of the brand. Alongside selling the house, you protect it. That means following the protocols faithfully rather than your private variant, using the correct products in the correct quantities, keeping retail and testers immaculate, reporting low stock before it forces substitutions, and never quietly shortening the ritual to rescue a late-running column; flag the schedule instead. Guests experience the brand only through its therapists. On an ila shift, you are ila, and the calm you hold is the brand's reputation in that room.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a house is most famous for and the first one to master on any new menu; for ila, the Kundalini Back Massage, its renowned energy-led back ritual.` },
        { term: 'Marma point therapy', definition: `Work on vital energy points drawn from Ayurvedic tradition, used in ila treatments such as the Kundalini Back Massage to release tension and restore energy flow.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely loved or needs, such as facial to Kundalini Back Massage, or sixty minutes to the longer ritual.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct products and quantities, faithful protocols, immaculate presentation, stock reporting and the ritual delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at Glenmorren House, the Scottish Highlands',
        scenario: `Amara, an experienced agency therapist, arrives at Glenmorren House, a five-star Highland retreat carrying ila, for her first shift on the menu. She has forty minutes before her first guest. She asks the head therapist for the menu and protocols, learns the structure of the Kundalini Back Massage first, confirms the products for her first two bookings, and takes two quiet minutes to ground herself before the door opens. Her second guest, Mrs Callaghan, is a facial regular who mentions that the brief shoulder work is always her favourite part, and that nobody has ever suggested she try anything else on the menu.`,
        insight: `Amara's preparation makes the professional move available. She delivers the facial at the house's unhurried pace, protecting every ritual moment, then at the close prescribes the face oil she used and the bath salts, each with its one-sentence story. Hearing that the shoulder work is Mrs Callaghan's favourite part, she opens the upgrade path: the Kundalini Back Massage is the house's signature answer to exactly that, and she notes it on the record for whoever treats her next. Nothing was pushed; a genuine preference was heard and answered, and the spa asks the agency for Amara by name.`,
      },
      summary: `Mastering an ila shift is a craft with four faces. Read the menu like a professional, flagship first, and know the Kundalini Back Massage before anything else. Deliver the signature style faithfully: grounded presence, a slow meditative pace, the energy work of marma points, chakras, sound and breath, and ritual openings and closings protected in full. Retail as the ritual continued at home, prescribing two or three products with their provenance stories. And build honest upgrade paths while protecting the standards, because on shift the therapist is the brand, and the calm is never the thing you trim.`,
    },
  ],
}
