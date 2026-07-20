// WHC Academy brand masterclass: Guinot. Independent WHC training - not
// affiliated with or endorsed by Guinot. Answer key lives in
// academy-more-answers/guinot-masterclass.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'guinot-masterclass',
  title: 'Guinot Masterclass',
  tagline: `The French salon institution - its science, its machines, and how to deliver it`,
  category: 'Brands',
  minutes: 30,
  price: 500,
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      content: `Guinot is one of the great French professional skincare houses, and its story begins in the treatment room. The brand was founded in France in the 1960s by René Guinot, a chemist whose defining invention was a facial that used gentle electrical currents to carry active ingredients into the skin. That treatment, originally known as Cathiodermie and later renamed Hydradermie, became one of the best-known salon facials in the world and remains the beating heart of the brand.

The house was later acquired and led by Jean-Daniel Mondin, a doctor of pharmacy, under whom Guinot grew into an international group with its own laboratories in France and a sister brand, Mary Cohr. That pharmacy-led ownership shaped the house's identity: scientific, methodical and proudly professional.

The philosophy is that beauty is a profession. Guinot has always distributed through trained beauty salons, institutes and spas rather than supermarkets or ordinary high-street shelves, because the house believes real skin results come from a qualified therapist delivering a precise method, supported by professional products at home.

The USP in one breath: Guinot offers methodical, machine-assisted and manual French facial treatments, developed in its own laboratories, delivered exclusively by trained professionals, with results a guest can see. Where some houses sell atmosphere, Guinot sells visible outcomes achieved through technique.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      content: `Guinot credibility starts with the treatment serums and the retail icons, because guests meet the house through both.

In the treatment room, Hydradermie works with personalised treatment gels, chosen for the guest's skin during consultation and driven into the skin by gentle ionisation. This personalisation is central: the machine is the method, but the choice of actives is the prescription.

On the retail shelf, start with the icons. Longue Vie Cellulaire, often called the youth cream of the house, is famous for its Cellular Life Complex of 56 active ingredients drawn from cell biology, including amino acids and coenzymes. Crème Hydrazone is a much-loved hydration hero. The Age Summum and Lift Summum families carry the anti-ageing story, with ingredients such as pure vitamin C and hyaluronic acid that also star in the professional facials of the same names.

The ingredient philosophy is scientific rather than botanical romance: Guinot speaks of actives, concentrations and mechanisms, formulated in its own French laboratories. Narrate products in that spirit: what the active is, what it does, and what the guest will see.

Where a specific formulation detail is not certain, never invent it. Learn heroes first, one category at a time, use the house training materials and testers, and try the key products yourself. Honest fluency beats confident guessing every time.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      content: `On day one in a Guinot salon or spa, learn the flagship first: Hydradermie, the machine facial the house is famous for, with its ionisation and high-frequency stages and personalised gels. Then map the rest of the menu in layers: Hydradermie Lift, which uses gentle currents to stimulate the facial muscles for a lifted look; the manual facials, led by Age Summum with its pure vitamin C and hyaluronic acid; radiance treatments such as the double-peel Beauté Neuve; and the body and aromatic treatments. For each, note duration, protocol, machine settings where relevant, and the products used - and ask the senior therapist rather than guessing.

Delivery is precise. The Guinot style is methodical and results-led: correct protocol order, correct machine technique, correct timings. Machines must be checked, cleaned and maintained, because a therapist fumbling with rollers destroys the confidence the method is built on.

Retail is the prescription that continues the result. Link two or three products directly to the treatment and the skin you analysed, with the matching retail lines, such as the Hydrazone or Age Summum creams after their namesake concerns, as your most natural links.

Upsell paths follow results: a single facial guest becomes a course-of-treatments guest, and a manual facial guest with ageing concerns is a natural Hydradermie Lift or Age Summum guest. Protect the brand on every shift: full protocols, correct quantities, maintained machines, reported stock, and never a shortened method to rescue a late column.`,
    },
  ],
  quiz: [
    {
      q: 'Guinot was founded...',
      options: [
        'In Italy by a fashion designer',
        'In France in the 1960s by René Guinot, a chemist',
        'In the USA by a dermatologist in the 1990s',
        'In Switzerland by a hotel group',
      ],
    },
    {
      q: `A defining part of Guinot's USP is that its products are...`,
      options: [
        'Sold mainly through supermarkets',
        'Available only online',
        'Sold in duty-free shops first',
        'Distributed through trained professional salons, institutes and spas, because beauty is treated as a profession',
      ],
    },
    {
      q: `Guinot's famous machine facial, Hydradermie, was originally known as...`,
      options: [
        'Cathiodermie',
        'Beauté Neuve',
        'Age Summum',
        'Hydra Peeling',
      ],
    },
    {
      q: 'The Hydradermie method works by...',
      options: [
        'Steam and manual extractions only',
        'Chemical peeling with strong acids',
        'Using gentle ionisation and high-frequency currents to carry personalised treatment gels into the skin',
        'Microneedling the skin surface',
      ],
    },
    {
      q: 'Age Summum is best described as...',
      options: [
        'A body wrap',
        'A manual anti-ageing facial featuring pure vitamin C and hyaluronic acid',
        'A scalp treatment',
        'A self-tanning service',
      ],
    },
    {
      q: 'Longue Vie Cellulaire is famous for...',
      options: [
        'Its Cellular Life Complex of 56 active ingredients drawn from cell biology',
        'Being fragrance-led rather than active-led',
        'Containing hand-harvested seaweed',
        'Being a professional-only product with no retail version',
      ],
    },
    {
      q: 'The strongest way to retail the Guinot range is...',
      options: [
        'Offer a discount on whatever is overstocked',
        'Present the full shelf at reception',
        'Prescribe two or three products linked directly to the treatment delivered and the skin you analysed',
        'Leave recommendations to the guest',
      ],
    },
    {
      q: 'Protecting the Guinot brand on shift means...',
      options: [
        'Improvising your own version of the protocols',
        'Skipping machine stages when running late',
        'Using more product than the protocol states to impress guests',
        'Full protocols, correct quantities, maintained machines, reported stock and never a shortened method',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I asked why the salon carried Guinot and the therapist told me about the chemist who invented a machine facial in the 1960s, and why the brand only sells through professionals. I stopped seeing a cream and started seeing a method."`,
      helpsYou: `Guinot salons and spas hire for method and precision. Being able to tell the founding story, explain the professional-only philosophy and state the USP in one sentence marks you out instantly at interview and with knowledgeable guests.`,
      tips: [
        'Learn the one-breath USP: methodical French treatments, laboratory-developed, professional-only, visible results',
        `Remember the heritage: the house grew from a treatment invented by a chemist, not from a retail counter`,
        'Match the house voice - scientific, precise and confident about results',
      ],
    },
    {
      guestView: `"She explained the gel she had chosen for my skin and why, then named the cream with the 56 actives when I asked what to use at home. Every answer was specific. I bought it because she clearly knew it."`,
      helpsYou: `Hero-product fluency is the fastest credibility in a new house. Knowing Longue Vie Cellulaire, Hydrazone and the Summum families, and the personalised gels of Hydradermie, lets you walk onto a Guinot column and belong within an hour.`,
      tips: [
        'Heroes first: Longue Vie Cellulaire, Crème Hydrazone, the Age Summum and Lift Summum families',
        'Tell ingredient stories in the house spirit: the active, what it does, what the guest will see',
        'Use the key products on your own skin - conviction cannot be memorised',
        'Never invent a formulation detail; say what you know and check the rest',
      ],
    },
    {
      guestView: `"The machine work was seamless - she never fumbled, never hesitated, and my skin looked visibly brighter in the mirror afterwards. Then she wrote down two products and booked my next visit in the same breath."`,
      helpsYou: `Therapists who deliver the Guinot method precisely, retail from genuine analysis and build honest course-of-treatments paths are the ones salons trust with machines, regulars and promotion.`,
      tips: [
        'Day one: learn Hydradermie first, then map the menu in layers',
        'Precision is the brand - protocol order, machine technique and timings, never improvised',
        'Prescribe two or three products, linked to the treatment and your analysis',
        'Upsell along natural paths: single facial to course, manual facial to Hydradermie Lift where ageing is the concern',
      ],
    },
  ],
}

export const content: CourseContent = {
  slug: 'guinot-masterclass',
  aims: `This masterclass gives working spa and salon therapists genuine professional depth in Guinot, one of the most influential French professional skincare houses. It covers the founding story, the science-led philosophy and the professional-only distribution that define the brand, the hero products and ingredient stories a therapist must know cold, and the practical craft of the Guinot shift: reading the treatment menu, delivering the precise machine-assisted and manual signature style, retailing the range by prescription, building honest upsell and course-of-treatments paths, and upholding the standards that protect the brand's name. Where house-specific details vary by salon, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by Guinot.`,
  audience: `Spa and beauty therapists working in, or preparing to work in, Guinot salons, spas and hotel accounts across the UK. It suits therapists interviewing for a Guinot account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house method at short notice, experienced therapists moving to Guinot from another house, and salon owners, spa managers or head therapists who coach brand standards. Reception and retail colleagues in Guinot businesses will also gain a working command of the range and its language.`,
  outcomes: [
    `Tell Guinot's founding story and articulate its philosophy and USP in confident, guest-ready language`,
    'Name the hero products and treatment serums and explain their ingredient stories accurately and honestly',
    `Deliver Guinot's precise, results-led signature style across machine-assisted and manual treatments at professional standard`,
    'Retail the range by linking treatment, skin analysis and a two or three item home prescription',
    `Build integrity-led upgrade and course-of-treatments paths and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount Guinot's founding story and explain why its treatment-room origins set it apart from retail-born brands`,
        `Explain the house philosophy that beauty is a profession, delivered through professional-only distribution and laboratory science`,
        `Articulate Guinot's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'A French house born from a treatment',
          body: `Guinot began in France in the 1960s with René Guinot, a chemist rather than a marketer, and with an invention rather than a jar. His breakthrough was a facial that used gentle electrical currents to carry active ingredients into the skin, a treatment originally known as Cathiodermie and later renamed Hydradermie. It became one of the best-known salon facials in the world, and it is still the treatment most guests associate with the name above the door. This origin matters to everything that follows. Most skincare brands start with a retail product and later write treatment protocols to match; Guinot travelled the other way, building the products around a professional method that only trained hands can deliver. For a therapist, that heritage is the answer to the guest who asks what makes the brand different: Guinot did not arrive in the salon from a shop shelf. The salon is where it was born, and the machine facial that started it all is still on the menu.`,
        },
        {
          heading: 'Pharmacy-led ownership and the scientific identity',
          body: `The house was later acquired and led by Jean-Daniel Mondin, a doctor of pharmacy, and under his leadership Guinot grew into an international group with its own laboratories and production in France, alongside a sister brand, Mary Cohr. That pharmacy background is not a footnote; it is the character of the company. Guinot speaks the language of science: actives, concentrations, mechanisms and measurable results, researched and formulated in-house rather than bought in. The treatments reflect the same temperament. They are methods, with defined stages, defined timings and, in the machine treatments, defined technique with the equipment. Where some houses ask a therapist to be intuitive and atmospheric, Guinot asks a therapist to be precise, and rewards the ones who are. Understanding this identity helps you calibrate everything from your consultation language to your treatment delivery: a Guinot guest has been promised a visible result achieved through method, and your job is to deliver exactly that, without shortcuts and without vagueness.`,
        },
        {
          heading: 'Beauty is a profession: the distribution philosophy',
          body: `Guinot's most distinctive commercial choice is where it refuses to be sold. The house has always distributed through trained beauty salons, institutes and spas rather than supermarkets or ordinary high-street shelves, because its philosophy holds that beauty is a profession: real skin results come from a qualified therapist analysing the skin, delivering a precise treatment, and prescribing the right products for home. This is a genuine USP and you should be able to explain it warmly. For the guest, it means the products they buy from you are part of a professional relationship, chosen for their skin by someone who has actually examined it, not picked from a wall by guesswork. For the therapist, it is a quiet compliment: the entire business model depends on your training and judgement. It also raises the standard expected of you. A brand that stakes its name on professional delivery is damaged fastest by unprofessional delivery, which is why protocol discipline and honest prescription matter more in a Guinot business than almost anywhere else.`,
        },
        {
          heading: 'The USP in one breath, and the house voice',
          body: `Every therapist on a Guinot account should be able to state the USP in a single sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: Guinot offers methodical, machine-assisted and manual French facial treatments, developed in its own laboratories, delivered exclusively by trained professionals, with results a guest can see. Each clause earns its place. Methodical, because the treatments are defined methods, not improvisations. Machine-assisted and manual, because the house is famous for Hydradermie yet equally proud of hands-on facials such as Age Summum. Developed in its own laboratories, because the science is in-house and French. Delivered exclusively by professionals, because that is the distribution philosophy made visible. Results a guest can see, because Guinot sells outcomes, not just experiences. The house voice follows: precise, confident and results-led, speaking of what the skin will show as readily as how the guest will feel. Practise saying it until it sounds like you, not a script.`,
        },
      ],
      keyTerms: [
        { term: 'Product house', definition: `A brand that supplies a spa or salon's products, treatment protocols, training and much of its identity; luxury businesses partner with a house rather than simply stocking its products.` },
        { term: 'Cathiodermie', definition: `The original name of the machine facial invented by René Guinot in the 1960s, using gentle electrical currents to carry actives into the skin; later renamed Hydradermie.` },
        { term: 'Professional-only distribution', definition: `Guinot's policy of selling through trained salons, institutes and spas rather than mass retail, expressing the philosophy that beauty is a profession.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The comparison shopper at The Farleigh, Mayfair',
        scenario: `Priya is a therapist at The Farleigh, a boutique five-star hotel spa in Mayfair running a Guinot menu. Her guest, Mr Whitcombe, books a facial as a gift-voucher redemption and admits he knows nothing about the brand. Halfway through the consultation he asks why he should buy anything here when his partner orders premium skincare from a department store website with next-day delivery. Priya senses that a vague answer about quality will lose him, and that reciting ingredients will bore him. She has one chance to explain, in plain language, what a professional-only French house actually offers that a website cannot.`,
        insight: `Priya answers with the philosophy, not a product pitch: Guinot was born in the treatment room, sells only through trained professionals, and works as a partnership - her analysis of his skin, a precise treatment with a visible result, and a short prescription chosen for him rather than picked from a wall. Then she lets the facial prove it, and shows him the result in the mirror. The professional lesson: the distribution philosophy is not trivia, it is the answer to the internet. A website can sell a product; it cannot analyse, treat or take responsibility for a result.`,
      },
      summary: `Guinot is a French house founded in the 1960s by chemist René Guinot, whose machine facial, first Cathiodermie and then Hydradermie, became one of the best-known salon treatments in the world. Later led by Jean-Daniel Mondin, a doctor of pharmacy, with its own French laboratories and sister brand Mary Cohr, the house is scientific, methodical and proudly professional. Its philosophy is that beauty is a profession, expressed through professional-only distribution, and its USP is methodical, laboratory-developed treatments delivered by trained hands with results a guest can see.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify Guinot's hero products and treatment serums and describe what each is famous for`,
        `Explain the house's science-led ingredient philosophy in guest-ready language`,
        'Apply a reliable, honest method for learning any range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'Two shelves: treatment products and retail icons',
          body: `Guinot knowledge lives on two shelves, and a professional needs both. The first is the treatment shelf: the professional products used in the cabin, above all the personalised treatment gels at the heart of Hydradermie. During consultation the therapist analyses the skin and selects the gels whose actives answer what was found, and the machine's gentle ionisation then helps carry those actives into the skin. This is the crucial idea to grasp: the machine is the method, but the choice of actives is the prescription, and it is your analysis that personalises the treatment. The second shelf is retail, where the icons live: the products guests ask for by name and the ones that anchor most home prescriptions. Master the treatment products for your delivery and the retail icons for your credibility, and always connect the two, because in a Guinot business the home prescription is designed to continue the professional result. A therapist who can move fluently between both shelves sounds like the house itself.`,
        },
        {
          heading: 'The retail icons to learn first',
          body: `Start with Longue Vie Cellulaire, often described as the youth cream of the house and one of the most storied products in professional skincare. Its fame rests on the Cellular Life Complex, a blend of 56 active ingredients drawn from cell biology, including amino acids and coenzymes, formulated to support youthful-looking skin. Guests who know Guinot usually know this cream, and being able to tell its story in one fluent sentence is instant credibility. Next, Crème Hydrazone, a much-loved hydration hero and one of the easiest honest recommendations for the dehydrated skin you will see daily. Then the anti-ageing families that share their names with the professional facials: Age Summum, with ingredients such as pure vitamin C and hyaluronic acid, and Lift Summum for firming concerns. Learning these first gives you most of your retail conversations for a fraction of the effort, and the treatment-to-retail links are already built into the naming: a guest who loved a Summum facial has a Summum cream waiting.`,
        },
        {
          heading: 'The ingredient philosophy: science, plainly told',
          body: `Guinot's formulation story is scientific rather than botanical romance. The house speaks of actives, concentrations and mechanisms, researched and made in its own French laboratories, and its most famous ingredient stories reflect that: the 56 actives of the Cellular Life Complex, the pure vitamin C of Age Summum, hyaluronic acid for hydration and plumpness. Your job is to translate that science into guest-ready sentences without dumbing it down or drowning the guest in chemistry. The reliable pattern is three beats: the active, what it does, and what the guest will see. For example: this cream carries a complex of 56 cell-life actives, it supports the skin's youthful function, and over the weeks you should see a fresher, more rested look. Two disciplines keep this professional. Stay within claims the house itself makes in its training materials, and never quote a percentage, ingredient or mechanism you have not verified. A knowledgeable guest who catches one invented detail will quietly discount everything else you say.`,
        },
        {
          heading: 'How to learn a range properly',
          body: `No course can teach every product on your particular salon's shelf, because ranges evolve and menus differ, so the meta-skill matters more than any list: the professional method for learning a house fast and honestly. First, heroes before everything: Longue Vie Cellulaire, Hydrazone and the Summum families answer most guest questions and anchor most prescriptions. Second, one category at a time: cleansers as a family, then moisturisers, then serums, then body, learning each category's logic rather than memorising isolated items. Third, use the testers and the house training materials your salon holds; the brand's own words are your safest source for claims, and Guinot businesses are usually well supplied with training because education is part of the model. Fourth, use the key products on your own skin, because conviction cannot be faked and guests read your certainty within seconds. Fifth, practise the honest gap: when asked something you do not know, say what you do know, offer to check the rest, and then actually check it. Fluency is a method, not a memory feat.`,
        },
      ],
      keyTerms: [
        { term: 'Hero product', definition: `An iconic product that carries a house's reputation and that guests ask for by name; for Guinot, think of Longue Vie Cellulaire, Crème Hydrazone and the Age Summum and Lift Summum families.` },
        { term: 'Cellular Life Complex', definition: `The famous blend of 56 active ingredients drawn from cell biology, including amino acids and coenzymes, at the heart of Longue Vie Cellulaire.` },
        { term: 'Personalised treatment gels', definition: `The professional actives selected for each guest during a Hydradermie consultation and carried into the skin by gentle ionisation; the prescription at the heart of the method.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The knowledgeable regular at Thornbury Manor, the Cotswolds',
        scenario: `Ellie has just joined Thornbury Manor, a luxury country hotel spa in the Cotswolds with a long-standing Guinot account, moving from a botanical house she knew inside out. Her formal Guinot training is booked but a fortnight away, and she is on the column now. Her second guest, Mrs Okafor, has used Guinot for fifteen years and opens the consultation by asking whether the youth cream still has all fifty-six actives, and which gels Ellie plans to use in her Hydradermie and why. Ellie feels the pull to bluff a fluent answer rather than admit she is new to the range.`,
        insight: `Ellie's preparation saves her. She had learned the heroes first, so she can confirm the Cellular Life Complex story accurately, and she turns the gel question into the brand's own strength: she examines Mrs Okafor's skin, explains what she finds, and presents her gel choices as a prescription for today's skin rather than a recitation. Where a detail sits beyond her knowledge, she uses the honest gap and checks after the treatment. Mrs Okafor, treated as a partner in her own analysis, rebooks with Ellie by name. Method beat memory, and honesty beat bluffing.`,
      },
      summary: `Guinot product mastery spans two shelves: the professional treatment products, above all the personalised gels chosen through analysis for Hydradermie, and the retail icons, led by Longue Vie Cellulaire with its Cellular Life Complex of 56 cell-life actives, Crème Hydrazone for hydration, and the Age Summum and Lift Summum families with stars such as pure vitamin C and hyaluronic acid. Tell ingredient stories in the house's scientific spirit, three beats at a time, stay within verified claims, and learn any new range by the method: heroes first, category by category, personal use, and the honest gap.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate a Guinot treatment menu on day one and deliver the house's precise, results-led signature style with confidence`,
        'Retail the range by linking treatment, skin analysis and a short, honest home prescription',
        `Build integrity-led upsell and course-of-treatments paths and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every Guinot business's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the flagship: Hydradermie is the treatment the house is famous for, the machine facial with ionisation and high-frequency stages and personalised gels, and it is the one guests most often arrive already knowing. Learn it first, in full, including the machine handling. Then map the menu in layers: Hydradermie Lift, which uses gentle currents to stimulate the facial muscles for a lifted, toned appearance; the manual facials, led by Age Summum with its pure vitamin C and hyaluronic acid; radiance and renewal treatments such as Beauté Neuve, the double-peel facial known for restoring glow; and the body and aromatic treatments the salon offers. For each treatment note four things: duration, protocol source, products and settings used, and who it is for. Read the protocols the salon holds, shadow a senior therapist on the machines where you can, and ask questions before your first guest rather than improvising in front of one.`,
        },
        {
          heading: 'Delivering the signature style: precision as luxury',
          body: `The Guinot style is methodical, and in this house precision is the luxury. A machine treatment delivered with calm, practised hands, correct settings and smooth roller work feels like technology in the service of care; the same treatment delivered with fumbling and hesitation feels like an experiment, and no scented candle can rescue it. Practise the machine choreography until it is silent and certain: equipment checked before the guest arrives, gels prepared, stages flowing in the protocol order, timings honoured. Around the method, keep the five-star frame: a thorough consultation and skin analysis, because personalisation is the heart of Hydradermie; clear, calm explanation of what each stage does, because guests relax into machines they understand; and an unhurried finish with the result shown in the mirror, because Guinot sells visible outcomes and the mirror moment is where the promise is kept. Never trim protocol stages for time. The method is the brand, and a shortened method is a different treatment sold under the same name.`,
        },
        {
          heading: 'Retail: the prescription that continues the result',
          body: `Guinot retail follows the house's own logic: the professional treatment achieves the result, and the home prescription maintains it. That framing does the selling for you, because it is true and guests feel it. During the treatment, narrate the key products at natural moments, one sentence each, in the three-beat pattern: the active, what it does, what the guest will see. At the close, prescribe rather than pitch: two or three products, each linked explicitly to the treatment just delivered and to what your analysis found. The naming architecture makes the links effortless: the Age Summum facial guest has an Age Summum cream, the guest whose dehydration you treated has Hydrazone, and the guest who asks for one product that earns its keep has the Longue Vie Cellulaire story waiting. Tell guests what not to buy as well, which builds the trust that compounds over years. Write the prescription down, and record it on the guest's history so the next therapist, and the next visit, can continue the story rather than restart it.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Guinot's menu is built for honest progression. The single-facial guest whose skin you analysed is a natural course-of-treatments guest, because professional results build across a series, and explaining that truthfully is service, not selling. The manual facial guest with ageing concerns is a natural Hydradermie Lift or Age Summum guest next visit; say so at the close and note it on their record. Enhancements and eye-area additions, where your salon offers them, deepen a booking without changing it. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill. Alongside selling the brand, you protect it. On shift that means full protocols in the correct order, correct products in the correct quantities, machines cleaned, checked and reported when faulty rather than worked around, testers and retail immaculate, low stock flagged before it forces substitutions, and the method never quietly shortened to rescue a late-running column; flag the schedule instead. In a house whose philosophy is that beauty is a profession, your professionalism is the brand in the room.`,
        },
      ],
      keyTerms: [
        { term: 'Flagship treatment', definition: `The treatment a house is most famous for and the first one to master on any new menu; for Guinot, Hydradermie, the machine facial with ionisation, high-frequency stages and personalised gels.` },
        { term: 'Hydradermie Lift', definition: `The Guinot machine treatment that uses gentle currents to stimulate the facial muscles, delivering a lifted, toned appearance; a natural progression for guests with firming concerns.` },
        { term: 'Course of treatments', definition: `A planned series of professional treatments across weeks or months, reflecting the truth that skin results build cumulatively; the most honest upsell in a results-led house.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: faithful protocols, correct products and quantities, maintained machines, immaculate presentation, stock reporting and the method delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at The Rowanhurst, Harrogate',
        scenario: `Marta, an experienced agency therapist, arrives at The Rowanhurst, a five-star spa hotel in Harrogate, for her first shift on its Guinot menu. She has trained on Hydradermie before but not at this salon, and she has forty minutes before her first guest. She asks the head therapist for the menu and protocols, confirms the machine model, settings and gel range, and rehearses the roller work on her own forearm. Her second guest, Ms Bellamy, books her usual manual facial, mentions that her main worry is loss of firmness along the jaw, and says no one has ever suggested anything different for it.`,
        insight: `Marta's preparation makes the professional move available. She delivers the booked facial in full, then at the close connects the guest's own words to the menu: for firmness concerns, Hydradermie Lift is the treatment designed for exactly that, and a course would build the result properly. She prescribes two products matched to her analysis, writes them down, and notes the Lift recommendation on the guest's record for whoever treats her next. Nothing was pushed; a stated concern was heard and answered from the menu. One shift, one honest path opened, and an agency therapist The Rowanhurst asks for by name.`,
      },
      summary: `Mastering a Guinot shift is a craft with four faces. Read the menu like a professional, flagship first: Hydradermie before anything else, then Hydradermie Lift, Age Summum, Beauté Neuve and the body menu. Deliver the signature style with precision, because the method is the luxury: correct stages, settings and timings, framed by real analysis and the mirror moment. Retail as the prescription that continues the result, two or three linked products, written down. And build honest course-of-treatments and upgrade paths while protecting the standards, because in a house built on professional delivery, the therapist is the brand.`,
    },
  ],
}
