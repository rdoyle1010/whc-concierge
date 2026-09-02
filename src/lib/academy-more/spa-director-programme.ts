import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'

export const course: AcademyCourse = {
  slug: 'spa-director-programme',
  title: 'WHC Professional Certificate in Spa & Wellness Leadership',
  tagline: 'Lead the spa as a business: profit, strategy, people, pricing, marketing and investment',
  category: 'Commercial',
  minutes: 300,
  lessons: [
    { title: 'The Spa Director as Business Leader', content: 'Move from department management to commercial leadership: strategy, stakeholder management, ownership thinking and decision quality.' },
    { title: 'P&L, Budgeting & Forecasting', content: 'Read a spa P&L, build a budget from operating drivers, explain variances and create a rolling forecast that management can trust.' },
    { title: 'Menu Engineering, Pricing & Revenue Management', content: 'Use contribution, capacity, demand and daypart performance to shape pricing, packages, menus and premium inventory.' },
    { title: 'Workforce Strategy & Organisational Design', content: 'Design team structure, payroll strategy, succession, recruitment and flexible cover around the business model rather than habit.' },
    { title: 'Marketing, Memberships & Commercial Partnerships', content: 'Build demand with measurable campaigns, local partnerships, memberships and hotel integration rather than discount-led activity.' },
    { title: 'Capex, Risk & Executive Communication', content: 'Build investment cases, prioritise operational risk, and communicate decisions clearly to a GM, owner or board.' },
    { title: '12-Month Spa Business Plan', content: 'Bring the programme together into a board-ready plan with priorities, targets, owners, milestones and financial impact.' },
  ],
  quiz: [
    { q: 'A Spa Director adds the most value when they...', options: ['Focus only on treatment delivery', 'Connect guest experience, people and operations to financial outcomes', 'Avoid the P&L', 'Leave strategy entirely to the hotel GM'] },
    { q: 'A useful budget is built from...', options: ['Last year plus a random percentage', 'Operational drivers such as capacity, utilisation, average spend and cost assumptions', 'Revenue only', 'Payroll only'] },
    { q: 'A favourable revenue variance can still be a concern if...', options: ['It comes with a worse profit result or unsustainable cost', 'Revenue is above budget', 'Retail is strong', 'The spa is busy'] },
    { q: 'Revenue management should primarily use...', options: ['Blanket discounting', 'Demand, capacity and daypart performance to change the offer intelligently', 'The same price for every slot regardless of demand', 'Only competitor prices'] },
    { q: 'The purpose of workforce strategy is to...', options: ['Maximise headcount', 'Create the skills and capacity the business model needs at a sustainable cost', 'Remove all flexible labour', 'Guarantee identical staffing every day'] },
    { q: 'A marketing campaign is commercially useful when...', options: ['It looks premium', 'Its audience, cost, bookings, revenue and repeat behaviour can be measured', 'It gets many social likes', 'It offers the biggest discount'] },
    { q: 'A strong capex proposal includes...', options: ['Purchase price only', 'Total cost, expected contribution, payback, risks and success measures', 'Only guest feedback', 'Only competitor examples'] },
    { q: 'A board-ready business plan should...', options: ['List every possible idea', 'Prioritise measurable initiatives with financial impact, owners and milestones', 'Avoid risks', 'Focus only on marketing'] },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    { guestView: '“The spa feels like part of the hotel, not a separate department.”', helpsYou: 'Senior leaders notice directors who can connect spa performance to the wider property strategy.', tips: ['Think like an owner', 'Translate spa language into business language', 'Bring solutions, not just problems'] },
    { guestView: '“The operation feels well resourced without looking overstaffed.”', helpsYou: 'P&L and forecasting confidence is essential for Spa Director, Cluster and Wellness Director roles.', tips: ['Explain the driver behind every variance', 'Forecast from capacity and demand', 'Separate controllable from structural cost'] },
    { guestView: '“Peak times feel premium; quieter times still feel valuable rather than discounted.”', helpsYou: 'Pricing and revenue management are rare spa skills and create direct, visible profit impact.', tips: ['Protect peak capacity', 'Measure revenue per available room hour', 'Use value-add before discount'] },
    { guestView: '“The team seems stable and there is always someone ready to step up.”', helpsYou: 'Succession and workforce design show that you are leading beyond the next rota.', tips: ['Build bench strength', 'Model true payroll cost', 'Use flexible labour deliberately, not reactively'] },
    { guestView: '“The spa keeps giving me reasons to come back without bombarding me with offers.”', helpsYou: 'Directors who can build measurable demand are more valuable than those relying on hotel occupancy alone.', tips: ['Target a commercial need', 'Track acquisition and repeat', 'Build partnerships around shared guests'] },
    { guestView: '“The spa keeps evolving, but the changes feel considered rather than gimmicky.”', helpsYou: 'Capex judgement and executive communication are core skills for senior hospitality leadership.', tips: ['Show payback and downside case', 'Quantify risk of doing nothing', 'Ask for a decision, not vague support'] },
    { guestView: '“The spa feels consistent because there is clearly a plan behind it.”', helpsYou: 'A concise, financially literate business plan is one of the strongest pieces of evidence you can take into a senior interview.', tips: ['Choose 3–5 strategic priorities', 'Tie each to a baseline and target', 'Review the plan monthly'] },
  ],
}
