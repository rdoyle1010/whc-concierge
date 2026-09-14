import type { SopDocument } from './types'
import type { PlanDocument } from './plan-types'

// One entry point, whatever kind of document it is.
//
// Two renderers exist because a procedure and a plan are different shapes,
// and every caller that has to remember which is which is a caller that will
// eventually pick the wrong one and hand a property a Normal Operating
// Procedure typeset as a list of steps.

export const PLAN_KINDS = new Set(['nop', 'eap', 'policy', 'safe-system', 'risk-assessment', 'guide', 'training'])

export async function renderAnyDocumentPdf(kind: string, document: unknown): Promise<Buffer> {
  if (PLAN_KINDS.has(kind)) {
    const { renderPlanPdf } = await import('./plan-pdf')
    return renderPlanPdf(document as PlanDocument)
  }
  const { renderDocumentPdf } = await import('./document-pdf')
  return renderDocumentPdf(document as SopDocument)
}
