import { buildWorkbook, cellRef, sheetRef, type Cell, type Sheet } from '../xlsx'
import { FINANCE_REGISTER, type ReportEntry } from './register'
import { COMPUTED, DASHBOARD_SOURCES, SETUP_FIELDS, SETUP_SHEET, formatFor } from './computed'

// One workbook, every report, and the arithmetic done.
//
// The PDFs are how a pack is presented: what each measure is, why it matters,
// what a bad number means, and a page somebody can put in front of a general
// manager. This is where the month is actually worked out.
//
// One file rather than twenty, because the reports are not independent.
// RevPATH needs the revenue off the trading sheet and the rooms off Setup;
// payroll percentage needs the same revenue; the dashboard needs all of it. A
// pack of twenty separate workbooks is twenty places to type the same total
// and three months until two of them disagree.
//
// It is generated from the same register the PDFs are, so the tabs, the lines
// and the definitions cannot drift from the documents they belong to.

/** Where the value columns start, and what they are called. */
const VALUE_COLUMNS = ['This period', 'Last period', 'Same period last year', 'Budget']
const HEADER_ROW = 4
const FIRST_METRIC_ROW = HEADER_ROW + 1

const numberStyle = (format: 'money' | 'percent' | 'number', derived: boolean) =>
  derived
    ? (format === 'money' ? 'derivedMoney' : format === 'percent' ? 'derivedPercent' : 'derivedNumber')
    : (format === 'money' ? 'money' : format === 'percent' ? 'percent' : 'number')

/** The metrics table on a report: the one whose first column is Measure. */
function metricsOf(entry: ReportEntry): { name: string; how: string }[] {
  const figures = entry.sections.find(section =>
    section.part === 'The figures' && section.table?.columns[0] === 'Measure')
  const definitions = entry.sections.find(section => section.heading === 'How each line is calculated')
  const how = new Map((definitions?.table?.rows || []).map(row => [row[0], row[1]]))
  return (figures?.table?.rows || [])
    .map(row => row[0])
    .filter(Boolean)
    .map(name => ({ name, how: how.get(name) || '' }))
}

/**
 * Turns a formula written with {names} into one written with cells.
 *
 * A name that is not on the sheet throws rather than producing a reference to
 * nowhere. A workbook that opens with errors down a column is worse than one
 * that opens with blanks: the blanks are obviously unfinished, and the errors
 * look like the buyer broke it.
 */
function resolve(
  template: string,
  column: string,
  rowOf: Map<string, number>,
  setupRowOf: Map<string, number>,
  otherSheets: Map<string, Map<string, number>>,
  where: string,
): string {
  return `=${template.replace(/\{([^}]+)\}/g, (_, raw: string) => {
    const name = String(raw)

    if (name.startsWith('@')) {
      const row = setupRowOf.get(name.slice(1))
      if (!row) throw new Error(`${where}: no Setup field called "${name.slice(1)}"`)
      return `${sheetRef(SETUP_SHEET)}!$B$${row}`
    }

    if (name.includes('!')) {
      const [sheet, measure] = name.split('!')
      const rows = otherSheets.get(sheet)
      if (!rows) throw new Error(`${where}: no sheet called "${sheet}"`)
      const row = rows.get(measure)
      if (!row) throw new Error(`${where}: "${measure}" is not on the ${sheet} sheet`)
      return `${sheetRef(sheet)}!${column}${row}`
    }

    const row = rowOf.get(name)
    if (!row) throw new Error(`${where}: "${name}" is not a line on this report`)
    return `${column}${row}`
  })}`
}

function readMeSheet(): Sheet {
  const lines: [string, string][] = [
    ['Start on Setup.', 'Eight numbers. Everything on the capacity sheet, and half the dashboard, is worked out from them. Get them wrong and the rest is confidently wrong.'],
    ['Type into the pale blue cells only.', 'The grey cells are worked out. Typing over one replaces a formula with a number, and it will not update again.'],
    ['Fill all four value columns.', 'A figure on its own is a fact. A figure against budget, against last period and against the same period last year is a finding. Most spa reporting shows the first and calls it a report.'],
    ['The dashboard is not typed.', 'Every line on it points at a report sheet. If a dashboard number looks wrong, the report behind it is wrong, and that is the point.'],
    ['Definitions live on the last column of each sheet.', 'They are the part worth keeping. The argument at month end is almost never about the number: it is about whether utilisation counted rostered hours or available hours.'],
    ['Do not rename the tabs.', 'The dashboard and the capacity sheet point at them by name. Renaming a tab breaks every formula that does.'],
    ['Save a copy per period.', 'This is a template, not a database. One file per month, named by the month, keeps a year of history you can actually compare.'],
  ]

  const rows: Cell[][] = [
    [{ text: 'Spa Reporting Pack', style: 'title' }],
    [{ text: 'The workbook behind the reports. The PDFs are how you present a month. This is where you work it out.', style: 'subtitle' }],
    [],
    [{ text: 'How to use it', style: 'header' }, { text: 'Why', style: 'header' }],
    ...lines.map(([what, why]): Cell[] => [{ text: what, style: 'label' }, { text: why, style: 'label' }]),
    [],
    [{ text: 'What is in here', style: 'section' }],
    [{ text: 'Sheet', style: 'header' }, { text: 'What it answers', style: 'header' }],
    ...FINANCE_REGISTER.map((entry): Cell[] => [
      { text: entry.sheet, style: 'label' },
      { text: entry.intro, style: 'label' },
    ]),
    [],
    [{ text: 'Issued as a professional template for the property to review, amend and adopt. Nothing in it is a benchmark or a target: a printed number would be somebody else’s spa.', style: 'note' }],
  ]

  return { name: 'Read me', widths: [42, 96], rows, freezeRows: 4 }
}

function setupSheet(): Sheet {
  const rows: Cell[][] = [
    [{ text: 'Setup', style: 'title' }],
    [{ text: 'The constants the rest of the pack reads. Eight numbers, stated once.', style: 'subtitle' }],
    [],
    [{ text: 'Constant', style: 'header' }, { text: 'Value', style: 'header' }, { text: 'What it means', style: 'header' }],
    ...SETUP_FIELDS.map((field): Cell[] => [
      { text: field.label, style: 'label' },
      { text: '', style: numberStyle(field.format, false) },
      { text: field.hint, style: 'label' },
    ]),
  ]
  return { name: SETUP_SHEET, widths: [40, 16, 70], rows, freezeRows: 4, freezeColumns: 1 }
}

function reportSheet(
  entry: ReportEntry,
  setupRowOf: Map<string, number>,
  rowsBySheet: Map<string, Map<string, number>>,
): Sheet {
  const metrics = metricsOf(entry)
  const computed = COMPUTED[entry.reference] || {}
  const rowOf = rowsBySheet.get(entry.sheet)!

  const header: Cell[] = [
    { text: 'Measure', style: 'header' },
    ...VALUE_COLUMNS.map((name): Cell => ({ text: name, style: 'header' })),
    { text: 'Variance to budget', style: 'header' },
    { text: 'How it is calculated', style: 'header' },
  ]

  const body = metrics.map((metric, index): Cell[] => {
    const row = FIRST_METRIC_ROW + index
    const format = formatFor(metric.name)
    const template = computed[metric.name]

    const values = VALUE_COLUMNS.map((_, columnIndex): Cell => {
      const column = cellRef(1, columnIndex + 1).replace(/\d+$/, '')
      if (!template) return { text: '', style: numberStyle(format, false) }
      return {
        formula: resolve(template, column, rowOf, setupRowOf, rowsBySheet, `${entry.reference} / ${metric.name}`),
        style: numberStyle(format, true),
      }
    })

    // This period against budget, in the units the line is in. A percentage
    // point difference and a pound difference are both differences, and
    // showing them the same way is how a report gets misread aloud.
    const variance: Cell = {
      formula: `=IF(OR(B${row}="",E${row}=""),"",B${row}-E${row})`,
      style: numberStyle(format, true),
    }

    return [
      { text: metric.name, style: 'label' },
      ...values,
      variance,
      { text: metric.how, style: 'label' },
    ]
  })

  return {
    name: entry.sheet,
    widths: [38, 15, 15, 20, 15, 16, 74],
    freezeRows: HEADER_ROW,
    freezeColumns: 1,
    rows: [
      [{ text: entry.title, style: 'title' }],
      [{ text: `${entry.reference}  ${String.fromCharCode(183)}  ${entry.cadence}  ${String.fromCharCode(183)}  grey cells are worked out, pale blue cells are yours`, style: 'subtitle' }],
      [],
      header,
      ...body,
    ],
  }
}

function dashboardSheet(
  entry: ReportEntry,
  rowsBySheet: Map<string, Map<string, number>>,
): Sheet {
  const header: Cell[] = [
    { text: 'Measure', style: 'header' },
    ...VALUE_COLUMNS.map((name): Cell => ({ text: name, style: 'header' })),
    { text: 'Variance to budget', style: 'header' },
    { text: 'Where it comes from', style: 'header' },
  ]

  const body = DASHBOARD_SOURCES.map((source, index): Cell[] => {
    const row = FIRST_METRIC_ROW + index
    const format = formatFor(source.measure)
    const rows = rowsBySheet.get(source.sheet)
    if (!rows) throw new Error(`Dashboard: no sheet called "${source.sheet}"`)
    const target = rows.get(source.from)
    if (!target) throw new Error(`Dashboard: "${source.from}" is not on the ${source.sheet} sheet`)

    const values = VALUE_COLUMNS.map((_, columnIndex): Cell => {
      const column = cellRef(1, columnIndex + 1).replace(/\d+$/, '')
      return {
        formula: `=IF(${sheetRef(source.sheet)}!${column}${target}="","",${sheetRef(source.sheet)}!${column}${target})`,
        style: numberStyle(format, true),
      }
    })

    return [
      { text: source.measure, style: 'label' },
      ...values,
      { formula: `=IF(OR(B${row}="",E${row}=""),"",B${row}-E${row})`, style: numberStyle(format, true) },
      { text: `${source.sheet}: ${source.from}`, style: 'label' },
    ]
  })

  return {
    name: entry.sheet,
    widths: [34, 15, 15, 20, 15, 16, 44],
    freezeRows: HEADER_ROW,
    freezeColumns: 1,
    rows: [
      [{ text: entry.title, style: 'title' }],
      [{ text: 'Nothing on this page is typed. Every line points at the report behind it, so the dashboard and the pack cannot disagree.', style: 'subtitle' }],
      [],
      header,
      ...body,
      [],
      [{ text: 'The three things that matter this month', style: 'section' }],
      [{ text: 'What went well, and why', style: 'label' }, { text: '', style: 'input' }],
      [{ text: 'What did not, and why', style: 'label' }, { text: '', style: 'input' }],
      [{ text: 'What we are changing, and what it is worth', style: 'label' }, { text: '', style: 'input' }],
    ],
  }
}

/** Every report, in one workbook, with the arithmetic wired up. */
export function reportingWorkbook(): Buffer {
  // Where every line sits, worked out before anything is written, because a
  // formula on the capacity sheet points at a row on the trading sheet and
  // the dashboard points at both.
  const rowsBySheet = new Map<string, Map<string, number>>()
  for (const entry of FINANCE_REGISTER) {
    const rows = new Map<string, number>()
    metricsOf(entry).forEach((metric, index) => rows.set(metric.name, FIRST_METRIC_ROW + index))
    rowsBySheet.set(entry.sheet, rows)
  }
  DASHBOARD_SOURCES.forEach((source, index) => {
    rowsBySheet.get('Dashboard')!.set(source.measure, FIRST_METRIC_ROW + index)
  })

  const setupRowOf = new Map(SETUP_FIELDS.map((field, index) => [field.label, FIRST_METRIC_ROW + index]))

  const sheets: Sheet[] = [readMeSheet(), setupSheet()]
  for (const entry of FINANCE_REGISTER) {
    // The action tracker is a list rather than a set of measures, and the
    // dashboard is entirely references.
    if (entry.sheet === 'Dashboard') sheets.push(dashboardSheet(entry, rowsBySheet))
    else if (metricsOf(entry).length) sheets.push(reportSheet(entry, setupRowOf, rowsBySheet))
  }

  return buildWorkbook(sheets)
}

export const WORKBOOK_FILE_NAME = 'Spa Reporting Pack.xlsx'
