import type { PlanDocument, PlanSection } from '@/lib/documents/plan-types'
import { PLAN_KIND_LABEL } from '@/lib/documents/plan-types'
import { DOCUMENT_FOOTER, DOCUMENT_STATUS, disclaimersFor } from '@/lib/documents/status'

// A plan, on screen, so she can read it before signing it off.
//
// The blanks are drawn as blanks rather than hidden. Most of a Normal
// Operating Procedure is a form, and a preview that quietly renders empty
// fields as nothing would show her a document that looks finished and is not.

const cell = 'border border-[#c7bdae] px-3 py-2 align-top text-[10.5pt] leading-[1.45]'
const head = `${cell} bg-[#f2f2f2] font-semibold uppercase tracking-[.06em] text-[9pt]`

function Blank({ tall = false }: { tall?: boolean }) {
  return <div className={`mt-1 border border-[#9aa5b1] bg-[#f4f6f8] ${tall ? 'h-9' : 'h-5'}`} />
}

function Section({ section }: { section: PlanSection }) {
  return (
    <section className={`mt-7 ${section.ownPage ? 'break-before-page' : 'break-inside-avoid'}`}>
      <h2 className="border-b-2 border-[#222321] pb-1 text-[11pt] font-bold uppercase tracking-[.1em]">
        {section.heading}
      </h2>

      {section.intro && <p className="mt-3 text-[10pt] text-[#5a5a5a]">{section.intro}</p>}

      {section.mustBeChecked && (
        <p className="mt-3 border-l-[3px] border-[#222321] py-1.5 pl-3 text-[9.5pt] leading-relaxed">
          This section must be completed by a person who knows these premises, checked against the building, and
          signed off before this document is issued to anybody. Nothing here may be answered from memory or copied
          from another property.
        </p>
      )}

      {section.paragraphs?.map(paragraph => (
        <p key={paragraph.slice(0, 40)} className="mt-2.5 text-[10.5pt] leading-[1.55]">{paragraph}</p>
      ))}

      {section.bullets?.length ? (
        <ul className="mt-2.5 space-y-1.5 text-[10.5pt]">
          {section.bullets.map(bullet => (
            <li key={bullet.slice(0, 40)} className="flex gap-2"><span className="font-bold">-</span><span>{bullet}</span></li>
          ))}
        </ul>
      ) : null}

      {section.facts?.length ? (
        <div className="mt-3 space-y-3">
          {section.facts.map(fact => (
            <div key={fact.label}>
              <p className="text-[8.5pt] font-semibold uppercase tracking-[.06em]">{fact.label}</p>
              {fact.hint && <p className="mt-0.5 text-[8pt] text-[#7e7a70]">{fact.hint}</p>}
              {fact.value
                ? <p className="mt-1 border border-[#c7bdae] px-2 py-1 text-[10.5pt]">{fact.value}</p>
                : <Blank tall={fact.long} />}
            </div>
          ))}
        </div>
      ) : null}

      {section.actions?.length ? (
        <table className="mt-3 w-full border-collapse">
          <thead>
            <tr>
              <th className={`${head} w-[5%] text-left`}>#</th>
              <th className={`${head} text-left`}>What is done</th>
              <th className={`${head} w-[22%] text-left`}>Done by</th>
            </tr>
          </thead>
          <tbody>
            {section.actions.map((action, index) => (
              <tr key={action.name} className="break-inside-avoid">
                <td className={`${cell} text-center font-semibold`}>{index + 1}</td>
                <td className={cell}>
                  <span className="font-semibold">{action.name}. </span>{action.action}
                </td>
                <td className={cell}>{action.by || <Blank />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {section.hazards?.length ? (
        <div className="mt-3 space-y-3">
          {section.hazards.map((hazard, index) => (
            <div key={hazard.hazard} className="break-inside-avoid border border-[#222321]">
              <div className="border-b border-[#c7bdae] bg-[#f2f2f2] px-3 py-2">
                <p className="text-[7.5pt] uppercase tracking-[.1em] text-[#6e6a60]">Hazard {index + 1}</p>
                <p className="text-[10.5pt] font-bold">{hazard.hazard}</p>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-[7.5pt] font-semibold uppercase tracking-[.07em] text-[#6e6a60]">Who is at risk</p>
                <p className="mb-2.5 text-[9.5pt]">{hazard.whoIsAtRisk}</p>

                <p className="text-[7.5pt] font-semibold uppercase tracking-[.07em] text-[#6e6a60]">
                  Controls: tick each one you have seen in place
                </p>
                <ul className="mt-1 space-y-1">
                  {hazard.controlsToVerify.map(control => (
                    <li key={control} className="flex gap-2 text-[9.5pt] leading-snug">
                      <span className="mt-[3px] inline-block h-2 w-2 shrink-0 border border-[#222321]" />
                      <span>{control}</span>
                    </li>
                  ))}
                </ul>

                {hazard.note && <p className="mt-2.5 text-[9pt] text-[#5a5a5a]">{hazard.note}</p>}

                {/* Blank, deliberately. A pre-scored assessment is a property
                    filing somebody else's opinion of its own premises. */}
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {['Likelihood 1-5', 'Severity 1-5', 'Score L x S', 'Risk level'].map(label => (
                    <div key={label}>
                      <p className="text-[6.5pt] uppercase tracking-[.05em] text-[#6e6a60]">{label}</p>
                      <Blank />
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-[6.5pt] uppercase tracking-[.05em] text-[#6e6a60]">Further controls required</p>
                  <Blank tall />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {['Responsible person', 'Target date', 'Residual level'].map(label => (
                    <div key={label}>
                      <p className="text-[6.5pt] uppercase tracking-[.05em] text-[#6e6a60]">{label}</p>
                      <Blank />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {section.table ? (
        <table className="mt-3 w-full border-collapse">
          <thead>
            <tr>{section.table.columns.map(column => <th key={column} className={`${head} text-left`}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {section.table.rows.map((row, rowIndex) => (
              <tr key={`r${rowIndex}`}>
                {section.table!.columns.map((column, columnIndex) => (
                  <td key={`r${rowIndex}c${columnIndex}`} className={cell}>
                    {row[columnIndex] || (section.table!.fillable ? <Blank /> : null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  )
}

export default function PlanSheet({ document }: { document: PlanDocument }) {
  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white px-[14mm] py-[12mm] text-[#222321] print:max-w-none print:px-0 print:py-0">
      <header className="border-b-4 border-[#222321] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9pt] font-semibold uppercase tracking-[.18em] text-[#6e6a60]">
              {PLAN_KIND_LABEL[document.kind]}
            </p>
            <h1 className="mt-1 font-serif text-[24pt] leading-[1.15]">{document.title}</h1>
            <p className="mt-1.5 text-[11pt] text-[#3a3832]">{document.property}</p>
          </div>
          <div className="shrink-0 border-2 border-[#222321] px-4 py-2 text-right">
            <p className="text-[8.5pt] uppercase tracking-[.1em] text-[#6e6a60]">Reference</p>
            <p className="font-mono text-[12pt] font-bold">{document.reference}</p>
            <p className="mt-1 text-[9pt] text-[#3a3832]">Version {document.version}</p>
          </div>
        </div>
        <p className="mt-3 inline-block border border-[#222321] px-2 py-1 text-[8.5pt] font-semibold uppercase tracking-[.08em]">
          {DOCUMENT_STATUS}
        </p>
      </header>

      <section className="mt-7">
        <h2 className="border-b-2 border-[#222321] pb-1 text-[11pt] font-bold uppercase tracking-[.1em]">
          What this document is
        </h2>
        <p className="mt-3 text-[10.5pt] leading-[1.55]">{document.summary}</p>
        <p className="mt-2.5 text-[10.5pt] leading-[1.55]">{document.scope}</p>
      </section>

      <section className="mt-7">
        <h2 className="border-b-2 border-[#222321] pb-1 text-[11pt] font-bold uppercase tracking-[.1em]">
          Document control
        </h2>
        <table className="mt-3 w-full border-collapse">
          <tbody>
            {[
              ['Department', document.department],
              ['Written by', [document.accountability.author, document.accountability.authorRole].filter(Boolean).join(' - ')],
              ['Owned by', document.accountability.owner],
              ['Issued', document.issued],
              ['Review by', document.reviewBy],
              ['Governance framework', document.governance.join('; ')],
            ].map(([label, value]) => (
              <tr key={label}>
                <th scope="row" className={`${head} w-[34%] text-left`}>{label}</th>
                <td className={cell}>{value || <span className="text-[#7e7a70]">To be completed</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {document.sections.map(section => <Section key={section.heading} section={section} />)}

      <section className="mt-7 break-inside-avoid">
        <h2 className="border-b-2 border-[#222321] pb-1 text-[11pt] font-bold uppercase tracking-[.1em]">
          Status of this document
        </h2>
        {disclaimersFor(document.kind).map(text => (
          <p key={text.slice(0, 40)} className="mt-3 text-[9.5pt] leading-[1.6] text-[#3a3832]">{text}</p>
        ))}
      </section>

      <footer className="mt-8 border-t border-[#c7bdae] pt-3 text-[8.5pt] text-[#6e6a60]">
        <p>{document.reference} &middot; Version {document.version} &middot; Issued {document.issued} &middot; Review by {document.reviewBy}</p>
        <p className="mt-0.5">{DOCUMENT_FOOTER}</p>
      </footer>
    </article>
  )
}
