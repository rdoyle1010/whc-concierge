import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactionalEmail, SUPPORT_MAILBOX } from '@/lib/send-email'
import { isBuildStatus } from '@/lib/profile-build'
import { visibilityColumns } from '@/lib/talent-visibility'
import { tolerantUpsert } from '@/lib/tolerant-upsert'
import { ensureCandidateProfile } from '@/lib/candidate-record'
import { cvReadingConfigured, readCv, type CvReading } from '@/lib/cv-read'
import { sanitiseProfileEdit, completionPercent, missingFrom } from '@/lib/candidate-fields'

// Building somebody's profile for them, from the queue to the handover.
//
// A profile is filled in here, by an administrator who stays signed in as
// herself: 'profile' reads it and 'save_profile' writes it through the
// service role.
//
// It used to be filled in by signing in as the professional. One magic link,
// same browser, same origin, and the session it created replaced the
// administrator's own - so the admin screen behind it answered "Unauthorised"
// to everything and the workspace that opened was somebody else's. That link
// still exists as 'open', because there are things only the real form can do,
// but it is now the exception rather than the route: two-step enforced by
// adminRequestUser, written consent required, every use logged, and the
// screen says plainly what it will do to the session before she presses it.

export const dynamic = 'force-dynamic'

// A model reading a CV does not answer in ten seconds, and ten is the
// platform default for a route that does not say otherwise. /api/cv/analyse
// learned this the same way: the request died mid-read, the browser got an
// error page rather than JSON, and the screen said "That did not work",
// which is true and tells nobody anything.
//
// Twenty-six, not sixty. The host caps a synchronous function at twenty-six
// seconds and asking for sixty does not raise the ceiling, it just means the
// number in the code disagrees with the number that is enforced - so the read
// still died and the fix looked like it had not worked. The work below is cut
// to fit inside this rather than the other way round.
export const maxDuration = 26

const SITE = 'https://talenthousecollective.co.uk'
const BUCKET = 'talent-documents'

export async function GET() {
  const admin_user = await adminRequestUser()
  if (!admin_user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()

  const { data, error } = await admin.from('profile_build_requests')
    .select('*').order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ rows: [], unavailable: true, reason: error.message })

  // A signed link per CV, valid for an hour. The bucket is private and must
  // stay that way: these are strangers' CVs.
  const rows = await Promise.all((data || []).map(async (row: any) => {
    if (!row.cv_path) return { ...row, cv_url: null }
    try {
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(row.cv_path, 3600)
      return { ...row, cv_url: signed?.signedUrl || null }
    } catch {
      return { ...row, cv_url: null }
    }
  }))

  return NextResponse.json({ rows })
}

export async function POST(req: NextRequest) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ error: 'Missing request' }, { status: 400 })

  const admin = createAdminClient()
  const { data: request, error: readError } = await admin.from('profile_build_requests')
    .select('*').eq('id', id).maybeSingle()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!request) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

  if (action === 'status') {
    if (!isBuildStatus(body.status)) return NextResponse.json({ error: 'Unknown status' }, { status: 400 })
    const { error } = await admin.from('profile_build_requests')
      .update({ status: body.status, admin_note: String(body.admin_note || '').slice(0, 2000) || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Create the account. No password: they set one at handover, which is the
  // first and only thing they are ever asked to do.
  if (action === 'create') {
    if (request.created_user_id) return NextResponse.json({ error: 'This one already has an account.' }, { status: 400 })

    let userId: string | null = null
    let reused = false

    const { data: made, error: createError } = await admin.auth.admin.createUser({
      email: request.email,
      email_confirm: true,
      user_metadata: { role: 'talent', full_name: request.full_name },
    })

    if (made?.user) {
      userId = made.user.id
    } else if (alreadyRegistered(createError?.message)) {
      // The most useful person in this queue is somebody who already signed
      // up, got stuck at ten per cent and has now asked for help. Refusing
      // her because an account exists would turn the one request we most want
      // into a dead end.
      userId = await findUserByEmail(admin, request.email)
      reused = true
      if (!userId) {
        return NextResponse.json({
          error: 'An account exists for that address but we could not find it. Look them up in Users.',
        }, { status: 409 })
      }
    } else {
      return NextResponse.json({ error: createError?.message || 'That account could not be created.' }, { status: 400 })
    }

    // An existing account is read before anything is written to it.
    //
    // This used to write profiles first and check afterwards, which converted
    // a live property account into a talent one: role overwritten, the
    // property's name replaced with a person's, and the owner locked out of
    // her own dashboard. The guard was there and the write ran in front of it.
    // Nothing touches an account that already exists until we know what it is.
    if (reused) {
      const { data: existing, error: lookupError } = await admin.from('profiles')
        .select('role, full_name').eq('id', userId).maybeSingle()
      if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 })

      const existingRole = String(existing?.role || '')
      if (existingRole && existingRole !== 'candidate') {
        return NextResponse.json({
          error: `That address already belongs to a ${existingRole === 'employer' ? 'property' : existingRole} account, and changing it would lock them out of it. Ask them for a different address, or build the profile from Users instead.`,
        }, { status: 409 })
      }

      // Only what is genuinely absent. She asked for help finishing a profile,
      // not for it to be started again.
      if (!existing) {
        const { error: seedError } = await admin.from('profiles')
          .insert({ id: userId, email: request.email, role: 'candidate', full_name: request.full_name })
        if (seedError) return NextResponse.json({ error: seedError.message }, { status: 500 })
      } else if (!String(existing.full_name || '').trim() && request.full_name) {
        const { error: nameError } = await admin.from('profiles')
          .update({ full_name: request.full_name }).eq('id', userId)
        if (nameError) return NextResponse.json({ error: nameError.message }, { status: 500 })
      }

      // Not overwriting is not the same as not creating. An account that
      // became talent any other way - converted by hand, made for a course
      // purchase - has no candidate record at all, and its workspace says
      // "Profile not found" while every save reports success and writes
      // nothing.
      const record = await ensureCandidateProfile(admin, userId, {
        full_name: request.full_name,
        phone: request.phone,
        cv_url: request.cv_path,
      })
      if (!record.ok) return NextResponse.json({ error: record.error }, { status: 500 })

      const { error: linkError } = await admin.from('profile_build_requests')
        .update({ created_user_id: userId, status: 'building', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 })
      return NextResponse.json({ success: true, userId, reused: true, created: record.created })
    }

    // A brand new account, which is ours to shape.
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId, email: request.email, role: 'candidate', full_name: request.full_name,
    }, { onConflict: 'id' })
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    // Private, and not merely by default. She has not seen this yet, so
    // nobody else may either.
    // No agreed_terms: that column does not exist on this table, and naming
    // it refuses the whole statement. It cost three registrations on the
    // launch weekend before anybody knew. Nobody has asked this person to
    // agree to anything yet anyway; they will when they claim the account.
    const seeded = await tolerantUpsert(admin, 'candidate_profiles', {
      user_id: userId,
      full_name: request.full_name,
      phone: request.phone || null,
      cv_url: request.cv_path || null,
      approval_status: 'approved',
      ...visibilityColumns('private'),
    }, { onConflict: 'user_id' })
    if (seeded.stripped.length) {
      console.error('Profile build wrote without unknown columns:', seeded.stripped.join(', '))
    }
    if (!seeded.ok) return NextResponse.json({ error: seeded.error }, { status: 500 })

    const { error: linkError } = await admin.from('profile_build_requests')
      .update({ created_user_id: userId, status: 'building', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (linkError) {
      return NextResponse.json({
        success: true, userId,
        warning: 'The account was created, but we could not link it to this request. Do not press create again: it would fail on a duplicate address.',
      })
    }
    return NextResponse.json({ success: true, userId })
  }

  // Sign in as them, to fill the profile in using the real form.
  if (action === 'open') {
    if (!request.created_user_id) return NextResponse.json({ error: 'Create the account first.' }, { status: 400 })
    if (!request.consent_given_at) return NextResponse.json({ error: 'There is no recorded consent on this request.' }, { status: 403 })

    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: request.email,
      options: { redirectTo: `${SITE}/talent/profile` },
    })
    const url = link?.properties?.action_link
    if (error || !url) {
      return NextResponse.json({ error: error?.message || 'We could not open that workspace.' }, { status: 502 })
    }

    // Written down before the link is handed over, so the record exists even
    // if the browser never opens it. This is the most sensitive action on the
    // platform and the log is the only thing that makes it accountable.
    const { error: logError } = await admin.from('profile_build_access_log').insert({
      admin_user_id: actor.id,
      admin_email: actor.email || null,
      target_user_id: request.created_user_id,
      target_email: request.email,
      request_id: id,
      reason: 'Building a profile at their written request',
    })
    if (logError) {
      // No log, no link. An unrecorded sign-in as somebody else is exactly
      // what this is not allowed to be.
      console.error('Profile build access log failed:', logError.message)
      return NextResponse.json({ error: 'We could not record that access, so it has not been granted.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url,
      // Said here as well as on the screen, because the consequence is not
      // reversible by pressing back: opening this in the browser she is
      // already signed into ends her admin session.
      warning: 'That link signs you in as them. Open it in a private window, or you will be signed out of admin here.',
    })
  }

  // Hand it over: here is your profile, set a password and it is yours.
  if (action === 'handover') {
    if (!request.created_user_id) return NextResponse.json({ error: 'Create the account first.' }, { status: 400 })

    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: request.email,
      options: { redirectTo: `${SITE}/talent/profile` },
    })
    const url = link?.properties?.action_link
    if (error || !url) {
      return NextResponse.json({ error: error?.message || 'We could not create the link.' }, { status: 502 })
    }

    const sent = await sendTransactionalEmail({
      to: request.email,
      subject: 'Your profile is ready',
      html: handoverHtml(request.full_name, url),
      kind: 'onboarding',
      userId: request.created_user_id,
      replyTo: SUPPORT_MAILBOX,
    })
    if (!sent.ok) return NextResponse.json({ error: sent.error || 'The email did not send.' }, { status: 502 })

    const { error: statusError } = await admin.from('profile_build_requests')
      .update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', id)
    if (statusError) {
      return NextResponse.json({ success: true, warning: 'Sent, but the queue status did not update.' })
    }
    return NextResponse.json({ success: true })
  }

  // Read the CV and propose a profile. Saves nothing: the draft goes back to
  // the screen, a person corrects it, and only then is anything written.
  // Deliberately available before the account exists. Reading writes nothing,
  // so gating it behind account creation only hid the useful button behind a
  // step that can fail.
  if (action === 'read_cv') {
    if (!cvReadingConfigured()) {
      return NextResponse.json({ error: 'Reading CVs is not switched on: ANTHROPIC_API_KEY is not set in Netlify.' }, { status: 400 })
    }

    const pasted = String(body.text || '').trim()
    let result

    if (pasted) {
      result = await readCv({ kind: 'text', text: pasted })
    } else if (request.cv_path) {
      // Only PDFs can be read directly. A Word document has to be saved as
      // one, and saying so is better than a reader that quietly returns
      // nothing useful from a file it never understood.
      const { data: file, error: downloadError } = await admin.storage.from(BUCKET).download(request.cv_path)
      if (downloadError || !file) {
        return NextResponse.json({ error: 'That CV could not be fetched from storage.' }, { status: 502 })
      }
      const bytes = Buffer.from(await file.arrayBuffer())

      if (request.cv_path.toLowerCase().endsWith('.pdf')) {
        result = await readCv({ kind: 'pdf', base64: bytes.toString('base64') })
      } else {
        // Word, which is what spa professionals actually send. The reader
        // takes a PDF or text and nothing else, so the text comes out here
        // rather than telling somebody to go and convert their own CV.
        const text = await wordText(bytes)
        if (!text) {
          return NextResponse.json({
            error: 'We could not read that Word document. Paste the text in below, or ask them for a PDF.',
          }, { status: 400 })
        }
        result = await readCv({ kind: 'text', text })
      }
    } else {
      return NextResponse.json({ error: 'There is no CV on this request. Paste the text instead.' }, { status: 400 })
    }

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 })
    return NextResponse.json({ success: true, reading: result.reading })
  }

  // Save the draft the administrator has corrected. This is the write, and it
  // happens only after a person has read every field.
  if (action === 'apply_reading') {
    if (!request.created_user_id) return NextResponse.json({ error: 'Create the account first.' }, { status: 400 })
    const reading = body.reading as CvReading | undefined
    if (!reading || typeof reading !== 'object') {
      return NextResponse.json({ error: 'There is nothing to save.' }, { status: 400 })
    }

    const list = (values: unknown, limit: number) =>
      Array.isArray(values) ? values.map(String).slice(0, limit) : []
    const line = (value: unknown, limit: number) => {
      const text = typeof value === 'string' ? value.trim() : ''
      return text ? text.slice(0, limit) : null
    }
    const years = Number(reading.experience_years)

    // A row to update. Without this the save writes nothing and says it
    // worked, which is the exact shape of failure this platform keeps being
    // caught by.
    const record = await ensureCandidateProfile(admin, request.created_user_id, { full_name: request.full_name })
    if (!record.ok) return NextResponse.json({ error: record.error }, { status: 500 })

    // Through the tolerant write, and reporting what it had to drop.
    //
    // This was a plain update and it wrote `hotel_brands`, which is not a
    // column - the real one is hotel_brands_worked. Postgres refuses the whole
    // statement over one bad name, so a corrected draft with eleven right
    // fields saved none of them. That is the third time this shape has cost
    // something on this platform.
    //
    // Stripping is right here because ten saved fields beat none, and naming
    // what was dropped is what stops a field quietly going missing.
    const written = await tolerantUpsert(admin, 'candidate_profiles', {
      user_id: request.created_user_id,
      full_name: line(reading.full_name, 200) || request.full_name,
      headline: line(reading.headline, 120),
      role_level: line(reading.role_level, 60),
      experience_years: Number.isFinite(years) && years >= 0 && years <= 60 ? Math.round(years) : null,
      bio: line(reading.bio, 4000),
      product_houses: list(reading.product_houses, 30),
      systems_experience: list(reading.systems_experience, 30),
      qualifications: list(reading.qualifications, 30),
      // Both, and services_offered above all: that is the column the
      // matching engine reads. Writing the treatments only to
      // treatment_skills filled a profile that still matched nothing.
      services_offered: list(reading.treatment_skills, 40),
      treatment_skills: list(reading.treatment_skills, 40),
      business_skills: list(reading.business_skills, 20),
      languages: list(reading.languages, 12),
      current_employer: line(reading.current_employer, 160),
      hotel_brands_worked: list(reading.hotel_brands, 30),
      location: line(reading.location, 120),
      // Still private. A draft somebody corrected is not the same as a person
      // saying yes to being seen.
      ...visibilityColumns('private'),
    }, { onConflict: 'user_id' })

    if (!written.ok) return NextResponse.json({ error: written.error }, { status: 500 })
    return NextResponse.json({
      success: true,
      warning: written.stripped.length
        ? `Saved, but these could not be stored and are missing from the profile: ${written.stripped.join(', ')}. Tell Claude.`
        : undefined,
    })
  }

  // Read their profile back, so it can be edited here rather than there.
  if (action === 'profile') {
    if (!request.created_user_id) return NextResponse.json({ error: 'Create the account first.' }, { status: 400 })

    // Created if it is missing. An account that became talent some other way
    // has no candidate record, and an editor pointed at nothing saves nothing
    // and says it worked.
    const record = await ensureCandidateProfile(admin, request.created_user_id, { full_name: request.full_name })
    if (!record.ok) return NextResponse.json({ error: record.error }, { status: 500 })

    const { data: profile, error } = await admin.from('candidate_profiles')
      .select('*').eq('user_id', request.created_user_id).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!profile) return NextResponse.json({ error: 'Their profile could not be read.' }, { status: 500 })

    return NextResponse.json({
      success: true,
      profile,
      completion: completionPercent(profile),
      missing: missingFrom(profile),
    })
  }

  // Fill it in for them, from here, as herself.
  //
  // The whole point of this action is that nobody is signed in as anybody.
  // The administrator stays in her own session and the write goes through the
  // service role against the named list in candidate-fields.
  if (action === 'save_profile') {
    if (!request.created_user_id) return NextResponse.json({ error: 'Create the account first.' }, { status: 400 })

    const fields = sanitiseProfileEdit(body.profile)
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: 'There is nothing to save.' }, { status: 400 })
    }

    const record = await ensureCandidateProfile(admin, request.created_user_id, { full_name: request.full_name })
    if (!record.ok) return NextResponse.json({ error: record.error }, { status: 500 })

    const written = await tolerantUpsert(admin, 'candidate_profiles', {
      user_id: request.created_user_id,
      ...fields,
      // Still theirs to release. Filling somebody's profile in for them is
      // not the same as them agreeing to be seen, and this action must never
      // be the thing that puts a stranger in front of a hotel.
      ...visibilityColumns('private'),
    }, { onConflict: 'user_id' })
    if (!written.ok) return NextResponse.json({ error: written.error }, { status: 500 })

    // Read back and score, so the number on this screen and the number on
    // their own profile page are the same number.
    const { data: saved } = await admin.from('candidate_profiles')
      .select('*').eq('user_id', request.created_user_id).maybeSingle()
    const completion = completionPercent(saved || {})
    if (saved?.id) {
      await tolerantUpsert(admin, 'candidate_profiles', {
        user_id: request.created_user_id,
        profile_completion_score: completion,
        profile_completion_pct: completion,
      }, { onConflict: 'user_id' })
    }

    // The name on the account follows the name on the profile. A professional
    // whose profile says one thing and whose dashboard greets her as another
    // has been given somebody else's account, as far as she can tell.
    const savedName = typeof fields.full_name === 'string' ? fields.full_name : ''
    if (savedName) {
      const { error: nameError } = await admin.from('profiles')
        .update({ full_name: savedName }).eq('id', request.created_user_id)
      if (nameError) console.error('Profile build name sync failed:', nameError.message)
    }

    return NextResponse.json({
      success: true,
      profile: saved || null,
      completion,
      missing: missingFrom(saved || {}),
      warning: written.stripped.length
        ? `Saved, but these could not be stored and are missing from the profile: ${written.stripped.join(', ')}. Tell Claude.`
        : undefined,
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/** Supabase says this several ways depending on the path it took. */
function alreadyRegistered(message: string | null | undefined): boolean {
  return /already been registered|already registered|already exists|duplicate key/i.test(String(message || ''))
}

/** There is no getUserByEmail, so the list is paged through rather than guessed at. */
async function findUserByEmail(admin: any, email: string): Promise<string | null> {
  const wanted = String(email || '').trim().toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data?.users?.length) return null
    const found = data.users.find((user: any) => String(user.email || '').toLowerCase() === wanted)
    if (found) return found.id
    if (data.users.length < 200) return null
  }
  return null
}

/** The text of a Word document, or null if it cannot be read. */
async function wordText(bytes: Buffer): Promise<string | null> {
  try {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ buffer: bytes })
    const text = String(value || '').trim()
    return text.length >= 40 ? text : null
  } catch (error: any) {
    console.error('Word CV extraction failed:', error?.message)
    return null
  }
}

const escape = (value: string) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function handoverHtml(fullName: string, url: string): string {
  const firstName = String(fullName || '').trim().split(/\s+/)[0] || 'there'
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:32px auto;border:1px solid #dddddd;">
      <div style="background:#262626;padding:26px 32px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;opacity:.75;">Talent House Collective</p>
        <p style="margin:0;color:#ffffff;font-size:23px;font-weight:600;">Your profile is ready</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">Hello ${escape(firstName)},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          We have built it from what you sent. Have a look, change anything that is not right, and it
          is yours. Setting a password is the only thing left to do.
        </p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          <strong>It is private.</strong> No property can see you, and none will until you decide
          otherwise. When you are ready there is a middle setting as well, where a spa can find you by
          what you can do without learning your name until you agree to an introduction.
        </p>
        <p style="margin:0 0 22px;">
          <a href="${url}" style="display:inline-block;background:#1c1c1c;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:14px;font-weight:600;">See your profile and set a password</a>
        </p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b6b;">
          Anything we have got wrong, just reply to this email and we will fix it.
        </p>
        <p style="margin:22px 0 0;font-size:12px;color:#6b6b6b;">Talent House Collective &middot; talenthousecollective.co.uk</p>
      </div>
    </div>
  </body></html>`
}
