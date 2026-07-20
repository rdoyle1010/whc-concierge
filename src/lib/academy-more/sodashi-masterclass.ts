// WHC Academy brand masterclass: Sodashi. Independent WHC training - not
// affiliated with or endorsed by Sodashi. Answer key lives in
// academy-more-answers/sodashi-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'sodashi-masterclass',
  title: 'Sodashi Masterclass',
  tagline: `The Australian house of pure, high-touch natural luxury - its story, its heroes, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Sodashi is one of the quiet aristocrats of luxury spa: a small Australian house with an outsized presence in some of the finest hotel spas in the world. It was founded in 1999 by Megan Larsen, an aromatherapist and natural skincare formulator, in Western Australia, and the products are still made there in small batches rather than on a mass production line.

The name tells you the philosophy before you open a jar. Sodashi is derived from Sanskrit and is usually translated as wholeness, purity and radiance, and those three words are the brand in miniature. The house's founding conviction is that skincare can be completely natural and still perform at true luxury level: formulations built from plant actives, essential oils and mineral-rich natural ingredients, free from synthetic chemicals, artificial fragrances and fillers.

Sodashi's route to fame was the treatment room, not the shop shelf. It earned its reputation inside five-star hotel and destination spas, where therapists deliver its high-touch, ritual-led treatments to guests who could buy anything.

The USP in one breath: Sodashi offers pure, completely natural, high-performance skincare, hand-blended in small batches in Australia, delivered through deeply personal, touch-rich spa rituals. A guest can buy natural skincare anywhere; at a Sodashi spa they are buying purity without compromise, and hands trained to honour it.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `A Sodashi therapist's credibility rests on being able to tell the purity story accurately, and on knowing the products guests ask about by name.

Start at the top. The Samadara Ultimate Age-Defying Cream is the house's flagship prestige product, the jar the brand is most famous for, and the anchor of its age-defying offer. Learn it first: what it is, who it suits, and the treatment it crowns on menus that carry a Samadara facial. Around it sit face and body ranges organised by skin need, built on the same natural foundation.

The ingredient story is the philosophy made visible. Sodashi formulates with plant actives chosen for genuine skin benefit, essential oils for the senses and the nervous system, and mineral-rich natural ingredients such as clays and floral waters. Just as important is what is absent: no synthetic chemicals, no artificial fragrances, no fillers. When you narrate a product in treatment, tell that story in one sentence: what it contains, what it leaves out, and how the guest will feel.

Where you are unsure of a specific formulation, never invent it. The professional method for learning any range holds here as everywhere: heroes first, then one category at a time, using the testers, reading the house training materials, and using the key products on your own skin until conviction is real. Purity is a claim guests test; only accuracy protects it.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Every Sodashi spa's menu differs in detail, so your day one discipline is a method. Read the menu flagship first: find the treatment the spa positions at the top, often a Samadara age-defying facial where the range is stocked, and learn it completely, duration, protocol, products and who it is for. Then map the facials, the body treatments and rituals, and the enhancements that extend them. Read the protocols the spa holds and ask the senior therapist rather than guessing.

Delivery is where Sodashi lives. The house style is high-touch and ritual-led: generous hands-on time, unhurried flow, warm attentive presence, and personalisation at every decision point. The products are pure; the delivery must feel equally considered. Guests choose a Sodashi spa for a deeply natural, deeply human experience, and a rushed or mechanical treatment breaks the promise the jar made.

Retail is the ritual continued at home. Narrate products as you use them, then prescribe two or three, linked directly to the treatment and to what you found, and write the prescription down. Upsell paths are natural: the facial guest ready for the flagship experience next visit, the sixty-minute booking that genuinely needs ninety, the enhancement that answers something the consultation surfaced.

Finally, protect the house. Correct products in correct quantities, protocols followed faithfully, testers immaculate, low stock reported, and the ritual never trimmed under time pressure. On a Sodashi shift, you are the brand.`,
    },
  ],
  quiz: [
    {
      q: 'Sodashi was founded by...',
      options: [
        'A Swiss laboratory group in the 1980s',
        'Megan Larsen, an aromatherapist, in Western Australia in 1999',
        'A Parisian perfume house',
        'A dermatology clinic in Sydney',
      ],
    },
    {
      q: `The name Sodashi is usually translated as...`,
      options: [
        'Strength, science and results',
        'Ocean, mineral and light',
        'A family surname with no wider meaning',
        'Wholeness, purity and radiance, from Sanskrit',
      ],
    },
    {
      q: `Sodashi's formulation promise is...`,
      options: [
        'Completely natural: plant actives, essential oils and mineral-rich ingredients, free from synthetic chemicals, artificial fragrances and fillers',
        'Clinical actives at the highest legal percentages',
        'Natural where possible, synthetic where cheaper',
        'Fragrance-led formulas designed around signature scents',
      ],
    },
    {
      q: `The house's flagship prestige product is...`,
      options: [
        'The Pro-Collagen Marine Cream',
        'The Optimal Skin ProCleanser',
        'The Samadara Ultimate Age-Defying Cream',
        'The Pink Hair and Scalp Mud',
      ],
    },
    {
      q: 'Sodashi products are made...',
      options: [
        'Under licence in several countries',
        'In small batches in Western Australia',
        'In a mass production facility in Europe',
        'By each spa on site',
      ],
    },
    {
      q: 'Your first move with an unfamiliar Sodashi treatment menu on day one is...',
      options: [
        'Learn the flagship treatment completely, then map the rest, reading protocols and asking the senior therapist rather than guessing',
        'Improvise from your general facial training',
        'Memorise the price list',
        'Deliver every treatment the same way to stay consistent',
      ],
    },
    {
      q: 'The strongest way to retail the Sodashi range is...',
      options: [
        'Present the full range at the till',
        'Leave retail to reception',
        'Discount whatever is overstocked',
        'Narrate products during treatment, then prescribe two or three linked to what you found, written down',
      ],
    },
    {
      q: 'Protecting the brand on a Sodashi shift means...',
      options: [
        'Substituting products quietly when stock runs low',
        'Shortening the ritual to keep the column on time',
        'Correct products and quantities, faithful protocols, stock reported, and the ritual never trimmed under pressure',
        'Adding your own signature steps to every protocol',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked the therapist why the spa chose Sodashi and she told me the story - a small Australian house, hand-blended, completely natural, in the best spas in the world. I stopped reading ingredient labels and started trusting her."`,
      helpsYou: `Sodashi accounts are rare and coveted, and managers filter hard for therapists who can tell the purity story accurately. Stating the founding story and the USP in one confident sentence is what makes an interviewer, or a sceptical guest, relax.`,
      tips: [
        'Learn the one-breath USP: pure, completely natural, high-performance, hand-blended in small batches, delivered through touch-rich ritual',
        `Remember the meaning of the name: wholeness, purity and radiance, from Sanskrit`,
        `Sodashi earned its name in five-star treatment rooms, not on shop shelves - say so`,
      ],
    },
    {
      guestView: `"She told me what was in the cream, and then what was not in it - no synthetics, no artificial fragrance, no fillers. Nobody had ever sold me skincare by what it leaves out before. I bought it."`,
      helpsYou: `Purity is a claim guests test, and hero-product fluency is the fastest credibility you can build in a natural house. Knowing the Samadara flagship and the plant, essential oil and mineral story cold lets you belong on a Sodashi shift within an hour.`,
      tips: [
        'Heroes first: know the Samadara Ultimate Age-Defying Cream before anything else',
        'Tell the story in one sentence: what it contains, what it leaves out, how it feels',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The treatment felt hand-made, like the products - unhurried, warm, completely personal. At the end she wrote down two products, told me a third could wait, and suggested the signature facial next time. I booked it there and then."`,
      helpsYou: `Therapists who can deliver the high-touch Sodashi style, retail from the treatment and build honest upgrade paths are the ones five-star spas rebook, promote and put in front of VIPs.`,
      tips: [
        'Day one: learn the flagship treatment on the menu completely before anything else',
        'The house style is high-touch and unhurried - the ritual is never the thing to trim',
        'Prescribe two or three products, linked to the treatment just delivered, written down',
        'Upsell along natural paths: consultation findings, the flagship facial, sixty to ninety minutes',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'sodashi-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Sodashi, the Australian house of completely natural luxury skincare found in some of the world's finest hotel spas. It covers the founding story, the Sanskrit-rooted philosophy of wholeness, purity and radiance, the flagship products and the ingredient story of plant actives, essential oils and mineral-rich naturals, and the practical craft of the Sodashi shift: reading the treatment menu, delivering the high-touch signature style, retailing the range by linking products to treatments, building honest upsell paths, and upholding the standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by Sodashi.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas that carry Sodashi across UK luxury hotels, destination spas and premium day spas. It suits therapists interviewing for a Sodashi account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving to Sodashi from a results-led clinical house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in Sodashi spas will also gain a working command of the range and its language.`,
  outcomes: [
    `Tell Sodashi's founding story and articulate its philosophy and USP in confident, guest-ready language`,
    'Explain the completely natural formulation promise accurately, including what the products contain and what they deliberately leave out',
    `Name the flagship Samadara product and present the house's ingredient story honestly during treatment`,
    'Read an unfamiliar Sodashi treatment menu on day one and deliver the high-touch signature style at five-star standard',
    'Retail the range by linking products used in treatment to a two or three item home prescription',
    `Build integrity-led upgrade paths between treatments and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount Sodashi's founding story and explain why its treatment-room heritage and small-batch production set it apart`,
        `Explain the philosophy carried in the name: wholeness, purity and radiance, delivered through completely natural formulation`,
        `Articulate Sodashi's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'A small Australian house with a five-star footprint',
          body: `Sodashi was founded in 1999 by Megan Larsen, an aromatherapist and natural skincare formulator, in Western Australia. From the beginning it was a maker's brand rather than a marketing brand: Larsen formulated the products herself from natural ingredients, and the house has stayed deliberately small, blending its products in small batches in Australia rather than scaling onto a mass production line. What makes the story remarkable is where those small batches ended up. Sodashi built its reputation inside five-star hotel spas and destination spas around the world, the most demanding retail environment in skincare, where guests can afford anything and spa directors audit everything. For a therapist, this heritage is the answer to the guest who has never heard of the brand and wonders why the spa carries it. Sodashi is not unknown because it is minor; it is quietly distributed because it is a small-batch house that chose depth in the world's best spas over breadth on the high street. Scarcity, in this house, is part of the luxury.`,
        },
        {
          heading: 'The name is the philosophy',
          body: `Sodashi is derived from Sanskrit and is usually translated as wholeness, purity and radiance, and the house treats those three words as a formulation brief rather than a slogan. Wholeness is the holistic commitment: treatments and products that address the whole person, using essential oils for the mind and senses as well as plant actives for the skin. Purity is the formulation promise, and it is the strictest in mainstream luxury spa: completely natural products, free from synthetic chemicals, artificial fragrances and fillers. Radiance is the outcome, because the house has always insisted that purity is not a compromise; the products are formulated to perform at genuine luxury level, not merely to be gentle. A therapist should be able to unpack the name in exactly this way, because it converts a pretty word into a three-part argument for the brand. When a guest asks what Sodashi means, the answer is a thirty-second masterclass in why they are lying on your couch, and it is one of the easiest pieces of brand storytelling in the industry to deliver warmly.`,
        },
        {
          heading: 'The USP in one breath',
          body: `Every therapist on a Sodashi account should be able to state the house USP in a single sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: Sodashi offers pure, completely natural, high-performance skincare, hand-blended in small batches in Australia, and delivered through deeply personal, touch-rich spa rituals. Each clause earns its place. Pure and completely natural, because the absence of synthetic chemicals, artificial fragrance and fillers is the brand's hardest and most distinctive claim. High-performance, because the house rejects the assumption that natural means weak. Hand-blended in small batches in Australia, because provenance and craft are what the guest is paying a premium for. Delivered through touch-rich rituals, because Sodashi earned its name in treatment rooms, and the experience is inseparable from the product. When a guest compares Sodashi with a natural brand from the supermarket, this sentence gives you an honest, specific answer that elevates the house without disparaging anything else, which is exactly how luxury speaks.`,
        },
        {
          heading: 'Speaking Sodashi: the house voice',
          body: `A product house is also a vocabulary, and the Sodashi voice is calm, warm, sincere and unhurried. Its natural words are purity, wholeness, radiance, nurture, balance, hand-blended, ritual. It speaks of provenance and craft as readily as results, and it never shouts: a house built on purity persuades by quiet confidence, not clinical percentages or hard sell. Contrast this with a results-led clinical house, where the voice is technical and outcome-driven; neither voice is superior, but each belongs to its own brand, and a therapist reciting laboratory language in a Sodashi treatment room sounds like a visitor rather than a resident. Practise translating your knowledge into the house voice: not this product contains active concentrations for barrier repair, but everything in this cream is from nature, chosen for your skin, and you will feel the difference by morning. The voice matters most under challenge. When a knowledgeable guest probes the natural claim, the Sodashi answer stays calm and specific: what the products contain, what they deliberately leave out, and where and how they are made.`,
        },
      ],
      keyTerms: [
        { term: 'Small-batch production', definition: `Making products in limited quantities with close human oversight rather than on a mass line; central to Sodashi's craft story and its Australian provenance.` },
        { term: 'Completely natural', definition: `Sodashi's formulation promise: products built from natural ingredients and free from synthetic chemicals, artificial fragrances and fillers.` },
        { term: 'Holistic', definition: `Treating the whole person, mind and body together; in Sodashi's terms, the wholeness of the name, expressed through essential oils and high-touch treatment design.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The unfamiliar name at Harewell Manor, the Cotswolds',
        scenario: `Priya is a therapist at Harewell Manor, a five-star country house spa in the Cotswolds that carries Sodashi. Her guest, Mrs Ellison, arrives for a facial she was gifted and admits, slightly apologetically, that she has never heard of the brand and nearly swapped the voucher for a massage: surely a serious spa would carry a name she recognised from the department store? Priya senses that a defensive answer, or a vague one, will colour the entire hour. The guest is not hostile, just unconvinced, and she is watching Priya's face for the smallest flicker of doubt about the products she is about to use.`,
        insight: `Priya smiles and turns the objection into the story: Sodashi is a small Australian house, founded by an aromatherapist in 1999, hand-blended in small batches, completely natural, and found almost nowhere except spas like this one, because it grew up in five-star treatment rooms rather than department stores. Not recognising the name, she explains warmly, is part of what the guest is enjoying: something her friends have not found yet. The professional lesson: for a quietly distributed house, obscurity is an invitation to tell the story, and the story, told with conviction, is the brand's best advertisement.`,
      },
      summary: `Sodashi is a small Australian house founded in 1999 by aromatherapist Megan Larsen, hand-blending completely natural products in small batches in Western Australia, and famous almost entirely through the world's finest hotel and destination spas. Its name, from Sanskrit, is usually translated as wholeness, purity and radiance, and those words carry the whole philosophy: holistic treatment of the whole person, formulation free from synthetic chemicals, artificial fragrance and fillers, and genuine luxury performance. The USP, pure natural skincare delivered through touch-rich ritual, should live on every therapist's tongue in the house's calm, sincere voice.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Present the Samadara Ultimate Age-Defying Cream as the house flagship and explain its place in the range`,
        `Explain Sodashi's ingredient philosophy of plant actives, essential oils and mineral-rich naturals, including what the products deliberately leave out`,
        'Apply a reliable, honest method for learning any natural range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The flagship first: Samadara',
          body: `Every house has a product that carries its reputation, and for Sodashi that is the Samadara Ultimate Age-Defying Cream, the house's flagship prestige product and the jar guests and press mention first. Learn it before anything else: what it is, an age-defying cream at the very top of the range; who it suits, the guest investing seriously in long-term skin quality; and where it sits in treatment, crowning the Samadara facial on menus that carry one. You do not need to recite a full formulation to present it well, and you must not invent one. What you need is the honest positioning sentence: this is the house's ultimate cream, completely natural like everything Sodashi makes, and the centrepiece of our most indulgent facial. Around the flagship sit the face and body ranges, organised by skin need on the same natural foundation. Master the flagship first because it anchors the most valuable conversations you will have: the prestige facial booking, the serious retail purchase, and the guest who asks what the very best is.`,
        },
        {
          heading: 'The ingredient story: what is in, and what is out',
          body: `Sodashi's formulation story has two halves, and the second is the more distinctive. The first half is what goes in: plant actives chosen for genuine skin benefit, essential oils chosen for the senses and the nervous system as well as the skin, and mineral-rich natural ingredients such as clays and floral waters. The second half is what stays out: synthetic chemicals, artificial fragrances and fillers. Train yourself to sell with both halves, because in a market saturated with vague natural claims, the exclusion list is what makes Sodashi's purity concrete. A guest who has heard a hundred brands say botanical has rarely heard a therapist say, calmly and specifically, there is nothing synthetic in this jar. In treatment, narrate at natural moments in single sentences: what it contains, what it leaves out, and how the guest will feel. The guest's own senses, the scent of real essential oils and the feel of the product, verify the story in real time, which is the most honest advertising in the industry.`,
        },
        {
          heading: 'Aromatherapy at the root',
          body: `Because the founder is an aromatherapist, essential oils are not a fragrance decision at Sodashi; they are a functional layer of the formulation and of the treatment. Essential oils speak to the nervous system through scent while they work on the skin, which is why a Sodashi treatment can relax a guest as deeply as a massage while delivering a visible facial result. For the therapist this creates a practical craft: introduce scent deliberately. Let the guest smell a product before it touches their skin where the protocol allows, name the naturals they are smelling, and connect scent to outcome: the oils in this blend are chosen to settle you as much as to treat your skin. It also creates a duty of care: genuinely natural essential oils are active substances, so consultation matters, and any allergies, sensitivities, pregnancy or skin conditions must be checked against the spa's protocols before treatment, exactly as your training requires. Natural never means automatically suitable for everyone, and saying so, when relevant, is one more proof of your professionalism.`,
        },
        {
          heading: 'How to learn a natural range honestly',
          body: `No course can teach every product on your particular spa's Sodashi shelf, because ranges evolve and menus differ, so the meta-skill matters more than any list. First, flagship and heroes before everything: they answer most guest questions and anchor most retail. Second, one category at a time, cleansers as a family, then moisturisers, then body, learning each category's logic rather than memorising isolated items. Third, use the spa's testers and the house training materials; the brand's own words are your only safe source for ingredient claims, which matters doubly in a purity-led house where a single invented detail can undermine the entire natural promise. Fourth, use the key products on your own skin, because conviction cannot be faked and guests read certainty in seconds. Fifth, keep the honest gap: when asked something you do not know, say what you do know, offer to check, and actually check. A therapist who follows this method can walk into an unfamiliar Sodashi spa and be genuinely fluent within their first week.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship product', definition: `The product that carries a house's reputation and anchors its prestige offer; for Sodashi, the Samadara Ultimate Age-Defying Cream.` },
        { term: 'Exclusion list', definition: `The things a purity-led house deliberately leaves out; for Sodashi, synthetic chemicals, artificial fragrances and fillers, and a powerful, concrete retail argument.` },
        { term: 'Plant actives', definition: `Naturally derived botanical ingredients selected for genuine skin benefit; one pillar of Sodashi's formulation alongside essential oils and mineral-rich naturals.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; essential in a house whose whole promise rests on accuracy about purity.` },
      ],
      caseStudy: {
        title: 'The label-reader at The Aldworth, Mayfair',
        scenario: `Tomas has recently joined the spa at The Aldworth, a five-star hotel in Mayfair, on its Sodashi account. His guest, Ms Keane, works in cosmetics buying and reads ingredient labels for a living. Midway through the consultation she says, pleasantly but pointedly, that every brand claims to be natural these days, and asks Tomas what exactly makes Sodashi different, and whether the cream he plans to use contains anything synthetic at all. His formal brand training is booked but has not yet happened, and he feels the pull to improvise an impressively technical answer to match her expertise.`,
        insight: `Tomas stays inside what he knows to be true. He gives the two-sided story: plant actives, essential oils and mineral-rich naturals in; synthetic chemicals, artificial fragrances and fillers out; hand-blended in small batches in Western Australia by a house founded by an aromatherapist. On her detailed formulation question he uses the honest gap, saying what he knows, and promising the brand's own documentation from the spa's training folder after the treatment, which he delivers. Ms Keane later buys the cleanser. With an expert guest, accuracy plus honesty outperforms improvised chemistry every time, and in a purity house it is the only safe play.`,
      },
      summary: `Sodashi product mastery starts at the top with the Samadara Ultimate Age-Defying Cream, the house flagship, then builds outward through ranges organised by skin need. The ingredient story has two halves: plant actives, essential oils and mineral-rich naturals in, and synthetic chemicals, artificial fragrances and fillers out, with the exclusion list doing the hardest selling. Aromatherapy sits at the root, so scent is functional and consultation is essential. Beyond any list, the lasting skill is the learning method: flagship first, one category at a time, the brand's own materials, personal use, and the honest gap instead of invention.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Read an unfamiliar Sodashi treatment menu on day one and identify the flagship, the layers and the enhancements`,
        `Deliver the house's high-touch, ritual-led signature style and retail the range by prescription from the treatment`,
        `Build integrity-led upsell paths and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every Sodashi spa writes its own menu around the range, so the day one discipline is a reading method, not a memorised list. Start with the flagship: find the treatment the spa positions at the top of its facial offer, often a Samadara age-defying facial where the flagship cream is stocked, and learn it completely before anything else, because it is the booking with the highest expectations attached. Then map the menu in layers: the facials and what distinguishes each tier, the body treatments and rituals, the massage offer and how the products serve it, and finally the enhancements, the add-ons that extend or deepen a booking. For each treatment note four things: duration, protocol source, products used, and who it is for. Read the written protocols the spa holds, shadow a senior therapist where you can, and ask questions before your first guest rather than improvising in front of one. A therapist who can honestly say I know this menu by the end of day one is rare, and remembered.`,
        },
        {
          heading: 'Delivering the signature style',
          body: `Sodashi's treatment identity is high-touch, natural luxury, and the delivery must match the purity of the jar. In practice that means four disciplines. Generous, skilled hands-on time, because touch is the medium through which this house speaks; guests choose a Sodashi spa for a deeply human experience, and the massage elements of its facials and rituals are never the parts to economise. Unhurried flow, with transitions as considered as techniques, so the hour feels hand-made rather than processed. Deliberate use of scent, introducing the natural aromatics as part of the experience, because aromatherapy is the root of the house. And personalisation at every decision point, from consultation through product selection to pressure and focus, so the guest feels the treatment was composed for them. Protect the ritual absolutely under time pressure: the openings, the touch-rich passages and the considered close are the first things a rushed therapist trims and the last things this brand would sacrifice, because in a house famous for craft, the craft is the product.`,
        },
        {
          heading: 'Retail: purity continued at home',
          body: `Sodashi retail succeeds when it is framed as the treatment, and the purity, going home with the guest. During the treatment, narrate the key products at natural moments, one sentence each, while the guest is experiencing them: what it contains, what it leaves out, how it feels. At the close, prescribe rather than pitch: two or three products, each linked explicitly to the treatment just delivered and to what your consultation and analysis found. The natural story gives your prescription a distinctive edge: for the guest wary of overloaded routines or sensitised by harsh actives, a completely natural regime is itself the recommendation, and you can say honestly that everything in it is free from synthetic chemicals, artificial fragrance and fillers. Tell them what not to buy as well, which builds the trust that compounds over years. Write the prescription down, because a card with two named products converts far better than a verbal mention at a busy desk, and record it on the guest's history so the next therapist can continue the story rather than restart it.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths in a Sodashi spa follow the menu's natural landscape. The facial guest who responded visibly and loved the experience is a flagship facial guest next visit; say so at the close, honestly, and note it on their record. The sixty-minute booking carrying real tension or a complex skin picture genuinely benefits from ninety minutes, offered once, warmly, at booking or in consultation. Enhancements let a guest deepen today's booking without changing it, answering something the consultation surfaced. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill, and in a house whose entire identity is purity, a pushy or cynical sell is a brand violation as real as a wrong product. Alongside selling the brand, you protect it: correct products in correct quantities, protocols followed faithfully rather than privately varied, testers and retail displays immaculate, low stock reported before it forces substitutions, and the ritual never quietly shortened to rescue a late column; flag the schedule instead. Guests experience the brand only through its therapists. On a Sodashi shift, you are Sodashi.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a spa positions at the top of its menu and the first to master on day one; on Sodashi menus, often a Samadara age-defying facial built around the flagship cream.` },
        { term: 'Enhancement', definition: `An add-on that extends or deepens an existing booking, letting a guest upgrade the outcome without changing the treatment.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely loved or needs, such as a classic facial to the flagship facial, or sixty minutes to ninety.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct products and quantities, faithful protocols, immaculate presentation, stock reporting and the ritual delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at Fenwick Hall, North Yorkshire',
        scenario: `Amara, an experienced agency therapist, arrives at Fenwick Hall, a five-star spa hotel in North Yorkshire, for her first shift on its Sodashi menu. She has forty minutes before her first guest, so she asks the head therapist for the menu and protocols, learns the spa's flagship Samadara facial structure first, and confirms the products for her first two bookings. Her second guest, Mrs Okafor, is a regular who books the same classic facial every month, mentions that her skin has felt reactive since trying a strong retinol product at home, and sighs that no one has ever suggested she try anything different at the spa.`,
        insight: `Amara's preparation makes the professional move available. In consultation she adapts to the sensitised skin, and in treatment she narrates the natural story, what the products contain and what they leave out, which lands powerfully with a guest whose skin is reacting to harsh actives. At the close she prescribes two gentle products, advises pausing the retinol per the guest's own dermatology advice rather than diagnosing, and opens the honest upgrade path: the flagship facial next visit, noted on the record. One shift, one honest prescription, one guest given a reason to return, and an agency therapist Fenwick Hall asks for by name.`,
      },
      summary: `Mastering a Sodashi shift is a craft with four faces. Read the menu like a professional, flagship first, noting duration, protocol, products and audience for every treatment. Deliver the signature style faithfully: generous touch, unhurried flow, deliberate scent and personalisation at every decision point, with the ritual protected under any time pressure. Retail as purity continued at home, prescribing two or three products linked to the treatment and written down. And build honest upgrade paths while protecting the standards, because in a small-batch house built on craft, the therapist on shift is the brand.`,
    },
  ],
}
