import { deflateRawSync, crc32 } from 'node:zlib'

// A spreadsheet writer, written here rather than installed.
//
// The reporting pack needs workbooks that compute rather than workbooks with
// the row labels typed into them, and the libraries that do that well are
// megabytes of dependency for a feature that is a zip file containing XML.
// This writes that zip: deflate comes from node, the XML is a few hundred
// lines, and the result is a file with formulas, number formats and frozen
// panes that Excel, Numbers and LibreOffice all open.
//
// Every generated workbook is opened and recalculated in the test suite,
// because a malformed spreadsheet is worse than no spreadsheet. It is a file
// a buyer downloads, cannot open, and quietly stops trusting the rest of the
// pack over.

export type CellStyle =
  | 'default' | 'title' | 'subtitle' | 'header' | 'label' | 'section'
  | 'note' | 'input' | 'money' | 'percent' | 'number' | 'derived'
  | 'derivedMoney' | 'derivedPercent' | 'derivedNumber' | 'wrap'

export type Cell =
  | null
  | { text: string; style?: CellStyle }
  | { number: number; style?: CellStyle }
  | { formula: string; style?: CellStyle }

export type Sheet = {
  /** Thirty-one characters, and none of the names Excel refuses. */
  name: string
  /** Column widths, in characters. */
  widths?: number[]
  rows: Cell[][]
  /** Rows to hold on screen while scrolling, usually the header. */
  freezeRows?: number
  /** Columns to hold on screen, usually the measure name. */
  freezeColumns?: number
}

const STYLES: CellStyle[] = [
  'default', 'title', 'subtitle', 'header', 'label', 'section',
  'note', 'input', 'money', 'percent', 'number', 'derived',
  'derivedMoney', 'derivedPercent', 'derivedNumber', 'wrap',
]

const styleIndex = (style: CellStyle = 'default') => Math.max(0, STYLES.indexOf(style))

// Control characters are not valid anywhere in XML, and one of them in one
// cell makes the whole file unopenable rather than that one cell wrong.
const CONTROL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]', 'g')

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
    .replace(CONTROL, '')

/** A1, B1 ... AA1. */
export function cellRef(row: number, column: number): string {
  let name = ''
  let index = column
  while (index >= 0) {
    name = String.fromCharCode(65 + (index % 26)) + name
    index = Math.floor(index / 26) - 1
  }
  return `${name}${row}`
}

/** A sheet name a formula can point at, quoted when it has to be. */
export function sheetRef(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_.]*$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`
}

export function safeSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31)
  return cleaned || 'Sheet'
}

function sheetXml(sheet: Sheet): string {
  const cols = sheet.widths?.length
    ? `<cols>${sheet.widths.map((width, index) =>
      `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>`
    : ''

  const freezeRows = sheet.freezeRows || 0
  const freezeColumns = sheet.freezeColumns || 0
  const pane = freezeRows || freezeColumns
    ? `<pane${freezeColumns ? ` xSplit="${freezeColumns}"` : ''}${freezeRows ? ` ySplit="${freezeRows}"` : ''}`
      + ` topLeftCell="${cellRef(freezeRows + 1, freezeColumns)}" activePane="bottomRight" state="frozen"/>`
    : ''

  const rows = sheet.rows.map((cells, rowIndex) => {
    const number = rowIndex + 1
    const body = cells.map((cell, columnIndex) => {
      if (!cell) return ''
      const reference = cellRef(number, columnIndex)
      const style = ` s="${styleIndex(cell.style)}"`
      if ('formula' in cell) {
        return `<c r="${reference}"${style}><f>${escape(cell.formula.replace(/^=/, ''))}</f></c>`
      }
      if ('number' in cell) {
        return Number.isFinite(cell.number)
          ? `<c r="${reference}"${style}><v>${cell.number}</v></c>`
          : `<c r="${reference}"${style}/>`
      }
      return cell.text === ''
        ? `<c r="${reference}"${style}/>`
        : `<c r="${reference}"${style} t="inlineStr"><is><t xml:space="preserve">${escape(cell.text)}</t></is></c>`
    }).join('')
    return `<row r="${number}">${body}</row>`
  }).join('')

  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + `<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>`
    + '<sheetFormatPr defaultRowHeight="15"/>'
    + cols
    + `<sheetData>${rows}</sheetData>`
    + '</worksheet>'
}

const POUND = String.fromCharCode(163)

// One font, fill, border and number format table, in the order STYLES lists.
const STYLES_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<numFmts count="4">'
  + '<numFmt numFmtId="164" formatCode="#,##0;[Red]-#,##0"/>'
  + '<numFmt numFmtId="165" formatCode="0.0%"/>'
  + '<numFmt numFmtId="166" formatCode="#,##0.0"/>'
  + `<numFmt numFmtId="167" formatCode="&quot;${POUND}&quot;#,##0;[Red]-&quot;${POUND}&quot;#,##0"/>`
  + '</numFmts>'
  + '<fonts count="6">'
  + '<font><sz val="11"/><name val="Calibri"/></font>'
  + '<font><b/><sz val="16"/><name val="Calibri"/></font>'
  + '<font><sz val="10"/><color rgb="FF5A5A5A"/><name val="Calibri"/></font>'
  + '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
  + '<font><b/><sz val="11"/><name val="Calibri"/></font>'
  + '<font><i/><sz val="10"/><color rgb="FF5A5A5A"/><name val="Calibri"/></font>'
  + '</fonts>'
  + '<fills count="5">'
  + '<fill><patternFill patternType="none"/></fill>'
  + '<fill><patternFill patternType="gray125"/></fill>'
  + '<fill><patternFill patternType="solid"><fgColor rgb="FF1C1C1C"/><bgColor indexed="64"/></patternFill></fill>'
  + '<fill><patternFill patternType="solid"><fgColor rgb="FFF4F6F8"/><bgColor indexed="64"/></patternFill></fill>'
  + '<fill><patternFill patternType="solid"><fgColor rgb="FFEFEFEF"/><bgColor indexed="64"/></patternFill></fill>'
  + '</fills>'
  + '<borders count="2">'
  + '<border><left/><right/><top/><bottom/><diagonal/></border>'
  + '<border><left style="thin"><color rgb="FFD0D0D0"/></left><right style="thin"><color rgb="FFD0D0D0"/></right>'
  + '<top style="thin"><color rgb="FFD0D0D0"/></top><bottom style="thin"><color rgb="FFD0D0D0"/></bottom><diagonal/></border>'
  + '</borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="16">'
  + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="0"/>'
  + '<xf xfId="0" numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/>'
  + '<xf xfId="0" numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
  + '<xf xfId="0" numFmtId="0" fontId="3" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
  + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
  + '<xf xfId="0" numFmtId="0" fontId="4" fillId="0" borderId="0" applyFont="1"/>'
  + '<xf xfId="0" numFmtId="0" fontId="5" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
  + '<xf xfId="0" numFmtId="164" fontId="0" fillId="3" borderId="1" applyNumberFormat="1" applyFill="1" applyBorder="1"/>'
  + '<xf xfId="0" numFmtId="167" fontId="0" fillId="3" borderId="1" applyNumberFormat="1" applyFill="1" applyBorder="1"/>'
  + '<xf xfId="0" numFmtId="165" fontId="0" fillId="3" borderId="1" applyNumberFormat="1" applyFill="1" applyBorder="1"/>'
  + '<xf xfId="0" numFmtId="166" fontId="0" fillId="3" borderId="1" applyNumberFormat="1" applyFill="1" applyBorder="1"/>'
  + '<xf xfId="0" numFmtId="164" fontId="4" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>'
  + '<xf xfId="0" numFmtId="167" fontId="4" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>'
  + '<xf xfId="0" numFmtId="165" fontId="4" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>'
  + '<xf xfId="0" numFmtId="166" fontId="4" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>'
  + '<xf xfId="0" numFmtId="0" fontId="0" fillId="0" borderId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
  + '</cellXfs>'
  + '</styleSheet>'

/** The whole workbook, as the bytes of an .xlsx file. */
export function buildWorkbook(sheets: Sheet[]): Buffer {
  if (!sheets.length) throw new Error('A workbook needs at least one sheet.')

  const files: { path: string; data: Buffer }[] = []
  const add = (path: string, text: string) => files.push({ path, data: Buffer.from(text, 'utf8') })

  add('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + sheets.map((_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    + '</Types>')

  add('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    + '</Relationships>')

  add('xl/workbook.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    + ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    + `<sheets>${sheets.map((sheet, index) =>
      `<sheet name="${escape(safeSheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}</sheets>`
    // Nothing here carries a cached value, so everything is worked out on open.
    + '<calcPr fullCalcOnLoad="1"/>'
    + '</workbook>')

  add('xl/_rels/workbook.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + sheets.map((_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')
    + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
    + '</Relationships>')

  add('xl/styles.xml', STYLES_XML)
  sheets.forEach((sheet, index) => add(`xl/worksheets/sheet${index + 1}.xml`, sheetXml(sheet)))

  return zip(files)
}

/** A zip file, deflated, with no external dependency. */
function zip(files: { path: string; data: Buffer }[]): Buffer {
  const locals: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const name = Buffer.from(file.path, 'utf8')
    const compressed = deflateRawSync(file.data)
    const checksum = crc32(file.data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(8, 8)
    local.writeUInt16LE(0, 10)
    // A fixed date, so the same content produces the same bytes and a
    // download can be compared with the one from last month.
    local.writeUInt16LE(0x21, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(file.data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, name, compressed)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt16LE(0, 8)
    entry.writeUInt16LE(8, 10)
    entry.writeUInt16LE(0, 12)
    entry.writeUInt16LE(0x21, 14)
    entry.writeUInt32LE(checksum, 16)
    entry.writeUInt32LE(compressed.length, 20)
    entry.writeUInt32LE(file.data.length, 24)
    entry.writeUInt16LE(name.length, 28)
    entry.writeUInt16LE(0, 30)
    entry.writeUInt16LE(0, 32)
    entry.writeUInt16LE(0, 34)
    entry.writeUInt16LE(0, 36)
    entry.writeUInt32LE(0, 38)
    entry.writeUInt32LE(offset, 42)
    central.push(entry, name)

    offset += 30 + name.length + compressed.length
  }

  const directory = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...locals, directory, end])
}
