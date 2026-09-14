import type { PlanSection } from '../plan-types'
import { figures, definitions, purpose, actionsBlock, type Metric } from './shape'

// Complaints, standards, safety and marketing. The reports that are not about
// money and decide it anyway.

const COMPLAINTS: Metric[] = [
  { name: 'Complaints received', how: 'Count in the period, and as a rate per thousand guests so months of different sizes can be compared.' },
  { name: 'By type', how: 'Treatment quality, cleanliness, temperature, noise, booking error, billing, staff conduct, facility fault, waiting time.' },
  { name: 'By area', how: 'Where it happened, not where it was reported. Reception hears most complaints and causes few of them.' },
  { name: 'By therapist or team', how: 'Read against volume. The busiest therapist will usually have the most, and that is not a finding.' },
  { name: 'Value of compensation given', how: 'Refunds, complimentary treatments at menu value, vouchers and goodwill. Total and average per complaint.' },
  { name: 'Root cause', how: 'The actual cause, agreed after investigation. Not the guest’s description and not the first explanation.' },
  { name: 'Repeat issues', how: 'Complaints matching one raised in the previous three months. This is the only line that measures whether you fix things.' },
  { name: 'Time to resolution', how: 'From receipt to the guest being told the outcome. Average and the longest one.' },
  { name: 'Complaints escalated', how: 'Referred beyond the spa, to the hotel, a brand or a regulator.' },
  { name: 'Recovered guests', how: 'Complainants who returned within six months. The measure of whether service recovery worked.' },
]

export const COMPLAINTS_REPORT: PlanSection[] = [
  ...purpose(
    'what keeps going wrong, rather than what went wrong.',
    'Monthly.',
    'The spa manager.',
    [
      'A complaints log records incidents. A complaints report finds patterns. If this report is a list, it is doing the first job and not the second.',
      'Repeat issues is the important line. A complaint fixed for one guest and not for the cause will be back within the quarter with a different name on it.',
      'Read compensation value alongside the discount report. Rising service recovery is an operational cost appearing in the wrong column.',
      'Recovered guests is the honest test of your recovery procedure. A generous gesture that does not bring somebody back has bought an apology, not a guest.',
      'Complaints falling is not automatically good. Check it against feedback volume: people who have given up complaining have usually also given up coming.',
    ],
  ),
  figures('Complaints and service recovery', 'Count, cause, cost and whether it happened again.', COMPLAINTS),
  definitions(COMPLAINTS),
  ...actionsBlock(),
]

const QUALITY: Metric[] = [
  { name: 'External audit score', how: 'The brand or third party standards audit result, with the date and the assessor.' },
  { name: 'Internal audit score', how: 'Your own audit against your own standards, using the same scoring each time.' },
  { name: 'Mystery shopper score', how: 'Overall and by section, with the visit date.' },
  { name: 'Checklist completion rate', how: 'Shift checklists completed and signed, divided by shifts run. The base measure of whether the system is alive.' },
  { name: 'Checklist verification rate', how: 'Checks verified independently by a manager, as a percentage of checks claimed. A system nobody verifies degrades within weeks.' },
  { name: 'Treatment audits completed', how: 'Observed treatments assessed against the delivery standard, with the average score.' },
  { name: 'Cleanliness audit score', how: 'By area, with the same areas each time so the trend means something.' },
  { name: 'Procedure compliance findings', how: 'Where practice and the written procedure differ. Both directions: the procedure may be the thing that is wrong.' },
  { name: 'Outstanding actions', how: 'Open actions from any audit, with age. Anything over ninety days is a governance problem.' },
  { name: 'Actions closed this period', how: 'With evidence, not with an assertion.' },
]

export const QUALITY_REPORT: PlanSection[] = [
  ...purpose(
    'whether the standards you have written down are the ones being delivered.',
    'Monthly, with external audits as they fall.',
    'The spa manager.',
    [
      'Checklist verification rate is the line that keeps the whole system honest. Completion alone measures signing, not checking.',
      'Where practice and procedure differ, decide which one is wrong. Sometimes the team has found a better way and the document is out of date, and forcing compliance with a worse procedure is the expensive mistake.',
      'An audit score without an action list is entertainment. The score is the beginning of the report, not the end.',
      'Outstanding action age is the number to watch. Scores recover quickly; a ninety day old open action says nobody owns it.',
      'Read this report with complaints. A high audit score and rising complaints means you are auditing the wrong things.',
    ],
  ),
  figures('Quality and standards', 'Scores, compliance, and what is still open.', QUALITY),
  definitions(QUALITY),
  ...actionsBlock(),
]

const SAFETY: Metric[] = [
  { name: 'Accidents', how: 'Recorded accidents to guests and staff, with the area and the outcome.' },
  { name: 'Reportable incidents', how: 'Anything meeting the reporting threshold, and confirmation it was reported within the time allowed.' },
  { name: 'Near misses', how: 'Count. A rising near miss count with a falling accident count is a well run spa, not a deteriorating one.' },
  { name: 'First aid administered', how: 'Occasions, with the reason and who administered it.' },
  { name: 'Water test results out of range', how: 'Occasions, with the action taken and the time to return within range.' },
  { name: 'Water testing completion rate', how: 'Tests carried out divided by tests required. Anything below complete is the finding.' },
  { name: 'Chemical handling incidents', how: 'Spills, exposures and delivery issues, with the control that failed.' },
  { name: 'Equipment faults reported', how: 'Count, with how many were safety critical and how long each took to resolve.' },
  { name: 'Equipment out of use', how: 'Items currently tagged out, with the age of each. A long list is a capital conversation.' },
  { name: 'Planned maintenance completion rate', how: 'Scheduled tasks completed on time, as a percentage.' },
  { name: 'Fire alarm and emergency lighting tests', how: 'Completed against required, with any failure and the remedy.' },
  { name: 'Risk assessments due for review', how: 'Assessments past or approaching their review date, with the owner.' },
  { name: 'Training expiring within ninety days', how: 'Certifications approaching expiry, by person and qualification.' },
  { name: 'Staff working without current certification', how: 'This should always be zero. If it is not, it is the first item on the agenda.' },
  { name: 'First aid and pool qualification cover', how: 'Whether every shift pattern next month has qualified cover rostered.' },
]

export const SAFETY_REPORT: PlanSection[] = [
  ...purpose(
    'whether the spa is safe and can prove it.',
    'Monthly, from the weekly checklist.',
    'The spa manager, to the general manager or owner.',
    [
      'A rising near miss count alongside a falling accident count is the signature of a spa where people report things. That is the outcome you want, and it looks worse on a chart.',
      'Staff working without current certification should be zero every month. Any other number is the first item on the agenda and the last one closed.',
      'Water testing completion rate is binary in practice. Ninety-six per cent means tests were missed, and the missed ones are the ones that get asked about.',
      'Equipment out of use, by age, is the cheapest capital expenditure argument you will ever build.',
      'This report is evidence. Produce it whether or not anybody asks, and keep it, because the month somebody asks is the month you cannot construct it retrospectively.',
    ],
  ),
  figures('Health, safety and compliance', 'Incidents, testing, maintenance and certification.', SAFETY),
  definitions(SAFETY),
  ...actionsBlock(),
]

const MARKETING: Metric[] = [
  { name: 'Campaign spend', how: 'By campaign, including agency fees, production and media.' },
  { name: 'Bookings generated', how: 'Attributed to the campaign by code, source or landing path. State the attribution rule and keep it.' },
  { name: 'Revenue generated', how: 'Revenue from those bookings, including retail on the visit.' },
  { name: 'Return on marketing spend', how: 'Revenue generated divided by spend. State whether it is gross revenue or contribution: the two differ by a factor.' },
  { name: 'Cost per booking', how: 'Spend divided by bookings generated.' },
  { name: 'Cost per new guest acquired', how: 'Spend divided by first-ever-visit guests. Always higher than cost per booking and more honest.' },
  { name: 'New guest lifetime indication', how: 'Average twelve month spend of guests acquired a year ago. The only way to judge whether acquisition cost was worth paying.' },
  { name: 'Email performance', how: 'Sends, open rate, click rate, bookings and revenue. Bookings is the only one that matters.' },
  { name: 'Social performance', how: 'Reach and engagement, then bookings and revenue. Report the last two first.' },
  { name: 'Website conversion', how: 'Booking page visits converting to a booking.' },
  { name: 'Lapsed guest campaign performance', how: 'Contacted, returned, and revenue. Usually the cheapest acquisition a spa has.' },
  { name: 'Off-peak campaign performance', how: 'Bookings driven into off-peak hours specifically, and the discount given to do it.' },
]

export const MARKETING_REPORT: PlanSection[] = [
  ...purpose(
    'which marketing is worth repeating.',
    'Monthly.',
    'Marketing with the spa manager.',
    [
      'State the attribution rule and never change it mid-year. An honest imperfect rule beats a perfect one that moves.',
      'Cost per new guest acquired is the number, not cost per booking. A campaign that rebooks existing guests has moved revenue, not created it.',
      'Read acquisition cost against the twelve month value of guests acquired a year ago. Without that, every acquisition cost looks either cheap or expensive depending on the mood in the room.',
      'Lapsed guest campaigns almost always beat acquisition on cost and are almost always the last thing anybody runs.',
      'An off-peak campaign should be judged on incremental revenue, not total. If it discounted guests who would have come anyway, it cost money.',
    ],
  ),
  figures('Marketing performance', 'Spend, what it produced, and what that was worth.', MARKETING),
  definitions(MARKETING),
  ...actionsBlock(),
]
