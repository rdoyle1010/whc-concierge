import type { CourseContent } from '../academy-types'

// Split out of the pack beside it so a course title can be imported
// without dragging every lesson of every course along with it.

export const content: CourseContent = {
  slug: 'evolve-organic-beauty-masterclass',
  aims: `This masterclass gives working spa therapists genuine professional depth in Evolve Organic Beauty, the independent British natural skincare house founded in 2009 and made by hand in small batches in its own Hertfordshire studio. It covers the founding story and philosophy that make the brand distinctive, the hero products and ingredient stories a therapist must know cold, and the practical craft of working with Evolve in a spa: reading the spa's own Evolve menu and protocols, delivering a sensory, natural treatment style, retailing by linking products to treatments, building honest upgrade paths, and upholding the standards a natural, transparency-led brand depends on. Where details vary by spa, the course teaches the professional method for learning them accurately on day one. This is independent Talent House training and is not affiliated with or endorsed by Evolve Organic Beauty.`,
  audience: `Spa and wellness therapists working in, or preparing to work in, spas that carry Evolve Organic Beauty, whether as a treatment house or as a natural retail range alongside another brand. It suits therapists interviewing at spas with a sustainability or organic focus, agency and freelance therapists who may meet the range at short notice, experienced therapists moving from a clinical or larger house, and spa managers or head therapists who coach brand and retail standards. Reception and retail colleagues will also gain a confident, accurate command of the range and its language.`,
  outcomes: [
    `Tell Evolve's founding story and articulate its philosophy and USP in confident, guest-ready language`,
    'Name the hero products and aromatherapy blends and explain their ingredient stories accurately, in the brand\'s own terms',
    `Approach the spa's Evolve menu and protocols with a reliable day one method and deliver a sensory, natural treatment style`,
    'Retail the range by linking products used in treatment to a two or three item home prescription',
    `Build integrity-led upgrade paths and uphold the honest, transparency-led standards the brand depends on`,
  ],
  lessons: [
    {
      title: 'The house: history, philosophy and USP',
      objectives: [
        `Recount Evolve's founding story and explain why its independent, in-house, small-batch making sets it apart`,
        `Explain the house philosophy of high-performing natural skincare built on transparency and sustainability`,
        `Articulate Evolve's USP to a guest in one confident, accurate sentence, using the house's own tone of voice`,
      ],
      sections: [
        {
          heading: 'An independent house, made by hand',
          body: `Evolve Organic Beauty was founded in 2009 by Laura Rudoe, who had worked in the skincare industry before setting out to build her own brand. The brand still describes itself as founder-led and independent, female-led, and free from the pressure of outside investors, and that independence explains a great deal about how it behaves. The founder has said in interviews that the brand stayed small for years, growing steadily rather than quickly, and that patience is visible in its character. For a therapist, the important point is simple: Evolve is not a range created by a large group to occupy a natural shelf. It is a British business with a named founder, its own studio and its own formulators, and guests who care about who makes their skincare respond strongly to that story. When a guest asks what the brand is, you can answer with facts rather than adjectives: independent, British, founded in 2009, and still run by the person who started it.`,
        },
        {
          heading: 'The Hertfordshire Eco Studio and small-batch making',
          body: `The detail that most clearly separates Evolve from its competitors is where and how the products are made. Most skincare companies, including many natural ones, use contract manufacturers: the brand owns the formula and a factory makes it. Evolve does not. It formulates in house and makes its products by hand, in small batches, in its own Eco Studio in Hertfordshire, which the brand says runs on renewable energy. The founder has explained that small-batch making in their own studio began out of necessity, when the brand was small, but that the team now sees it as a real product benefit, because they know exactly what goes into every product and where each ingredient comes from. That is a powerful and honest point for a therapist to carry into a consultation. It speaks to freshness, care and accountability without any need to exaggerate. Use it as it is: the brand makes its own products, in small batches, in Hertfordshire. You do not need to embellish a story that is already this specific.`,
        },
        {
          heading: 'The philosophy: purity that performs',
          body: `Evolve frames its mission around three ideas: skincare that is high-performing, transparent and sustainable. The first matters because natural skincare is sometimes assumed to be gentle but ineffective, and the brand deliberately positions itself against that assumption, using plant-derived actives such as hyaluronic acid, vitamin C and a plant alternative to retinol. The second, transparency, shows up in the way the brand talks about ingredients openly and explains where they come from. The third, sustainability, runs through the business: many of its products carry COSMOS organic or natural certification, the Soil Association's international standard for organic and natural cosmetics; the range is vegan and cruelty free; and its parent company is a certified B Corp. Teach yourself to hold all three ideas together. A therapist who only talks about being natural undersells the brand's performance, and one who only talks about results misses why many guests choose it. The balanced version is the house: natural, certified where it says so, and made to work.`,
        },
        {
          heading: 'The USP in one breath, and the house voice',
          body: `Every therapist working with Evolve should be able to state its USP in a single sentence. A reliable version: Evolve is an independent British house making certified organic, high-performing skincare by hand in small batches in its own Hertfordshire studio. Each part earns its place. Independent and British, because guests who choose natural brands often care who owns them. Certified organic, because certification is evidence, not adjectives. High-performing, because the brand insists on results. Made by hand in small batches in its own studio, because that is its deepest point of difference. The house voice is warm, open and plain-speaking: it explains rather than dazzles, and it would rather tell a guest exactly what is in a product than use a vague word like clean. Match that voice. Avoid clinical bravado and avoid green clichés. Speak as someone who knows where the product was made and is happy to show the label, because with this brand, the label is part of the pitch.`,
        },
      ],
      keyTerms: [
        { term: 'Product house', definition: `A brand that supplies a spa's products and often its protocols and training; a spa may partner with it for treatments or carry it as a retail range.` },
        { term: 'Contract manufacturer', definition: `A factory that makes products for a brand that owns the formula; most skincare brands use one, and Evolve's point of difference is that it does not.` },
        { term: 'Small-batch making', definition: `Producing in limited runs rather than large factory volumes; Evolve makes its products this way, by hand, in its own Hertfordshire studio.` },
        { term: 'COSMOS certification', definition: `The Soil Association's international standard for organic and natural cosmetics; many Evolve products carry COSMOS organic or natural certification.` },
        { term: 'B Corp', definition: `A certification for businesses that meet independent standards of social and environmental performance; Evolve's parent company is certified.` },
      ],
      caseStudy: {
        title: 'The greenwashing question at The Wrenbury, Marylebone',
        scenario: `Priya is a therapist at The Wrenbury, a boutique hotel spa in Marylebone that carries Evolve alongside its main treatment house. During a consultation her guest, Ms Hartley, who works in sustainable fashion, says she is tired of brands that put a leaf on the bottle and call it natural, and asks whether Evolve is just another one. Priya feels the temptation to reassure her with big words about purity and the planet. She recognises that this guest will see straight through adjectives, and that she needs facts the guest can check for herself.`,
        insight: `Priya answers with specifics. The brand was founded in 2009 by Laura Rudoe and is still independent; it formulates in house rather than using a contract manufacturer; it makes its products by hand in small batches in its own Hertfordshire studio; many products carry COSMOS certification from the Soil Association; and the parent company is a B Corp. Then she hands Ms Hartley the product to read the label herself. The professional lesson: with a transparency-led brand, the most persuasive thing you can offer is verifiable fact, plainly stated. Never answer scepticism with louder claims.`,
      },
      summary: `Evolve Organic Beauty is an independent, founder-led British house founded in 2009 by Laura Rudoe. Its deepest point of difference is that it formulates in house and makes its products by hand, in small batches, in its own Hertfordshire Eco Studio, rather than using a contract manufacturer. Its philosophy joins high performance, transparency and sustainability, backed by COSMOS certification on many products, a vegan and cruelty-free range and a B Corp parent company. Its USP should be stated in one plain, factual sentence, in a voice that explains rather than dazzles.`,
    },
    {
      title: 'Product knowledge and hero ingredients',
      objectives: [
        `Identify Evolve's hero products, masks and aromatherapy blends and describe what each is known for`,
        `Explain the brand's ingredient stories in guest-ready language, attributing every benefit to the brand's own wording`,
        'Apply a reliable, honest method for learning the range quickly without inventing claims',
      ],
      sections: [
        {
          heading: 'Heroes first: Hyaluronic Serum 200 and the hydration trio',
          body: `Every house has a product guests ask for by name, and for Evolve it is Hyaluronic Serum 200, which the brand itself describes as its number one global bestseller. It is a natural hyaluronic acid serum, and its listed ingredients include aloe leaf juice, rose flower water and pomegranate extract alongside the hyaluronic acid. The brand presents it as the hydrating centre of an Evolve routine, and it is the easiest honest recommendation in the range for a guest whose skin feels dry, tight or tired. Around it, learn the products the brand sells together as its Hydration Trio. The Gentle Cleansing Melt is a water-free balm cleanser, made with plant oils including baobab, sunflower and sweet almond, and scented with vanilla and rose. The Daily Renew Facial Cream is the moisturiser, which the brand describes as nourishing the skin with organic argan oil and shea butter. Cleanse, serum, cream: if you can present those three fluently, each in one sentence, you can already answer most of the questions an Evolve guest will ask.`,
        },
        {
          heading: 'The treatment masks: bio-retinol and vitamin C',
          body: `Two masks give the range its more targeted side, and they are worth knowing well because they translate naturally into a weekly home ritual. The Bio-Retinol Gold Mask is built around what Evolve calls bio-retinol, an extract of the plant Bidens pilosa, which the brand describes as delivering the benefits of retinol without the irritation, alongside rosehip oil. This is a useful answer for the guest who wants a retinol-style product but finds conventional retinoids too strong; present it in the brand's own terms and let the guest decide. The Miracle Vitamin C Mask combines AHAs, a stable form of vitamin C and maca, and the brand positions it for a brighter, more radiant look. Be precise and modest with both. You can say what the mask contains and what the brand says it does; you should not promise results on a timetable, compare it with prescription treatments, or recommend it for a skin condition. If a guest is pregnant, under medical care or reacting to products, follow your spa's contraindication guidance and suggest they check with their own doctor.`,
        },
        {
          heading: 'The aromatherapy blends',
          body: `Evolve's sensory side lives in its aromatherapy blends, sold as bath and body oils and in other body products, and they are the part of the range that turns a treatment into a memory. Zen Whisper is built on lavender, frankincense and vetiver, and is the blend the brand pairs with rest and sleep. Wild Divine is built on rose otto, geranium and cacao. Joyful Light and Vital Clarity complete the signature family; check their current notes on your spa's testers before describing them. The bath oil in the Zen Whisper pairing is designed to turn milky in the water, a small detail guests enjoy. In practice, the blends work best when the guest chooses. Offer two or three to smell during consultation, notice which one they reach for, and use it through the treatment. When the guest leaves, that same blend is the most natural retail recommendation you will ever make, because they are taking home the scent of the hour they relaxed. Let the choosing be part of the experience, not a step to rush.`,
        },
        {
          heading: 'Speaking about ingredients honestly',
          body: `A natural brand attracts guests who read labels, and some of them will know more about ingredients than you expect. Two disciplines keep you credible. First, attribute: the brand describes bio-retinol as working like retinol without irritation; the brand calls Hyaluronic Serum 200 its bestseller; the brand says the cream nourishes with argan oil and shea butter. That wording is accurate and keeps you on safe ground. Second, never invent: do not quote ingredient percentages, do not claim a product treats a condition, and do not repeat claims from social media or another therapist without checking the brand's own materials. For learning the range, follow the professional method. Heroes first, then one category at a time: cleansers, serums, moisturisers, masks, body. Read the current product information your spa holds, because formulations and names can change. Use the key products yourself until you can describe the texture and scent from experience. And practise the honest gap: say what you know, offer to check the rest, and then check it.`,
        },
      ],
      keyTerms: [
        { term: 'Hero product', definition: `An iconic product that carries a house's reputation; for Evolve, Hyaluronic Serum 200, which the brand calls its number one global bestseller.` },
        { term: 'Hyaluronic acid', definition: `A moisture-binding ingredient used in hydrating skincare; the centre of Evolve's Hyaluronic Serum 200.` },
        { term: 'Bio-retinol', definition: `Evolve's name for an extract of the plant Bidens pilosa, which the brand describes as giving retinol-like benefits without irritation; used in the Bio-Retinol Gold Mask.` },
        { term: 'Balm cleanser', definition: `A water-free cleanser that melts on the skin; Evolve's Gentle Cleansing Melt is one.` },
        { term: 'The honest gap', definition: `The professional habit of saying what you know, admitting what you do not, and checking before claiming.` },
      ],
      caseStudy: {
        title: 'The retinol question at Elderfield Park, the Cotswolds',
        scenario: `Tom is a therapist at Elderfield Park, a country house hotel spa in the Cotswolds that retails Evolve. After a facial, his guest Mrs Okafor explains that she gave up a retinol serum because it left her skin red and flaky, and asks whether the gold mask on the shelf is the same kind of thing and whether it will fix her fine lines. Tom has used the mask himself and likes it, and he feels the pull to promise her that it will do everything the retinol did without the side effects.`,
        insight: `Tom stays inside the brand's own words. He explains that the mask uses what Evolve calls bio-retinol, from the plant Bidens pilosa, which the brand describes as giving retinol-like benefits without irritation, and that it also contains rosehip oil. He does not promise results or a timescale, and because she has reacted before he suggests she patch test first, following the spa's guidance. He pairs it with Hyaluronic Serum 200 for daily hydration. Mrs Okafor buys both and trusts him because he did not oversell. Accurate attribution is not a weakness in retail; with a label-reading guest it is the whole case.`,
      },
      summary: `Evolve product mastery starts with Hyaluronic Serum 200, the brand's self-described number one global bestseller, and the Hydration Trio it anchors with the Gentle Cleansing Melt and the Daily Renew Facial Cream. The Bio-Retinol Gold Mask and the Miracle Vitamin C Mask give the range its targeted side, and the aromatherapy blends, Zen Whisper, Wild Divine, Joyful Light and Vital Clarity, give it its sensory heart, always chosen with the guest. Attribute every benefit to the brand, never invent percentages or medical claims, and learn the range heroes first, one category at a time.`,
    },
    {
      title: 'Signature treatments, retail and upselling',
      objectives: [
        `Approach a spa's Evolve menu on day one with a reliable method and deliver a sensory, natural treatment style`,
        'Retail the range by linking the products used in treatment to a short, honest home prescription',
        `Build integrity-led upgrade paths and uphold the brand's standards on every shift`,
      ],
      sections: [
        {
          heading: 'What the professional offer is, and what it is not',
          body: `Evolve has a professional spa offer of its own. On its website the brand describes holistic face and body protocols, bespoke organic facials, body rituals and a Custom Blend Massage that uses custom-blended organic oils and aromatherapy. It says these protocols are designed around modern wellbeing concerns such as stress, sleep and burnout, and that it supports partner spas with training and business guidance. That is the honest outline. What a course like this cannot tell you is the exact name, duration and step-by-step protocol of each treatment on your spa's menu, because partner spas tailor their menus and the brand trains its own partners directly. Many other spas carry Evolve as a natural retail range alongside a different treatment house. So the first professional question on any new shift is simply: how does this spa use Evolve? As its treatment house, as part of a body or massage menu, or as retail only? The answer shapes everything else you do.`,
        },
        {
          heading: 'Reading the menu and delivering the style',
          body: `On day one, ask for the spa's Evolve menu and protocols and read them before your first guest. For each treatment note four things: duration, protocol source, products used and who it is for. Shadow a senior therapist if you can, and ask rather than guess; improvising a branded treatment is the quickest way to lose a guest's trust and a manager's confidence. Then bring the house character into whatever you deliver. The Evolve style is sensory, natural and personal. Offer the guest a choice of aromatherapy blends to smell and let them choose, then carry that blend through the treatment so it becomes their thread. Work with unhurried, attentive touch. Narrate products simply and honestly at natural moments: this is a balm cleanser made with plant oils, this serum is the brand's bestseller, this is the blend you chose. Keep the room calm and the language plain. A guest who chose a natural brand wants to feel looked after, not processed, and should leave knowing exactly what was used on their skin.`,
        },
        {
          heading: 'Retail: the treatment continued at home',
          body: `Evolve retail works best when it feels like a short, personal prescription rather than a sales pitch. During the treatment, mention the key products once, when the guest is experiencing them. At the close, prescribe two or three products, each linked to what you used and what you noticed. For a guest whose skin felt dry and tight, the Hydration Trio of Gentle Cleansing Melt, Hyaluronic Serum 200 and Daily Renew Facial Cream is a complete, honest routine. For a guest who loved the facial and wants something more, a weekly mask, the Bio-Retinol Gold Mask or the Miracle Vitamin C Mask, re-creates part of the treatment at home. For the guest who melted during the massage, the blend they chose, as a bath or body oil, is the strongest recommendation of all. Tell them what they do not need as well. Write the prescription down and record it on the guest's history, so the next therapist can continue the conversation. Guests who choose natural brands are often loyal for years once they trust you, so trust is the asset to protect.`,
        },
        {
          heading: 'Upselling with integrity, and protecting the brand on shift',
          body: `Upgrade paths should grow from what the guest genuinely enjoyed. A facial guest who loved the massage elements may value a longer face and body protocol next time; a massage guest carrying real tension may benefit from more time, offered once and warmly; a guest who loved the chosen blend may enjoy a body ritual built around it. Every upgrade must improve the guest's experience, not merely the bill. Alongside selling the brand, you protect it, and with a transparency-led house that protection includes your words. Use the correct products in the correct quantities and follow the spa's protocols rather than your own variation. Keep testers clean and dated and the retail shelf tidy. Report low stock before it forces a substitution. Use only the brand's own claims, attributed to the brand: no medical promises, no percentages, no comparisons that disparage other brands. Follow your spa's consultation and contraindication procedures every time. Guests experience Evolve through you; on shift, your accuracy and care are the brand's reputation in that room.`,
        },
      ],
      keyTerms: [
        { term: 'Custom Blend Massage', definition: `A massage the brand describes on its spa page as using custom-blended organic oils and aromatherapy; check your own spa's version and protocol before delivering it.` },
        { term: 'Partner spa', definition: `A spa that works with Evolve as a treatment house, receiving the brand's protocols and training; other spas carry the range for retail only.` },
        { term: 'Home prescription', definition: `A short written list of two or three products linked to the treatment just delivered, recorded on the guest's history.` },
        { term: 'Upgrade path', definition: `The natural route from one treatment to a richer one, built on what the guest genuinely enjoyed or needs.` },
        { term: 'Brand standards', definition: `The practices that protect a house on shift: correct products and quantities, faithful protocols, clean testers, stock reporting and accurate, attributed claims.` },
      ],
      caseStudy: {
        title: 'The agency shift at Coldharbour Hall, North Yorkshire',
        scenario: `Grace, an experienced agency therapist, arrives at Coldharbour Hall, a country house hotel spa in North Yorkshire, for her first shift. The booking sheet shows two facials and an aromatherapy massage, and the retail shelf is Evolve, but nobody has told her whether the spa uses Evolve in its treatments or only sells it. Her first guest, Mr Bell, mentions he sleeps badly and asks whether the massage will cure his insomnia, because he read something about it online.`,
        insight: `Grace asks the duty manager before her first guest and learns that the spa runs its own Evolve massage protocol and retails the full range. She reads the protocol and confirms the products. With Mr Bell she is careful: she makes no promise about insomnia, explains that the brand designs its body protocols around rest and relaxation, and invites him to choose between blends, and he chooses Zen Whisper, the lavender, frankincense and vetiver blend. At the close she suggests the Zen Whisper bath oil as part of an evening routine and notes it on his record. Asking first, claiming honestly and retailing from the treatment made one agency shift a success.`,
      },
      summary: `Evolve has a professional spa offer of holistic face and body protocols, bespoke organic facials, body rituals and a Custom Blend Massage, with training for partner spas, while many other spas carry it as retail. On day one, find out how your spa uses the brand, then read its menu and protocols and ask rather than guess. Deliver a sensory, natural, personal style built around the guest's chosen blend. Retail as a two or three product prescription linked to the treatment, build honest upgrade paths, and protect the brand with faithful protocols and claims that use only the brand's own words.`,
    },
  ],
}
