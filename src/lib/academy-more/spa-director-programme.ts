import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'spa-director-programme',
  title: 'Spa Director Programme',
  tagline: 'Lead the spa as a business: profit, strategy, people, pricing, marketing and investment',
  category: 'Commercial',
  minutes: 150,
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

export const content: CourseContent = {
  slug: 'spa-director-programme',
  aims: 'An advanced commercial leadership programme for Spa Directors and experienced managers who need to run a spa as a business within a luxury hotel, resort or destination operation. The programme develops financial literacy, pricing and revenue management, workforce strategy, marketing, investment judgement and executive communication, finishing with a practical 12-month spa business plan.',
  audience: 'Experienced Spa Managers, Spa Directors, Wellness Directors, Cluster Spa leaders and ambitious managers preparing for senior commercial responsibility.',
  outcomes: [
    'Position the spa as a strategic business unit and communicate its value to senior stakeholders',
    'Read a spa P&L, build a driver-based budget and explain material variances clearly',
    'Use menu engineering and revenue management to improve profit from finite treatment capacity',
    'Design a sustainable workforce structure with succession, flexibility and payroll discipline',
    'Build measurable marketing, membership and partnership strategies that generate quality demand',
    'Prepare credible capex cases and communicate risk, payback and decisions to executives',
    'Produce a focused 12-month business plan linking initiatives to measurable financial and operational outcomes',
  ],
  lessons: [
    {
      title: 'The Spa Director as Business Leader',
      objectives: ['Define the commercial responsibilities of a Spa Director', 'Connect spa performance to hotel or ownership priorities', 'Improve stakeholder communication and decision framing'],
      sections: [
        { heading: 'From department head to business leader', body: 'A Spa Director owns more than service standards. You are responsible for the commercial health, reputation, workforce, risk and long-term relevance of the spa. That means understanding what owners and GMs care about: contribution, guest loyalty, brand positioning, asset value, operational risk and return on investment.' },
        { heading: 'Translate the spa into business language', body: 'Do not present “we need another therapist” as a staffing preference. Present the capacity lost, revenue displaced, guest impact and cost of the proposed solution. Senior stakeholders make better decisions when the commercial consequence is visible.' },
        { heading: 'Strategy is choosing', body: 'A strategy is not a list of ambitions. It is a small number of choices about who you serve, how you win, what you will invest in and what you will not prioritise. The director protects focus while day-to-day noise competes for attention.' },
      ],
      keyTerms: [{ term: 'Contribution', definition: 'The amount the spa contributes after relevant operating costs, used to judge commercial value.' }, { term: 'Strategic priority', definition: 'A limited, high-impact choice that receives resources, ownership and measurement.' }],
      caseStudy: { title: 'The under-valued hotel spa', scenario: 'A hotel GM sees the spa mainly as an amenity because treatment revenue is modest compared with rooms and food and beverage.', insight: 'The Director reframes the conversation with treatment contribution, spa-led room packages, guest satisfaction, repeat local demand, membership opportunity and the commercial risk of under-investing in a luxury brand promise.' },
      summary: 'The Spa Director earns influence by connecting spa decisions to the commercial and brand priorities of the wider business.',
    },
    {
      title: 'P&L, Budgeting & Forecasting',
      objectives: ['Read core spa P&L lines', 'Build a budget from operating assumptions', 'Explain variance and forecast credibly'],
      sections: [
        { heading: 'Read the story behind the P&L', body: 'Revenue, payroll, product cost, retail cost of sales, laundry, agency, marketing, maintenance and other operating costs are not isolated lines. Each is the financial result of operating decisions. The Director’s job is to explain the driver, not merely report the number.' },
        { heading: 'Driver-based budgeting', body: 'Start with sellable hours, expected utilisation, average treatment value, retail percentage, memberships and other revenue. Then model payroll, product and operating costs against that activity. A budget built from drivers can be challenged and updated; a percentage uplift cannot.' },
        { heading: 'Forecast, do not hope', body: 'A rolling forecast uses actual performance and updated assumptions to estimate where the year will land. Separate timing issues from structural problems, identify the actions already taken and be explicit about upside and downside risk.' },
      ],
      keyTerms: [{ term: 'Variance', definition: 'The difference between budget or forecast and actual performance.' }, { term: 'Rolling forecast', definition: 'An updated forward view based on actual performance and current assumptions.' }],
      caseStudy: { title: 'Revenue up, profit down', scenario: 'The spa beats treatment revenue budget by 6%, but profit is below plan.', insight: 'The Director identifies overtime, agency usage, product cost creep and a low-margin promotional mix. The response targets the cost and mix drivers rather than celebrating revenue alone.' },
      summary: 'Financial literacy means understanding why the number moved, what can be controlled and what the new outlook is.',
    },
    {
      title: 'Menu Engineering, Pricing & Revenue Management',
      objectives: ['Compare treatment contribution accurately', 'Protect scarce peak capacity', 'Design intelligent offers for soft demand'],
      sections: [
        { heading: 'Menu engineering for a spa', body: 'Analyse price, direct cost, room time, demand, retail potential and brand role. Some signature rituals earn their place through positioning; others consume capacity without enough contribution. The point is not to delete everything low-margin, but to know the trade-off.' },
        { heading: 'Capacity is perishable', body: 'An empty treatment room at 11:00 yesterday can never be sold again. Revenue management aims to protect high-demand slots while creating reasons to buy in softer periods. Daypart analysis makes the problem visible.' },
        { heading: 'Value before discount', body: 'Before reducing price, test packaging, added value, member benefits, upgrades, local partnerships or restricted off-peak offers. Discounting peak demand teaches guests to pay less for inventory that would have sold anyway.' },
      ],
      keyTerms: [{ term: 'Revenue per available hour', definition: 'Revenue generated divided by available treatment capacity, useful for comparing dayparts.' }, { term: 'Menu engineering', definition: 'Using demand, contribution and strategic role to optimise treatment mix and pricing.' }],
      caseStudy: { title: 'The permanently discounted weekday', scenario: 'A spa has run 20% off Monday–Thursday for two years, yet utilisation remains weak.', insight: 'The Director analyses guest segments and dayparts, removes blanket discounting, creates a restricted local recovery package with added value, and measures acquisition, average spend and repeat behaviour.' },
      summary: 'Pricing should respond to demand and contribution, not habit. Protect premium capacity and solve soft demand precisely.',
    },
    {
      title: 'Workforce Strategy & Organisational Design',
      objectives: ['Design a fit-for-purpose structure', 'Balance fixed and flexible labour', 'Build succession and reduce key-person risk'],
      sections: [
        { heading: 'Structure follows the business model', body: 'A hotel spa dominated by weekends, a destination spa with programmes and a membership-led day spa need different structures. Define the work, demand pattern and leadership span before deciding headcount.' },
        { heading: 'True payroll strategy', body: 'Consider salary, on-costs, commission, holiday, training, sickness, overtime, agency and vacancy cost. Flexible labour can be sensible for peaks; it becomes expensive when used to cover structural vacancies or poor planning.' },
        { heading: 'Succession is operational resilience', body: 'Identify roles that would expose the business if someone left tomorrow. Build deputy capability, cross-training, development plans and internal promotion routes. Stable leadership protects both guest standards and recruitment cost.' },
      ],
      keyTerms: [{ term: 'Span of control', definition: 'The number and complexity of people or functions a leader can manage effectively.' }, { term: 'Succession plan', definition: 'A deliberate plan to develop people who can step into critical roles.' }],
      caseStudy: { title: 'Agency spend that became permanent', scenario: 'Agency therapists now cover 18% of treatment hours and the monthly spend is rising.', insight: 'The Director separates genuine peak flexibility from vacancy cover, compares cost per productive hour, rebuilds recruitment and retention actions, and retains agency as a controlled resilience tool rather than a default staffing model.' },
      summary: 'Workforce strategy creates the capability the business needs at a cost and risk level the business can sustain.',
    },
    {
      title: 'Marketing, Memberships & Commercial Partnerships',
      objectives: ['Build campaigns around a defined commercial need', 'Measure acquisition and repeat value', 'Design partnerships and memberships strategically'],
      sections: [
        { heading: 'Start with the problem', body: 'Do not begin with “we need a campaign”. Begin with the commercial need: weak Tuesday mornings, low local awareness, seasonal softness, poor rebooking or untapped hotel guests. The audience and offer follow from the problem.' },
        { heading: 'Measure beyond likes', body: 'Track spend, enquiries, bookings, revenue, cost per acquisition, average spend and repeat behaviour. A beautiful campaign that attracts low-value one-off bargain hunters may be weaker than a quieter partnership that creates regular local clients.' },
        { heading: 'Memberships and partnerships', body: 'Membership creates repeat demand when benefits are valuable but economically controlled. Partnerships work when both parties share a guest profile and can measure referral value. Hotel packages should also be engineered with rooms revenue, not created in isolation.' },
      ],
      keyTerms: [{ term: 'Cost per acquisition', definition: 'Marketing spend divided by the number of new customers acquired.' }, { term: 'Lifetime value', definition: 'The expected commercial value of a guest across the whole relationship, not one transaction.' }],
      caseStudy: { title: 'The influencer campaign that looked successful', scenario: 'A campaign creates strong social reach but very few full-price bookings.', insight: 'The Director measures actual booking conversion and repeat behaviour, stops treating reach as revenue, and redirects budget into a local luxury-gym partnership with a more valuable shared audience.' },
      summary: 'Commercial marketing is measured by the quality and value of demand created, not by visibility alone.',
    },
    {
      title: 'Capex, Risk & Executive Communication',
      objectives: ['Build a credible investment case', 'Quantify operational risk', 'Present decisions concisely to senior stakeholders'],
      sections: [
        { heading: 'Capex needs a business case', body: 'A new treatment bed, hydrotherapy upgrade or device should be presented with purchase, installation, training and maintenance cost; realistic incremental revenue or risk reduction; payback; downside case; and success measures.' },
        { heading: 'The cost of doing nothing', body: 'Maintenance deferral, outdated equipment and capacity bottlenecks carry commercial and safety risk. Quantify lost bookings, downtime, guest impact and escalating repair cost where possible so “do nothing” is visible as a choice with consequences.' },
        { heading: 'Executive communication', body: 'Senior leaders need the headline, evidence, recommendation, financial implication, risk and decision required. Avoid drowning a clear decision in spa detail. Keep backup analysis ready for questions.' },
      ],
      keyTerms: [{ term: 'Payback period', definition: 'The time required for incremental contribution or savings to recover the investment cost.' }, { term: 'Downside case', definition: 'A conservative scenario showing what happens if key assumptions underperform.' }],
      caseStudy: { title: 'The £45,000 equipment proposal', scenario: 'The Director wants a premium device because competitors are introducing similar technology.', insight: 'Instead of using competitor activity as the argument, the Director models demand, achievable price premium, treatments per month, direct costs, training, maintenance, downside case and payback, then asks for a clear investment decision.' },
      summary: 'Investment is strongest when the Director shows both return and risk in language senior stakeholders can act on.',
    },
    {
      title: '12-Month Spa Business Plan',
      objectives: ['Select strategic priorities', 'Set measurable targets and financial impact', 'Build a delivery roadmap with governance'],
      sections: [
        { heading: 'Diagnose before planning', body: 'Summarise the current position using financial, guest, workforce and operational evidence. Identify the few constraints preventing the spa from achieving its commercial and brand potential.' },
        { heading: 'Build 3–5 priorities', body: 'Each priority needs a baseline, 12-month target, financial impact, owner, milestones, dependencies and key risks. If everything is a priority, nothing is.' },
        { heading: 'Govern the plan', body: 'Translate annual priorities into 30, 60, 90, 180 and 365-day milestones. Review monthly against the P&L and scorecard, change actions when evidence changes, and keep the strategic outcome stable unless the business case itself changes.' },
      ],
      keyTerms: [{ term: 'Baseline', definition: 'The current measurable starting point against which improvement is judged.' }, { term: 'Milestone', definition: 'A dated, observable point that shows whether delivery is progressing.' }],
      caseStudy: { title: 'The board meeting in four weeks', scenario: 'The owner asks for a credible plan to improve spa contribution over the next year without damaging the luxury positioning.', insight: 'The Director builds a concise plan around capacity and pricing, workforce productivity, local demand, retail and membership, plus targeted capex. Each initiative has a target, financial effect, owner and milestone rather than broad ambition.' },
      summary: 'A business plan is a decision and delivery tool: focused priorities, quantified outcomes and disciplined review.',
    },
  ],
}
