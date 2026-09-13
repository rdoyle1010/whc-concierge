import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceRateLimit } from '@/lib/rate-limit'
import { sendTransactionalEmail, SUPPORT_MAILBOX } from '@/lib/send-email'
import { alertAdminOfSignup } from '@/lib/admin-alerts'
import {
  BUILD_CONSENT_WORDING, CV_MAX_BYTES, cvStoragePath, cvTypeAllowed,
} from '@/lib/profile-build'
import { ensureCandidateProfile } from '@/lib/candidate-record'
import { visibilityColumns } from '@/lib/talent-visibility'
import { tolerantUpsert } from '@/lib/tolerant-upsert'
import {
  sanitiseAnswers, unanswered, answersToProfile, chosenVisibility, type BuildAnswers,
} from '@/lib/profile-build-questions'

// The intake for "send us your CV and we will do the rest".
//
// Public by design and by necessity: the whole point is that somebody with no
// account and no intention of filling in a form can still end up with a
// finished profile. So it is fenced the way the other public write routes are:
// rate limited per address, honeypotted, one narrow file type, and it reads
// nothing back.

export const dynamic = 'force-dynamic'

const BUCKET = 'talent-documents'

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, 'profile-build', { windowMs: 60 * 60 * 1000, maxRequests: 5 })
  if (limited) {
    return NextResponse.json({ error: 'That has been sent a few times already. Try again shortly.' }, { status: 429 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'We could not read that. Please try again.' }, { status: 400 })
  }

  // A field no person can see. Advisory, not a verdict.
  //
  // This used to return success and save nothing, which is the worst thing a
  // form can do: a professional whose browser autofilled the hidden field was
  // told her CV had arrived, and it had not. Losing one real therapist costs
  // far more than storing one spam row, and the rate limit above is the
  // actual defence.
  //
  // So a tripped check is written on the request and shown in the queue,
  // where a person decides. The one thing it does suppress is the
  // acknowledgement email, because sending mail to an address a bot supplied
  // is how a form becomes somebody else's problem.
  const suspected = Boolean(String(form.get('thc_hp') || '').trim())

  const fullName = String(form.get('full_name') || '').trim().slice(0, 200)
  const email = String(form.get('email') || '').trim().toLowerCase().slice(0, 200)
  const phone = String(form.get('phone') || '').trim().slice(0, 40)
  const note = String(form.get('note') || '').trim().slice(0, 2000)
  const consent = form.get('consent') === 'true'

  // The eight things a CV cannot say. Checked here as well as in the browser,
  // because a form that validates only on screen validates only for people
  // using the screen.
  let answers: BuildAnswers = {}
  try {
    answers = sanitiseAnswers(JSON.parse(String(form.get('answers') || '{}')))
  } catch {
    answers = {}
  }

  if (!fullName) return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 })
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please give us an email address we can reach you on.' }, { status: 400 })
  const missing = unanswered(answers)
  if (missing.length) return NextResponse.json({ error: `Still to answer: ${missing.join(', ')}.` }, { status: 400 })
  if (!consent) return NextResponse.json({ error: 'We need your permission before we can build anything.' }, { status: 400 })

  const file = form.get('cv') as File | null
  if (file && file.size > 0) {
    if (!cvTypeAllowed(file.type)) {
      return NextResponse.json({ error: 'Send a PDF or a Word document, and we will take it from there.' }, { status: 400 })
    }
    if (file.size > CV_MAX_BYTES) {
      return NextResponse.json({ error: 'That file is over 8MB. Send a smaller one, or just tell us where to find you.' }, { status: 400 })
    }
  }

  const admin = createAdminClient()

  const { data: created, error } = await admin.from('profile_build_requests').insert({
    full_name: fullName,
    email,
    phone: phone || null,
    note: note || null,
    consent_wording: BUILD_CONSENT_WORDING,
    answers,
    admin_note: suspected
      ? 'Our spam check was tripped by this one. It is probably a browser filling in a hidden field rather than a bot, so read it before dismissing it.'
      : null,
  }).select('id').maybeSingle()

  if (error || !created?.id) {
    return NextResponse.json({ error: 'We could not save that. Please try again in a moment.' }, { status: 500 })
  }

  // The CV goes to the private bucket, under a path we choose. A filename is
  // whatever the sender typed, and a storage path is not the place to discover
  // that.
  let cvPath: string | null = null
  if (file && file.size > 0) {
    try {
      const path = cvStoragePath(created.id, file.name)
      const { error: uploadError } = await admin.storage.from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true })
      if (uploadError) {
        console.error('Profile build CV upload failed:', uploadError.message)
      } else {
        cvPath = path
        // Checked, because a request whose CV silently vanished is a request
        // she cannot act on and will not know is broken.
        const { error: attachError } = await admin.from('profile_build_requests')
          .update({ cv_path: path, cv_filename: String(file.name || '').slice(0, 200) })
          .eq('id', created.id)
        if (attachError) console.error('Profile build CV attach failed:', attachError.message)
      }
    } catch (uploadThrew: any) {
      console.error('Profile build CV upload threw:', uploadThrew?.message)
    }
  }

  // The account, made now rather than on a button.
  //
  // Somebody who has given a name, an address, written consent and a CV has
  // given us an account. Asking an administrator to press a button to agree
  // is a step that exists only because the code was written in that order,
  // and it is a step that can be forgotten, fail, or be done to the wrong
  // person.
  //
  // Not for a flagged submission: a spam check that trips should not be able
  // to create auth users. Those wait for a person.
  if (!suspected) {
    await createAccountFor(admin, created.id, { email, fullName, phone, cvPath, answers })
      .catch((accountError: any) => {
        // Never fails the request. Her CV is saved either way, and an account
        // that did not get made is a button away rather than a lost request.
        console.error('Profile build account creation failed:', accountError?.message)
      })
  }

  // She needs to know one has come in, and this is not a sign-up so it cannot
  // ride on the sign-up alert.
  await alertAdminOfSignup('talent', `${fullName} (profile build request)`).catch(() => {})

  // And they need to know it arrived. A form that swallows a CV and says
  // nothing is worse than no form. Held back only when the spam check tripped,
  // so this cannot be used to post mail at somebody who never asked for it.
  if (!suspected) await sendTransactionalEmail({
    to: email,
    subject: 'We have your details',
    html: acknowledgementHtml(fullName),
    kind: 'notification',
    replyTo: SUPPORT_MAILBOX,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}

/**
 * Make the account, or link to the one that is already there.
 *
 * Everything it writes is private and unapproved by its owner, because she
 * has not seen any of it yet. An address that already belongs to a property
 * is left completely alone and the request waits for a person: converting a
 * property account into a talent one locks its owner out of her own
 * dashboard, which has happened here once already.
 */
async function createAccountFor(
  admin: any,
  requestId: string,
  person: { email: string; fullName: string; phone: string; cvPath: string | null; answers: BuildAnswers },
): Promise<void> {
  let userId: string | null = null

  const { data: made, error: createError } = await admin.auth.admin.createUser({
    email: person.email,
    email_confirm: true,
    user_metadata: { role: 'talent', full_name: person.fullName },
  })

  if (made?.user) {
    userId = made.user.id
    const { error: profileError } = await admin.from('profiles').insert({
      id: userId, email: person.email, role: 'candidate', full_name: person.fullName,
    })
    if (profileError) throw new Error(profileError.message)
  } else {
    // Somebody who already has an account is the common case, not a problem.
    // But nothing is written to it until we know what it is.
    userId = await findExistingUser(admin, person.email)
    if (!userId) throw new Error(createError?.message || 'The account could not be created.')

    const { data: existing } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle()
    const role = String(existing?.role || '')
    if (role && role !== 'candidate') {
      await admin.from('profile_build_requests').update({
        admin_note: `That address already belongs to a ${role === 'employer' ? 'property' : role} account, so no account was made. Ask them for a different address, or work from Users.`,
        updated_at: new Date().toISOString(),
      }).eq('id', requestId)
      return
    }
  }

  // Created when it is missing, and otherwise only its blanks are filled.
  // Somebody who already has a profile and sends a CV is asking for help with
  // it, not for her visibility to be reset to private on our say-so.
  if (!userId) throw new Error('No account to attach a profile to.')
  const record = await ensureCandidateProfile(admin, userId, {
    full_name: person.fullName,
    phone: person.phone,
    cv_url: person.cvPath,
  })
  if (!record.ok) throw new Error(record.error)

  // The answers, written now rather than waiting for somebody to press a
  // button. By the time this reaches the queue the profile already knows what
  // they are, where they are, when they could start and how far they would
  // go, so reading the CV finishes it instead of starting it.
  //
  // Only on a record we just created. Somebody who already had a profile
  // asked us to help with it, not to have their own answers overwritten by a
  // form they filled in five minutes ago in a hurry.
  const fields = answersToProfile(person.answers)
  if (record.created && Object.keys(fields).length) {
    const written = await tolerantUpsert(admin, 'candidate_profiles', {
      user_id: userId,
      ...fields,
      // Their answer, through the one thing allowed to turn a preference into
      // those four booleans. Private unless they said otherwise.
      ...visibilityColumns(chosenVisibility(person.answers)),
    }, { onConflict: 'user_id' })
    if (written.stripped.length) {
      console.error('Profile build answers written without unknown columns:', written.stripped.join(', '))
    }
    if (!written.ok) console.error('Profile build answers failed:', written.error)
  }

  const { error: linkError } = await admin.from('profile_build_requests')
    .update({ created_user_id: userId, status: 'building', updated_at: new Date().toISOString() })
    .eq('id', requestId)
  if (linkError) throw new Error(linkError.message)
}

/** There is no getUserByEmail, so the list is paged through rather than guessed at. */
async function findExistingUser(admin: any, email: string): Promise<string | null> {
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

const escape = (value: string) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function acknowledgementHtml(fullName: string): string {
  const firstName = String(fullName || '').trim().split(/\s+/)[0] || 'there'
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:32px auto;border:1px solid #dddddd;">
      <div style="background:#262626;padding:24px 30px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;opacity:.75;">Talent House Collective</p>
        <p style="margin:0;color:#ffffff;font-size:21px;font-weight:600;">We have your details</p>
      </div>
      <div style="padding:26px 30px;">
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">Hello ${escape(firstName)},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          Thank you. We will build your profile properly and send it to you to look at before anybody
          else sees a word of it. Give us a couple of days.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          Nothing is visible to any property until you have seen it and said yes, and when you do go
          live you choose how much of you is shown.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          If you think of anything else worth including, just reply to this email.
        </p>
        <p style="margin:0;font-size:13px;line-height:1.7;color:#6b6b6b;">
          We have opened an account in your name ready for it. You do not need to do anything with it,
          but if you would rather get on without waiting for us, use "Forgot your password" on the
          sign-in page to set a password and it is yours.
        </p>
        <p style="margin:22px 0 0;font-size:12px;color:#6b6b6b;">Talent House Collective &middot; talenthousecollective.co.uk</p>
      </div>
    </div>
  </body></html>`
}
