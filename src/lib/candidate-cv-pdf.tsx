import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

// A professional's CV, from the profile they already keep here.
//
// Two reasons this exists, and only one of them is the obvious one.
//
// The obvious one: somebody who has filled in their profile should not have
// to retype it into Word to apply for something off-platform.
//
// The better one: it gives a reason to finish the profile. A CV that is
// visibly missing its qualifications is a more persuasive argument for adding
// them than any amount of nagging, and a complete profile is the only thing
// that makes matching worth anything. The document carries the Talent House
// mark, so it also puts the name in front of a hiring manager who has never
// heard of it.
//
// Built with the same library and the same restraint as the Academy manual:
// built-in Times and Helvetica so nothing downloads at render time, no
// decorative colour, generous margins. A CV that looks like a template is
// worse than a plain one.

const INK = '#1a1a1a'
const MUTED = '#555555'
const FAINT = '#8a8a8a'
const RULE = '#c9c9c9'

const styles = StyleSheet.create({
  page: {
    paddingTop: 54, paddingBottom: 64, paddingHorizontal: 56,
    fontFamily: 'Times-Roman', fontSize: 10.5, lineHeight: 1.5, color: INK,
  },
  header: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  photo: { width: 86, height: 86, objectFit: 'cover' },
  headerText: { flex: 1 },
  name: { fontFamily: 'Times-Bold', fontSize: 26, lineHeight: 1.15 },
  headline: { fontFamily: 'Times-Italic', fontSize: 12, color: MUTED, marginTop: 5 },
  meta: { fontFamily: 'Helvetica', fontSize: 8.5, color: MUTED, marginTop: 9, lineHeight: 1.6 },
  rule: { borderBottomWidth: 1, borderBottomColor: INK, marginTop: 18, marginBottom: 20 },

  sectionTitle: { fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 2, color: MUTED, textTransform: 'uppercase', marginBottom: 7 },
  section: { marginBottom: 18 },
  body: { fontSize: 10.5, lineHeight: 1.6 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: { fontFamily: 'Helvetica', fontSize: 8.5, color: INK, borderWidth: 0.5, borderColor: RULE, paddingVertical: 3, paddingHorizontal: 6 },

  row: { flexDirection: 'row', marginBottom: 4 },
  rowLabel: { flex: 1, fontSize: 10.5 },
  rowValue: { fontFamily: 'Helvetica', fontSize: 8.5, color: MUTED, paddingTop: 1.5 },

  verified: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, letterSpacing: 1.2, color: MUTED, textTransform: 'uppercase' },
  foot: {
    position: 'absolute', bottom: 44, left: 56, right: 56,
    fontFamily: 'Helvetica', fontSize: 7.5, color: FAINT,
    borderTopWidth: 0.5, borderTopColor: RULE, paddingTop: 7,
    flexDirection: 'row', justifyContent: 'space-between',
  },
})

export type CvCertificate = { title: string; code?: string | null; completed?: string | null }

export type CandidateCv = {
  fullName: string
  headline?: string | null
  bio?: string | null
  roleLevel?: string | null
  yearsExperience?: number | null
  location?: string | null
  photo?: string | null
  verified?: boolean
  services: string[]
  treatments: string[]
  productHouses: string[]
  systems: string[]
  qualifications: string[]
  businessSkills: string[]
  languages: string[]
  awards: Array<{ name: string; year: string | null }>
  certificates: CvCertificate[]
}

function Chips({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.chips}>{items.map(item => <Text key={item} style={styles.chip}>{item}</Text>)}</View>
  </View>
}

function CvDocument({ cv, generatedOn }: { cv: CandidateCv; generatedOn: string }) {
  const meta = [
    cv.roleLevel,
    cv.yearsExperience ? `${cv.yearsExperience} years in the industry` : null,
    cv.location,
  ].filter(Boolean).join('   ·   ')

  return <Document
    title={`${cv.fullName} - CV`}
    author="Talent House Collective"
    creator="Talent House Collective"
  >
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {/* A photograph is normal in spa and hospitality and unusual in most
            other industries. It is included when they have one and the layout
            simply closes up when they do not. */}
        {cv.photo ? <Image src={cv.photo} style={styles.photo} /> : null}
        <View style={styles.headerText}>
          <Text style={styles.name}>{cv.fullName}</Text>
          {cv.headline ? <Text style={styles.headline}>{cv.headline}</Text> : null}
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          {cv.verified ? <Text style={[styles.meta, styles.verified]}>Talent House verified</Text> : null}
        </View>
      </View>

      <View style={styles.rule} />

      {cv.bio ? <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.body}>{cv.bio}</Text>
      </View> : null}

      <Chips title="Services" items={cv.services} />
      <Chips title="Treatment skills" items={cv.treatments} />
      <Chips title="Product houses" items={cv.productHouses} />
      <Chips title="Systems" items={cv.systems} />
      <Chips title="Qualifications" items={cv.qualifications} />
      <Chips title="Leadership and business" items={cv.businessSkills} />
      <Chips title="Languages" items={cv.languages} />

      {cv.awards.length ? <View style={styles.section}>
        <Text style={styles.sectionTitle}>Awards and recognition</Text>
        {cv.awards.map(award => <View key={`${award.name}-${award.year}`} style={styles.row}>
          <Text style={styles.rowLabel}>{award.name}</Text>
          {award.year ? <Text style={styles.rowValue}>{award.year}</Text> : null}
        </View>)}
      </View> : null}

      {cv.certificates.length ? <View style={styles.section}>
        <Text style={styles.sectionTitle}>Talent House Academy</Text>
        {cv.certificates.map(certificate => <View key={certificate.title} style={styles.row}>
          <Text style={styles.rowLabel}>{certificate.title}</Text>
          {/* The code is what makes this checkable rather than claimable. */}
          <Text style={styles.rowValue}>{[certificate.completed, certificate.code].filter(Boolean).join('   ')}</Text>
        </View>)}
      </View> : null}

      <View style={styles.foot} fixed>
        <Text>Talent House Collective</Text>
        <Text>{generatedOn}</Text>
      </View>
    </Page>
  </Document>
}

export async function renderCandidateCvPdf(cv: CandidateCv): Promise<Buffer> {
  const generatedOn = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return renderToBuffer(<CvDocument cv={cv} generatedOn={generatedOn} />)
}
