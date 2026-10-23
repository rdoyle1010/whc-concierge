import type { CourseContent } from '../academy-types'

// Split out of the pack beside it so a course title can be imported
// without dragging every lesson of every course along with it.

export const content: CourseContent = {
  slug: 'skin-rocks-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Skin Rocks, the British skincare brand founded by aesthetician Caroline Hirons. It covers the founding story and education-first philosophy that shape the brand, the hero products and the way the brand itself explains them, and the practical craft of working with Skin Rocks in a spa: understanding the Skin Rocks Pro professional offer, recommending and retailing the range around a guest's real routine, introducing active ingredients responsibly, and upholding the standards that protect both the guest and the brand's name. Where details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent Talent House training and is not affiliated with or endorsed by Skin Rocks.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas, salons and clinics that retail Skin Rocks or offer Skin Rocks Pro facials. It suits therapists whose guests arrive already following Caroline Hirons and expect an informed conversation, retail and reception colleagues who advise on the range, experienced therapists adding a results-focused skincare brand to their knowledge, and spa managers or head therapists who coach retail standards. Anyone who recommends active skincare to guests will benefit from the lesson on introducing actives responsibly.`,
  outcomes: [
    `Tell the Skin Rocks founding story and articulate its education-first philosophy and USP in confident, guest-ready language`,
    'Name the hero products and explain, accurately and with attribution, where each sits in a routine and who it suits',
    'Describe the Skin Rocks Pro professional offer honestly and check your own spa menu before promising a treatment',
    `Recommend and retail the range around the guest's existing routine, one or two products at a time`,
    'Introduce active ingredients responsibly and uphold the standards that protect the guest and the brand',
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount the Skin Rocks founding story and explain why Caroline Hirons's background shapes the brand`,
        'Explain the education-first philosophy and why the brand began with advice before products',
        'Articulate the Skin Rocks USP to a guest in one confident, accurate sentence, in the house voice',
      ],
      sections: [
        {
          heading: 'A founder who learned skincare on the shop floor',
          body: `Skin Rocks is the brand of Caroline Hirons, a British aesthetician and author who built her reputation by explaining skincare to ordinary people in plain language. Her career began behind department store counters, including the Aveda counter at Harvey Nichols, with stints at Liberty and Harrods, and she later worked for Space NK while qualifying as a beauty therapist. She began writing a skincare blog in 2010, and her following grew into one of the largest in British beauty. Her book Skincare: The Ultimate No-Nonsense Guide became a Sunday Times number one bestseller and won Non-Fiction Lifestyle Book of the Year at the 2021 British Book Awards. For a therapist this background is not trivia. It explains why so many Skin Rocks guests arrive well read, why they value straight answers, and why the brand speaks the language of the counter and the treatment room rather than the language of advertising. The founder has stood where you stand, advising one guest at a time.`,
        },
        {
          heading: 'Advice first, product second',
          body: `Most skincare brands launch a product and then build the education around it. Skin Rocks travelled the other way. In July 2022 Hirons launched the Skin Rocks app, described at launch as a back-to-basics guide to skincare that covers products from many brands, not only her own. The first Skin Rocks products followed in November 2022, and they were not a gentle cleanser or a pretty moisturiser but two retinoids, among the most misunderstood ingredients in skincare. That choice says a great deal. The brand set out to help people use effective ingredients properly, with clear guidance on who should start where. Its own line puts it simply: Skin Rocks wants to make skincare make sense. Alongside the products the brand offers a routine builder that asks about a person's skin and suggests a routine, which tells you how the house thinks: a product only makes sense as part of a routine that fits the person using it.`,
        },
        {
          heading: 'The USP in one breath',
          body: `Every therapist who works with Skin Rocks should be able to state the brand's USP in a single sentence, because Skin Rocks guests ask, and they notice hesitation. A reliable version: Skin Rocks is no-nonsense, routine-led skincare created by a working aesthetician, built to help people understand their skin and use active ingredients properly. Each clause earns its place. No-nonsense, because plain speaking is the founder's signature and the reason her audience trusts her. Routine-led, because the brand teaches products as steps in a routine rather than as isolated treats. Created by a working aesthetician, because Hirons's professional background is the brand's deepest point of difference. Active ingredients used properly, because the brand began with retinoids and teaches careful introduction. When a guest asks why they should choose Skin Rocks over something cheaper online, this gives you an honest, specific answer that elevates the brand without disparaging any other, which is exactly how a professional speaks.`,
        },
        {
          heading: 'Speaking Skin Rocks: the house voice',
          body: `Every brand has a vocabulary, and using the wrong one is as noticeable as using the wrong products. The Skin Rocks voice is direct, warm and educational. It explains rather than enchants. It is comfortable naming ingredients and saying who a product is and is not for. Contrast this with a ritual-led spa house whose language is about mood, ceremony and escape; neither voice is better, but each belongs to its own brand. A therapist who drifts into vague luxury language with a Skin Rocks guest can sound evasive, while one who explains clearly what a step does and why it is in the routine sounds like the founder's own advice made personal. Practise translating your knowledge into this voice: not this will transform your skin, but this is the step your routine is missing, here is why, and here is how to start it slowly. Above all, the house voice never overstates. If you do not know, say so and check, which is precisely what the brand's own guidance models.`,
        },
      ],
      keyTerms: [
        { term: 'Aesthetician', definition: `A skin care professional trained in facial treatments and skin analysis; Caroline Hirons's profession, and the root of the brand's practical, routine-led approach.` },
        { term: 'Education-first brand', definition: `A brand that leads with guidance on understanding and using skincare, with products presented as part of that teaching; Skin Rocks launched its app before its first products.` },
        { term: 'Routine-led', definition: `Presenting products as steps in a daily routine suited to the individual, rather than as standalone purchases.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a brand from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The well-read guest at The Aldbury, Mayfair',
        scenario: `Priya is a therapist at The Aldbury, a five-star hotel spa in Mayfair that retails Skin Rocks. Her guest, Ms Hartley, mentions during consultation that she has read Caroline Hirons for years and owns the book. She then asks, with a slight edge, whether Priya actually knows the brand or is just going to read from the box. Priya feels the pull to prove herself by reeling off every ingredient she can remember, at speed, before the guest can test her further.`,
        insight: `Priya slows down instead. She tells the story briefly and accurately: the founder trained on the shop floor and as a therapist, the app came first in 2022 and the first products were two retinoids, because the brand wanted people to use actives properly. Then she asks Ms Hartley what her routine is now. The guest relaxes, because she has been met in the house voice: plain, informed and curious about her. The professional lesson: with a knowledgeable guest, accuracy and good questions build more trust than volume of information.`,
      },
      summary: `Skin Rocks is the British skincare brand of aesthetician and author Caroline Hirons, whose career on department store counters, at Space NK and as a bestselling writer shaped its plain-speaking style. The brand began with advice, launching the Skin Rocks app in July 2022, and followed with its first products, two retinoids, in November 2022. Its stated aim is to make skincare make sense. The USP, no-nonsense routine-led skincare created by a working aesthetician, should be delivered in the house voice: direct, warm, educational and never overstated.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        'Identify the Skin Rocks hero products and describe where each sits in a routine',
        `Explain key ingredients using the brand's own descriptions, attributed and without invented detail`,
        'Apply a reliable, honest method for learning the current range and checking claims',
      ],
      sections: [
        {
          heading: 'Cleansing: the foundation of the routine',
          body: `Cleansing sits at the start of every routine the brand teaches, and the two cleansers are among the products guests ask about most. The Cream Cleanser is a non-foaming cream that the brand describes as suitable for all skin types, highlighting amino acids, squalane and jojoba seed oil as ingredients chosen to support the skin barrier. The Gel Cleanser is built on what the brand calls a blend of six oils, avocado, jojoba, sunflower, grape, argan and rosehip, and there is also a fragrance-free version, which matters for guests who avoid fragrance. Learn the difference in a sentence each: cream for comfort and a cushioned cleanse, gel for those who prefer a lighter texture. Then learn how to explain why cleansing matters to the rest of a routine, because a guest who understands that is far more likely to keep using what you recommend. As always, describe texture and feel from your own use, and leave efficacy claims to the brand's own wording.`,
        },
        {
          heading: 'The retinoids: where the brand began',
          body: `Retinoid 1 and Retinoid 2 were the first Skin Rocks products, and they remain central to the brand's identity. The brand positions Retinoid 1 for beginners and for people with concerns around sensitivity; alongside its retinoid it includes bakuchiol and soybean extract, which the brand describes as boosters, with squalane and vitamin E for conditioning. Retinoid 2 combines two retinoid forms and is aimed, in the brand's words, at people already using a retinol or retinal who want to build on their results. The brand's own guidance is that sensitive skin should start with Retinoid 1, and that anyone introducing a new active should patch test first. A therapist does not need to recite strengths to be credible here; in fact the brand's own pages are the right place for those details. What you must be able to do is ask what the guest uses now, place them at the right starting point using the brand's guidance, and explain why starting gently is not a lesser choice but the correct one.`,
        },
        {
          heading: 'Treat, tone and moisturise: the wider range',
          body: `Around the cleansers and retinoids sits a focused range, each product with a clear role. The Antioxidant is a multi-ingredient serum whose vitamin C is tetrahexyldecyl ascorbate, an oil-soluble form the brand describes as gentle and stable. The Hyperpigmentation Serum targets uneven tone, in the brand's description. Gentle Acid appears in the brand's beginner routine as a step before serum, used a few times a week rather than daily, and The Amplifier is described by the brand as a performance enhancing essence. For hydration and comfort there is The Rich Moisturiser, which the brand describes as intensely nourishing and barrier-replenishing for dry skin, The Support Oil for dry skin, and The Eye Cream, presented as a daily treatment for the eye area. Several heroes, including The Antioxidant, both retinoids and The Eye Cream, are sold with refills that replace the inner bottle, which matters to guests who care about packaging. Ranges evolve, so confirm what is currently stocked in your spa.`,
        },
        {
          heading: 'How to learn the range properly',
          body: `No course can teach you every product on your spa's shelf, because ranges change and each spa stocks a selection, so the method matters more than any list. First, heroes before everything: the two cleansers, the two retinoids and The Antioxidant answer most guest questions. Second, learn by routine step rather than by product: which products cleanse, which treat, which moisturise, and which actives should not be stacked carelessly. Third, use the brand's own product pages and any training materials your spa holds, because the brand's words are your safest source for claims, strengths and directions. Fourth, use the products yourself, so you can describe texture and feel honestly. Fifth, keep the honest gap: with Skin Rocks guests, who often know a great deal, saying I will check that for you is a mark of professionalism, not weakness, provided you then actually check. A therapist who follows this method can be genuinely fluent in the range within a week.`,
        },
      ],
      keyTerms: [
        { term: 'Hero product', definition: `An iconic product that carries a brand's reputation and that guests ask for by name; for Skin Rocks, think of The Cream Cleanser, The Gel Cleanser, Retinoid 1, Retinoid 2 and The Antioxidant.` },
        { term: 'Retinoid', definition: `The family of vitamin A derived ingredients used in skincare; Skin Rocks launched with two retinoid serums at different starting levels.` },
        { term: 'Active ingredient', definition: `An ingredient included to achieve a specific skin effect, such as a retinoid, acid or vitamin C, which should be introduced gradually and with care.` },
        { term: 'Refill', definition: `A replacement inner bottle for an existing product, offered by Skin Rocks for several heroes to reduce packaging.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The retinoid question at Thornleigh Park, the Cotswolds',
        scenario: `Callum works at Thornleigh Park, a country house hotel spa in the Cotswolds that retails Skin Rocks. After a facial, his guest Mrs Okafor says she has read that Retinoid 2 is the stronger one and wants to buy it, since she wants results quickly. She has never used a retinoid before and mentions that her skin reacts to some products. Callum knows Retinoid 2 is the more expensive option and that the guest is ready to buy.`,
        insight: `Callum explains, using the brand's own guidance, that Retinoid 2 is intended for people already using a retinoid, and that the brand recommends Retinoid 1 for beginners and for sensitive skin, with a patch test before starting. He suggests she begins slowly, wears daily sun protection, and comes back to discuss moving up when her skin is comfortable. She buys Retinoid 1 and The Cream Cleanser. The professional lesson: the right starting point is the brand's own advice, and a guest who is protected from a bad first experience becomes a loyal one.`,
      },
      summary: `Skin Rocks product mastery starts with the heroes: The Cream Cleanser and The Gel Cleanser at the foundation of the routine, Retinoid 1 and Retinoid 2 where the brand began, and The Antioxidant with its oil-soluble vitamin C. Around them sit The Hyperpigmentation Serum, Gentle Acid, The Amplifier, The Rich Moisturiser, The Support Oil and The Eye Cream, with refills for several heroes. Learn by routine step, use the brand's own wording for claims and directions, place guests at the brand's recommended starting point, and keep the honest gap rather than inventing detail.`,
    },
    {
      title: 'Treatments, retail and recommending with standards',
      objectives: [
        'Describe the Skin Rocks Pro professional offer honestly and confirm what your own spa provides',
        `Recommend and retail the range around the guest's existing routine, one or two products at a time`,
        'Introduce active ingredients responsibly and uphold the standards that protect guest and brand',
      ],
      sections: [
        {
          heading: 'Skin Rocks Pro: the professional offer',
          body: `In 2025 Skin Rocks launched Skin Rocks Pro, a professional-only line for salons, clinics and skin therapists, with its own treatment protocols and products available only to professionals. The initial menu announced six facials: Amplified, presented as the hero treatment for dullness and luminosity; Control, for oil and congestion; Hydration; Hyperpigmentation; Regenerative; and Support, focused on the skin barrier. Each is personalised to the client and each includes a signature massage, lifting or lymphatic depending on the facial. Training is delivered by the brand, requires at least a Level 2 Ofqual-regulated beauty therapy qualification, and in March 2026 a Skin Rocks Pro Academy opened in Farringdon, London. Provider line-ups differ and the menu may change, so never assume your spa offers a particular facial or that you may deliver one untrained. On day one, ask your spa manager which treatments, if any, are on your menu, and learn the protocols the brand has trained the team in.`,
        },
        {
          heading: 'When your spa retails the range',
          body: `Many hotel spas will meet Skin Rocks as a retail brand rather than a treatment house, and that is honest to say. In that setting the therapist's craft is recommendation, and it suits the brand perfectly, because Skin Rocks is built around helping people understand their own routine. Begin with questions, not products: what does the guest use morning and evening, what are they happy with, what is bothering them, and what actives are they already using. Then find the gap. Perhaps they are using strong actives with a harsh cleanser, and a gentler cleanse is the missing step; perhaps they have never used a retinoid and are curious. Recommend one or two products that fill that gap, explain why in plain language, and show them how to use each, in the brand's own order of steps. Write the recommendation down, and note it on the guest record so the next therapist can continue the conversation. A guest who leaves with one product that genuinely fits will come back for the next.`,
        },
        {
          heading: 'Recommending actives responsibly',
          body: `Because Skin Rocks is a results-focused brand that includes retinoids, acids and vitamin C, retailing it carries real responsibility. Four habits keep your advice safe and on brand. One active at a time: introduce a single new active and let the skin settle before adding another, so that if a reaction occurs the cause is clear. Start where the brand says to start: use the brand's own guidance on starting levels, such as Retinoid 1 for beginners and sensitive skin, and its directions on frequency, such as using Gentle Acid a few times a week. Patch test, as the brand recommends before introducing any new active. Daily sun protection, explained clearly whenever actives are discussed. Beyond these, know your limits. A therapist advises on cosmetic skincare; a guest who is pregnant, under medical treatment, using prescription skincare or describing a persistent skin condition should be advised to speak to their doctor or pharmacist before starting actives. Saying so is part of the professional standard, not a lost sale.`,
        },
        {
          heading: 'Upholding standards on shift',
          body: `A brand's reputation in a spa is carried by its therapists, and Skin Rocks guests, who often know the founder's advice closely, will notice quickly if it is misrepresented. Use the brand's language accurately and attribute claims to it: the brand describes this as, rather than this will. Never overstate results or promise timelines. Keep testers clean, labelled and in date, and do not let guests apply actives from shared testers to their face without guidance. Know which products are currently stocked and report low stock before it forces a poor substitute. Respect the brand's starting guidance even when a guest pushes for something stronger, and record what you advised. Where your spa offers Skin Rocks Pro facials, follow the trained protocol rather than your own variant and never deliver a treatment you have not been trained in. Upsell only when it improves the guest's outcome: the right next step in their routine, at the right time, which is precisely the brand's own approach.`,
        },
      ],
      keyTerms: [
        { term: 'Skin Rocks Pro', definition: `The professional-only Skin Rocks line launched in 2025 for salons, clinics and skin therapists, with its own facials, protocols and brand-delivered training.` },
        { term: 'Lifting and lymphatic massage', definition: `The two signature massage styles built into the Skin Rocks Pro facials, with each facial using one or the other depending on its focus.` },
        { term: 'Routine gap', definition: `The step missing from, or working against, a guest's current routine; the starting point for an honest, targeted recommendation.` },
        { term: 'Patch test', definition: `Trying a new product on a small area of skin before full use, which the brand recommends before introducing any new active.` },
        { term: 'Brand standards', definition: `The practices that protect a brand's reputation on shift: accurate attributed language, clean and in-date testers, trained protocols, stock reporting and responsible advice.` },
      ],
      caseStudy: {
        title: 'The facial request at Kingsmere House, Harrogate',
        scenario: `Elena has just started at Kingsmere House, a hotel spa in Harrogate that retails Skin Rocks. A guest at reception says she has seen the Skin Rocks Pro Amplified facial online and wants to book it for this afternoon. Elena has used the retail products but has not checked whether the spa offers Skin Rocks Pro facials, and the receptionist looks to her for an answer. She is tempted to say yes and adapt a standard facial using the retail range.`,
        insight: `Elena checks with the spa manager and confirms that Kingsmere House retails the range but does not offer Skin Rocks Pro facials, and that no one on the team is trained in the protocol. She tells the guest honestly, offers the spa's own results-focused facial instead, and after the treatment recommends one Skin Rocks product for the gap she found in the guest's routine. The professional lesson: never improvise a branded professional treatment. Check the menu, be honest about what the spa provides, and let accurate recommendation carry the brand.`,
      },
      summary: `Skin Rocks Pro, launched in 2025, brought the brand into professional skin care with six initial facials, each personalised and each including a signature lifting or lymphatic massage, delivered by therapists the brand has trained. Many hotel spas will work with Skin Rocks as a retail brand, so the core craft is recommendation: ask about the guest's routine, find the gap, and suggest one or two products with clear reasons. Introduce actives one at a time from the brand's recommended starting point, with patch testing and daily sun protection, refer medical questions on, and protect the brand by speaking accurately and never improvising a treatment.`,
    },
  ],
}
