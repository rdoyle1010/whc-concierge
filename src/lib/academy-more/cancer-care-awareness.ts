// WHC Academy specialist care course: Cancer Care Awareness in the Spa.
// AWARENESS-LEVEL training only - it does not replace accredited oncology
// touch certification (e.g. Made for Life or Jennifer Young-style
// programmes), which many insurers require before treating guests in
// active treatment. Answer key lives in
// academy-more-answers/cancer-care-awareness.ts (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'cancer-care-awareness',
  title: 'Cancer Care Awareness in the Spa',
  tagline: `Welcome guests living with and beyond cancer - safely, warmly and within your scope`,
  category: 'Specialist Care',
  minutes: 90,
  lessons: [
    {
      title: 'Understanding cancer and its effect on the spa guest',
      content: `Cancer is not one disease but many, and no two guests living with it are alike. What matters to you as a therapist is not the diagnosis itself, which is never yours to interpret, but how the disease and its treatments may be affecting the person on your couch today.

The main medical treatments - surgery, chemotherapy, radiotherapy, hormone therapy and immunotherapy - each leave their own footprint. Common effects include deep fatigue, nausea, skin that is drier, thinner or more reactive than before, altered sensation in hands and feet, scarring, hair loss and a tender scalp, easier bruising, and reduced resistance to infection. Some guests carry medical devices such as a port or PICC line. Guests who have had lymph nodes removed or treated may carry a lifelong risk of lymphoedema in the nearby limb.

An important piece of history: therapists were once taught to refuse all massage to anyone with cancer, on the old belief that touch could spread the disease. That blanket exclusion is now understood to be outdated. Appropriately adapted touch, delivered by trained hands in line with the guest's medical guidance, is widely welcomed in professional spa - and for many guests it is a rare, precious experience of being touched with care rather than treated.

This course is awareness-level: it prepares you to understand, adapt and refer, not to replace accredited oncology touch training.`,
    },
    {
      title: 'Contraindications, cautions and treatment adaptations',
      content: `The professional question is never "can this guest have a treatment?" but "what treatment, adapted how, is right and safe for this guest today?" - answered within your venue's protocol and, where required, the guest's medical guidance.

The core adaptations follow the effects of treatment. Pressure comes down: gentle, slower work replaces deep tissue, because skin may be fragile, platelets may be low and bruising easy. Treated areas are respected: avoid radiotherapy sites while skin is healing, avoid recent surgical sites and unhealed scars, and never work over a port, PICC line or other medical device. A limb at risk of lymphoedema after lymph node removal or treatment receives only light pressure, or is left out entirely, according to your protocol.

Heat demands particular caution. Saunas, steam, hot stones and strongly heated couches can be unsuitable during active treatment, because sensation, circulation and skin tolerance may all be altered; follow venue policy and the guest's medical advice rather than your own judgement. Products should be gentle and low-fragrance, since chemotherapy can heighten smell sensitivity and nausea, and patch testing matters more than ever on reactive skin.

Shorter treatments, extra cushioning, help on and off the couch, and unhurried pacing complete the picture. When in doubt, adapt conservatively or refer. That is not caution for its own sake; it is the standard.`,
    },
    {
      title: 'Communication, consultation and emotional care',
      content: `For a guest living with cancer, the consultation can be the most exposed moment of the visit. Handle it privately, calmly and without a flicker of alarm. If a guest discloses a diagnosis, thank them for telling you, and move to practical, present-tense questions: how are you feeling today, which areas would you like me to avoid, what would make this hour comfortable?

Follow the guest's lead on conversation. Some want to talk about their illness; many are in the spa precisely to spend an hour not being a patient. Never ask for prognosis, never comment on scars, hair loss or devices unless the guest raises them, and never share their situation with colleagues beyond what the treatment requires. Confidentiality here is absolute.

Two traps sit on either side of good care. Fear-mongering - visible anxiety, excessive checking, treating the guest as breakable - takes away the normality they came for. False reassurance - "I am sure you will be fine", "my aunt had that and she was okay" - is not yours to give and can land painfully. The professional middle path is warm, steady and honest: I will adapt this to keep you comfortable and safe, and you can change your mind about anything at any point.

You are a therapist, not a counsellor. If a guest becomes tearful, stillness, kindness and a tissue are enough. Presence, not advice.`,
    },
    {
      title: 'Scope of practice, consent, referral and accredited training',
      content: `Everything in this course sits inside one frame: scope. This is awareness-level training. It helps you understand, communicate and adapt, and it does not qualify you to treat guests in active cancer treatment on its own authority.

Accredited oncology touch programmes exist for exactly that purpose - Made for Life and Jennifer Young-style training are well-known examples in UK spa - and many insurers require such certification before a therapist treats guests undergoing active treatment. Know what your venue holds, what your own insurance covers, and never work beyond either. Saying "I am not yet certified for that, but here is what we can offer" is professionalism, not failure.

Consent must be informed and specific. The guest should know what you will do, what you have adapted and why, and that they can stop at any time. Follow your venue's policy on medical guidance: many require confirmation that the guest's medical team is happy for them to receive treatment. Record the consultation, the adaptations agreed and anything declined.

Never diagnose. A therapist who notices an unusual mole, lump or skin change says only: I noticed this, and it may be worth showing your doctor. Nothing more.

And when the answer is genuinely unclear - adapt conservatively, or refer: to your senior therapist, to venue protocol, to the guest's medical team. The therapist who knows the edge of their scope, and holds it gracefully, is the one every spa wants on this guest's journey.`,
    },
  ],
  quiz: [
    {
      q: 'What does this course qualify you to do?',
      options: [
        'Treat guests in active cancer treatment without restriction',
        'Understand, communicate and adapt within venue protocols - it is awareness-level and does not replace accredited certification',
        'Advise guests on their medical treatment options',
        'Diagnose skin changes you notice during treatment',
      ],
    },
    {
      q: 'The old teaching that all massage must be refused to anyone with cancer is...',
      options: [
        'Still the current professional standard',
        'True for facials but not for massage',
        'Outdated - appropriately adapted touch, delivered in line with medical guidance and proper training, is widely welcomed in professional spa',
        'A legal requirement in the UK',
      ],
    },
    {
      q: 'A guest has had lymph nodes removed from under her left arm. The affected limb should receive...',
      options: [
        'Only light pressure, or be left out entirely, according to your protocol - lymphoedema risk can be lifelong',
        'Deep tissue work to improve drainage',
        'Normal massage once a year has passed',
        'Vigorous heat treatment',
      ],
    },
    {
      q: 'Heat experiences such as saunas, steam and hot stones for a guest in active treatment are...',
      options: [
        'Always beneficial for recovery',
        'Fine if the guest signs a waiver',
        'The safest part of the spa day',
        `Approached with particular caution, following venue policy and the guest's medical advice, because sensation and skin tolerance may be altered`,
      ],
    },
    {
      q: 'A guest discloses a cancer diagnosis in consultation. The professional response is to...',
      options: [
        'Reassure them that everything will be fine',
        'Thank them calmly and ask practical, present-tense questions about comfort and areas to avoid',
        'Ask about their prognosis so you can plan future visits',
        'Mention a relative who had the same condition',
      ],
    },
    {
      q: 'A guest has a port or PICC line in place. During treatment you should...',
      options: [
        'Never work over the device - avoid the area entirely',
        'Massage gently over it to ease discomfort',
        'Ask the guest to remove it first',
        'Cover it with a hot towel',
      ],
    },
    {
      q: 'Before treating guests undergoing active cancer treatment, many insurers require...',
      options: [
        'Nothing beyond a standard beauty qualification',
        'A note from the spa manager',
        'Accredited oncology touch certification, such as Made for Life or Jennifer Young-style training',
        'Five years of general spa experience',
      ],
    },
    {
      q: 'You are genuinely unsure whether your planned adaptation is enough for a guest. You should...',
      options: [
        'Proceed and watch carefully',
        'Cancel the booking without explanation',
        'Ask the guest to decide for you',
        `Adapt conservatively or refer - to your senior therapist, venue protocol or the guest's medical team - and never guess`,
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I braced myself to explain everything, the way I always have to. She already understood what chemotherapy does - the tiredness, the skin, all of it. For the first time since my diagnosis, somewhere felt easy."`,
      helpsYou: `Guests living with and beyond cancer are part of every luxury spa's clientele, and venues actively look for therapists who neither panic nor pretend. Understanding what treatment does to a body is the foundation every safe adaptation is built on.`,
      tips: [
        'Focus on how the guest is affected today, never on interpreting the diagnosis',
        'Know the common footprints: fatigue, fragile skin, altered sensation, bruising, infection risk, lymphoedema risk',
        `The old "never massage" blanket rule is outdated - adapted touch within medical guidance is the modern standard`,
        'This is awareness-level knowledge: it prepares you to adapt and refer, not to replace accredited training',
      ],
    },
    {
      guestView: `"She swapped the hot stones without making it a drama, kept the pressure feather-light on my treated side, and checked my comfort exactly twice. I felt looked after, not fussed over."`,
      helpsYou: `Adaptation skill is what turns a risky booking into a safe, five-star hour. Therapists who can quietly re-engineer a treatment - pressure, heat, products, positioning - are the ones coordinators trust with sensitive bookings.`,
      tips: [
        'Pressure down, pace down: fragile skin and easy bruising rule out deep work',
        'Respect the map: radiotherapy sites, surgical scars, devices and at-risk limbs are avoided or treated ultra-lightly',
        'Heat is a decision for protocol and medical guidance, not therapist instinct',
        'Low-fragrance products and patch tests matter double on treatment-affected skin',
      ],
    },
    {
      guestView: `"I cried on the couch, out of nowhere. She did not flinch, did not lecture me, just stayed. Then she carried on, gently, as if I was a person and not a diagnosis. That hour did more than she will ever know."`,
      helpsYou: `Communication is where these treatments are won or lost. The therapist who can hold a disclosure calmly, protect confidentiality and avoid both fear and false comfort becomes the one guests ask for by name at the hardest time of their lives.`,
      tips: [
        'Thank the guest for telling you, then move to practical present-tense questions',
        'Follow their lead: many guests want an hour of not being a patient',
        `Never say "you will be fine" - warmth and honesty, not promises`,
        'Tearful guest? Stillness, kindness, a tissue. Presence, not advice.',
      ],
    },
    {
      guestView: `"She was honest that she was not certified for treatment during chemo, and told me exactly what the spa could offer instead - and who could do more. I trusted that spa completely from then on."`,
      helpsYou: `Knowing the edge of your scope is a career asset, not a limitation. Insurers, venues and guests all reward the therapist who works to protocol, documents properly, refers gracefully and pursues accredited oncology training when ready.`,
      tips: [
        'Awareness-level means adapt and refer - accredited programmes such as Made for Life or Jennifer Young-style training are the route to treating guests in active treatment',
        'Know what your venue and your insurance actually cover before the guest arrives',
        'Informed consent: explain what you will do, what you adapted and why, and that they can stop at any time',
        'Notice a mole or lump? Say only that it may be worth showing their doctor - never more',
      ],
    },
  ],
}
