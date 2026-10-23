import type { CourseContent } from '../academy-types'

// Split out of the pack beside it so a course title can be imported
// without dragging every lesson of every course along with it.

export const content: CourseContent = {
  slug: 'myblend-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in myBlend, the personalised skincare house of the Clarins Group, rebuilt in 2022 under Dr Olivier Courtin. It covers the brand's true relationship to Clarins and the family behind it, the epigenetics-led philosophy and its Nutri, Derma and Tech ecosystem, the hero products a therapist must know cold, and the practical craft of a myBlend shift: consultation and skin diagnosis, technology-assisted facials delivered exactly as trained, prescribing retail from what the diagnosis found, honest upgrade paths and the standards that protect the brand. Where details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent Talent House training and is not affiliated with or endorsed by myBlend.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas that offer myBlend, including hotel spas that run it alongside Clarins. It suits therapists interviewing for a myBlend account who want to arrive fluent, experienced Clarins therapists who need to understand how myBlend differs, agency and freelance therapists who may meet the brand at short notice, and spa managers or head therapists who coach brand standards and technology use. Reception and retail colleagues will also gain a working command of the range and its language.`,
  outcomes: [
    `Explain myBlend's relationship to the Clarins Group and the Courtin family accurately, and state its USP in confident, guest-ready language`,
    `Describe the epigenetics-led philosophy and the Nutri, Derma and Tech ecosystem, attributing the science to the brand`,
    'Name the hero products, including the Superserums and La Crème Régénérante, and explain how they work together in a routine',
    'Run a consultation-led myBlend treatment, using the house technology only as trained, at five-star standard',
    'Prescribe retail from the skin diagnosis, build honest upgrade paths and uphold the standards that protect the brand',
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Explain accurately how myBlend relates to Clarins, the Clarins Group and Dr Olivier Courtin`,
        `Describe the epigenetics-led philosophy and the Nutri, Derma and Tech ecosystem in the brand's own terms`,
        `Articulate myBlend's USP to a guest in one confident, accurate sentence`,
      ],
      sections: [
        {
          heading: 'A family house, a separate brand',
          body: `To understand myBlend you first need the family. Clarins was founded in Paris in 1954 by Jacques Courtin-Clarins, who began with a beauty institute and built one of the best known French skincare houses in the world. The Clarins Group is still owned by the Courtin family, and today it has two brands: Clarins and myBlend. myBlend was first launched by the group in 2007, and in 2022 it was relaunched and rebuilt under Dr Olivier Courtin, one of Jacques Courtin-Clarins' sons, a physician and a general manager of the group. The brand presents him as its founder, and some partner spas and press use the family's full name, Dr Olivier Courtin-Clarins. The point a therapist must hold onto is simple and often misunderstood: myBlend belongs to the same family and group as Clarins, but it is not Clarins under another label. It has its own formulas, its own treatment menu, its own spas and its own point of view. When a guest says "so this is just Clarins", the accurate, respectful answer is that it is the family's other house, with a quite different philosophy.`,
        },
        {
          heading: 'The doctor and the idea: epigenetics',
          body: `myBlend's philosophy grows out of Dr Courtin's medical work, and the brand places one idea at its centre: epigenetics. Put simply, epigenetics is the study of how our environment and behaviour influence the way our genes are expressed. The brand's position is that how our skin ages is shaped far more by how we live, sleep, eat, manage stress and protect ourselves than by the genes we inherit. Dr Courtin has written books on the subject, and the brand describes its approach as guided by it. For a therapist, the practical meaning is that a myBlend guest is never just an age or a skin type. Their routine, their environment and their habits are part of the picture, which is why consultation matters so much in this house. Two disciplines keep this professional. Explain the idea simply, in plain language, rather than reaching for scientific jargon. And attribute it: say "the brand's philosophy is" or "myBlend believes", not "science has proven". A guest who works in healthcare will respect you more for the careful phrasing, not less.`,
        },
        {
          heading: 'Nutri, Derma, Tech: one ecosystem',
          body: `The 2022 relaunch organised the whole brand around three pillars that are meant to work together, which the brand describes as a synergy. Derma is the skincare: cleansers, exfoliation, serums and creams. Nutri is the range of food supplements, designed to support the skin from within. Tech is beauty technology, led by the myLEDmask for use at home and, in the spa, professional devices used by trained therapists. The idea is that each pillar strengthens the others, so the brand often presents products in pairings, such as its cream used alongside the LED mask. This structure is the backbone of how you talk about the house. A guest is not being sold three unrelated purchases; they are being shown one plan with three possible layers. It also tells you where the boundaries are. Skincare and treatment are the therapist's natural territory. Supplements and home devices are layers you can describe honestly from the brand's materials, but they are never pushed, and anything touching a guest's health goes to their own GP or pharmacist.`,
        },
        {
          heading: 'The USP in one breath, and the house voice',
          body: `Every therapist on a myBlend account should be able to state the USP in a single sentence. A reliable version: myBlend is personalised skin care from the Clarins family's doctor-led house, a complete ecosystem of skincare, supplements and technology, guided by epigenetics and built around a precise diagnosis of each guest. Each clause earns its place. Personalised, because the treatment and routine are built from what is found, not delivered off the peg. Doctor-led, because the brand's identity rests on Dr Courtin's medical perspective. Ecosystem, because Nutri, Derma and Tech are designed to work together. Diagnosis, because the consultation is where the personalisation actually happens. The house voice follows from this. It is calm, precise and science-literate, closer to a thoughtful clinic than a perfumed ritual, while still being warm and luxurious. Its natural words are personalised, synergy, diagnosis, regenerate, radiance, results. Speak in that register: clear, honest, never exaggerated, and always ready to say how the guest's skin will feel as well as what a product contains.`,
        },
      ],
      keyTerms: [
        { term: 'Clarins Group', definition: `The family-owned French beauty group founded from Jacques Courtin-Clarins' Paris institute in 1954; its two brands are Clarins and myBlend.` },
        { term: 'Epigenetics', definition: `The study of how environment and behaviour influence the way genes are expressed; the idea myBlend places at the heart of its philosophy of skin ageing.` },
        { term: 'Nutri, Derma, Tech', definition: `myBlend's three pillars: food supplements, skincare and beauty technology, designed by the brand to work together as one ecosystem.` },
        { term: 'Attribution', definition: `The professional habit of presenting a brand's scientific position as the brand's own ("myBlend believes") rather than as settled fact.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The Clarins regular at The Carrow, Chelsea',
        scenario: `Priya is a therapist at The Carrow, a five-star hotel spa in Chelsea that has just added myBlend facials alongside its existing menu. Her guest, Mrs Lindqvist, has used Clarins for twenty years and books the new myBlend facial out of curiosity. During consultation she says, a little warily, that she assumes this is simply the expensive version of what she already uses, and asks whether she should throw her current products away. Priya feels the pull either to over-praise the new brand or to brush the question aside and get on with the treatment.`,
        insight: `Priya does neither. She explains accurately that myBlend is the Clarins family's other house, rebuilt in 2022 under Dr Olivier Courtin, a physician and son of the Clarins founder, with its own philosophy built around how lifestyle shapes the skin. She reassures Mrs Lindqvist that nothing needs to be thrown away, and that the diagnosis will show what, if anything, her routine is missing. The professional lesson: getting the brand relationship right builds instant trust, and respecting a guest's existing loyalty is how luxury speaks.`,
      },
      summary: `myBlend is the second brand of the family-owned Clarins Group. It was first launched in 2007 and rebuilt in 2022 under Dr Olivier Courtin, a physician, son of Clarins founder Jacques Courtin-Clarins and a general manager of the group, whom the brand presents as its founder. It is not Clarins under another name. Its philosophy is epigenetics-led, holding that lifestyle and environment shape skin ageing, and it works as one ecosystem of Nutri, Derma and Tech. Its USP, personalised doctor-led skin care built around a precise diagnosis, should be spoken in a calm, precise voice, with the science attributed to the brand.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify myBlend's hero products and explain which concern each one answers`,
        'Explain how cleanser, Superserum, Pre-Serum and cream fit together as one routine, and where Nutri and Tech sit',
        'Tell ingredient stories in the brand\'s own terms without inventing figures or claims',
      ],
      sections: [
        {
          heading: 'Heroes first: the Superserums',
          body: `In any house a small number of products carry the reputation, and in myBlend the Superserums are the place to start. They are targeted, concentrated serums, each built around one concern, which makes them the natural link between a skin diagnosis and a home routine. Hydra+ is the hydration serum, built around hyaluronic acid and a peptide the brand developed for hydration. Radiance, called Éclat on the French sites, is for dull, tired-looking skin, with a vitamin C derivative, a radiance peptide and papain, an enzyme from papaya. Dark Spot, or Taches, is for the look of pigmentation, combining glycolic acid with a radiance peptide and hexylresorcinol. Blemishes, or Imperfections, is for breakouts and excess shine, built around salicylic acid and zinc gluconate. Learn all four until you can say, in one sentence each, what it is for and who it suits. Note that the brand publishes concentrations for some of these actives; quote them only from the brand's current materials, and in most conversations you will not need them at all. The concern and the feeling on the skin are what guests remember.`,
        },
        {
          heading: 'Pre-Serum and La Crème Régénérante',
          body: `Around the Superserums sit the products that turn a single fix into a full routine. The Revitalizing Pre-Serum is a two-part product: an antioxidant ampoule of fermented turmeric and vitamin E, paired with an essence that the brand describes as containing a radiance peptide and a marine prebiome. It is designed to prepare the skin before the serum step. Then the creams. La Crème Régénérante, sold in English as the Revitalizing Cream, is the house's anti-ageing cream, and the brand gives it lighter and richer companions: Le Fluide Régénérant, the Revitalizing Emulsion, a lighter texture the brand describes for day and night use, and a rich version for skin that wants more comfort. The brand also highlights its exclusive peptide complex as a signature of its formulas. In treatment and at retail, the clearest way to present all of this is as layers: prepare, target, protect. Ask yourself, for each guest, which Superserum the diagnosis points to and which cream texture suits their skin and climate. That is a recommendation the guest can understand and remember.`,
        },
        {
          heading: 'Cleansing that respects the barrier',
          body: `myBlend's cleansing step is a good example of how the brand thinks. Its enzymatic cleansers, a cleansing foam and a cleansing water, are described by the brand as free of soap and sulfates and pH neutral, made to clean without disturbing the skin barrier. For make-up and a deeper cleanse there is an intense balm-to-oil, and for exfoliation an Exfoliating Gel-Cream, which the brand presents as removing dead cells and excess sebum to refine texture and the look of pores. The story to tell guests is that a myBlend routine starts gently, because a calm, intact barrier is the base everything else builds on. This matters in practice. A guest with sensitive or reactive skin often arrives expecting high-performance skincare to be harsh, and the cleansing step is where you can show them otherwise. Keep claims to the brand's own wording, avoid medical language about conditions you are not qualified to assess, and refer any guest with a diagnosed skin condition to check with their dermatologist or GP before changing their routine.`,
        },
        {
          heading: 'Nutri and Tech, and how to learn a range properly',
          body: `The other two pillars complete the picture. Nutri is myBlend's food supplement range; Nutri Glow is presented by the brand as a supplement for complexion radiance. Tech is led by the myLEDmask, an at-home LED mask using red and near-infrared light, which the brand pairs with its cream as one of its signature synergies. Know what each is and how the brand positions it, but hold two boundaries. Do not make health claims about supplements, and send any guest who is pregnant, breastfeeding, on medication or managing a health condition to their GP or pharmacist before starting one. And repeat device claims only as the brand states them. Beyond any list, the lasting skill is the learning method. Heroes first. Then one category at a time: cleansers, Superserums, creams, then Nutri and Tech. Use the training materials your spa holds, because the brand's own words are your safest source for claims. Use the key products yourself so that your conviction is real. And when you are asked something you do not know, say what you do know, offer to check, and then actually check.`,
        },
      ],
      keyTerms: [
        { term: 'Superserum', definition: `myBlend's family of targeted, concentrated serums, each built for one concern: Hydra+ (hydration), Radiance or Éclat, Dark Spot or Taches, and Blemishes or Imperfections.` },
        { term: 'La Crème Régénérante', definition: `myBlend's anti-ageing cream, sold in English as the Revitalizing Cream, with a lighter Fluide and a richer version.` },
        { term: 'Skin barrier', definition: `The outer protective layer of the skin; myBlend presents its enzymatic, soap-free cleansers as designed to cleanse without disturbing it.` },
        { term: 'myLEDmask', definition: `myBlend's at-home LED mask using red and near-infrared light, the lead product of its Tech pillar, often paired by the brand with its cream.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The well-read guest at Westcombe Manor, Oxfordshire',
        scenario: `Tom has recently joined the spa at Westcombe Manor, a country house hotel in Oxfordshire offering myBlend. His guest, Dr Okafor, is a pharmacist who has read every ingredient list in advance. She asks which Superserum she should be using for the patches of pigmentation on her cheeks, exactly what percentage of acid is in it, and whether she should also take the Nutri Glow supplement alongside the medication she is on. Tom is tempted to reel off a confident number and say the supplement will be fine.`,
        insight: `Tom keeps to what he knows and what the brand states. He explains that the Dark Spot Superserum is the brand's answer for the look of pigmentation, names its key actives, and offers to show her the brand's own product information rather than quote a figure from memory. On the supplement, he is clear that he cannot advise alongside her medication and that she will know better than most to check it first. Dr Okafor buys the serum and books again. With an expert guest, accuracy and honest limits are what earn trust.`,
      },
      summary: `myBlend product mastery starts with the Superserums, Hydra+, Radiance, Dark Spot and Blemishes, each built for one concern, then the Revitalizing Pre-Serum and La Crème Régénérante with its lighter and richer companions. Cleansing is gentle and barrier-respecting, with enzymatic cleansers, a balm-to-oil and an Exfoliating Gel-Cream. Nutri and Tech complete the ecosystem with supplements such as Nutri Glow and the myLEDmask. Present products as layers, attribute claims to the brand, never invent figures, refer health questions to a GP or pharmacist, and learn the range heroes first, one category at a time.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        'Run a consultation-led myBlend treatment, from diagnosis to aftercare, and read the menu like a professional on day one',
        'Use the house technology exactly as trained and describe it in the brand\'s own terms',
        `Prescribe retail from the diagnosis, build honest upgrade paths and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Diagnosis first: the heart of the treatment',
          body: `In a myBlend spa the consultation is not paperwork before the treatment; it is where the treatment is designed. The brand describes its spa treatments as built on a digital diagnosis of the skin and an in-depth conversation with the therapist, and its own diagnosis tool, mySkinDiag, uses photo capture to assess a range of skin signs. Whether your spa uses the digital tool or a manual skin analysis, the discipline is the same. Ask about the guest's routine, lifestyle, sleep, stress, sun exposure and what they want to change, because the brand's epigenetics-led philosophy treats these as part of the skin's story. Look properly, and record what you find. Then explain, in two or three sentences, what you will focus on today and why. This is also where you check contraindications and anything that rules out a device: follow your spa's consultation form and the brand's training without exception, and if in doubt, do not proceed and ask your senior therapist. Done well, the diagnosis makes everything that follows feel made for the guest, and it gives you the evidence for an honest retail prescription at the end.`,
        },
        {
          heading: 'Reading the menu: hands and technology',
          body: `myBlend menus differ by spa, so learn a reading method rather than relying on a memorised list. Start with the two facials the brand describes most clearly. The Essential is a sixty-minute facial combining the CellSynergy device with lifting and sculpting hand movements, presented as a complete anti-ageing treatment. The Expert is the ninety-minute, most advanced protocol, bringing together technologies, intensified manual massage and LED. Some spas also offer shorter boosters and treatments using cold. The brand names a range of technologies its spa treatments can draw on, including radiofrequency, electroporation, electrostimulation, LED and heat and cold, but which ones your spa uses, and how, depends on its equipment and protocols. For each treatment on your menu note four things: duration, protocol source, products and devices used, and who it suits. Read the protocols your spa holds, complete any device training before you touch the machine on a guest, and ask rather than improvise. Technology in this house is only as good as the therapist's hands and judgement, and the brand's identity depends on both together.`,
        },
        {
          heading: 'Retail: prescribing from the diagnosis',
          body: `myBlend retail is at its most natural when it follows directly from the diagnosis, because the guest has already heard what you found. At the close, prescribe rather than pitch: two or three products, each linked to something specific. Usually that means a cleanser that suits their skin, the Superserum that answers their main concern, and a cream in the right texture. Explain the order of use and why the layers work together, so the guest leaves with a routine rather than a bag of products. Nutri and Tech can follow for the right guest. A guest who loved the LED step may want to know about the myLEDmask for home, and a guest interested in supporting their skin from within may ask about the supplements; describe both honestly in the brand's terms, and send supplement questions involving pregnancy, medication or a health condition to the guest's GP or pharmacist. Tell the guest what they do not need as well, which builds trust that lasts. Write the prescription down and record it on the guest's history so the next therapist can continue the plan.`,
        },
        {
          heading: 'Upgrade paths and protecting the brand on shift',
          body: `Upgrade paths in a myBlend spa grow out of the plan you have built with the guest. The guest who enjoyed The Essential and wants more sculpting and LED is a natural Expert guest next time; say so at the close and note it on their record. A guest working on a specific concern may benefit from a course of treatments, which you can suggest honestly if your spa offers one, alongside a home routine that supports it. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill, and nothing is presented as a medical result. Alongside selling the brand, you protect it. On shift that means using the correct products in the correct quantities, following the protocol rather than your own variant, using devices only as trained and keeping them clean, maintained and logged as your spa requires, keeping testers and retail immaculate, and reporting low stock before it forces substitutions. Never shorten the diagnosis to rescue a late-running column; flag the schedule instead. Guests meet this doctor-led brand through its therapists, and the care and accuracy you show is the brand's reputation in that room.`,
        },
      ],
      keyTerms: [
        { term: 'Skin diagnosis', definition: `The structured consultation and skin analysis, digital or manual, that opens every myBlend treatment and shapes both the treatment and the retail prescription.` },
        { term: 'The Essential', definition: `myBlend's sixty-minute facial combining the CellSynergy device with lifting and sculpting hand movements, as described by the brand.` },
        { term: 'The Expert', definition: `myBlend's ninety-minute, most advanced facial protocol, combining technologies, intensified manual massage and LED.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely loved or needs, such as The Essential to The Expert.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct products and quantities, faithful protocols, devices used only as trained, immaculate presentation and accurate claims.` },
      ],
      caseStudy: {
        title: 'The first Expert at The Linford, Marylebone',
        scenario: `Sofia, an experienced facialist, starts her first shift on the myBlend menu at The Linford, a five-star hotel spa in Marylebone. She has completed the device training but has never delivered The Expert on a guest. Her second booking is Ms Hargreaves, who has had The Essential twice and says she wants "the full works" before an event this weekend. During the diagnosis Ms Hargreaves mentions, almost in passing, that she has recently had a cosmetic procedure on her face.`,
        insight: `Sofia stops and checks the consultation form and the brand's contraindication guidance with her head therapist before any device is used, and adapts the treatment as the protocol requires rather than delivering it in full regardless. She explains why, calmly, and Ms Hargreaves is grateful. At the close Sofia prescribes the Superserum and cream that answer the diagnosis, notes on the record that The Expert is the natural next booking once it is appropriate, and writes the plan down. Safety first, then honest retail and a clear next step: that is the myBlend standard.`,
      },
      summary: `A myBlend shift rests on four habits. Treat the diagnosis as the foundation of the treatment, assessing the skin and the guest's lifestyle and checking contraindications properly. Read the menu like a professional, starting with The Essential and The Expert, and use the house technology only as trained. Retail by prescribing two or three products that answer what you found, with Nutri and Tech offered honestly to the right guest and health questions referred to a GP or pharmacist. Build upgrade paths that improve the outcome, and protect the brand with accurate claims, correct products and faithful protocols on every shift.`,
    },
  ],
}
