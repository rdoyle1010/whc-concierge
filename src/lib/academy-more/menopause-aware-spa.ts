// Talent House Academy specialist care course: Menopause-Aware Treatments.
// AWARENESS-LEVEL training only - it does not replace accredited
// certification, venue protocols or a guest's own medical guidance.
// Answer key lives in academy-more-answers/menopause-aware-spa.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'menopause-aware-spa',
  title: 'Menopause-Aware Treatments',
  tagline: `Confident, compassionate care for a life stage half your guests will experience`,
  category: 'Specialist Care',
  minutes: 90,
  lessons: [
    {
      title: 'Understanding Menopause and the Spa Guest',
      content: `Menopause is a natural life stage, not an illness: the point at which menstruation ends as the ovaries stop producing the hormones oestrogen and progesterone. It typically arrives in midlife, but the transition leading up to it, perimenopause, can begin years earlier and is often when symptoms are most disruptive. Menopause can also be brought on early by surgery or by medical treatment, including some cancer treatments, which can make the change sudden and emotionally complex.

Because oestrogen acts throughout the body, the effects reach far beyond periods. Commonly reported experiences include hot flushes and night sweats, disturbed sleep, joint and muscle aches, drier and more sensitive skin, headaches, palpitations, anxiety, low mood and difficulty concentrating, often described as brain fog. Every guest's experience is different: some sail through, others find daily life genuinely hard, and many are somewhere in between.

Why does this matter to a spa therapist? Because a significant share of your guests are living through this transition right now, and a spa visit may be one of the few hours in their week devoted entirely to feeling well. A therapist who understands what might be happening in the body on the couch, without ever presuming or diagnosing, delivers a safer, kinder and more comfortable treatment. This course is awareness-level training: it prepares you to adapt and to care, not to advise medically.`,
    },
    {
      title: 'Contraindications, Cautions and Treatment Adaptations',
      content: `Menopause itself is not a contraindication to spa treatments. The professional skill is recognising the cautions that can travel with it and adapting gracefully, following your training, your venue's protocols and anything the guest's own medical advisers have said.

Heat deserves the most thought. A guest prone to hot flushes may find heavy blankets, heated couches, saunas, steam rooms or hot stone work uncomfortable or overwhelming. Offer choices: lighter layers, a slightly cooler room, water within reach, and an easy way to signal a pause. If a flush arrives mid-treatment, it is a moment for calm, not alarm.

Skin changes matter too. Lower oestrogen commonly leaves skin drier, thinner and more reactive, so favour gentler products and pressure, respect patch test requirements, and dial exfoliation down rather than up.

Some guests will disclose related conditions. Osteoporosis or osteopenia, which become more common after menopause, call for conservative pressure and avoiding deep or forceful work, in line with your protocol. Medication, including hormone replacement therapy, is noted on the consultation form but never commented on or advised about.

The governing rule for every uncertainty in this course: adapt conservatively or refer. A slightly gentler treatment is never a failure; an overconfident one can be. When you are not sure, ask your senior, follow the venue protocol, and let the guest's medical guidance lead.`,
    },
    {
      title: 'Consultation, Communication and Emotional Care',
      content: `Menopause remains a subject many guests have never discussed with anyone outside their own home, and some have not discussed it at all. Your consultation is often the first place a guest is invited, gently and privately, to mention it.

Never ask a guest directly whether they are menopausal; presuming is intrusive and easy to get wrong. Instead, create the opening: a consultation form and a spoken consultation that ask about temperature comfort, sleep, skin changes, aches and anything the guest would like you to know. Open, neutral questions let a guest disclose as much or as little as they choose. If they do disclose, receive it as you would any other information: calmly, warmly and without drama.

Language matters. Mirror the guest's own words, keep your tone matter-of-fact and kind, and never joke, commiserate excessively or share other guests' stories. Confidentiality is absolute: what is said in the consultation stays on the secure record and nowhere else.

Emotional care is part of the treatment. Sleep loss, anxiety and feeling unlike oneself are among the hardest parts of this transition, and an hour of skilled, unhurried, respectful touch can be genuinely restorative. Offer control throughout: over temperature, pressure, conversation and pace. And hold the line on scope with compassion: you can listen, adapt and care, but questions about hormones, medication or symptoms belong with the guest's GP or a menopause specialist, and saying so kindly is good care, not a brush-off.`,
    },
    {
      title: 'Scope of Practice, Consent and Referral',
      content: `Everything in this course sits inside a firm professional boundary: you are a therapist, not a clinician. You never diagnose, never interpret symptoms, never recommend, adjust or discourage any medication or supplement, and never promise that a treatment will relieve a medical symptom. What you offer is skilled, adapted, compassionate treatment within your training, and that is valuable precisely because it stays within its limits.

Consent is ongoing, not a signature. Explain what you propose, including any adaptations, and confirm the guest is happy before and during the treatment. Record disclosures, adaptations and agreements on the consultation form. If a guest declines to share information, note it and follow your venue's protocol.

Know where awareness ends and accredited training begins. This course is awareness-level: it does not qualify you to treat guests whose menopause is linked to current medical treatment. In particular, guests in active cancer treatment, including those whose menopause has been induced by it, require a therapist holding accredited oncology-touch certification, such as the programmes offered by Made for Life or Jennifer Young-style training, and many insurers require exactly that before such guests can be treated at all. Check your venue's policy and your own insurance before ever proceeding.

When in doubt, the professional moves are always the same: adapt conservatively, consult your senior, follow the venue protocol, honour the guest's medical guidance, or refer. Referring well, warmly and without alarm, is a five-star skill in itself.`,
    },
  ],
  quiz: [
    {
      q: 'For a spa therapist, menopause is best understood as...',
      options: [
        'An illness that contraindicates most treatments',
        'A natural hormonal life stage affecting many body systems, experienced differently by every guest',
        'A purely emotional condition',
        'Something only relevant to guests over sixty',
      ],
    },
    {
      q: 'A guest has a hot flush mid-treatment. The professional response is to...',
      options: [
        'Carry on exactly as before so she is not embarrassed',
        'End the treatment for safety',
        'Pause calmly, lighten the covers, offer water and continue when she is ready',
        'Turn the heating up to help her sweat it out',
      ],
    },
    {
      q: 'Skin during and after menopause is commonly...',
      options: [
        'Drier, thinner and more sensitive, calling for gentler products and pressure',
        'Tougher and less reactive',
        'Unchanged',
        'Only affected on the face',
      ],
    },
    {
      q: 'A guest discloses osteoporosis on her consultation form. You should...',
      options: [
        'Refuse all treatments',
        'Use deep pressure to strengthen the bones',
        'Ignore it, as massage does not affect bone',
        'Adapt conservatively - lighter pressure, no deep or forceful work, following your training and venue protocol',
      ],
    },
    {
      q: `A guest asks whether she should start hormone replacement therapy. You should...`,
      options: [
        'Share what worked for another guest',
        'Listen kindly and suggest she speaks to her GP or a menopause specialist - medication advice is outside your scope',
        'Recommend a supplement from the retail shelf instead',
        'Give your honest personal opinion',
      ],
    },
    {
      q: 'Awareness-level training like this course means...',
      options: [
        'You can adapt and communicate confidently, but it does not replace accredited certification where that is required',
        'You are now qualified to treat any medical condition',
        'You may diagnose but not prescribe',
        'You no longer need to follow venue protocols',
      ],
    },
    {
      q: 'A guest in active cancer treatment, whose menopause was induced by it, books a massage. The correct move is to...',
      options: [
        'Proceed with lighter pressure',
        'Decline and ask her not to rebook',
        'Follow venue protocol - many insurers require accredited oncology-touch training, such as Made for Life or Jennifer Young-style programmes, before such guests can be treated',
        'Treat her but skip the consultation to save embarrassment',
      ],
    },
    {
      q: 'Whenever you are unsure how to adapt for a menopausal guest, the rule is...',
      options: [
        'Proceed as normal - menopause is not a contraindication',
        'Ask the guest to decide the clinical question',
        'Cancel the booking',
        'Adapt conservatively or refer, following your venue protocol and the guest’s own medical guidance',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1551816646-d64cca8d3ba0?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I did not have to explain anything. She simply understood why I was too warm, why I had not slept, why I ached - and nothing about her reaction made me feel old or awkward."`,
      helpsYou: `A large share of luxury spa guests are midlife women. Therapists who genuinely understand this life stage deliver visibly better treatments to a huge part of the guest book, and spas increasingly look for exactly this awareness when hiring.`,
      tips: [
        'Menopause is a life stage, not an illness - never treat a guest as fragile by default',
        'Perimenopause can begin years before periods end, so never assume by age',
        'Remember menopause can be surgical or treatment-induced, and sudden',
        'Every guest experiences it differently - awareness, never assumptions',
      ],
    },
    {
      guestView: `"She offered me a lighter blanket before I asked, kept water within reach, and when the flush came she just paused, calm as anything. I have never felt so looked after."`,
      helpsYou: `Confident, conservative adaptation is what separates a safe pair of hands from a liability. Managers and insurers both notice the therapist whose consultation records show thoughtful adaptations rather than guesswork.`,
      tips: [
        'Heat first: lighter layers, cooler room, water in reach, an easy signal to pause',
        'Drier, thinner skin means gentler products, lighter pressure, respect for patch tests',
        'Osteoporosis disclosed? Conservative pressure, no deep or forceful work, per protocol',
        'When unsure: adapt conservatively or refer - never improvise',
      ],
    },
    {
      guestView: `"The form asked about temperature and sleep, not my age or my hormones. It gave me the choice to say as much as I wanted. So I did - for the first time outside my own kitchen."`,
      helpsYou: `Sensitive consultation skill is career gold. Guests who feel safely heard rebook, request you by name and tell their friends - and the ability to open a door without pushing through it is rare enough to get noticed.`,
      tips: [
        'Never ask directly if a guest is menopausal - create openings, let her choose',
        'Mirror the guest’s own words; stay warm, calm and matter-of-fact',
        'Confidentiality is absolute - the record, and nowhere else',
        'Offer control throughout: temperature, pressure, conversation, pace',
      ],
    },
    {
      guestView: `"When I mentioned my cancer treatment she did not flinch or fudge it. She explained kindly that I needed a specially certified therapist, and booked me with one. I trusted that spa completely from then on."`,
      helpsYou: `Knowing exactly where your scope ends is what protects your insurance, your licence and your career. The therapist who refers well is trusted with the most delicate bookings - and with the training investment that follows.`,
      tips: [
        'Never diagnose, never advise on HRT, medication or supplements',
        'Consent is ongoing - explain adaptations and record everything',
        'Active cancer treatment requires accredited oncology-touch certification, such as Made for Life or Jennifer Young-style training - many insurers insist on it',
        'Referring warmly and without alarm is a five-star skill, not a failure',
      ],
    },
  ],
}
