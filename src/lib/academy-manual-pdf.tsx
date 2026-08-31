import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import type { CourseContent, RichLesson, LessonVisual } from '@/lib/academy-types'

// The Course Manual as a real PDF: a plain, professional reference document
// in the style of a printed course book. Restrained by design - near-black
// text, generous margins, hairline rules, no decorative colour. Built with
// @react-pdf/renderer (pure JS, serverless-safe) using the built-in Times
// and Helvetica faces so nothing needs downloading at runtime.

const INK = '#1a1a1a'
const MUTED = '#555555'
const FAINT = '#8a8a8a'
const RULE = '#c9c9c9'

const styles = StyleSheet.create({
  page: {
    paddingTop: 64,
    paddingBottom: 72,
    paddingHorizontal: 68,
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    lineHeight: 1.55,
    color: INK,
  },
  // Cover
  coverBrand: { fontFamily: 'Helvetica-Bold', fontSize: 9, letterSpacing: 2.5, color: MUTED, textTransform: 'uppercase' },
  coverRule: { borderBottomWidth: 1, borderBottomColor: INK, marginTop: 10, marginBottom: 26 },
  coverTitle: { fontFamily: 'Times-Bold', fontSize: 30, lineHeight: 1.2, color: INK },
  coverTagline: { fontSize: 12.5, fontFamily: 'Times-Italic', color: MUTED, marginTop: 10 },
  coverMeta: { fontFamily: 'Helvetica', fontSize: 8.5, color: MUTED, marginTop: 22, lineHeight: 1.7 },
  coverAims: { marginTop: 26, fontSize: 11, lineHeight: 1.65 },
  coverFoot: { position: 'absolute', bottom: 56, left: 68, right: 68, fontFamily: 'Helvetica', fontSize: 8, color: FAINT, borderTopWidth: 0.5, borderTopColor: RULE, paddingTop: 8 },
  // Contents
  contentsHeading: { fontFamily: 'Times-Bold', fontSize: 17, marginBottom: 14 },
  contentsRow: { flexDirection: 'row', marginBottom: 7 },
  contentsNum: { width: 26, fontFamily: 'Helvetica', fontSize: 9, color: MUTED, paddingTop: 1 },
  contentsTitle: { flex: 1, fontSize: 11 },
  // Module
  moduleEyebrow: { fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 2, color: MUTED, textTransform: 'uppercase', marginBottom: 5 },
  moduleTitle: { fontFamily: 'Times-Bold', fontSize: 18, lineHeight: 1.25, marginBottom: 4 },
  moduleRule: { borderBottomWidth: 0.75, borderBottomColor: INK, marginTop: 6, marginBottom: 14 },
  sectionHeading: { fontFamily: 'Times-Bold', fontSize: 12.5, marginTop: 14, marginBottom: 5 },
  para: { marginBottom: 7, textAlign: 'justify' },
  // Labelled blocks (case study, scenario, activity...) - plain typographic
  // treatment: a small-caps label over the text with a hairline above.
  block: { marginTop: 12, marginBottom: 4, borderTopWidth: 0.5, borderTopColor: RULE, paddingTop: 9 },
  blockLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, letterSpacing: 1.8, color: MUTED, textTransform: 'uppercase', marginBottom: 5 },
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { width: 14, fontSize: 10.5 },
  bulletText: { flex: 1 },
  termLine: { marginBottom: 4 },
  termWord: { fontFamily: 'Times-Bold' },
  // Tables
  table: { marginTop: 6, marginBottom: 4, borderTopWidth: 0.75, borderTopColor: INK },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RULE },
  th: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 8, paddingVertical: 5, paddingRight: 6 },
  td: { flex: 1, fontFamily: 'Helvetica', fontSize: 8.5, paddingVertical: 4.5, paddingRight: 6, lineHeight: 1.4 },
  caption: { fontFamily: 'Helvetica', fontSize: 8, color: FAINT, marginTop: 3, marginBottom: 4 },
  // Running footer
  footer: { position: 'absolute', bottom: 34, left: 68, right: 68, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: RULE, paddingTop: 7 },
  footerText: { fontFamily: 'Helvetica', fontSize: 7.5, color: FAINT },
})

function Paragraphs({ text, style }: { text: string; style?: any }) {
  const parts = String(text || '').split(/\n\n+/).map(part => part.trim()).filter(Boolean)
  return (
    <>
      {parts.map((part, index) => (
        <Text key={index} style={[styles.para, ...(style ? [style] : [])]}>{part.replace(/\n/g, ' ')}</Text>
      ))}
    </>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.block} wrap={false}>
      <Text style={styles.blockLabel}>{label}</Text>
      {children}
    </View>
  )
}

function VisualBlock({ visual }: { visual: LessonVisual }) {
  if (visual.kind === 'table') {
    return (
      <View style={styles.block}>
        <Text style={styles.blockLabel}>{visual.title}</Text>
        <View style={styles.table}>
          <View style={styles.tr} wrap={false}>
            {visual.headers.map((header, index) => <Text key={index} style={styles.th}>{header}</Text>)}
          </View>
          {visual.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tr} wrap={false}>
              {row.map((cell, cellIndex) => <Text key={cellIndex} style={styles.td}>{cell}</Text>)}
            </View>
          ))}
        </View>
        {visual.caption ? <Text style={styles.caption}>{visual.caption}</Text> : null}
      </View>
    )
  }
  if (visual.kind === 'flow') {
    return (
      <View style={styles.block} wrap={false}>
        <Text style={styles.blockLabel}>{visual.title}</Text>
        {visual.steps.map((step, index) => (
          <View key={index} style={styles.bulletRow}>
            <Text style={[styles.bulletDot, { fontFamily: 'Helvetica', fontSize: 8.5, color: MUTED, paddingTop: 1 }]}>{index + 1}.</Text>
            <Text style={styles.bulletText}>{step}</Text>
          </View>
        ))}
        {visual.caption ? <Text style={styles.caption}>{visual.caption}</Text> : null}
      </View>
    )
  }
  if (visual.kind === 'matrix') {
    const [q1, q2, q3, q4] = visual.quadrants
    return (
      <View style={styles.block} wrap={false}>
        <Text style={styles.blockLabel}>{visual.title}</Text>
        <View style={styles.table}>
          <View style={styles.tr}><Text style={styles.th}> </Text><Text style={styles.th}>{visual.xLabel}: low</Text><Text style={styles.th}>{visual.xLabel}: high</Text></View>
          <View style={styles.tr}><Text style={styles.td}>{visual.yLabel}: high</Text><Text style={styles.td}>{q1}</Text><Text style={styles.td}>{q2}</Text></View>
          <View style={styles.tr}><Text style={styles.td}>{visual.yLabel}: low</Text><Text style={styles.td}>{q3}</Text><Text style={styles.td}>{q4}</Text></View>
        </View>
        {visual.caption ? <Text style={styles.caption}>{visual.caption}</Text> : null}
      </View>
    )
  }
  return null // image placeholders are digital-course furniture, not manual content
}

function ModulePages({ lesson, index, courseTitle }: { lesson: RichLesson; index: number; courseTitle: string }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.moduleEyebrow}>Module {index + 1}</Text>
      <Text style={styles.moduleTitle}>{lesson.title}</Text>
      <View style={styles.moduleRule} />

      {lesson.whyThisMatters ? (
        <Paragraphs text={lesson.whyThisMatters} style={{ fontFamily: 'Times-Italic' }} />
      ) : null}

      <Block label="Learning outcomes">
        {lesson.objectives.map((objective, objectiveIndex) => (
          <View key={objectiveIndex} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{objective}</Text>
          </View>
        ))}
      </Block>

      {lesson.sections.map((section, sectionIndex) => (
        <View key={sectionIndex}>
          <Text style={styles.sectionHeading}>{section.heading}</Text>
          <Paragraphs text={section.body} />
        </View>
      ))}

      {(lesson.visuals || []).map((visual, visualIndex) => <VisualBlock key={visualIndex} visual={visual} />)}

      {lesson.scenario ? (
        <Block label="Scenario"><Paragraphs text={lesson.scenario} /></Block>
      ) : null}

      {lesson.activity ? (
        <Block label="Practical activity"><Paragraphs text={lesson.activity} /></Block>
      ) : null}

      {lesson.keyTerms.length ? (
        <Block label="Key terms">
          {lesson.keyTerms.map((term, termIndex) => (
            <Text key={termIndex} style={styles.termLine}>
              <Text style={styles.termWord}>{term.term}. </Text>{term.definition}
            </Text>
          ))}
        </Block>
      ) : null}

      <Block label={`Case study - ${lesson.caseStudy.title}`}>
        <Paragraphs text={lesson.caseStudy.scenario} />
        <Text style={[styles.blockLabel, { marginTop: 4 }]}>The professional response</Text>
        <Paragraphs text={lesson.caseStudy.insight} />
      </Block>

      <Block label="Key takeaway"><Paragraphs text={lesson.summary} /></Block>

      {lesson.nextStep ? (
        <Block label="Your next step at work"><Paragraphs text={lesson.nextStep} /></Block>
      ) : null}

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>{courseTitle} · WHC Academy</Text>
        <Text style={styles.footerText} render={({ pageNumber }) => `${pageNumber}`} />
      </View>
    </Page>
  )
}

export type ManualCourseInfo = {
  title: string
  tagline?: string
  minutes: number
  level: string
  cpdHours: number
  learnerName: string
}

// The built-in PDF faces use WinAnsi encoding: a handful of characters used
// in course text (arrows, the almost-equals sign) have no glyph and would
// print as odd symbols. Swap them for safe equivalents throughout.
function sanitise<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replaceAll('→', '->').replaceAll('≈', '~') as unknown as T
  }
  if (Array.isArray(value)) return value.map(sanitise) as unknown as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitise(entry)])) as unknown as T
  }
  return value
}

export async function renderCourseManualPdf(info: ManualCourseInfo, rawContent: CourseContent): Promise<Buffer> {
  const content = sanitise(rawContent)
  const duration = info.minutes >= 60 ? `${Math.round((info.minutes / 60) * 10) / 10} hours` : `${info.minutes} minutes`
  const generated = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const doc = (
    <Document title={`${info.title} - Course Manual`} author="Wellness House Collective" creator="WHC Academy">
      {/* Cover */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.coverBrand}>WHC Academy · Course Manual</Text>
        <View style={styles.coverRule} />
        <Text style={styles.coverTitle}>{info.title}</Text>
        {info.tagline ? <Text style={styles.coverTagline}>{info.tagline}</Text> : null}
        <Text style={styles.coverMeta}>
          {info.level} level · {duration} of guided learning · {info.cpdHours} CPD hour{info.cpdHours === 1 ? '' : 's'}{'\n'}
          Prepared for {info.learnerName} · {generated}
        </Text>
        {content.aims ? <View style={styles.coverAims}><Paragraphs text={content.aims} /></View> : null}
        {content.audience ? (
          <Block label="Who this course is for"><Paragraphs text={content.audience} /></Block>
        ) : null}
        {content.author ? (
          <Block label="Course author"><Text>{content.author.name}, {content.author.role}{content.author.note ? `. ${content.author.note}` : ''}</Text></Block>
        ) : null}
        <Text style={styles.coverFoot}>
          © Wellness House Collective. This manual accompanies the interactive WHC Academy course and is for the enrolled learner&apos;s personal professional use.
          {content.lastReviewed ? ` Content last reviewed ${content.lastReviewed}.` : ''}{content.version ? ` Version ${content.version}.` : ''}
        </Text>
      </Page>

      {/* Contents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.contentsHeading}>Contents</Text>
        {content.lessons.map((lesson, index) => (
          <View key={index} style={styles.contentsRow}>
            <Text style={styles.contentsNum}>{index + 1}</Text>
            <Text style={styles.contentsTitle}>{lesson.title}</Text>
          </View>
        ))}
        {content.references?.length ? (
          <View style={styles.contentsRow}>
            <Text style={styles.contentsNum}>{content.lessons.length + 1}</Text>
            <Text style={styles.contentsTitle}>Further reading and references</Text>
          </View>
        ) : null}
        {content.prerequisites ? (
          <Block label="Before you start"><Paragraphs text={content.prerequisites} /></Block>
        ) : null}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{info.title} · WHC Academy</Text>
          <Text style={styles.footerText} render={({ pageNumber }) => `${pageNumber}`} />
        </View>
      </Page>

      {content.lessons.map((lesson, index) => (
        <ModulePages key={index} lesson={lesson} index={index} courseTitle={info.title} />
      ))}

      {content.references?.length ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.contentsHeading}>Further reading and references</Text>
          {content.references.map((reference, index) => (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{reference.label}{reference.url ? ` - ${reference.url}` : ''}</Text>
            </View>
          ))}
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>{info.title} · WHC Academy</Text>
            <Text style={styles.footerText} render={({ pageNumber }) => `${pageNumber}`} />
          </View>
        </Page>
      ) : null}
    </Document>
  )

  const buffer = await renderToBuffer(doc)
  return Buffer.from(buffer)
}
