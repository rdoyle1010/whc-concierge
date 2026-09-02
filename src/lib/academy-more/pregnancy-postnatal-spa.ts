// WHC Academy specialist care course: Pregnancy & Post-Natal Treatments.
// Awareness-level training - it does not replace accredited pregnancy or
// post-natal massage certification, venue protocols or insurer requirements.
// Answer key lives in academy-more-answers/pregnancy-postnatal-spa.ts
// (server-only).

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'pregnancy-postnatal-spa',
  title: 'Pregnancy & Post-Natal Treatments',
  tagline: `Safe, confident, compassionate care for guests before and after birth`,
  category: 'Specialist Care',
  minutes: 90,
  lessons: [
    {
      title: 'The pregnant and post-natal guest: what changes',
      content: `Pregnancy changes almost every system a spa treatment touches. Blood volume rises substantially, which alters circulation and can make a guest feel warm, flushed or light-headed more easily. Hormones such as relaxin soften ligaments, so joints are more mobile and more vulnerable to overstretching. The growing uterus shifts posture and loads the lower back and pelvis, and in later pregnancy lying flat on the back can compress a major blood vessel, leaving the guest faint or nauseous. Temperature regulation changes too, which is one reason heat experiences are treated so carefully.

The post-natal period is its own life stage, not a return to normal. Joint laxity persists for months, the abdominal wall and pelvic floor are recovering, a caesarean section is major abdominal surgery, and feeding, carrying and broken sleep create real musculoskeletal strain alongside deep tiredness.

Why does this matter to a therapist? Because these guests are not fragile curiosities; they are often carrying more discomfort than any other guest on your column, and a well-adapted treatment can be genuinely valuable to them. Understanding what has changed lets you adapt with confidence rather than treating with vague anxiety or, worse, treating as if nothing has changed. This course is awareness-level training: it builds that understanding, and it never replaces accredited pregnancy massage certification, your venue's protocols or the guest's own medical guidance.`,
    },
    {
      title: 'Contraindications, cautions and treatment adaptations',
      content: `Start with the rules that come from outside the treatment room. Many venues and insurers restrict or decline treatments in the first trimester, commonly the first twelve weeks, and many require accredited pregnancy massage training before a therapist treats pregnant guests at all. Know your venue's protocol before the guest arrives, and follow it exactly. It is not yours to relax.

The classic cautions: heat experiences such as saunas, steam rooms, hot tubs and body wraps are generally avoided in pregnancy, as are hot stones. Positioning is adapted, with side-lying supported by cushions, or a semi-reclined position, preferred in later pregnancy instead of lying flat or face down. Deep, specific abdominal work is avoided. Leg work is kept light and flowing in many protocols, because the risk of blood clots is raised in pregnancy and the weeks after birth, and deep pressure on the calves is treated with particular caution. Product choice matters too: use only products and essential oil blends your venue and brand approve as suitable for pregnancy.

Post-natally, many venues ask that the guest has had her doctor's postnatal check before treatments resume, and any caesarean scar is left alone until healed and medically cleared.

If a guest reports symptoms such as a severe headache, visual disturbance, sudden swelling, bleeding, or one-sided calf pain or heat, you pause and encourage urgent medical advice. You never diagnose; you adapt conservatively or refer.`,
    },
    {
      title: 'Consultation, communication and emotional care',
      content: `The first rule of communication in this territory is simple: never assume. Never comment on a guest's body, never guess at a pregnancy, and never ask about it in front of others. Let the consultation form and a private, unhurried conversation do the work. A calm question such as asking whether there is anything about her health, including pregnancy or recent birth, that should shape the treatment gives every guest a dignified way to tell you what you need to know.

Remember what you may be standing beside. Some guests are pregnant after loss and quietly anxious. Some have recently experienced miscarriage or stillbirth and may still be marked as pregnant in a booking note. Some post-natal guests are struggling emotionally, and a spa treatment may be their first hour alone in months. Take the guest's lead: mirror her language, celebrate only when she invites it, and never probe. If a guest becomes tearful or shares something painful, your role is warm, unhurried listening, not counselling and not advice. Acknowledge, adjust the treatment to what she needs now, and afterwards signpost gently to her midwife, GP or health visitor where appropriate.

Practical communication matters too: explain positioning before she is on the couch, check comfort more often than usual, agree how she can tell you if anything feels wrong, and make leaving anything out feel completely acceptable. Compassion, here, is a clinical skill.`,
    },
    {
      title: 'Scope of practice, consent, referral and accredited training',
      content: `This course makes you aware; it does not make you certified. That sentence is the heart of professional scope. Awareness-level training builds understanding, safe habits and confident communication, but treating pregnant and post-natal guests hands-on is governed by three authorities that outrank any course: your venue's protocols, your insurer's requirements, and the guest's own medical guidance. Many insurers require a recognised pregnancy massage qualification before you may deliver pregnancy treatments, and the same pattern applies across specialist care: for guests in active cancer treatment, for example, many venues and insurers require accredited oncology-touch training, such as Made for Life or Jennifer Young style programmes, before hands-on treatment. If your venue offers pregnancy treatments, ask what training and sign-off it requires, and do not treat beyond it.

Consent must be informed and specific. Explain what you propose, what you have adapted and why, confirm the guest is happy, and record the consultation, the adaptations and anything she declined to share. If her doctor or midwife has given guidance, the treatment follows it.

Referral is a professional act, not a failure. When something falls outside your training, your protocol or your comfort, the options are always the same: adapt conservatively, defer the treatment, or refer to reception, a senior therapist or the guest's own healthcare team. A therapist who says, honestly, that she is not certified for a treatment and offers a safe alternative is demonstrating exactly the judgement that five-star spas promote.`,
    },
  ],
  quiz: [
    {
      q: 'This course is described as awareness-level training. That means...',
      options: [
        'You can now market yourself as a certified pregnancy massage specialist',
        'It builds understanding and safe habits but does not replace accredited certification, venue protocols or insurer requirements',
        'It licenses you to treat any pregnant guest unsupervised',
        'It only applies to reception staff',
      ],
    },
    {
      q: 'In later pregnancy, the generally preferred treatment positioning is...',
      options: [
        'Flat on the back for the full treatment',
        'Face down with no support',
        'Side-lying supported with cushions, or semi-reclined',
        'Whatever is quickest to set up',
      ],
    },
    {
      q: 'Heat experiences such as saunas, steam rooms and hot tubs during pregnancy are...',
      options: [
        'Generally avoided, along with hot stones and heated body wraps, in line with venue protocol',
        'Fine if the guest feels well',
        'Recommended to ease back pain',
        'Only restricted in the first trimester',
      ],
    },
    {
      q: 'A pregnant guest mentions a severe headache, visual disturbance and sudden swelling. You should...',
      options: [
        'Reassure her that this is normal in pregnancy',
        'Continue with lighter pressure',
        'Diagnose the problem so she knows what it is',
        'Pause the treatment, follow your protocol and encourage urgent medical advice, without diagnosing',
      ],
    },
    {
      q: 'Many protocols keep leg work light and flowing during pregnancy and the weeks after birth because...',
      options: [
        'Pregnant guests dislike leg massage',
        'The risk of blood clots is raised, so deep pressure on the calves is treated with caution',
        'Leg work takes too long',
        'Oils cannot be used on the legs in pregnancy',
      ],
    },
    {
      q: 'The professional rule on discussing a possible pregnancy is...',
      options: [
        'Never assume or comment on a guest’s body; let the consultation form and a private conversation do the work',
        'Congratulate any guest who looks pregnant',
        'Ask about pregnancy openly at reception',
        'Avoid the subject entirely, even on the form',
      ],
    },
    {
      q: 'A post-natal guest had a caesarean section eight weeks ago. Work over the scar area is...',
      options: [
        'Fine, as the birth is over',
        'Encouraged, to speed up healing',
        'Left alone until the scar is healed and medically cleared, following venue protocol',
        'Replaced with deep abdominal work',
      ],
    },
    {
      q: 'For guests in active cancer treatment, many venues and insurers require...',
      options: [
        'Nothing beyond a standard consultation',
        'A signed waiver only',
        'A doctor present during the treatment',
        'Accredited oncology-touch training, such as Made for Life or Jennifer Young style programmes, before hands-on treatment',
      ],
    },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    {
      guestView: `"I was thirty-two weeks and so tired of being treated like a problem. She talked to me like a woman who ached, not a risk assessment, and every cushion was exactly where my body needed it."`,
      helpsYou: `Therapists who genuinely understand the pregnant and post-natal body are scarce, requested by name, and trusted by managers with the bookings other therapists quietly dread. Understanding what has changed is what turns anxiety into calm, adaptable confidence.`,
      tips: [
        'Learn the changes, not just the rules: circulation, joint laxity, posture and temperature all shift',
        'Remember the post-natal guest is still recovering months after birth, however well she looks',
        'These guests often carry more discomfort than anyone on your column - adapted care is real care',
        'Awareness first, always: this knowledge supports accredited training, it never substitutes for it',
      ],
    },
    {
      guestView: `"She moved me onto my side with cushions everywhere, kept the room warm rather than hot, and told me exactly why. I stopped worrying about the baby and finally let go."`,
      helpsYou: `Contraindication fluency is what insurers, auditors and head therapists look for before they let anyone near specialist bookings. Knowing the classic cautions cold, and your venue's exact protocol, is the fastest way to be trusted with them.`,
      tips: [
        'Know your venue’s trimester policy before the guest arrives - it is not yours to relax',
        'No saunas, steam, hot tubs, hot stones or heated wraps in pregnancy; side-lying or semi-reclined in later pregnancy',
        'Keep leg work light and flowing; deep calf pressure is treated with particular caution',
        'Red flags mean pause and refer for urgent medical advice - never diagnose, never reassure blindly',
      ],
    },
    {
      guestView: `"Nobody at the spa knew we had lost the baby. She asked one gentle, private question, followed my lead completely, and gave me an hour where I felt looked after instead of managed."`,
      helpsYou: `Sensitive consultation skill is the difference between a five-star review and a complaint that reaches the general manager. Guests remember exactly how these conversations felt, and so do the managers who watch you handle them.`,
      tips: [
        'Never assume, never comment on a body, never raise pregnancy in front of others',
        'Mirror the guest’s language and celebrate only when she invites it',
        'Tearful guest? Listen warmly, adapt the hour, and signpost to midwife, GP or health visitor afterwards',
        'Explain positioning before she is on the couch and agree how she can flag discomfort',
      ],
    },
    {
      guestView: `"She was honest that the treatment I wanted needed a specialist, offered me a beautiful alternative, and suggested I speak to my GP first. I trusted that spa completely from then on."`,
      helpsYou: `Knowing your scope, and saying so gracefully, is the single most protective habit in specialist care. It keeps your insurance valid, your guests safe and your reputation clean, and it is precisely the judgement spas look for when they promote.`,
      tips: [
        'Three authorities outrank any course: venue protocol, insurer requirements, the guest’s medical guidance',
        'Record consent, adaptations and anything the guest declined to share',
        'Referral is a professional act, not a failure - adapt conservatively, defer or refer',
        'For cancer care, accredited oncology-touch programmes such as Made for Life or Jennifer Young style training are required by many insurers',
      ],
    },
  ],
}
