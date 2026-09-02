import type { CourseContent } from '../academy-types'

// Split out of the pack beside it so a course title can be imported
// without dragging every lesson of every course along with it.

export const content: CourseContent = {
  slug: 'thalgo-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Thalgo, the French house that defined marine cosmetics for the professional spa world. It covers the founding story, the thalassotherapy philosophy and the patented marine science that shape every treatment, the hero ingredients and skincare ranges a therapist must know cold, and the practical craft of the Thalgo shift: reading the treatment menu, delivering the marine signature style, retailing the range by linking products to treatments and skin analysis, building honest upsell paths, and upholding the standards that protect the brand's name. Where house-specific details vary by spa, the course teaches the professional method for learning them fast and accurately on day one. This is independent WHC training and is not affiliated with or endorsed by Thalgo.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, Thalgo spas and salons across UK luxury hotels, destination spas, day spas and thalassotherapy-inspired venues. It suits therapists interviewing for a Thalgo account who want to arrive fluent, agency and freelance therapists who may be asked to deliver the house style at short notice, experienced therapists moving to Thalgo from another house, and spa managers or head therapists who coach brand standards. Reception and retail colleagues in Thalgo venues will also gain a working command of the range and its marine language.`,
  outcomes: [
    `Tell Thalgo's founding story and articulate its marine philosophy and USP in confident, guest-ready language`,
    'Name the hero ingredients and skincare ranges and match each range to the skin need it answers',
    `Deliver the marine signature style, from the algae body wrap tradition to results-led facials, at five-star standard`,
    'Retail the range by linking products used in treatment to a two or three item home prescription',
    `Build integrity-led upgrade paths between treatments and uphold the house's standards on every shift`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount Thalgo's founding story and explain the meaning of its name and the significance of its patented marine science`,
        `Explain the thalassotherapy philosophy that positions the ocean as the source of skin-compatible nutrition`,
        `Articulate Thalgo's USP to a guest in one confident, accurate sentence, using the house's marine voice`,
      ],
      sections: [
        {
          heading: 'A pharmacist, the sea, and 1964',
          body: `Thalgo was founded in France in 1964 by André Bouclet, a pharmacist convinced that the sea held therapeutic riches that beauty and wellness had barely begun to use. The scientific framing matters: this is a house born from a pharmacy mindset, not a fashion or fragrance one, and its earliest ambition was to make the benefits of the marine world genuinely available to the skin rather than merely to evoke the seaside. The brand grew up alongside France's thalassotherapy tradition, the structured use of seawater, marine climate and marine derivatives for health and wellbeing, and it built its reputation in the professional channel, supplying trained therapists in salons, spas and thalassotherapy centres rather than supermarket shelves. For a therapist, that heritage answers the guest who asks what makes the brand different: Thalgo has spent decades formulating for professional hands first, with homecare designed as the continuation of the treatment. The house remains proudly French, rooted on the Mediterranean coast, and proudly professional in its distribution and its training culture.`,
        },
        {
          heading: 'The name and the patent: micronised marine algae',
          body: `The name Thalgo is the brand's philosophy compressed into two syllables: thalassotherapy and algae, sea therapy and seaweed. The defining scientific breakthrough followed soon after the founding, when Thalgo developed and patented the micronisation of marine algae. Ordinary seaweed is locked away from the skin; its cell walls hold minerals, trace elements, vitamins and amino acids that a whole leaf cannot deliver. Micronisation grinds the algae to an extraordinarily fine powder, breaking those structures open so the actives become available where they touch the body. That patented powder became the basis of the professional micronised marine algae body wrap, the treatment on which the house built its name in salons and spas around the world, and the emblem of everything the brand does: take the richness of the ocean and refine it with science until the skin can use it. When you can explain micronisation in two guest-friendly sentences, you hold the single most persuasive piece of Thalgo knowledge there is.`,
        },
        {
          heading: 'The philosophy: the ocean as origin',
          body: `Thalgo's philosophy begins with a simple observation the house never tires of making: life began in the ocean, and seawater bears a striking affinity with the fluids of the human body, which is part of why marine minerals and trace elements are so readily received by the skin. From that starting point the brand positions itself as the marine beauty expert: its role is to source algae and marine ingredients responsibly, refine them with laboratory science, and deliver them through professional treatments and structured homecare. The tone that follows is distinctive. Thalgo speaks the language of results and of nature at once: it is comfortable with words like minerals, trace elements, actives and efficacy, yet everything is anchored in the story of the sea. A therapist on a Thalgo account should hold both registers, moving from the sensory, the scent of the ocean in a wrap, to the scientific, what the algae actually delivers, in a single unforced sentence. That double fluency, poetry and pharmacy together, is the house voice.`,
        },
        {
          heading: 'The USP in one breath',
          body: `Every therapist on a Thalgo account should be able to state the USP in one sentence, because guests ask, interviewers ask, and hesitation reads as ignorance. A reliable version: Thalgo is the French marine beauty expert, offering professional skincare and spa treatments powered by algae and marine actives, born from thalassotherapy and delivered through trained hands worldwide. Each clause earns its place. French, because the heritage and formulation culture are genuinely French and guests value it. Marine beauty expert, because no theme is borrowed: the sea is the whole identity, protected by decades of research and the founding patent. Powered by algae and marine actives, because that is the honest formulation story from the body wraps to the premium facial ranges. Born from thalassotherapy, because the brand descends from a genuine treatment tradition rather than a marketing concept. Delivered through trained hands, because the professional channel is where Thalgo lives, which flatters both the spa and the therapist saying it. State it warmly, and let the treatment prove it.`,
        },
      ],
      keyTerms: [
        { term: 'Thalassotherapy', definition: `The structured use of seawater, marine climate and marine derivatives such as algae and mud for health and wellbeing; the French treatment tradition from which Thalgo descends and takes half its name.` },
        { term: 'Micronisation', definition: `Thalgo's patented process of grinding marine algae to an extraordinarily fine powder, breaking open cell structures so minerals, trace elements and actives become available to the skin.` },
        { term: 'Marine actives', definition: `Ingredients derived from the sea, including algae extracts, marine collagen and mineral-rich derivatives, selected for specific skin benefits; the formulation heart of the house.` },
        { term: 'USP', definition: `Unique selling point: the specific, honest claim that distinguishes a house from its competitors, which every therapist should be able to state in one sentence.` },
      ],
      caseStudy: {
        title: 'The sceptical guest at The Pendarrow, Cornwall',
        scenario: `Priya is a therapist at The Pendarrow, a clifftop spa hotel in Cornwall whose menu is built on Thalgo. Her guest, Mrs Ellison, is a well-read skincare enthusiast who says during consultation: seaweed in face cream sounds like marketing to me, the sea is lovely but I do not see what it has to do with results. Priya senses that a defensive list of ingredients will sound exactly like the marketing Mrs Ellison distrusts. She decides instead to tell the house story in miniature, then let the treatment and the analysis of the guest's own skin carry the argument for her.`,
        insight: `Priya answers with the pharmacy, not the poetry: Thalgo was founded by a French pharmacist in 1964, and its patented breakthrough was grinding marine algae so finely that the minerals and actives locked in the seaweed actually become available to the skin. She then connects it to the analysis: the hydration family she has chosen answers the dehydration she can see on Mrs Ellison's cheeks. The professional lesson: a sceptical guest is not asking for enthusiasm, they are asking for substance. The founding story, the patent and a specific link to their own skin is substance, delivered in under a minute.`,
      },
      summary: `Thalgo is the French marine beauty house, founded in 1964 by pharmacist André Bouclet and named for thalassotherapy and algae, the two roots of everything it does. Its defining breakthrough was the patented micronisation of marine algae, which makes the seaweed's minerals and actives available to the skin and underpins the professional body wrap that made its name. The philosophy holds that the ocean is the origin of life and an unmatched source of skin-compatible nutrition, refined by science and delivered through professional hands. The USP, the French marine beauty expert, should live on every therapist's tongue.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify Thalgo's hero marine ingredients and explain in guest-ready language what each brings to the skin`,
        'Map the main skincare ranges to the skin needs they answer, from hydration to premium anti-ageing',
        'Apply a reliable, honest method for learning any range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'The marine larder: ingredients to know cold',
          body: `Thalgo's formulation story starts with the founding hero: micronised marine algae, the patented fine-ground seaweed rich in minerals, trace elements and amino acids, most famous in the professional body wrap and present in spirit across the house. Around it sits a marine larder a therapist should be able to narrate without notes. Marine collagen supports the skin's plumpness and smoothness story in the anti-ageing families. Hyaluronic acid, a moisture magnet the skin recognises, drives the hydration narratives. Spirulina, the nutrient-dense blue-green algae, carries the energising, antioxidant story for skin dulled by city life and fatigue. And targeted algae and marine extracts appear range by range, each chosen for a specific job. The professional discipline is one sentence per ingredient: what it is, what it does, how the guest will feel or see the difference. Precision matters more than volume; a therapist who can say three true, simple things about the algae in the jar will always outsell one reciting a memorised paragraph of claims.`,
        },
        {
          heading: 'The facial ranges: a map organised by skin need',
          body: `Thalgo organises its facial care by skin need, which makes the shelf a diagnostic map rather than a memory test. Learn the families as answers to questions. Skin thirsty, tight and dulled by dehydration: Source Marine, the hydration family. Skin dry and sensitive, needing comfort and softness: Cold Cream Marine, a name with real guest recognition, beloved for winter skin, reactive skin and anyone whose barrier needs kindness. Skin losing firmness and showing wrinkles: Silicium, the firming and wrinkle-correction family. Skin dulled by urban living, stress and fatigue: Spiruline Boost, the energising antioxidant family built around spirulina. And at the summit of the house sits Prodige des Océans, the premium anti-ageing line, Thalgo's most luxurious expression of marine intelligence and typically the range behind the top facial on a spa's menu. Ranges evolve and menus differ between venues, so treat this map as your starting frame and confirm your own spa's current shelf against the brand's training materials in your first week.`,
        },
        {
          heading: 'Narrating the sea: ingredient stories in treatment',
          body: `The moment to teach a guest about a product is the moment they are experiencing it, because their own senses verify every word you say. During cleansing, one sentence about what the formula is doing; as a mask goes on, one sentence about the algae or the marine active inside it and what it will leave behind; as a wrap warms, the micronisation story in miniature. This is the most honest advertising in the industry, and with Thalgo it is unusually easy, because the sea gives every product a narrative spine: sourced from the ocean, refined by science, delivered by professional hands. Two disciplines keep it professional. First, lead with feeling and benefit in the house's double voice, marine poetry anchored by pharmacy-grade specifics, rather than reciting chemistry. Second, never claim an ingredient, a percentage or a mechanism you have not verified from the brand's own materials. An invented detail that unravels in front of a knowledgeable guest costs more credibility than a modest true sentence ever earns, and marine skincare attracts knowledgeable guests.`,
        },
        {
          heading: 'How to learn a range properly',
          body: `No course can teach you the exact shelf of your particular spa, because ranges evolve and stock varies, so the meta-skill matters more than any list: the professional method for learning a house fast and honestly. First, heroes before everything: the micronised algae story, the range map and the top-tier line answer most guest questions and anchor most retail. Second, one family at a time: learn Source Marine as a set, then Cold Cream Marine, then the anti-ageing tiers, understanding each family's logic rather than memorising isolated products. Third, use the testers and the spa's Thalgo training materials; the house's own words are your safest source for any claim. Fourth, use the key products on your own skin, because conviction cannot be faked and guests read certainty in seconds. Fifth, keep the habit of the honest gap: when asked something you do not know, say what you do know, offer to check, and actually check. A therapist working this method is genuinely fluent on a new Thalgo account within a week.`,
        },
      ],
      keyTerms: [
        { term: 'Micronised marine algae', definition: `Thalgo's patented fine-ground seaweed, rich in minerals and trace elements made available to the skin; the founding hero ingredient and the basis of the professional body wrap.` },
        { term: 'Marine collagen', definition: `A collagen sourced from marine origin used in the house's anti-ageing story to support the appearance of plumpness and smoothness in the skin.` },
        { term: 'Spirulina', definition: `A nutrient-dense blue-green algae carrying Thalgo's energising, antioxidant story for skin dulled by urban life and fatigue, headline ingredient of the Spiruline Boost family.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming; the opposite of inventing product details under pressure.` },
      ],
      caseStudy: {
        title: 'The first week at Wraysbury Manor, Berkshire',
        scenario: `Callum has joined the spa at Wraysbury Manor, a five-star country house hotel in Berkshire, moving from a botanical house he knew intimately to a Thalgo account he barely knows. His formal brand training is weeks away, but he is on the column from Monday. In his first facial, his guest Mrs Okafor mentions that her skin has felt tight and dull since a stressful house move, then asks what is actually in the mask he is applying and whether the famous seaweed wrap would help her dry, flaky shins. Callum feels the pull to bluff two confident answers rather than admit he is new to the range.`,
        insight: `Callum works his method instead. He learned the range map before Monday, so he can honestly explain that her tight, dulled skin is a dehydration story and that the mask he chose comes from the hydration family, one sentence on the marine actives inside it. On the wrap he uses the honest gap: he describes the micronised algae tradition accurately, says he wants to confirm the best option for her legs with the senior therapist, and has the answer and a note on her record before she leaves. She books the wrap. Fluency is a method, not a memory feat.`,
      },
      summary: `Thalgo product mastery starts with the marine larder: patented micronised algae, marine collagen, hyaluronic acid and spirulina, each narrated in one honest sentence. The facial ranges form a map organised by skin need: Source Marine for hydration, Cold Cream Marine for dry and sensitive comfort, Silicium for firming, Spiruline Boost for urban fatigue, and Prodige des Océans as the premium summit. Products are taught while the guest experiences them, in the house's double voice of marine story and pharmacy substance. Beyond any list, the lasting skill is the learning method: heroes first, one family at a time, the brand's own materials, personal use, and the honest gap instead of invention.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Navigate a Thalgo treatment menu on day one and deliver the house's marine signature style with confidence`,
        'Retail the range by linking the products used in treatment and the skin analysis to a short, honest home prescription',
        `Build integrity-led upsell paths between treatments and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'Reading the treatment menu like a professional',
          body: `Every Thalgo spa's menu differs in detail, so the day one discipline is a reading method, not a memorised list. Start with the marine classics: the micronised marine algae body wrap is the treatment the house built its name on, and it anchors the body menu wherever it appears. Then map the facials onto the ranges you already know, because Thalgo menus usually mirror the shelf: a hydration facial built on Source Marine, comfort for dry and sensitive skin from Cold Cream Marine, firming from Silicium, and a top-tier experience built on Prodige des Océans. Many venues also carry the house's multi-sensory body rituals, such as the Indocéane journey; if yours does, learn it in full, because ritual treatments live or die on faithful delivery. For each treatment note four things: duration, protocol source, products used, and who it is for. Read the protocols the spa holds, shadow a senior therapist where you can, and ask questions before your first guest rather than improvising in front of one.`,
        },
        {
          heading: 'Delivering the marine signature style',
          body: `A Thalgo treatment should feel like the sea made professional: sensory, warm and evocative, yet visibly diagnostic and results-led. In practice that means three commitments. First, honour the sensory architecture: the scent of the products, the enveloping warmth of a wrap, the unhurried transitions; these are not decoration, they are the thalassotherapy inheritance, and a rushed version is not a shorter Thalgo treatment, it is not a Thalgo treatment at all. Second, keep the diagnostic spine visible: a proper skin analysis before a facial, findings narrated in a sentence or two, and every product choice traceable to something you saw or the guest told you. Third, tell the marine story at the right moments, briefly: the micronisation sentence as a wrap goes on, the range's purpose as a serum is applied. Guests should leave able to repeat one true thing about the sea and their skin. That balance, evocative delivery on a clinical frame, is the house style, and therapists who hold both are the ones guests describe when they rebook.`,
        },
        {
          heading: 'Retail: the ocean continued at home',
          body: `Thalgo retail succeeds when it is framed as the treatment going home with the guest, and the range map makes it unusually natural. During the treatment, narrate the key products at natural moments, one sentence each, while the guest is experiencing them. At the close, prescribe rather than pitch: two or three products, each linked explicitly to the treatment just delivered and to what your analysis found. The strongest links are the ones the guest has already felt: the cleanser that opened the facial, the serum from the range you matched to their skin need, the cream whose texture they commented on. Because the ranges answer needs, your analysis is the prescription: dehydration found means the hydration family goes home; sensitivity found means Cold Cream Marine. Tell them what not to buy as well, which builds the trust that compounds over years. Write the prescription down, state prices plainly if asked and without apology, and record the recommendation on the guest's history so the next therapist can continue the story rather than starting again.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upsell paths in a Thalgo spa follow the menu's own logic. The facial guest whose skin showed real dehydration or ageing benefits from a course of facials, explained honestly as how professional skin results actually work. The massage guest intrigued by the marine scent is a natural algae body wrap guest next visit. The facial regular ready for something more is a candidate for the top-tier Prodige des Océans experience or a full body ritual. Offer once, warmly, at the natural moment, and note declined suggestions on the record for another day. The integrity rule is absolute: every upgrade must improve the guest's outcome, not merely the bill. Alongside selling the brand, you protect it: correct products in correct quantities, protocols followed rather than privately edited, testers and retail shelving immaculate, low stock reported before it forces substitutions, and the ritual never quietly trimmed to rescue a late-running column; flag the schedule instead. Guests experience the brand only through its therapists. On a Thalgo shift, you are Thalgo, and the standard you hold is the brand's reputation in that room.`,
        },
      ],
      keyTerms: [
        { term: 'Marine classics', definition: `The treatments a Thalgo menu is anchored by, led by the micronised marine algae body wrap, the professional treatment on which the house built its name.` },
        { term: 'Diagnostic spine', definition: `The visible thread of analysis running through a results-led treatment: skin assessed, findings narrated, and every product choice traceable to what was found.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely loved or needs, such as facial to facial course, or massage to algae body wrap.` },
        { term: 'Brand standards', definition: `The practices that protect a house's reputation on shift: correct products and quantities, faithful protocols, immaculate presentation, stock reporting and the ritual delivered in full.` },
      ],
      caseStudy: {
        title: 'The agency shift at The Harborne, Edinburgh',
        scenario: `Elena, an experienced agency therapist, arrives at The Harborne, a five-star spa hotel in Edinburgh, for her first shift on its Thalgo menu. She has forty minutes before her first guest, so she asks the head therapist for the menu and protocols, learns the algae body wrap structure and the facial tiers first, and confirms the products for her first two bookings. Her second guest, Ms Fraser, is a massage regular who remarks during consultation that she loves the smell of the spa's products, that her skin has felt parched all winter, and that no one has ever suggested she try anything beyond her usual massage.`,
        insight: `Elena's preparation makes the professional move available. She delivers the massage beautifully, narrating the marine story once, at the right moment. At the close she links retail to what she found, prescribing a hydration-family product for the parched skin Ms Fraser described, and opens the honest upgrade path: since the marine scent is what she loves, the micronised algae body wrap is the natural next visit, warming, enveloping and the treatment the house is famous for. She notes both on the record. Nothing was pushed; a stated preference was heard and answered, and the spa asks the agency for Elena by name.`,
      },
      summary: `Mastering a Thalgo shift is a craft with four faces. Read the menu like a professional: marine classics first, led by the algae body wrap, with the facials mapped onto the ranges. Deliver the signature style: sensory, marine and unhurried on the surface, diagnostic and results-led at the spine, with the sea's story told briefly at the right moments. Retail as the ocean continued at home, prescribing two or three products that follow directly from your analysis. And build honest upgrade paths while protecting the standards, because on shift the therapist is the brand, and the ritual is never the thing you trim.`,
    },
  ],
}
