import { ALLOWED_ATTACHMENT_TYPES } from './attachments'

// What a buyer is actually going to open.
//
// "36 documents" tells somebody spending eight hundred pounds nothing about
// what lands in their inbox. A spa director who has been sent a folder of
// PDFs before wants to know whether the reporting pack is a picture of a
// spreadsheet or an actual spreadsheet, and whether the training pack is
// slides they can present or a document they will have to retype.
//
// So every pack says what is in it and in what format, by name, before the
// buy button rather than after the payment.

export type Format = 'PDF' | 'Excel' | 'Word' | 'PowerPoint' | 'CSV' | 'File'

const BY_TYPE: Record<string, Format> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12': 'Excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'text/csv': 'CSV',
}

const BY_EXTENSION: Record<string, Format> = {
  pdf: 'PDF', xlsx: 'Excel', xls: 'Excel', xlsm: 'Excel',
  docx: 'Word', doc: 'Word', pptx: 'PowerPoint', csv: 'CSV',
}

/**
 * The format of an uploaded file.
 *
 * Read from the content type where there is one, and from the extension where
 * the browser sent nothing useful, which it does often enough that trusting
 * the type alone would label a real workbook as "File".
 */
export function formatOf(contentType: string | null | undefined, fileName = ''): Format {
  const byType = contentType ? BY_TYPE[contentType] : undefined
  if (byType) return byType
  const extension = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : ''
  return BY_EXTENSION[extension] || 'File'
}

/** Every document in the library is delivered as a PDF with fillable fields. */
export const DOCUMENT_FORMAT: Format = 'PDF'

/**
 * One line saying what a pack is made of.
 *
 * Counted rather than listed, because "36 PDFs and an Excel workbook" is the
 * sentence a buyer repeats to the person holding the budget.
 */
export function formatSummary(counts: Partial<Record<Format, number>>): string {
  const order: Format[] = ['PDF', 'Excel', 'Word', 'PowerPoint', 'CSV', 'File']
  const parts = order
    .filter(format => (counts[format] || 0) > 0)
    .map(format => {
      const count = counts[format] || 0
      // "105 PDFs" sounds like homework. Fillable is the whole difference
      // between a document somebody uses and a document somebody retypes.
      if (format === 'PDF') return `${count} fillable PDF${count === 1 ? '' : 's'}`
      if (format === 'Excel') return `${count} Excel workbook${count === 1 ? '' : 's'}`
      if (format === 'Word') return `${count} Word document${count === 1 ? '' : 's'}`
      if (format === 'PowerPoint') return `${count} presentation${count === 1 ? '' : 's'}`
      if (format === 'CSV') return `${count} CSV file${count === 1 ? '' : 's'}`
      return `${count} file${count === 1 ? '' : 's'}`
    })
  return parts.join(' · ')
}

/** Guard: every type the upload accepts has a name a buyer would recognise. */
export function everyAllowedTypeHasAFormat(): boolean {
  return [...ALLOWED_ATTACHMENT_TYPES.keys()].every(type => BY_TYPE[type] !== undefined)
}
