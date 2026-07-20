// Elemis Masterclass - a WHC Academy brand masterclass pack.
// Independent WHC training; not affiliated with or endorsed by Elemis.

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'elemis-masterclass',
  title: 'Elemis Masterclass',
  tagline: `The British house of results-driven naturals - speak it like a native`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Elemis is one of the great British skincare success stories: a house founded in London in 1989 and built, unusually, by people from the therapy room rather than the boardroom. Co-founder Noella Gabriel is a therapist by background, and that origin still defines the brand. Elemis treatments are famous for serious, skilled hands-on work, and its products were designed to be used by professionals on real skin before they ever reached a shelf.

The philosophy is a deliberate marriage of nature and science. Elemis builds its formulas around marine and plant actives, then frames them in the confident, clinical language of visible results and independent testing. Where some houses sell ritual and escape, Elemis sells outcomes you can see in the mirror, delivered with the warmth and touch of a therapist-led brand.

That positioning is the USP: results-driven natural skincare, delivered through touch. Elemis grew through luxury hotel spas and a long association with spas at sea, joined the L'Occitane group in 2019, and welcomes guests at its House of ELEMIS flagship in Mayfair. For a therapist, fluency in this house means holding both halves at once: talk results with confidence, and deliver them with genuinely exceptional hands.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Elemis organises its skincare into ranges built around skin concerns, and learning that architecture is the fastest route to fluency. Pro-Collagen is the anti-ageing flagship, the family guests ask for by name; its icons include the Marine Cream and the cult Cleansing Balm. Dynamic Resurfacing is the smoothing, texture-refining range built on gentle enzyme technology. Superfood is the glow and nourishment story, rich in nutrient-dense plant ingredients with a prebiotic angle. On the body side, the frangipani monoi collection is a signature scent guests remember for years.

The most famous ingredient story in the house belongs to Pro-Collagen: Padina pavonica, a Mediterranean algae, is the marine active at the heart of the range, and telling that story well is a core Elemis retail skill. Guests do not remember ingredient lists; they remember a therapist who explained why a marine plant earned its place in a luxury cream.

Where you are unsure of a specific claim, never improvise one. The professional method is to learn the range architecture, use the heroes yourself, tell the ingredient stories you know to be true, and take the brand's own training for depth. Confident, accurate knowledge sells; invented detail eventually embarrasses you in front of a guest who knows better.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `Your first task in any Elemis spa is to study the treatment menu and map every treatment to its range: which facial belongs to Pro-Collagen, which to Superfood or Dynamic Resurfacing, and which sit in the technology tier. Elemis is known for pairing skilled hands-on facials with machine-assisted options, the concept it made famous with BIOTEC, so know which treatments are touch-led and which add technology.

Delivering the signature style means two things at once: hands that work deeply and beautifully, and language that is warm but outcome-led. An Elemis guest expects a visible result, named confidently.

Retail follows the treatment. Narrate the heroes as you use them, then prescribe two or three products from the same range as the facial, linked to what you found. The upsell paths are natural: from a classic facial to its advanced or technology version, from face to body with a scalp or back addition, and from a one-off visit to a course that matches the skin's renewal cycle.

Finally, protect the house on shift: follow the trained protocol and dosages exactly, keep the retail wall and testers immaculate, report low stock rather than substituting, and never freelance a protocol you were not trained in. The brand's reputation is in your hands, literally.`,
    },
  ],
  quiz: [
    {
      q: 'Elemis is best described as...',
      options: [
        'A French pharmacy brand focused on minimalist dermatology',
        'A British house of results-driven natural skincare, pairing marine and plant actives with confident, clinically framed language',
        'A medical aesthetics clinic chain',
        'A budget high-street range',
      ],
    },
    {
      q: `The most famous Elemis product family is...`,
      options: [
        'Diamond Lift',
        'Optimal Skin',
        'Pro-Collagen, including the Marine Cream and the Cleansing Balm',
        'Seaweed Bath',
      ],
    },
    {
      q: 'The signature marine active at the heart of Pro-Collagen is...',
      options: [
        'Padina pavonica, a Mediterranean algae',
        'Dead Sea salt',
        'Spirulina',
        'Hand-harvested Irish seaweed',
      ],
    },
    {
      q: 'The BIOTEC concept is known for...',
      options: [
        'Machine-only facials with no hands-on work',
        'Aromatherapy massage rituals',
        'A waxing technique',
        'Pairing skilled hands-on facial work with technology',
      ],
    },
    {
      q: `A defining fact about the founding of Elemis is that...`,
      options: [
        'It was founded by a dermatologist in Paris',
        'It was co-founded in London in 1989 with a therapist, Noella Gabriel, at its heart - a therapist-led heritage',
        'It began as a cruise line',
        'It started as a fragrance house',
      ],
    },
    {
      q: 'When retailing Elemis, the strongest link is between...',
      options: [
        'The products you used in the treatment and what you found in the guest’s skin',
        'Whatever is on promotion this month',
        'The most expensive item in the cabinet',
        'Products the guest already owns',
      ],
    },
    {
      q: 'Your first task on day one in an Elemis spa is to...',
      options: [
        'Rearrange the retail wall to your taste',
        'Learn the till system and nothing else',
        'Study the treatment menu and map each treatment to its range, its heroes and its upgrade options',
        'Improvise your own version of the facials',
      ],
    },
    {
      q: 'Protecting the brand’s standards on shift means...',
      options: [
        'Improvising protocols when busy',
        'Substituting products freely when stock runs low',
        'Skipping the brand training if you are experienced',
        'Following trained protocols and dosages exactly, keeping displays immaculate, and reporting stock issues rather than substituting',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the spa chose Elemis and she told me the story - founded by a therapist, British, obsessed with results you can see. By the end I trusted the brand because I trusted her."`,
      helpsYou: `Spas that carry Elemis want therapists who can speak the house fluently on day one. Knowing the founding story, the philosophy and the USP is exactly what hiring managers and agency coordinators listen for.`,
      tips: [
        'Learn the one-sentence USP: results-driven natural skincare, delivered through touch',
        'Remember the therapist-led heritage - it explains everything about the brand',
        'Match your tone to the house: warm, confident and outcome-led',
      ],
    },
    {
      guestView: `"She told me about the Mediterranean algae in the Marine Cream while she was massaging it in. I could feel the product and hear the story at the same time. I bought it on the way out."`,
      helpsYou: `Hero-product fluency is the difference between a therapist who retails and one who hopes. Guests ask about Pro-Collagen by name - being ready with the range map and the ingredient story turns questions into sales.`,
      tips: [
        'Learn the range architecture first: Pro-Collagen, Dynamic Resurfacing, Superfood, the body collections',
        'Master the Padina pavonica story - it is the house’s most famous ingredient tale',
        'Use the heroes yourself; conviction is audible',
        'Never invent a claim - say what you know and take the brand training for depth',
      ],
    },
    {
      guestView: `"After my facial she recommended the cream from the same range she had used, showed me my skin in the mirror, and mentioned the longer version with technology for next time. None of it felt like selling."`,
      helpsYou: `Menu mapping, linked retail and clean upsell paths are what let you walk into any Elemis spa, including agency shifts, and perform like a house-trained therapist from your first guest.`,
      tips: [
        'Day one: map every treatment on the menu to its range and its upgrade',
        'Prescribe two or three products from the range you just used, linked to findings',
        'Know the natural upgrades: classic to advanced, face to body, visit to course',
        'Protect the standard: exact protocols, exact dosages, report stock issues - never substitute',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'elemis-masterclass',
  aims: `This masterclass sets out to make you fluent in Elemis as a professional house: where it came from, what it believes, why guests love it and how a therapist represents it impeccably on shift. It covers the founding story and therapist-led heritage, the philosophy of marine and plant actives framed in confident, results-led language, the architecture of the ranges and their hero products, the hallmark treatment style that pairs serious hands-on skill with technology, and the commercial craft of linking products to treatments, building honest upsell paths and protecting the brand's standards. Throughout, where a specific detail is not publicly certain, the course teaches the professional method for learning it on the ground rather than guessing. This is independent WHC training and is not affiliated with or endorsed by Elemis.`,
  audience: `Spa and beauty therapists working in, or preparing to work in, UK luxury spas, five-star hotel spas and day spas that carry Elemis, and agency therapists who may be asked to deliver an Elemis menu at short notice. It suits newly qualified therapists building their first brand fluency, experienced therapists moving to an Elemis account, and senior therapists or managers who coach retail and treatment standards. No prior Elemis training is assumed, and this course complements rather than replaces the brand's own professional education.`,
  outcomes: [
    `Explain the Elemis founding story, philosophy and USP accurately and persuasively to guests and interviewers`,
    `Navigate the range architecture and present hero products, including the Pro-Collagen family and its signature marine active, with confidence`,
    `Map an Elemis treatment menu on day one, deliver the house's touch-and-results signature style, and link retail directly to treatments`,
    `Build honest upsell paths between treatments and uphold brand standards, protocols and presentation on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        'Recount the Elemis founding story and explain why its therapist-led heritage shapes everything the brand does',
        'Describe the house philosophy of marine and plant actives delivered with clinically framed, results-led confidence',
        'State the Elemis USP in one sentence and adjust your own tone and language to match the house',
      ],
      sections: [
        {
          heading: 'A British house built by therapists',
          body: `Elemis was founded in London in 1989, and the detail that matters most to you is who built it. Co-founder Noella Gabriel came from the treatment room: a therapist who understood skin through her hands, and who shaped the brand's products and treatments from that professional standpoint, alongside co-founders Sean Harrington and Oriele Frank. Most skincare houses are created by chemists, marketers or heritage beauty families; Elemis is one of the few global brands whose DNA is the therapy couch itself. That origin explains the house's obsessions. Products are designed to perform under professional hands, treatments are choreographed rather than assembled, and hands-on skill is treated as the equal of any formula. The brand grew into one of the most successful British skincare stories of its generation, joined the L'Occitane group in 2019, and today welcomes guests to its House of ELEMIS flagship in Mayfair. When you represent Elemis, you are representing a therapist's brand, and the house expects your hands to prove it.`,
        },
        {
          heading: 'Nature and science, holding hands',
          body: `The Elemis philosophy is a deliberate marriage that many brands claim and few sustain: natural origins presented with scientific confidence. The formulas are built around marine and plant actives, ingredients drawn from the sea and the botanical world, but the language around them is never vague or mystical. Elemis frames its skincare in terms of visible results, independent testing and measurable difference, and its most famous products carry that clinically confident tone. This pairing is worth understanding deeply, because it tells you how to speak in an Elemis spa. You do not promise miracles, and you do not drift into purely poetic ritual language either. You name the active, you explain what it does, and you point to the result the guest can expect to see. The house's long-standing idea of truth in beauty captures the discipline: enthusiasm anchored to evidence. A therapist who masters that register, warm delivery of precise claims, sounds like the brand itself, and guests hear the difference immediately.`,
        },
        {
          heading: 'Where Elemis lives, and why it matters',
          body: `You will meet Elemis in a distinctive set of places, and each one shapes what is expected of you. The house built its professional reputation through luxury hotel and resort spas, where its facials and body treatments anchor five-star menus. It has a famous long association with spas at sea, treating guests aboard cruise ships around the world, which trained the brand to deliver consistent results across thousands of therapists and time zones, a heritage you inherit whenever you follow an Elemis protocol exactly. It is also a retail powerhouse: guests arrive already knowing the hero products from home shopping, travel retail and department store counters, often more familiar with the Marine Cream than with you. That last point changes your job. In many houses you introduce the brand to the guest; in an Elemis spa, guests frequently arrive as fans, and your role is to deepen existing loyalty with professional knowledge they cannot get from a website.`,
        },
        {
          heading: 'The USP in one sentence',
          body: `Every product house can be compressed into a sentence, and compressing it is the fastest way to own it. For Elemis: results-driven natural skincare, delivered through therapist-led touch. Compare the accents of its peers and the sentence sharpens. An aromatherapy-rooted house sells ritual and restoration; a dermatological house sells diagnosis and skin health; Elemis sells a visible outcome, wrapped in genuine luxury and exceptional hands. That is why an Elemis guest walks out checking her cheekbones in the mirror rather than describing her state of mind. For you, the USP is a working instruction. It tells you what to emphasise in consultation, which is the outcome the guest wants to see; how to narrate the treatment, naming actives and results rather than only sensations; and what the goodbye should contain, which is evidence, shown in the mirror, of the difference the hour made. Hold the sentence in your head on shift and every choice, from language to retail, lines up behind it.`,
        },
      ],
      keyTerms: [
        { term: 'Therapist-led house', definition: `A brand founded and shaped by professional therapists rather than chemists or marketers; in Elemis's case the heritage of co-founder Noella Gabriel, which places hands-on skill at the centre of the brand.` },
        { term: 'Marine and plant actives', definition: `The ingredient signature of Elemis: performance ingredients drawn from the sea and the botanical world, presented with scientific confidence rather than purely natural romance.` },
        { term: 'Results-driven', definition: `The Elemis register of language and expectation: treatments and products are framed around visible, testable outcomes the guest can see, not only around how the experience feels.` },
        { term: 'House of ELEMIS', definition: `The brand's London flagship in Mayfair, a townhouse destination that showcases the full treatment and retail expression of the house at its most complete.` },
      ],
      caseStudy: {
        title: 'The sceptical guest at Aldercombe Manor, the Lake District',
        scenario: `Hannah is a therapist at Aldercombe Manor, a country house hotel spa in the Lake District that recently moved its menu to Elemis. Mrs Pemberton, a long-standing regular, arrives for her facial visibly unconvinced: her previous spa carried a French pharmacy brand, and she asks, a little sharply, why she should trust "a brand I only know from the telly". Hannah has sixty seconds before the consultation must move on, a guest whose loyalty is to the old menu, and a first impression of the new house resting entirely on what she says next.`,
        insight: `Hannah answers with the house's story rather than a defence: Elemis is British, founded in 1989 with a therapist at its heart, which is why its facials are famous for hands-on skill, and its products pair marine and plant actives with a results-led promise she is happy to be judged on today. She then lets the treatment argue for her, and shows the result in the mirror at the end. The professional lesson is that brand fluency converts scepticism where salesmanship inflames it: a therapist who can place a house's story, philosophy and USP in three sentences gives the guest a reason to extend trust, and the mirror does the rest.`,
      },
      summary: `Elemis is a British house founded in London in 1989 with a therapist, Noella Gabriel, among its co-founders, and that heritage still defines it: products built to perform under professional hands, and treatments where touch matters as much as formula. Its philosophy pairs marine and plant actives with clinically confident, results-led language, and its USP compresses to one working sentence: results-driven natural skincare, delivered through therapist-led touch. Grown through luxury hotel spas and spas at sea, now part of the L'Occitane group, Elemis expects its therapists to talk outcomes warmly and prove them in the mirror.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        'Map the Elemis range architecture and match each major range to the skin concern it serves',
        'Tell the Pro-Collagen and Padina pavonica ingredient story accurately and compellingly',
        'Apply a professional method for learning any range deeply without ever inventing a claim',
      ],
      sections: [
        {
          heading: 'Range architecture: learn the map before the streets',
          body: `Faced with a full Elemis retail wall, new therapists try to memorise products one by one and drown. The professional shortcut is architecture: Elemis organises its skincare into ranges built around skin concerns, so learn the ranges first and every product finds its place. Pro-Collagen is the anti-ageing flagship, the range guests ask for by name, addressing fine lines and firmness. Dynamic Resurfacing is the smoothing range, refining texture and tone through gentle enzyme technology rather than harsh abrasion. Superfood is the glow and nourishment story, built on nutrient-rich plant ingredients with a prebiotic angle, and it speaks especially well to younger guests and tired, dulled skin. Around the facial ranges sit the body collections, of which the frangipani monoi family is the signature scent that guests remember for years. With that map in your head, any product you pick up already has a context, a guest profile and a place in your retail conversation. Learn the map, then walk the streets.`,
        },
        {
          heading: 'Pro-Collagen and the algae that made it famous',
          body: `Every great house has one ingredient story its therapists must tell perfectly, and for Elemis it belongs to Pro-Collagen. At the heart of the range is Padina pavonica, a Mediterranean algae, the marine active around which the brand built its most celebrated products. The range's icons are the Marine Cream, one of the best known premium moisturisers in British skincare, and the Cleansing Balm, a cult favourite that guests buy again and again. When you present these products, the algae story is your instrument: a marine plant, harvested from the sea that gives the range its name, chosen for its benefits to the look of firmer, smoother skin. Told well, in a sentence or two while the guest feels the product on their skin, the story transforms a cream into a piece of the ocean with a pedigree. Practise it aloud until it sounds like conversation rather than recitation, because guests will ask, and the therapist who answers fluently owns the sale and the trust that follows.`,
        },
        {
          heading: 'The supporting cast: enzymes, superfoods and the body',
          body: `Beyond the flagship, fluency means knowing what each supporting range is for and who it suits. Dynamic Resurfacing is your answer for texture: uneven tone, rough patches and dullness respond to its enzyme-based approach, which resurfaces gently rather than scrubbing, making it a story about intelligence rather than force. Superfood is your answer for depleted, lacklustre skin and for guests who love an ingredient-led, nutritional way of thinking about skincare; its language of feeding the skin lands naturally with wellness-minded guests. The body collections carry the house's sensorial signature, led by the frangipani monoi scent that many guests identify as the smell of their best holiday, which makes body oils and creams some of the easiest and most joyful recommendations on the wall. Notice the craft here: each range gives you a different conversation, matched to a different guest. Product knowledge is not a list of items; it is a set of prepared conversations, each waiting for the guest it fits.`,
        },
        {
          heading: 'How professionals learn a range, and the rule against inventing',
          body: `However good a masterclass, the depth comes from method, and the method is the same for every house you will ever work with. First, use the heroes yourself: a therapist whose own skin knows the Cleansing Balm sells it with a conviction no script can fake. Second, live with the testers: texture, scent and finish are learned through fingers, not leaflets. Third, take the brand's own training whenever it is offered, because the house's education is the authoritative source for protocols, claims and new launches. Fourth, read the packaging and official materials for claims, and let those exact words be the outer limit of what you promise. Which brings us to the one absolute rule: never invent. If you do not know whether a product suits a condition, say you will check, and check. An improvised claim might win a sale today and will cost your credibility, and the brand's, the day a well-informed guest hears it. In luxury retail, "I will find out for you" is a professional sentence, not an admission of failure.`,
        },
      ],
      keyTerms: [
        { term: 'Range architecture', definition: `The organising structure of a house's products, in Elemis's case ranges built around skin concerns such as Pro-Collagen for anti-ageing and Dynamic Resurfacing for texture; learning it first makes every individual product easier to place.` },
        { term: 'Padina pavonica', definition: `The Mediterranean algae that is the signature marine active of the Pro-Collagen range, and the ingredient story every Elemis therapist must be able to tell fluently.` },
        { term: 'Hero product', definition: `An icon guests ask for by name, such as the Pro-Collagen Marine Cream or Cleansing Balm; heroes anchor retail conversations and carry the reputation of their range.` },
        { term: 'Ingredient story', definition: `A short, accurate narrative about a signature ingredient's origin and purpose, told while the guest experiences the product; the most persuasive and honest tool in luxury retail.` },
      ],
      caseStudy: {
        title: 'The Marine Cream question at The Osborne Row Spa, Mayfair',
        scenario: `Daniel works at The Osborne Row Spa, a boutique hotel spa in Mayfair. After a facial, his guest Mr Ashworth picks up the Pro-Collagen Marine Cream at the retail wall and says he has seen it everywhere, but his wife uses "a perfectly good moisturiser from the supermarket, so what am I actually paying for?" Daniel knows a vague answer about luxury will lose him, and an invented scientific claim would be worse. He has one honest minute at the shelf to justify one of British skincare's most famous products.`,
        insight: `Daniel answers with the specific story he knows to be true: at the heart of the range is Padina pavonica, a Mediterranean algae, the marine active the house built its flagship around, and the cream's reputation was earned in professional treatment rooms before it ever became famous on screen. He connects it to the treatment: the product he used today is from the same range, and Mr Ashworth has already felt the finish on his own skin. The lesson is that hero products are defended with their real story, not with adjectives. Specific, accurate, felt on the skin: that is what separates a premium purchase from an awkward silence at the shelf.`,
      },
      summary: `Elemis product knowledge starts with architecture: Pro-Collagen for anti-ageing, Dynamic Resurfacing for texture, Superfood for nourishment and glow, and body collections led by the beloved frangipani monoi scent. The house's defining ingredient story is Padina pavonica, the Mediterranean algae at the heart of Pro-Collagen and its icons, the Marine Cream and Cleansing Balm. Depth comes from method: use the heroes yourself, live with the testers, take the brand's training, and treat official claims as the limit of your promises. Never invent a claim; fluency is telling true stories beautifully.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        'Map an Elemis treatment menu on day one, linking every treatment to its range, its heroes and its upgrade options',
        `Deliver the house's signature style, pairing accomplished hands-on work with confident, results-led language and its touch-and-technology concept`,
        'Retail from the treatment, build honest upsell paths, and uphold brand protocols and presentation standards on every shift',
      ],
      sections: [
        {
          heading: 'Day one: reading the treatment menu like a professional',
          body: `Whether you are joining permanently or arriving for a single agency shift, your first task in an Elemis spa is the same: sit with the treatment menu and build your map before you meet a guest. Work through three questions for every treatment. Which range does it belong to, so that a Pro-Collagen facial ends in a Pro-Collagen retail conversation and a Superfood facial in a Superfood one? Is it touch-led or technology-assisted, since Elemis menus famously pair skilled hands-on facials with machine-assisted options in the tradition of its BIOTEC concept, and you must know which is which before a guest asks? And where does it sit in the upgrade ladder, with which longer, deeper or more advanced version above it? Then check the practical layer: durations, what the protocol includes, and any treatments you are not yet trained to deliver, which you flag honestly to the coordinator rather than discover mid-booking. Thirty minutes with the menu on day one is the difference between performing the house and impersonating it.`,
        },
        {
          heading: 'Delivering the signature: hands first, results always',
          body: `The Elemis signature style asks you to hold two standards at once. The first is touch. This is a house founded by a therapist, famous for facials in which massage is serious, skilled and generous, so your hands-on work must be unhurried, confident and technically clean; a rushed, perfunctory massage phase betrays the brand at its heart. The second is results. Consultation in an Elemis room is outcome-led: establish what the guest wants to see change, choose the protocol and products accordingly, and narrate what you are using and why at the key moments, naming the range and the active without breaking the calm. Where technology features, present it as the amplifier of your hands, never their replacement, and explain each sensation a beat before it happens. Then finish the way the house finishes: with evidence. Light the mirror kindly, show the guest the change you both worked for, and describe it specifically. An Elemis facial ends with a result the guest can see, spoken by a therapist who expected it.`,
        },
        {
          heading: 'Retail that flows from the treatment',
          body: `In an Elemis spa, retail is the third act of the treatment, not an ambush at the desk. The link is the method: the facial you delivered belongs to a range, the guest's skin has just experienced that range, and your recommendation continues it at home. Narrate during the treatment, so the heroes introduce themselves while the guest can feel them working. At the close, prescribe rather than pitch: two or three products, drawn primarily from the range you used, tied explicitly to what you found, with the mirror moment as your proof. The Cleansing Balm after a Pro-Collagen facial, the body oil after a frangipani-scented treatment, each recommendation should feel like the obvious continuation of the last hour. Be equally professional about what you leave out; telling a guest their existing cleanser is fine builds the trust that sells the serum. Write the prescription down, note it on the guest record, and accept a no with complete warmth. The house's fame means many guests will return to buy on visit two; your job is to make sure the door is wide open.`,
        },
        {
          heading: 'Upsell paths, and being a guardian of the brand',
          body: `Elemis menus are built with natural ladders, and honest upselling is simply showing the guest the next rung. The classic paths: from a shorter facial to its longer or more advanced version, where the extra time deepens the massage and the result; from a touch-led facial to its technology-assisted counterpart, for the guest chasing a stronger visible outcome; from face to body, adding a scalp, back or body element that converts a treatment into an escape; and from a single visit to a course, because skin renews in cycles and a series delivers what one facial cannot. Offer once per natural moment, tie the offer to the guest's own stated goal, and let every no stand gracefully. Alongside the selling sits the guarding. On shift, you are the brand: follow trained protocols and dosages exactly, respect timings, keep the retail wall, testers and treatment room immaculate, report low stock rather than substituting or diluting, and never improvise a treatment you have not been trained to give. Guests cannot tell where the spa ends and Elemis begins; make sure neither ever lets the other down.`,
        },
      ],
      keyTerms: [
        { term: 'Menu mapping', definition: `The day-one discipline of linking every treatment on a spa's menu to its range, its hero products, its touch or technology tier and its upgrade options before treating a single guest.` },
        { term: 'Touch and technology', definition: `The Elemis hallmark of pairing skilled hands-on facial work with machine-assisted treatments, the concept the house made famous with BIOTEC; technology amplifies the therapist's hands rather than replacing them.` },
        { term: 'Linked retail', definition: `Recommending home care drawn from the same range as the treatment just delivered, tied to consultation findings and proven in the mirror, so the purchase feels like the continuation of the hour.` },
        { term: 'Upgrade ladder', definition: `The built-in paths between treatments, from classic to advanced, touch to technology, face to body, and single visit to course, that let a therapist upsell honestly by matching the next rung to the guest's goal.` },
      ],
      caseStudy: {
        title: `The agency shift at The Caldstane, Edinburgh`,
        scenario: `Grace, an experienced agency therapist, arrives at The Caldstane, a five-star Edinburgh hotel spa, for her first shift on an Elemis menu. She has forty minutes before her first guest, a full column of facials she has never delivered under this house, and a spa manager watching how the agency cover performs. Rather than waiting in the staff room, Grace asks for the treatment menu and the protocol folder, maps each facial to its range and upgrade, checks which treatments involve technology she is not certified on, and flags one of those bookings to the coordinator immediately.`,
        insight: `Grace's forty minutes contain the whole of this lesson. The menu map means every facial she delivers ends in the right retail conversation; the honest flag about the technology treatment protects the guest, the licence and the brand, and earns more trust than a confident blag ever could; and following the protocol folder exactly means her guests receive Elemis, not her improvisation of it. By the afternoon she is recommending range-linked products and planting course bookings like a house therapist. Agency therapists are rebooked on exactly this: the professionalism to learn a house fast, and the integrity never to fake it.`,
      },
      summary: `Representing Elemis on shift is a three-part craft. Map the menu on day one, so every treatment connects to its range, its heroes, its touch or technology tier and its upgrade. Deliver the signature: generous hands-on work, outcome-led language, technology as the amplifier of touch, and a mirror-moment finish with visible evidence. Then let retail flow from the treatment: prescribe two or three range-linked products, offer the honest upgrade paths from classic to advanced, face to body, and visit to course, and guard the standard by following protocols exactly rather than improvising.`,
    },
  ],
}
