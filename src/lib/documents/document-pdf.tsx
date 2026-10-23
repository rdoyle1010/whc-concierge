import React from 'react'
import { Document, Page, Text, View, StyleSheet, TextInput, Font, renderToBuffer } from '@react-pdf/renderer'
import type { SopDocument } from './types'
import { DOCUMENT_FOOTER, DOCUMENT_STATUS, disclaimersFor } from './status'
import { placeholdersIn, type Placeholder } from './placeholders'

// The document as a PDF somebody can actually complete.
//
// Printing the web page gives a locked PDF full of square brackets, which is
// homework with no pencil: the buyer has free Adobe Reader, not Acrobat, and
// cannot type into it. So the PDF is generated rather than printed, and every
// bracket in the document becomes a real form field.
//
// The fields are gathered onto one page at the front rather than buried
// inline through seven pages of procedure. Two reasons, and the second is the
// commercial one:
//
//   1. A form field sitting inside a justified paragraph reflows badly, and a
//      procedure that looks broken does not get bought.
//   2. Page one then answers the question a spa director actually has, which
//      is "what do I need to know before this is usable here". That is a
//      briefing sheet, not a chore.
//
// Fields sharing a name share a value in a PDF form, so [property name] typed
// once fills the header, the control table and every mention in the text.

// Words break at spaces or not at all. The default hyphenator produced
// "re-ceptionist" and "sig-natures" mid-table, which reads as a typesetting
// accident on a document somebody is paying for.
Font.registerHyphenationCallback(word => [word])

const INK = '#1c1c1c'
const MUTED = '#5a5a5a'
const FAINT = '#8a8a8a'
const RULE = '#c9c9c9'
const FIELD = '#f4f6f8'

const styles = StyleSheet.create({
  page: {
    paddingTop: 44, paddingBottom: 54, paddingHorizontal: 44,
    fontFamily: 'Helvetica', fontSize: 9, lineHeight: 1.45, color: INK,
  },

  eyebrow: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, letterSpacing: 1.6, color: MUTED, textTransform: 'uppercase' },
  title: { fontFamily: 'Times-Bold', fontSize: 19, lineHeight: 1.15, marginTop: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  headerLeft: { flex: 1 },
  refBox: { borderWidth: 1.2, borderColor: INK, paddingHorizontal: 9, paddingVertical: 5, minWidth: 148 },
  refLabel: { fontSize: 6.5, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase', textAlign: 'right' },
  refValue: { fontFamily: 'Courier-Bold', fontSize: 9.5, textAlign: 'right', marginTop: 2 },
  refVersion: { fontSize: 7.5, color: MUTED, textAlign: 'right', marginTop: 2 },
  headerRule: { borderBottomWidth: 2.5, borderBottomColor: INK, marginTop: 10 },
  statusBadge: {
    alignSelf: 'flex-start', borderWidth: 0.75, borderColor: INK,
    paddingHorizontal: 5, paddingVertical: 2.5, marginTop: 9,
    fontFamily: 'Helvetica-Bold', fontSize: 6.5, letterSpacing: 0.8, textTransform: 'uppercase',
  },

  sectionHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 8.5, letterSpacing: 1.3, textTransform: 'uppercase',
    borderBottomWidth: 1.5, borderBottomColor: INK, paddingBottom: 3, marginBottom: 8,
  },
  section: { marginTop: 18 },

  table: { borderWidth: 0.5, borderColor: RULE, borderBottomWidth: 0 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RULE },
  th: {
    fontFamily: 'Helvetica-Bold', fontSize: 6.8, letterSpacing: 0.7, textTransform: 'uppercase',
    backgroundColor: '#f2f2f2', paddingHorizontal: 6, paddingVertical: 5,
  },
  td: { paddingHorizontal: 6, paddingVertical: 5 },
  tdBold: { fontFamily: 'Helvetica-Bold' },
  cellDivider: { borderLeftWidth: 0.5, borderLeftColor: RULE },

  bulletRow: { flexDirection: 'row', marginBottom: 3 },
  bulletMark: { width: 11, fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1 },

  // The completion page.
  completeIntro: { fontSize: 9, color: MUTED, marginBottom: 12, lineHeight: 1.5 },
  fieldLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldWhere: { fontSize: 6.8, color: FAINT, marginTop: 1.5 },
  input: {
    height: 17, backgroundColor: FIELD, borderWidth: 0.5, borderColor: '#9aa5b1',
    fontSize: 9, paddingHorizontal: 4,
  },
  inputTall: {
    height: 34, backgroundColor: FIELD, borderWidth: 0.5, borderColor: '#9aa5b1',
    fontSize: 9, paddingHorizontal: 4, paddingTop: 3,
  },

  signRow: { flexDirection: 'row', gap: 18, marginTop: 14 },
  signCol: { flex: 1 },
  signLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.7, color: MUTED, marginBottom: 3 },
  signLine: { borderBottomWidth: 0.75, borderBottomColor: INK, height: 22 },

  note: { fontSize: 8.5, color: MUTED, lineHeight: 1.55, marginBottom: 7 },

  tickCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  tickBox: { width: 8, height: 8, borderWidth: 0.75, borderColor: INK },

  footer: {
    position: 'absolute', bottom: 26, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: RULE, paddingTop: 6,
    fontSize: 6.8, color: FAINT,
  },
})

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHead} minPresenceAhead={48}>{title}</Text>
      {children}
    </View>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${index}-${item.slice(0, 24)}`} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>-</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

/** A label and value pair, as a bordered row. */
function Rule({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tr} wrap={false}>
      <Text style={[styles.th, { width: '30%' }]}>{label}</Text>
      <Text style={[styles.td, styles.cellDivider, { flex: 1 }]}>{value || 'To be completed'}</Text>
    </View>
  )
}

/**
 * The page that turns a locked template into something completable.
 *
 * One row per distinct thing the document needs the property to state, with a
 * field beside it. Nothing here is guessed: a muster point, an escalation
 * time or a duty manager for a building nobody has walked round is exactly
 * the invention this whole library refuses to make.
 */
function Footer({ document }: { document: SopDocument }) {
  // No page number, deliberately.
  //
  // A dynamic Text renders nothing in this composition: the render callback
  // is called for every page and arrives without totalPages, and its output
  // never reaches the paint. It works in isolation, so this is a limitation
  // of a Document built from several Page elements rather than a mistake to
  // find and correct, and a footer that prints "Page 1 of undefined" on a
  // document a property files is worse than one that prints neither.
  //
  // What an assessor actually needs on a sheet that has come loose is the
  // reference, the version and the review date, and those are static.
  return (
    <View style={styles.footer} fixed>
      <Text>
        {document.reference} · Version {document.version} · Issued {document.issued} · Review by {document.reviewBy}
      </Text>
      <Text style={{ marginTop: 2 }}>{DOCUMENT_FOOTER}</Text>
    </View>
  )
}

function CompletionPage({ blanks, document }: { blanks: Placeholder[]; document: SopDocument }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.eyebrow}>Before this document is used</Text>
      <Text style={styles.title}>Your property details</Text>
      <View style={styles.headerRule} />

      <Text style={[styles.completeIntro, { marginTop: 12 }]}>
        The procedure that follows is complete except for the facts that belong to your building, which appear in
        square brackets in the text. Type each one below and it fills in everywhere it is used. You can do this in
        the free Adobe Reader: click a box, type, then save. Nothing needs to be bought and nothing needs to be
        sent back to us.
      </Text>
      <Text style={[styles.completeIntro, { marginTop: -4 }]}>
        Where an entry concerns life safety, an evacuation route, a muster point, a plant room, or the person
        holding a qualification, it must be completed by somebody who knows the premises, checked against the
        building, and signed off before the document is issued to anyone.
      </Text>

      <View style={{ marginTop: 6 }}>
        {blanks.map(blank => (
          <View key={blank.name} style={{ marginBottom: 11 }} wrap={false}>
            <Text style={styles.fieldLabel}>{blank.label}</Text>
            <Text style={styles.fieldWhere}>
              {blank.count === 1 ? 'Appears once in this document' : `Appears ${blank.count} times in this document`}
            </Text>
            <View style={{ marginTop: 3 }}>
              <TextInput name={blank.name} style={styles.input} fontSize={9} />
            </View>
          </View>
        ))}
      </View>

      <Footer document={document} />
    </Page>
  )
}

export type PdfDocumentRow = {
  reference: string
  title: string
  version?: string | null
  department?: string | null
  kind?: string | null
}

export function SopPdf({ document }: { document: SopDocument }) {
  const blanks = placeholdersIn(document)
  const disclaimers = disclaimersFor(document.kind)

  return (
    <Document
      title={`${document.reference} ${document.title}`}
      author="Talent House Collective"
      subject={document.department || 'Spa operations'}
    >
      {blanks.length > 0 && <CompletionPage blanks={blanks} document={document} />}

      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>Standard Operating Procedure</Text>
            <Text style={styles.title}>{document.title}</Text>
            <View style={{ marginTop: 6, width: '92%' }}>
              {/* The property, as a field rather than a bracket. It is the
                  one entry every single document needs and the one a buyer
                  notices first. */}
              <TextInput name="f_property_name" style={styles.input} fontSize={9} />
              <Text style={styles.fieldWhere}>Property</Text>
            </View>
          </View>
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Reference</Text>
            <Text style={styles.refValue}>{document.reference}</Text>
            <Text style={styles.refVersion}>Version {document.version}</Text>
          </View>
        </View>
        <View style={styles.headerRule} />
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flexDirection: 'row' }}>
          <Text style={styles.statusBadge}>{DOCUMENT_STATUS}</Text>
        </View>
        </View>

        <Section title="Document control">
          <View style={styles.table}>
            <Rule label="Department" value={document.department} />
            {document.operationalStage ? <Rule label="Operational stage" value={document.operationalStage} /> : null}
            <Rule
              label="Written by"
              value={[document.accountability.author, document.accountability.authorRole].filter(Boolean).join(' - ')}
            />
            {/* Owner and approver are theirs to write in. A pre-filled
                approver is a lie that looks tidy. */}
            <View style={styles.tr} wrap={false}>
              <Text style={[styles.th, { width: '30%' }]}>Owned by</Text>
              <View style={[styles.td, styles.cellDivider, { flex: 1 }]}>
                <TextInput name="f_owner_role" style={styles.input} fontSize={9} />
              </View>
            </View>
            <View style={styles.tr} wrap={false}>
              <Text style={[styles.th, { width: '30%' }]}>Approved by</Text>
              <View style={[styles.td, styles.cellDivider, { flex: 1 }]}>
                <TextInput name="f_approved_by" style={styles.input} fontSize={9} />
              </View>
            </View>
            <Rule label="Issued" value={document.issued} />
            <Rule label="Review by" value={document.reviewBy} />
            <Rule label="Governance framework" value={document.governance.join('; ')} />
          </View>
        </Section>

        <Section title="Introduction">
          <View style={styles.table}>
            <Rule label="Purpose" value={document.purpose} />
            <Rule label="Scope" value={document.scope} />
            <Rule label="Why this matters" value={document.whyItMatters} />
            <View style={styles.tr} wrap={false}>
              <Text style={[styles.th, { width: '30%' }]}>Equipment and systems</Text>
              <View style={[styles.td, styles.cellDivider, { flex: 1 }]}>
                <Bullets items={document.equipment} />
              </View>
            </View>
          </View>
        </Section>

        <Section title="Responsible for">
          <View style={styles.table}>
            <View style={styles.tr} wrap={false}>
              <Text style={[styles.th, { width: '28%' }]}>Role</Text>
              <Text style={[styles.th, styles.cellDivider, { flex: 1 }]}>Responsibility</Text>
            </View>
            {document.responsibilities.map(row => (
              <View key={row.role} style={styles.tr}>
                <Text style={[styles.td, styles.tdBold, { width: '28%' }]}>{row.role}</Text>
                <Text style={[styles.td, styles.cellDivider, { flex: 1 }]}>{row.responsibility}</Text>
              </View>
            ))}
          </View>
        </Section>

        <View style={styles.section}>
          <Text style={styles.sectionHead}>Procedure</Text>
          <View style={styles.table}>
            <View style={styles.tr} fixed wrap={false}>
              <Text style={[styles.th, { width: '5%' }]}>#</Text>
              <Text style={[styles.th, styles.cellDivider, { width: '22%' }]}>Step</Text>
              <Text style={[styles.th, styles.cellDivider, { flex: 1 }]}>Action</Text>
              <Text style={[styles.th, styles.cellDivider, { width: '30%' }]}>Standard</Text>
            </View>
            {document.steps.map((step, index) => (
              <View key={step.name} style={styles.tr} wrap={false}>
                <Text style={[styles.td, styles.tdBold, { width: '5%', textAlign: 'center' }]}>{index + 1}</Text>
                <Text style={[styles.td, styles.tdBold, styles.cellDivider, { width: '22%' }]}>{step.name}</Text>
                <Text style={[styles.td, styles.cellDivider, { flex: 1 }]}>{step.action}</Text>
                <Text style={[styles.td, styles.cellDivider, { width: '30%' }]}>{step.standard}</Text>
              </View>
            ))}
          </View>
        </View>

        <Section title="How this is measured">
          <Bullets items={document.measuredBy} />
        </Section>

        {document.commonFailures.length > 0 && (
          <Section title="Where this goes wrong">
            <Bullets items={document.commonFailures} />
          </Section>
        )}

        {document.definitions.length > 0 && (
          <Section title="Definitions">
            <View style={styles.table}>
              {document.definitions.map(row => (
                <View key={row.term} style={styles.tr}>
                  <Text style={[styles.td, styles.tdBold, { width: '28%' }]}>{row.term}</Text>
                  <Text style={[styles.td, styles.cellDivider, { flex: 1 }]}>{row.meaning}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {document.references.length > 0 && (
          <Section title="References">
            <View style={styles.table}>
              {document.references.map(row => (
                <View key={row.reference} style={styles.tr}>
                  <Text style={[styles.td, { flex: 1 }]}>{row.name}</Text>
                  <Text style={[styles.td, styles.cellDivider, { width: '34%', fontFamily: 'Courier' }]}>{row.reference}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <Footer document={document} />
      </Page>

      {/* The training record, on its own page, because it is filled in with a
          learner in front of you and gets photocopied on its own. */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>{document.reference}</Text>
        <Text style={styles.title}>Competency sign-off</Text>
        <View style={styles.headerRule} />

        <Section title="Learner knowledge check">
          <Text style={[styles.note, { marginBottom: 8 }]}>
            Verbal or written. The learner must be able to explain each of the following.
          </Text>
          <View style={styles.table}>
            {[
              'The purpose of this procedure',
              'When and why it must be followed exactly',
              'Who has authority to approve a deviation',
              'The risk of not following it',
            ].map(item => (
              <View key={item} style={styles.tr}>
                <Text style={[styles.td, { flex: 1 }]}>{item}</Text>
                <View style={[styles.td, styles.cellDivider, styles.tickCell, { width: '22%' }]}>
                  <View style={styles.tickBox} />
                  <Text>Understood</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Practical check, observed">
          <Text style={[styles.note, { marginBottom: 8 }]}>The learner must demonstrate the following in real time.</Text>
          <View style={styles.table}>
            {[
              'Correct sequence of steps followed',
              'Every stated standard met',
              'Appropriate use of equipment and systems',
              'Safe, confident and professional execution',
            ].map(item => (
              <View key={item} style={styles.tr}>
                <Text style={[styles.td, { flex: 1 }]}>{item}</Text>
                <View style={[styles.td, styles.cellDivider, styles.tickCell, { width: '22%' }]}>
                  <View style={styles.tickBox} />
                  <Text>Competent</Text>
                </View>
                <View style={[styles.td, styles.cellDivider, styles.tickCell, { width: '26%' }]}>
                  <View style={styles.tickBox} />
                  <Text>Further training</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Sign-off">
          <Text style={styles.note}>
            I confirm that the learner has demonstrated both knowledge and practical competence in line with this
            procedure.
          </Text>
          {/* Names and dates are typed. Signatures are not: a signature block
              that can be filled from a keyboard is worth nothing to anybody
              asking who signed this. */}
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Learner name</Text>
              <TextInput name="f_learner_name" style={styles.input} fontSize={9} />
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Role</Text>
              <TextInput name="f_learner_role" style={styles.input} fontSize={9} />
            </View>
          </View>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Learner signature</Text>
              <View style={styles.signLine} />
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Date</Text>
              <View style={styles.signLine} />
            </View>
          </View>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Trainer or manager name</Text>
              <TextInput name="f_trainer_name" style={styles.input} fontSize={9} />
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Role</Text>
              <TextInput name="f_trainer_role" style={styles.input} fontSize={9} />
            </View>
          </View>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Trainer signature</Text>
              <View style={styles.signLine} />
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Date</Text>
              <View style={styles.signLine} />
            </View>
          </View>
        </Section>

        <Section title="Revision history">
          <View style={styles.table}>
            <View style={styles.tr} wrap={false}>
              <Text style={[styles.th, { width: '20%' }]}>Date</Text>
              <Text style={[styles.th, styles.cellDivider, { width: '26%' }]}>Revised by</Text>
              <Text style={[styles.th, styles.cellDivider, { flex: 1 }]}>Description</Text>
            </View>
            {document.revisions.map(row => (
              <View key={`${row.date}${row.description}`} style={styles.tr}>
                <Text style={[styles.td, { width: '20%' }]}>{row.date}</Text>
                <Text style={[styles.td, styles.cellDivider, { width: '26%' }]}>{row.by}</Text>
                <Text style={[styles.td, styles.cellDivider, { flex: 1 }]}>{row.description}</Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Status of this document">
          {disclaimers.map(text => (
            <Text key={text.slice(0, 40)} style={styles.note}>{text}</Text>
          ))}
        </Section>

        <Footer document={document} />
      </Page>
    </Document>
  )
}

/** The finished file. */
export function renderDocumentPdf(document: SopDocument): Promise<Buffer> {
  return renderToBuffer(<SopPdf document={document} />)
}
