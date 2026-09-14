import React from 'react'
import { Document, Page, Text, View, StyleSheet, TextInput, Font, renderToBuffer } from '@react-pdf/renderer'
import type { PlanDocument, PlanSection, Fact, Hazard } from './plan-types'
import { PLAN_KIND_LABEL, partsOf } from './plan-types'
import { DOCUMENT_FOOTER, DOCUMENT_STATUS } from './status'
import { splitPlaceholders, fieldName } from './placeholders'

// A plan as a form somebody completes.
//
// The difference from the procedure renderer is the proportion. A drafted SOP
// is mostly text with a few blanks; a Normal Operating Procedure is mostly
// blanks, because the length of a pool, the bather load and the position of
// the emergency stop are the document. So every fact is a form field by
// default, rather than a bracket that happens to become one.
//
// The Emergency Action Plan prints one emergency per page. Somebody reading
// it has wet hands and roughly ten seconds, and turning a sheet over to find
// the rest of a rescue is a design decision with consequences.

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
  refBox: { borderWidth: 1.2, borderColor: INK, paddingHorizontal: 9, paddingVertical: 5, minWidth: 150 },
  refLabel: { fontSize: 6.5, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase', textAlign: 'right' },
  refValue: { fontFamily: 'Courier-Bold', fontSize: 9, textAlign: 'right', marginTop: 2 },
  refVersion: { fontSize: 7.5, color: MUTED, textAlign: 'right', marginTop: 2 },
  headerRule: { borderBottomWidth: 2.5, borderBottomColor: INK, marginTop: 10 },
  statusBadge: {
    borderWidth: 0.75, borderColor: INK, paddingHorizontal: 5, paddingVertical: 2.5,
    fontFamily: 'Helvetica-Bold', fontSize: 6.5, letterSpacing: 0.8, textTransform: 'uppercase',
  },

  section: { marginTop: 18 },
  sectionHead: {
    fontFamily: 'Helvetica-Bold', fontSize: 8.5, letterSpacing: 1.3, textTransform: 'uppercase',
    borderBottomWidth: 1.5, borderBottomColor: INK, paddingBottom: 3, marginBottom: 8,
  },
  intro: { fontSize: 8.5, color: MUTED, lineHeight: 1.55, marginBottom: 10 },
  para: { marginBottom: 6 },

  // The band on a section a competent person has to complete against the
  // building. It is the difference between a form and a liability.
  checkBand: {
    borderLeftWidth: 2.5, borderLeftColor: INK, paddingLeft: 9, paddingVertical: 5, marginBottom: 10,
    fontSize: 8, color: INK, lineHeight: 1.5,
  },

  factRow: { marginBottom: 9 },
  factLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 0.5 },
  factHint: { fontSize: 6.8, color: FAINT, marginTop: 1.5, lineHeight: 1.4 },
  input: { height: 16, backgroundColor: FIELD, borderWidth: 0.5, borderColor: '#9aa5b1', fontSize: 9, paddingHorizontal: 4, marginTop: 3 },
  inputTall: { height: 32, backgroundColor: FIELD, borderWidth: 0.5, borderColor: '#9aa5b1', fontSize: 9, paddingHorizontal: 4, paddingTop: 3, marginTop: 3 },
  stated: { borderWidth: 0.5, borderColor: RULE, paddingHorizontal: 5, paddingVertical: 4, marginTop: 3 },

  table: { borderWidth: 0.5, borderColor: RULE, borderBottomWidth: 0 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RULE },
  th: {
    fontFamily: 'Helvetica-Bold', fontSize: 6.5, letterSpacing: 0.6, textTransform: 'uppercase',
    backgroundColor: '#f2f2f2', paddingHorizontal: 5, paddingVertical: 5,
  },
  td: { paddingHorizontal: 5, paddingVertical: 5 },
  cellDivider: { borderLeftWidth: 0.5, borderLeftColor: RULE },
  cellInput: { height: 15, backgroundColor: FIELD, fontSize: 8, paddingHorizontal: 3 },

  actionRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 6 },
  actionNum: { width: 18, fontFamily: 'Helvetica-Bold', fontSize: 10 },
  actionBody: { flex: 1, paddingRight: 8 },
  actionName: { fontFamily: 'Helvetica-Bold', fontSize: 9.5, marginBottom: 2 },
  actionBy: { width: 106 },
  actionByLabel: { fontSize: 6.2, letterSpacing: 0.6, color: FAINT, textTransform: 'uppercase' },

  bulletRow: { flexDirection: 'row', marginBottom: 3 },
  bulletMark: { width: 11, fontFamily: 'Helvetica-Bold' },
  bulletText: { flex: 1 },

  note: { fontSize: 8.5, color: MUTED, lineHeight: 1.55, marginBottom: 7 },

  partDivider: {
    marginTop: 22, marginBottom: 4, borderTopWidth: 2.5, borderTopColor: INK, paddingTop: 7,
  },
  partLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, letterSpacing: 1.8, color: MUTED, textTransform: 'uppercase' },
  partName: { fontFamily: 'Times-Bold', fontSize: 15, marginTop: 2 },

  contentsPart: { fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 12, marginBottom: 4 },
  contentsRow: { flexDirection: 'row', marginBottom: 2.5 },
  contentsDash: { width: 12, color: FAINT },
  contentsText: { flex: 1, fontSize: 9 },

  legalRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 5 },
  legalName: { width: '38%', fontFamily: 'Helvetica-Bold', fontSize: 8.5, paddingRight: 8 },
  legalCovers: { flex: 1, fontSize: 8.5 },

  hazard: { borderWidth: 0.75, borderColor: INK, marginBottom: 12 },
  hazardHead: { backgroundColor: '#f2f2f2', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: RULE },
  hazardRef: { fontSize: 6.5, letterSpacing: 1, color: MUTED, textTransform: 'uppercase' },
  hazardName: { fontFamily: 'Helvetica-Bold', fontSize: 10.5, marginTop: 1 },
  hazardBody: { paddingHorizontal: 8, paddingVertical: 7 },
  hazardLabel: { fontFamily: 'Helvetica-Bold', fontSize: 6.8, letterSpacing: 0.7, textTransform: 'uppercase', color: MUTED, marginBottom: 3 },
  tickLine: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3.5 },
  tickBox: { width: 8, height: 8, borderWidth: 0.75, borderColor: INK, marginRight: 6, marginTop: 1.5 },
  tickText: { flex: 1, fontSize: 8.5, lineHeight: 1.4 },
  scoreRow: { flexDirection: 'row', gap: 7, marginTop: 8 },
  scoreCell: { flex: 1 },
  scoreLabel: { fontSize: 6.2, letterSpacing: 0.5, textTransform: 'uppercase', color: MUTED, marginBottom: 2 },
  scoreInput: { height: 16, backgroundColor: FIELD, borderWidth: 0.5, borderColor: '#9aa5b1', fontSize: 9, paddingHorizontal: 4, textAlign: 'center' },
  signRow: { flexDirection: 'row', gap: 18, marginTop: 14 },
  signCol: { flex: 1 },
  signLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.7, color: MUTED, marginBottom: 3 },
  signLine: { borderBottomWidth: 0.75, borderBottomColor: INK, height: 22 },

  footer: {
    position: 'absolute', bottom: 26, left: 44, right: 44,
    borderTopWidth: 0.5, borderTopColor: RULE, paddingTop: 6, fontSize: 6.8, color: FAINT,
  },
})

function Footer({ document }: { document: PlanDocument }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        {document.reference} · Version {document.version} · Issued {document.issued} · Review by {document.reviewBy}
      </Text>
      <Text style={{ marginTop: 2 }}>{DOCUMENT_FOOTER}</Text>
    </View>
  )
}

/** Prose with its brackets turned into fields, inline where they fit. */
function Prose({ text, style }: { text: string; style?: any }) {
  const segments = splitPlaceholders(text)
  if (segments.every(segment => segment.kind === 'text')) {
    return <Text style={style}>{text}</Text>
  }
  return (
    <View>
      <Text style={style}>{segments.map(segment => segment.kind === 'text' ? segment.text : `[${segment.label}]`).join('')}</Text>
      {segments.filter(segment => segment.kind === 'field').map(segment => (
        <View key={(segment as any).name} style={{ marginTop: 3 }}>
          <Text style={styles.factLabel}>{(segment as any).label}</Text>
          <TextInput name={(segment as any).name} style={styles.input} fontSize={9} />
        </View>
      ))}
    </View>
  )
}

function FactRow({ fact, index }: { fact: Fact; index: string }) {
  return (
    <View style={styles.factRow} wrap={false}>
      <Text style={styles.factLabel}>{fact.label}</Text>
      {fact.hint ? <Text style={styles.factHint}>{fact.hint}</Text> : null}
      {fact.value ? (
        <Text style={styles.stated}>{fact.value}</Text>
      ) : (
        <TextInput name={`${fieldName(fact.label)}_${index}`} style={fact.long ? styles.inputTall : styles.input} fontSize={9} multiline={fact.long} />
      )}
    </View>
  )
}

/**
 * One hazard, as the block a competent person completes.
 *
 * Everything printed is general and holds in any spa. Everything blank is a
 * judgement about one building: a pre-scored risk assessment is a property
 * filing somebody else's opinion of its own premises, signed by somebody who
 * only read it.
 *
 * The controls are tick boxes rather than statements, because printing "non
 * slip flooring in place" on a document for a spa nobody has visited asserts
 * something that may not be true, and the assertion is what gets relied on.
 */
function HazardBlock({ hazard, index, keyBase }: { hazard: Hazard; index: number; keyBase: string }) {
  return (
    <View style={styles.hazard} wrap={false}>
      <View style={styles.hazardHead}>
        <Text style={styles.hazardRef}>Hazard {index + 1}</Text>
        <Text style={styles.hazardName}>{hazard.hazard}</Text>
      </View>
      <View style={styles.hazardBody}>
        <Text style={styles.hazardLabel}>Who is at risk</Text>
        <Text style={{ fontSize: 8.5, marginBottom: 8 }}>{hazard.whoIsAtRisk}</Text>

        <Text style={styles.hazardLabel}>Controls: tick each one you have seen in place</Text>
        {hazard.controlsToVerify.map((control, controlIndex) => (
          <View key={`${keyBase}-c${controlIndex}`} style={styles.tickLine}>
            <View style={styles.tickBox} />
            <Text style={styles.tickText}>{control}</Text>
          </View>
        ))}

        {hazard.note ? <Text style={[styles.note, { marginTop: 6, marginBottom: 0 }]}>{hazard.note}</Text> : null}

        <View style={styles.scoreRow}>
          {[['Likelihood 1-5', 'l'], ['Severity 1-5', 's'], ['Score L x S', 'score'], ['Risk level', 'level']].map(([label, suffix]) => (
            <View key={suffix} style={styles.scoreCell}>
              <Text style={styles.scoreLabel}>{label}</Text>
              <TextInput name={`${keyBase}_${suffix}`} style={styles.scoreInput} fontSize={9} />
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.scoreLabel}>Further controls required</Text>
          <TextInput name={`${keyBase}_further`} style={styles.inputTall} fontSize={9} multiline />
        </View>

        <View style={styles.scoreRow}>
          <View style={{ flex: 2 }}>
            <Text style={styles.scoreLabel}>Responsible person</Text>
            <TextInput name={`${keyBase}_owner`} style={styles.input} fontSize={9} />
          </View>
          <View style={styles.scoreCell}>
            <Text style={styles.scoreLabel}>Target date</Text>
            <TextInput name={`${keyBase}_target`} style={styles.input} fontSize={9} />
          </View>
          <View style={styles.scoreCell}>
            <Text style={styles.scoreLabel}>Residual level</Text>
            <TextInput name={`${keyBase}_residual`} style={styles.scoreInput} fontSize={9} />
          </View>
        </View>
      </View>
    </View>
  )
}

function SectionBody({ section, keyBase }: { section: PlanSection; keyBase: string }) {
  return (
    <View>
      {section.intro ? <Text style={styles.intro}>{section.intro}</Text> : null}

      {section.mustBeChecked ? (
        <Text style={styles.checkBand}>
          This section must be completed by a person who knows these premises, checked against the building, and
          signed off before this document is issued to anybody. Nothing here may be answered from memory or copied
          from another property.
        </Text>
      ) : null}

      {section.paragraphs?.map((paragraph, index) => (
        <Prose key={`${keyBase}-p${index}`} text={paragraph} style={styles.para} />
      ))}

      {section.bullets?.length ? (
        <View style={{ marginBottom: 6 }}>
          {section.bullets.map((bullet, index) => (
            <View key={`${keyBase}-b${index}`} style={styles.bulletRow}>
              <Text style={styles.bulletMark}>-</Text>
              <View style={styles.bulletText}><Prose text={bullet} /></View>
            </View>
          ))}
        </View>
      ) : null}

      {section.facts?.length ? (
        <View>
          {section.facts.map((fact, index) => (
            <FactRow key={`${keyBase}-f${index}`} fact={fact} index={`${keyBase}_${index}`} />
          ))}
        </View>
      ) : null}

      {section.actions?.length ? (
        <View>
          {section.actions.map((action, index) => (
            <View key={`${keyBase}-a${index}`} style={styles.actionRow} wrap={false}>
              <Text style={styles.actionNum}>{index + 1}</Text>
              <View style={styles.actionBody}>
                <Text style={styles.actionName}>{action.name}</Text>
                <Prose text={action.action} />
              </View>
              <View style={styles.actionBy}>
                <Text style={styles.actionByLabel}>Done by</Text>
                {/* Blank by default. Which role does what in a rescue is a
                    decision about one team and one rota, and a printed answer
                    is one nobody has agreed to. */}
                {action.by
                  ? <Text style={styles.stated}>{action.by}</Text>
                  : <TextInput name={`${keyBase}_by_${index}`} style={styles.input} fontSize={8} />}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {section.hazards?.length ? (
        <View>
          {section.hazards.map((hazard, index) => (
            <HazardBlock key={`${keyBase}-h${index}`} hazard={hazard} index={index} keyBase={`${keyBase}_h${index}`} />
          ))}
        </View>
      ) : null}

      {section.table ? (
        <View style={styles.table}>
          <View style={styles.tr} fixed wrap={false}>
            {section.table.columns.map((column, index) => (
              <Text key={column || `c${index}`}
                style={[styles.th, index === 0 ? { flex: 1.4 } : { flex: 1 }, index ? styles.cellDivider : {}]}>
                {column}
              </Text>
            ))}
          </View>
          {section.table.rows.map((row, rowIndex) => (
            <View key={`${keyBase}-r${rowIndex}`} style={styles.tr} wrap={false}>
              {section.table!.columns.map((column, columnIndex) => (
                <View key={`${keyBase}-r${rowIndex}c${columnIndex}`}
                  style={[styles.td, columnIndex === 0 ? { flex: 1.4 } : { flex: 1 }, columnIndex ? styles.cellDivider : {}]}>
                  {row[columnIndex] ? (
                    <Text style={{ fontSize: 8 }}>{row[columnIndex]}</Text>
                  ) : section.table!.fillable ? (
                    <TextInput name={`${keyBase}_r${rowIndex}c${columnIndex}`} style={styles.cellInput} fontSize={8} />
                  ) : <Text> </Text>}
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

export function PlanPdf({ document }: { document: PlanDocument }) {
  const label = PLAN_KIND_LABEL[document.kind]
  // An Emergency Action Plan prints one emergency per page. Somebody reading
  // it has wet hands and about ten seconds, and turning a sheet over to find
  // the rest of a rescue is a design decision with consequences.
  // Grouped in document order, not sorted into inline and own-page.
  //
  // Filtering the two apart put Parts I and J in front of Parts B to H,
  // because every own-page section was emitted after every inline one. A plan
  // whose contents page and whose actual order disagree is worse than one
  // with no contents page: somebody looks for the fire pages where the
  // listing says they are and finds the drill records.
  const groups: { own: boolean; sections: PlanSection[] }[] = []
  for (const section of document.sections) {
    const own = Boolean(section.ownPage)
    const last = groups[groups.length - 1]
    if (!own && last && !last.own) last.sections.push(section)
    else groups.push({ own, sections: [section] })
  }
  const parts = partsOf(document)

  return (
    <Document
      title={`${document.reference} ${document.title}`}
      author="Talent House Collective"
      subject={document.department || 'Spa operations'}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>{label}</Text>
            <Text style={styles.title}>{document.title}</Text>
            <View style={{ marginTop: 6, width: '92%' }}>
              <TextInput name="f_property_name" style={styles.input} fontSize={9} />
              <Text style={styles.factHint}>Property</Text>
            </View>
          </View>
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Reference</Text>
            <Text style={styles.refValue}>{document.reference}</Text>
            <Text style={styles.refVersion}>Version {document.version}</Text>
          </View>
        </View>
        <View style={styles.headerRule} />
        <View style={{ flexDirection: 'row', marginTop: 9 }}>
          <Text style={styles.statusBadge}>{DOCUMENT_STATUS}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHead}>What this document is</Text>
          <Text style={styles.para}>{document.summary}</Text>
          <Text style={styles.para}>{document.scope}</Text>
        </View>

        {document.legalFramework?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionHead}>The framework this is written to</Text>
            {/* Named plainly, because an assessor expects to see it and a
                document that dances around it reads as evasive. What is never
                done is citing a section number or telling a property what the
                law requires of them. */}
            <Text style={styles.intro}>
              Written to practice in the United Kingdom. If this property is outside the United Kingdom, or is
              subject to requirements of its own, the equivalent framework applies and this document must be
              checked against it before use. Nothing here is legal advice, and none of it discharges a duty the
              property owes.
            </Text>
            <View>
              {document.legalFramework.map(entry => (
                <View key={entry.name} style={styles.legalRow} wrap={false}>
                  <Text style={styles.legalName}>{entry.name}</Text>
                  <Text style={styles.legalCovers}>{entry.covers}</Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: 10 }}>
              <Text style={styles.factLabel}>Jurisdiction this property operates in</Text>
              <TextInput name="f_jurisdiction" style={styles.input} fontSize={9} />
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.factLabel}>Local authority, and the officer or team the property deals with</Text>
              <TextInput name="f_local_authority" style={styles.input} fontSize={9} />
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={styles.factLabel}>Any additional requirement that applies here</Text>
              <Text style={styles.factHint}>
                Licensing conditions, a brand standard, an insurer requirement, or a local by-law.
              </Text>
              <TextInput name="f_additional_requirements" style={styles.inputTall} fontSize={9} multiline />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionHead}>Document control</Text>
          <View style={styles.table}>
            {[
              ['Department', document.department],
              ['Written by', [document.accountability.author, document.accountability.authorRole].filter(Boolean).join(' - ')],
              ['Issued', document.issued],
              ['Review by', document.reviewBy],
            ].map(([rowLabel, value]) => (
              <View key={rowLabel} style={styles.tr} wrap={false}>
                <Text style={[styles.th, { width: '32%' }]}>{rowLabel}</Text>
                <Text style={[styles.td, styles.cellDivider, { flex: 1 }]}>{value || 'To be completed'}</Text>
              </View>
            ))}
            {[
              ['Owned by', 'f_owner_role'],
              ['Approved by', 'f_approved_by'],
              ['Date of approval', 'f_approved_on'],
            ].map(([rowLabel, name]) => (
              <View key={name} style={styles.tr} wrap={false}>
                <Text style={[styles.th, { width: '32%' }]}>{rowLabel}</Text>
                <View style={[styles.td, styles.cellDivider, { flex: 1 }]}>
                  <TextInput name={name} style={styles.input} fontSize={9} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* A contents page, once a document is long enough to need one. A
            hundred pages with a flat list of sixty headings is a hundred
            pages nobody navigates. */}
        {parts.length > 1 || document.sections.length > 12 ? (
          <View style={styles.section} break>
            <Text style={styles.sectionHead}>What is in this document</Text>
            {parts.map(part => (
              <View key={part.part || 'main'} wrap={false}>
                {part.part ? <Text style={styles.contentsPart}>{part.part}</Text> : null}
                {part.headings.map(heading => (
                  <View key={heading} style={styles.contentsRow}>
                    <Text style={styles.contentsDash}>-</Text>
                    <Text style={styles.contentsText}>{heading}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {(groups[0] && !groups[0].own ? groups[0].sections : []).map((section, index) => {
          const startsPart = Boolean(section.part) && section.part !== groups[0].sections[index - 1]?.part
          return (
            <View key={`s${index}`} style={styles.section}>
              {startsPart ? (
                <View style={styles.partDivider} break={index > 0}>
                  <Text style={styles.partLabel}>Part</Text>
                  <Text style={styles.partName}>{section.part}</Text>
                </View>
              ) : null}
              <Text style={styles.sectionHead} minPresenceAhead={48}>{section.heading}</Text>
              <SectionBody section={section} keyBase={`s${index}`} />
            </View>
          )
        })}

        <Footer document={document} />
      </Page>

      {groups.map((group, groupIndex) => {
        // The first group is already on the page above.
        if (groupIndex === 0 && !group.own) return null
        return (
          <Page key={`g${groupIndex}`} size="A4" style={styles.page}>
            {group.sections.map((section, index) => {
              const first = index === 0
              const startsPart = Boolean(section.part)
                && section.part !== (first ? groups[groupIndex - 1]?.sections.slice(-1)[0]?.part : group.sections[index - 1]?.part)
              return (
                <View key={`g${groupIndex}s${index}`} style={first ? {} : styles.section}>
                  {startsPart ? (
                    <View style={first ? { marginBottom: 4, borderTopWidth: 0, paddingTop: 0 } : styles.partDivider}>
                      <Text style={styles.partLabel}>{section.part}</Text>
                    </View>
                  ) : null}
                  {group.own ? (
                    <>
                      <Text style={styles.title}>{section.heading}</Text>
                      <View style={styles.headerRule} />
                      <View style={{ marginTop: 12 }}>
                        <SectionBody section={section} keyBase={`g${groupIndex}s${index}`} />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.sectionHead} minPresenceAhead={48}>{section.heading}</Text>
                      <SectionBody section={section} keyBase={`g${groupIndex}s${index}`} />
                    </>
                  )}
                </View>
              )
            })}
            <Footer document={document} />
          </Page>
        )
      })}

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>{document.reference}</Text>
        <Text style={styles.title}>Adoption and sign-off</Text>
        <View style={styles.headerRule} />

        <View style={styles.section}>
          <Text style={styles.sectionHead}>Before this is issued</Text>
          <Text style={styles.note}>
            This document is a professional template. It becomes this property&apos;s document only when every
            blank has been completed by somebody who knows these premises, the whole of it has been checked
            against the building, and the person accountable for it has signed below.
          </Text>
          <Text style={styles.note}>
            Until then it must not be issued to the team, relied on in training, or produced to an assessor,
            an insurer or an inspector.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHead}>Completed by</Text>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Name</Text>
              <TextInput name="f_completed_name" style={styles.input} fontSize={9} />
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Role</Text>
              <TextInput name="f_completed_role" style={styles.input} fontSize={9} />
            </View>
          </View>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Relevant qualification held</Text>
              <TextInput name="f_completed_qualification" style={styles.input} fontSize={9} />
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Date</Text>
              <TextInput name="f_completed_date" style={styles.input} fontSize={9} />
            </View>
          </View>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Signature</Text>
              <View style={styles.signLine} />
            </View>
            <View style={styles.signCol} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHead}>Approved for use by</Text>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Name</Text>
              <TextInput name="f_approver_name" style={styles.input} fontSize={9} />
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Role</Text>
              <TextInput name="f_approver_role" style={styles.input} fontSize={9} />
            </View>
          </View>
          <View style={styles.signRow}>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Signature</Text>
              <View style={styles.signLine} />
            </View>
            <View style={styles.signCol}>
              <Text style={styles.signLabel}>Date</Text>
              <View style={styles.signLine} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHead}>The team have read it</Text>
          <Text style={styles.note}>
            Every person working in or supervising these facilities signs to confirm they have read this document
            and understand what they are expected to do.
          </Text>
          <View style={styles.table}>
            <View style={styles.tr} fixed wrap={false}>
              {['Name', 'Role', 'Date', 'Signature'].map((column, index) => (
                <Text key={column} style={[styles.th, { flex: 1 }, index ? styles.cellDivider : {}]}>{column}</Text>
              ))}
            </View>
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <View key={`brief${rowIndex}`} style={styles.tr} wrap={false}>
                {[0, 1, 2].map(columnIndex => (
                  <View key={`brief${rowIndex}c${columnIndex}`} style={[styles.td, { flex: 1 }, columnIndex ? styles.cellDivider : {}]}>
                    <TextInput name={`brief_r${rowIndex}c${columnIndex}`} style={styles.cellInput} fontSize={8} />
                  </View>
                ))}
                {/* A signature column that can be typed into is a signature
                    column worth nothing to anybody asking who was briefed. */}
                <View style={[styles.td, styles.cellDivider, { flex: 1 }]}><Text> </Text></View>
              </View>
            ))}
          </View>
        </View>

        <Footer document={document} />
      </Page>
    </Document>
  )
}

export function renderPlanPdf(document: PlanDocument): Promise<Buffer> {
  return renderToBuffer(<PlanPdf document={document} />)
}
