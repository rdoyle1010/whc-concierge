import type { SopDocument } from '@/lib/documents/types'
import { DOCUMENT_FOOTER, DOCUMENT_STATUS, disclaimersFor } from '@/lib/documents/status'

// The document itself, on the page.
//
// Built to print. A spa director will read this on a screen once and then put
// it in a folder on a wall, so A4 is the design target and the screen is the
// preview: fixed page width, black on white, no colour that costs money in a
// laser printer, and every table able to break across a page without losing
// its heading.
//
// The control band at the top repeats what an assessor looks for first and
// what the original template did not carry: reference, version, issue date,
// review date, owner and approver. Author and owner are deliberately separate
// rows, because who wrote it and who is accountable for it are different
// questions and only one of them is asked in an audit.

const cell = 'border border-[#c9c9c9] px-3 py-2 align-top text-[10.5pt] leading-[1.45]'
const head = `${cell} bg-[#f2f2f2] font-semibold uppercase tracking-[.06em] text-[9pt]`

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid">
      <h2 className="border-b-2 border-[#1c1c1c] pb-1 text-[11pt] font-bold uppercase tracking-[.1em] text-[#1c1c1c]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Rule({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <th scope="row" className={`${head} w-[34%] text-left`}>{label}</th>
      <td className={cell}>{value || <span className="text-[#8a8a8a]">To be completed</span>}</td>
    </tr>
  )
}

/** An empty line somebody writes on. Never pre-filled: see status.ts. */
function Blank({ label, wide = false }: { label: string; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-[9pt] uppercase tracking-[.08em] text-[#6b6b6b]">{label}</p>
      <div className="mt-5 border-b border-[#1c1c1c]" />
    </div>
  )
}

export default function SopSheet({ document }: { document: SopDocument }) {
  const disclaimers = disclaimersFor(document.kind)

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white px-[14mm] py-[12mm] text-[#1c1c1c] print:max-w-none print:px-0 print:py-0">
      <header className="border-b-4 border-[#1c1c1c] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9pt] font-semibold uppercase tracking-[.18em] text-[#6b6b6b]">
              Standard Operating Procedure
            </p>
            <h1 className="mt-1 font-serif text-[24pt] leading-[1.15]">{document.title}</h1>
            <p className="mt-1.5 text-[11pt] text-[#3a3a3a]">{document.property}</p>
          </div>
          <div className="shrink-0 border-2 border-[#1c1c1c] px-4 py-2 text-right">
            <p className="text-[8.5pt] uppercase tracking-[.1em] text-[#6b6b6b]">Reference</p>
            <p className="font-mono text-[12pt] font-bold">{document.reference}</p>
            <p className="mt-1 text-[9pt] text-[#3a3a3a]">Version {document.version}</p>
          </div>
        </div>
        <p className="mt-3 inline-block border border-[#1c1c1c] px-2 py-1 text-[8.5pt] font-semibold uppercase tracking-[.08em]">
          {DOCUMENT_STATUS}
        </p>
      </header>

      <Section title="Document control">
        <table className="w-full border-collapse">
          <tbody>
            <Rule label="Department" value={document.department} />
            {document.operationalStage && <Rule label="Operational stage" value={document.operationalStage} />}
            <Rule label="Written by" value={[document.accountability.author, document.accountability.authorRole].filter(Boolean).join(' - ')} />
            <Rule label="Owned by" value={document.accountability.owner} />
            <Rule label="Approved by" value={document.accountability.approver} />
            <Rule label="Issued" value={document.issued} />
            <Rule label="Review by" value={document.reviewBy} />
            <Rule
              label="Governance framework"
              value={<ul className="space-y-0.5">{document.governance.map(line => <li key={line}>{line}</li>)}</ul>}
            />
          </tbody>
        </table>
      </Section>

      <Section title="Introduction">
        <table className="w-full border-collapse">
          <tbody>
            <Rule label="Purpose" value={document.purpose} />
            <Rule label="Scope" value={document.scope} />
            <Rule label="Why this matters" value={document.whyItMatters} />
            <Rule
              label="Equipment and systems"
              value={<ul className="space-y-0.5">{document.equipment.map(item => <li key={item}>{item}</li>)}</ul>}
            />
          </tbody>
        </table>
      </Section>

      <Section title="Responsible for">
        <table className="w-full border-collapse">
          <thead>
            <tr><th className={`${head} w-[30%] text-left`}>Role</th><th className={`${head} text-left`}>Responsibility</th></tr>
          </thead>
          <tbody>
            {document.responsibilities.map(row => (
              <tr key={row.role}><td className={`${cell} font-semibold`}>{row.role}</td><td className={cell}>{row.responsibility}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Procedure">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${head} w-[4%] text-left`}>#</th>
              <th className={`${head} w-[26%] text-left`}>Step</th>
              <th className={`${head} text-left`}>Action</th>
              <th className={`${head} w-[30%] text-left`}>Standard</th>
            </tr>
          </thead>
          <tbody>
            {document.steps.map((step, index) => (
              <tr key={step.name} className="break-inside-avoid">
                <td className={`${cell} text-center font-semibold`}>{index + 1}</td>
                <td className={`${cell} font-semibold`}>{step.name}</td>
                <td className={cell}>{step.action}</td>
                <td className={cell}>{step.standard}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="How this is measured">
        <ul className="space-y-1.5 text-[10.5pt]">
          {document.measuredBy.map(item => (
            <li key={item} className="flex gap-2"><span className="font-bold">-</span><span>{item}</span></li>
          ))}
        </ul>
      </Section>

      {document.commonFailures.length > 0 && (
        <Section title="Where this goes wrong">
          <ul className="space-y-1.5 text-[10.5pt]">
            {document.commonFailures.map(item => (
              <li key={item} className="flex gap-2"><span className="font-bold">-</span><span>{item}</span></li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Definitions">
        <table className="w-full border-collapse">
          <thead>
            <tr><th className={`${head} w-[30%] text-left`}>Term</th><th className={`${head} text-left`}>Definition</th></tr>
          </thead>
          <tbody>
            {document.definitions.map(row => (
              <tr key={row.term}><td className={`${cell} font-semibold`}>{row.term}</td><td className={cell}>{row.meaning}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      {document.references.length > 0 && (
        <Section title="References">
          <table className="w-full border-collapse">
            <thead>
              <tr><th className={`${head} text-left`}>Document</th><th className={`${head} w-[34%] text-left`}>Reference</th></tr>
            </thead>
            <tbody>
              {document.references.map(row => (
                <tr key={row.reference}><td className={cell}>{row.name}</td><td className={`${cell} font-mono`}>{row.reference}</td></tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <div className="break-before-page">
        <Section title="Learner knowledge check">
          <p className="text-[10pt] text-[#3a3a3a]">
            Verbal or written. The learner must be able to explain each of the following.
          </p>
          <table className="mt-3 w-full border-collapse">
            <tbody>
              {[
                'The purpose of this procedure',
                'When and why it must be followed exactly',
                'Who has authority to approve a deviation',
                'The risk of not following it',
              ].map(item => (
                <tr key={item}>
                  <td className={cell}>{item}</td>
                  <td className={`${cell} w-[22%] text-center`}>&#9744; Understood</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Practical check, observed">
          <p className="text-[10pt] text-[#3a3a3a]">The learner must demonstrate the following in real time.</p>
          <table className="mt-3 w-full border-collapse">
            <tbody>
              {[
                'Correct sequence of steps followed',
                'Every stated standard met',
                'Appropriate use of equipment and systems',
                'Safe, confident and professional execution',
              ].map(item => (
                <tr key={item}>
                  <td className={cell}>{item}</td>
                  <td className={`${cell} w-[22%] text-center`}>&#9744; Competent</td>
                  <td className={`${cell} w-[26%] text-center`}>&#9744; Further training</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Sign-off">
          <p className="text-[10pt] leading-relaxed text-[#3a3a3a]">
            I confirm that the learner has demonstrated both knowledge and practical competence in line with
            this procedure.
          </p>
          <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            <Blank label="Learner name" />
            <Blank label="Role" />
            <Blank label="Learner signature" />
            <Blank label="Date" />
            <Blank label="Trainer or manager name" />
            <Blank label="Role" />
            <Blank label="Trainer signature" />
            <Blank label="Date" />
          </div>
        </Section>

        <Section title="Revision history">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${head} w-[20%] text-left`}>Date</th>
                <th className={`${head} w-[26%] text-left`}>Revised by</th>
                <th className={`${head} text-left`}>Description</th>
              </tr>
            </thead>
            <tbody>
              {document.revisions.map(row => (
                <tr key={`${row.date}${row.description}`}>
                  <td className={cell}>{row.date}</td>
                  <td className={cell}>{row.by}</td>
                  <td className={cell}>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Status of this document">
          {disclaimers.map(text => (
            <p key={text.slice(0, 40)} className="mb-3 text-[9.5pt] leading-[1.6] text-[#3a3a3a]">{text}</p>
          ))}
        </Section>
      </div>

      <footer className="mt-8 border-t border-[#c9c9c9] pt-3 text-[8.5pt] text-[#6b6b6b]">
        <p>{document.reference} &middot; Version {document.version} &middot; Issued {document.issued} &middot; Review by {document.reviewBy}</p>
        <p className="mt-0.5">{DOCUMENT_FOOTER}</p>
      </footer>
    </article>
  )
}
