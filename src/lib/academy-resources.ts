export type AcademyResource = {
  id: string
  title: string
  description: string
  filename: string
  contentType: string
  content: string
}

const csv = (rows: string[][]) => rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

const manager: AcademyResource[] = [
  {
    id: 'rota-planner', title: 'Spa rota & coverage planner', filename: 'whc-spa-rota-planner.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Plan therapist coverage against treatment demand, contracted hours, breaks, skills and payroll.',
    content: csv([
      ['Date','Day','Opening hours','Forecast treatment hours','Target utilisation %','Required treatment hours','Employee','Role / skills','Shift start','Shift end','Break mins','Paid hours','Treatment hours available','Holiday / training / sickness','Notes'],
      ['','', '09:00-20:00','','','','','','','','','','','',''],
    ]),
  },
  {
    id: 'payroll-kpi', title: 'Payroll & productivity tracker', filename: 'whc-payroll-productivity-tracker.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Track revenue, payroll %, utilisation, average treatment value, retail and agency spend by week.',
    content: csv([
      ['Week','Treatment revenue £','Retail revenue £','Other spa revenue £','Total revenue £','Payroll £','Payroll %','Available treatment hours','Booked treatment hours','Utilisation %','Average treatment value £','Retail % of treatment revenue','Agency spend £','Sickness hours','Overtime hours','Management action'],
      ['','','','','','','','','','','','','','','',''],
    ]),
  },
  {
    id: 'sop-template', title: 'Spa SOP template', filename: 'whc-spa-sop-template.txt', contentType: 'text/plain; charset=utf-8',
    description: 'A professional structure for opening, closing, guest, safety and operational procedures.',
    content: `WHC SPA STANDARD OPERATING PROCEDURE\n\nSOP title:\nDepartment / area:\nDocument owner:\nVersion:\nEffective date:\nReview date:\n\n1. PURPOSE\nWhat this procedure protects or achieves.\n\n2. SCOPE\nWho and what this SOP applies to.\n\n3. RESPONSIBILITIES\nWho completes, checks and escalates each part.\n\n4. REQUIRED EQUIPMENT / DOCUMENTS\n\n5. PROCEDURE\nStep 1:\nStep 2:\nStep 3:\n\n6. HEALTH, SAFETY & COMPLIANCE POINTS\n\n7. EXCEPTIONS / ESCALATION\nWhat must stop the process and who must be contacted.\n\n8. RECORDS TO COMPLETE\n\n9. TRAINING / SIGN-OFF\n\n10. REVIEW HISTORY\nDate | Change | Approved by\n`,
  },
  {
    id: 'menu-costing', title: 'Treatment menu profitability calculator', filename: 'whc-treatment-menu-profitability.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Compare selling price, room time, direct product cost and contribution per available treatment hour.',
    content: csv([
      ['Treatment','Selling price £','Hands-on mins','Consultation/setup/reset mins','Total room mins','Product/consumable cost £','Commission/direct labour £','Direct contribution £','Contribution per room hour £','Monthly bookings','Monthly contribution £','Retail attachment %','Decision / action'],
      ['Example 60-min massage','120','60','15','75','8','0','','','','','',''],
    ]),
  },
  {
    id: 'monthly-scorecard', title: 'Spa manager monthly scorecard', filename: 'whc-spa-manager-scorecard.csv', contentType: 'text/csv; charset=utf-8',
    description: 'One-page monthly review covering commercial, guest, people and operational performance.',
    content: csv([
      ['KPI','Budget / target','Actual','Prior period','Variance','Status','Root cause','Action','Owner','Due date'],
      ['Treatment revenue £','','','','','','','','',''],['Retail revenue £','','','','','','','','',''],['Payroll %','','','','','','','','',''],['Therapist utilisation %','','','','','','','','',''],['Average treatment value £','','','','','','','','',''],['Retail %','','','','','','','','',''],['Rebooking %','','','','','','','','',''],['Guest score','','','','','','','','',''],['Complaints','','','','','','','','',''],['Sickness hours','','','','','','','','',''],['Agency spend £','','','','','','','','',''],
    ]),
  },
  {
    id: 'performance-conversation', title: 'Performance conversation worksheet', filename: 'whc-performance-conversation.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Prepare fair, evidence-based coaching and performance conversations with clear follow-up.',
    content: csv([
      ['Employee','Date','Observed behaviour / facts','Impact','Expected standard','Employee perspective','Agreed action','Support / training','Review date','Outcome'],['','','','','','','','','',''],
    ]),
  },
]

const director: AcademyResource[] = [
  {
    id: 'pnl-workbook', title: 'Spa P&L analysis workbook', filename: 'whc-spa-pnl-analysis.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Analyse budget, actual, variance and the operating drivers behind spa profit.',
    content: csv([
      ['P&L line','Budget £','Actual £','Variance £','Variance %','Operational driver / explanation','Corrective action'],
      ['Treatment revenue','','','','','',''],['Retail revenue','','','','','',''],['Membership / day spa / other revenue','','','','','',''],['TOTAL REVENUE','','','','','',''],['Payroll & on-costs','','','','','',''],['Commissions','','','','','',''],['Professional product cost','','','','','',''],['Retail cost of sales','','','','','',''],['Laundry / consumables','','','','','',''],['Agency','','','','','',''],['Marketing','','','','','',''],['Maintenance / equipment','','','','','',''],['Other operating costs','','','','','',''],['SPA CONTRIBUTION / PROFIT','','','','','',''],
    ]),
  },
  {
    id: 'budget-forecast', title: 'Annual budget & rolling forecast model', filename: 'whc-spa-budget-forecast.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Build a 12-month plan from capacity, utilisation, average spend, payroll and variable costs.',
    content: csv([
      ['Month','Sellable treatment hours','Utilisation %','Booked hours','Average treatment value £','Treatment revenue £','Retail %','Retail revenue £','Membership/other £','Total revenue £','Payroll £','Product/variable costs £','Other opex £','Forecast profit £','Key assumption / action'],
      ['Jan','','','','','','','','','','','','','',''],['Feb','','','','','','','','','','','','','',''],['Mar','','','','','','','','','','','','','',''],['Apr','','','','','','','','','','','','','',''],['May','','','','','','','','','','','','','',''],['Jun','','','','','','','','','','','','','',''],['Jul','','','','','','','','','','','','','',''],['Aug','','','','','','','','','','','','','',''],['Sep','','','','','','','','','','','','','',''],['Oct','','','','','','','','','','','','','',''],['Nov','','','','','','','','','','','','','',''],['Dec','','','','','','','','','','','','','',''],
    ]),
  },
  {
    id: 'revenue-management', title: 'Revenue management by daypart', filename: 'whc-spa-revenue-management.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Find peak and soft capacity so pricing and offers solve the right demand problem.',
    content: csv([
      ['Day','Time band','Available treatment hours','Booked hours','Utilisation %','Average treatment value £','Revenue per available hour £','Guest segment','Current offer / price','Recommended action'],
      ['Monday','09:00-12:00','','','','','','','',''],['Saturday','12:00-17:00','','','','','','','',''],
    ]),
  },
  {
    id: 'capex-business-case', title: 'Capex / equipment business case', filename: 'whc-spa-capex-business-case.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Present investment cost, revenue opportunity, payback, risks and measures to a GM or owner.',
    content: csv([
      ['Proposal','Business problem / opportunity','Purchase £','Installation £','Training £','Annual maintenance £','Total year-1 cost £','Expected price premium £','Expected treatments / month','Expected monthly incremental revenue £','Expected monthly incremental contribution £','Estimated payback months','Downside case','Key risks','Success KPI'],
      ['','','','','','','','','','','','','','',''],
    ]),
  },
  {
    id: 'marketing-calendar', title: '12-month spa marketing calendar', filename: 'whc-spa-marketing-calendar.csv', contentType: 'text/csv; charset=utf-8',
    description: 'Tie campaigns to target segments, soft periods, hotel occupancy, revenue targets and measurable ROI.',
    content: csv([
      ['Month','Commercial need','Target segment','Campaign / partnership','Offer / message','Channel','Budget £','Bookings target','Revenue target £','Owner','Launch date','Result £','Cost per acquisition £','Repeat / follow-up action'],
      ['January','','','','','','','','','','','','',''],['February','','','','','','','','','','','','',''],['March','','','','','','','','','','','','',''],
    ]),
  },
  {
    id: 'business-plan', title: '12-month spa business plan', filename: 'whc-12-month-spa-business-plan.txt', contentType: 'text/plain; charset=utf-8',
    description: 'Turn the programme into a board-ready annual plan with measurable priorities and financial impact.',
    content: `WHC 12-MONTH SPA BUSINESS PLAN\n\n1. EXECUTIVE SUMMARY\nCurrent position, commercial objective and the 3-5 priorities that matter most.\n\n2. CURRENT PERFORMANCE\nRevenue | Profit/contribution | Payroll % | Utilisation | Average treatment value | Retail % | Membership | Guest scores | Team / turnover\n\n3. MARKET & GUEST SEGMENTS\nPrimary guest groups, local market, hotel guest opportunity, competitive position.\n\n4. STRATEGIC PRIORITIES\nFor each priority:\n- Outcome\n- Baseline\n- 12-month target\n- Financial impact\n- Owner\n- Milestones\n- Risks / dependencies\n\n5. PEOPLE & WORKFORCE PLAN\nStructure, recruitment, succession, training, agency dependence, payroll strategy.\n\n6. MENU, PRICING & REVENUE PLAN\nMenu changes, peak/soft capacity, upgrades, memberships, retail and partnerships.\n\n7. MARKETING PLAN\nAudience, campaigns, budget, acquisition targets, measurement.\n\n8. CAPEX / MAINTENANCE PLAN\nInvestment, payback and operational risk.\n\n9. MONTHLY KPI SCORECARD\nDefine the numbers reviewed each month.\n\n10. 30 / 60 / 90 / 180 / 365-DAY DELIVERY ROADMAP\n`,
  },
  {
    id: 'gm-board-pack', title: 'GM / owner monthly performance pack', filename: 'whc-gm-owner-performance-pack.csv', contentType: 'text/csv; charset=utf-8',
    description: 'A concise senior update on financial result, drivers, guests, people, risks and decisions required.',
    content: csv([
      ['Section','Headline','Budget / target','Actual','Variance','Why it happened','Action / decision required','Owner','Deadline'],
      ['Financial result','','','','','','','',''],['Revenue drivers','','','','','','','',''],['Guest experience','','','','','','','',''],['People / workforce','','','','','','','',''],['Risk / compliance','','','','','','','',''],['Investment / decision required','','','','','','','',''],
    ]),
  },
]

export const ACADEMY_RESOURCES: Record<string, AcademyResource[]> = {
  'spa-manager-programme': manager,
  'spa-director-programme': director,
}

export function academyResources(slug: string) {
  return ACADEMY_RESOURCES[slug] || []
}

export function academyResource(slug: string, id: string) {
  return academyResources(slug).find(resource => resource.id === id) || null
}
