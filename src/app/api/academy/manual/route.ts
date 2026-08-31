import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAcademyCourseBySlug } from '@/lib/academy-catalog-server'
import { getCourseContent } from '@/lib/academy-content'
import { courseMeta } from '@/lib/academy-meta'

// The Course Manual: a beautifully formatted, printable reference document
// generated from the course content, for enrolled learners. The digital
// course stays interactive; this is the take-away reference. Save as PDF
// straight from the browser's print dialog.

const esc = (v: string) => String(v || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const para = (v: string) => esc(v).split(/\n\n+/).map(p => `<p>${p.replaceAll('\n', '<br/>')}</p>`).join('')

export async function GET(req: NextRequest) {
  const slug = String(req.nextUrl.searchParams.get('course') || '')
  if (!slug) return NextResponse.json({ error: 'Course is required.' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id,full_name').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 })
  const { data: enrolment } = await admin.from('course_enrollments')
    .select('paid_at').eq('candidate_id', candidate.id).eq('course_slug', slug)
    .not('paid_at', 'is', null).limit(1).maybeSingle()
  if (!enrolment) return NextResponse.json({ error: 'Paid course access required' }, { status: 403 })

  const [course, content] = [await getAcademyCourseBySlug(slug, true), getCourseContent(slug)]
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  const meta = courseMeta(slug)

  const lessonsHtml = (content?.lessons || []).map((lesson, index) => `
    <section class="lesson">
      <p class="eyebrow">Module ${index + 1}</p>
      <h2>${esc(lesson.title)}</h2>
      ${lesson.whyThisMatters ? `<div class="callout navy"><p class="label">Why this matters</p>${para(lesson.whyThisMatters)}</div>` : ''}
      <div class="callout plain"><p class="label">Learning outcomes</p><ul>${lesson.objectives.map(objective => `<li>${esc(objective)}</li>`).join('')}</ul></div>
      ${lesson.sections.map(section => `<h3>${esc(section.heading)}</h3>${para(section.body)}`).join('')}
      ${(lesson.visuals || []).map(visual => {
        if (visual.kind === 'flow') return `<div class="callout plain"><p class="label">${esc(visual.title)}</p><p class="flow">${visual.steps.map(esc).join(' &rarr; ')}</p>${visual.caption ? `<p class="caption">${esc(visual.caption)}</p>` : ''}</div>`
        if (visual.kind === 'table') return `<div class="callout plain"><p class="label">${esc(visual.title)}</p><table><thead><tr>${visual.headers.map(header => `<th>${esc(header)}</th>`).join('')}</tr></thead><tbody>${visual.rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>${visual.caption ? `<p class="caption">${esc(visual.caption)}</p>` : ''}</div>`
        if (visual.kind === 'matrix') return `<div class="callout plain"><p class="label">${esc(visual.title)}</p><p class="caption">${esc(visual.yLabel)} vs ${esc(visual.xLabel)}: ${visual.quadrants.map(esc).join(' | ')}</p>${visual.caption ? `<p class="caption">${esc(visual.caption)}</p>` : ''}</div>`
        return ''
      }).join('')}
      ${lesson.scenario ? `<div class="callout gold"><p class="label">Scenario</p>${para(lesson.scenario)}</div>` : ''}
      ${lesson.activity ? `<div class="callout green"><p class="label">Practical activity</p>${para(lesson.activity)}</div>` : ''}
      ${lesson.keyTerms.length ? `<div class="callout plain"><p class="label">Key terms</p><ul>${lesson.keyTerms.map(term => `<li><strong>${esc(term.term)}:</strong> ${esc(term.definition)}</li>`).join('')}</ul></div>` : ''}
      <div class="callout navy"><p class="label">Case study - ${esc(lesson.caseStudy.title)}</p>${para(lesson.caseStudy.scenario)}<p class="label" style="margin-top:8px">The professional response</p>${para(lesson.caseStudy.insight)}</div>
      <div class="callout plain"><p class="label">Key takeaway</p>${para(lesson.summary)}</div>
      ${lesson.nextStep ? `<div class="callout plain"><p class="label">Your next step at work</p>${para(lesson.nextStep)}</div>` : ''}
    </section>`).join('')

  const referencesHtml = content?.references?.length
    ? `<section class="lesson"><h2>Further reading &amp; references</h2><ul>${content.references.map(reference => `<li>${esc(reference.label)}${reference.url ? ` - ${esc(reference.url)}` : ''}</li>`).join('')}</ul></section>`
    : ''

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(course.title)} - Course Manual</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#1c2733;margin:0;background:#fff;line-height:1.7}
  .page{max-width:720px;margin:0 auto;padding:48px 32px}
  .cover{border-bottom:3px double #b08d4a;padding-bottom:28px;margin-bottom:36px}
  .brand{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8a6d3b;font-weight:700;font-family:Arial,sans-serif}
  h1{font-size:34px;margin:.3em 0 .2em;color:#0b2f4d}
  .sub{color:#5a6672;font-size:14px}
  .metaRow{font-size:12px;color:#5a6672;margin-top:14px;font-family:Arial,sans-serif}
  .eyebrow{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#8a6d3b;font-weight:700;font-family:Arial,sans-serif;margin-bottom:2px}
  h2{font-size:23px;color:#0b2f4d;margin:0 0 12px}
  h3{font-size:16px;color:#0b2f4d;margin:22px 0 6px}
  p{font-size:13.5px;margin:0 0 10px}
  ul{font-size:13.5px;margin:0 0 10px;padding-left:20px}
  li{margin-bottom:4px}
  .lesson{margin-bottom:44px;page-break-inside:avoid}
  .callout{border:1px solid #e2ddd2;border-radius:8px;padding:14px 16px;margin:14px 0;page-break-inside:avoid}
  .callout .label{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;font-family:Arial,sans-serif;color:#8a6d3b;margin-bottom:6px}
  .callout.navy{background:#0b2f4d;color:#eef2f4;border-color:#0b2f4d}
  .callout.navy p{color:#e6ebef}
  .callout.navy .label{color:#e8c98c}
  .callout.gold{background:#faf6ec;border-color:#e2d6b8}
  .callout.green{background:#f0f6f2;border-color:#cfdcd4}
  .callout.plain{background:#faf9f6}
  .flow{font-weight:600;color:#0b2f4d}
  .caption{font-size:11.5px;color:#77818c}
  table{border-collapse:collapse;width:100%;font-size:12.5px;font-family:Arial,sans-serif}
  th{border-bottom:2px solid #0b2f4d33;text-align:left;padding:6px 8px;background:#f2f0eb}
  td{border-bottom:1px solid #eee9df;padding:6px 8px}
  .footer{border-top:1px solid #e2ddd2;margin-top:40px;padding-top:14px;font-size:11px;color:#77818c;font-family:Arial,sans-serif}
  @media print{.page{padding:0}.noprint{display:none}}
  .noprint{background:#0b2f4d;color:#fff;text-align:center;padding:10px;font-family:Arial,sans-serif;font-size:13px}
</style></head><body>
<div class="noprint">Use your browser's Print option and choose "Save as PDF" to keep this manual.</div>
<div class="page">
  <div class="cover">
    <p class="brand">WHC Academy · Course Manual</p>
    <h1>${esc(course.title)}</h1>
    <p class="sub">${esc(course.tagline || '')}</p>
    <p class="metaRow">${esc(meta.level)} level · ${course.minutes >= 60 ? `${Math.round(course.minutes / 60 * 10) / 10} hours` : `${course.minutes} minutes`} of learning · ${meta.cpdHours} CPD hour${meta.cpdHours === 1 ? '' : 's'} · Prepared for ${esc(candidate.full_name || 'the enrolled learner')}</p>
    ${content?.aims ? `<p style="margin-top:14px">${esc(content.aims)}</p>` : ''}
  </div>
  ${lessonsHtml || '<p>The full manual for this course is being prepared.</p>'}
  ${referencesHtml}
  <div class="footer">© Wellness House Collective. This manual accompanies the interactive WHC Academy course and is for the enrolled learner's personal professional use.${content?.lastReviewed ? ` Content last reviewed ${esc(content.lastReviewed)}.` : ''}${content?.version ? ` Version ${esc(content.version)}.` : ''}</div>
</div>
</body></html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
