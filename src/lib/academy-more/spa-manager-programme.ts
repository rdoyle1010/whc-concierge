import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'spa-manager-programme',
  title: 'Talent House Professional Certificate in Spa Management',
  tagline: 'Run the floor, lead the team and understand the numbers behind a high-performing spa',
  category: 'Commercial',
  minutes: 180,
  lessons: [
    { title: 'The Spa Manager Role', content: 'Move from excellent therapist to operational leader: standards, communication, ownership, daily rhythm and management judgement.' },
    { title: 'People Leadership & Performance', content: 'Build a calm, accountable team through briefings, one-to-ones, coaching, feedback, fair performance conversations and clear expectations.' },
    { title: 'Rotas, Capacity & Payroll Control', content: 'Plan staffing around demand, protect breaks and service quality, manage absence and agency use, and understand the payroll impact of every rota decision.' },
    { title: 'Guest Journey, Standards & Service Recovery', content: 'Translate luxury standards into repeatable operating habits, audit the guest journey and recover complaints without losing trust.' },
    { title: 'Revenue, Retail & Treatment Profitability', content: 'Use utilisation, average treatment value, retail, rebooking and menu contribution to improve commercial performance without damaging the guest experience.' },
    { title: 'Manager Scorecards, SOPs & 30-Day Action Plan', content: 'Turn numbers and observations into an operating plan: KPIs, SOP ownership, weekly priorities and a practical first 30 days.' },
  ],
  quiz: [
    { q: 'The strongest Spa Manager mindset is to...', options: ['Personally fix every problem', 'Create standards and systems so the team can deliver consistently', 'Focus only on treatment quality', 'Avoid commercial targets'] },
    { q: 'A good performance conversation should begin with...', options: ['Rumour and general impressions', 'Observed facts and the impact of the behaviour', 'A threat of disciplinary action', 'Comparison with another employee'] },
    { q: 'The best starting point for a rota is...', options: ['Who wants which shift', 'Forecast demand and the skills needed to serve it safely', 'The previous week copied exactly', 'Minimum headcount regardless of demand'] },
    { q: 'If payroll is high while utilisation is low, the manager should first...', options: ['Add more hours', 'Compare scheduled capacity with booked demand and identify the mismatch', 'Discount every treatment', 'Stop measuring utilisation'] },
    { q: 'The purpose of service recovery is to...', options: ['Prove the guest is wrong', 'Restore trust quickly and prevent the problem repeating', 'Offer compensation every time', 'Avoid recording complaints'] },
    { q: 'Treatment profitability should consider...', options: ['Selling price only', 'Price, room time, direct product cost and contribution per available hour', 'Only therapist commission', 'Only retail sales'] },
    { q: 'A useful monthly manager scorecard includes...', options: ['Revenue only', 'Commercial, guest, people and operational KPIs with actions', 'Only complaints', 'Only payroll'] },
    { q: 'An SOP is most useful when it...', options: ['Is written once and never revisited', 'Makes the expected process, responsibility and escalation route clear', 'Uses the longest possible wording', 'Replaces manager judgement in every situation'] },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    { guestView: '“The spa feels calm even when it is busy. Everyone seems to know what is happening.”', helpsYou: 'Operational control is what turns a strong therapist into someone trusted with a department.', tips: ['Start each day with priorities, risks and VIPs', 'Manage by standards, not moods', 'Fix the system as well as the immediate problem'] },
    { guestView: '“The team seem confident, warm and consistent rather than stressed or scripted.”', helpsYou: 'Managers are judged by the quality and stability of the team they build, not just by their own output.', tips: ['Use facts in feedback', 'Coach early before frustration grows', 'Keep expectations specific and measurable'] },
    { guestView: '“There was always someone available, but the spa never felt crowded or chaotic.”', helpsYou: 'Rota and payroll literacy is one of the clearest signs that you can be trusted with commercial responsibility.', tips: ['Plan from demand first', 'Protect skill mix as well as headcount', 'Track agency and overtime separately'] },
    { guestView: '“Something went wrong, but the way they handled it made me trust them more.”', helpsYou: 'Service recovery and standards management are core promotion-level skills in luxury hospitality.', tips: ['Audit the full journey, not just treatment rooms', 'Resolve first, explain second', 'Log root cause and prevention'] },
    { guestView: '“The recommendations made sense; nothing felt pushed.”', helpsYou: 'A manager who improves revenue without eroding guest trust becomes commercially valuable very quickly.', tips: ['Use contribution, not price alone', 'Grow utilisation before discounting', 'Coach recommendation quality, not just retail totals'] },
    { guestView: '“The spa feels organised because the basics are always right.”', helpsYou: 'The ability to turn KPIs into practical action is what separates management from supervision.', tips: ['One owner for every action', 'Review trends, not one-off numbers', 'Use SOPs as living operating tools'] },
  ],
}
