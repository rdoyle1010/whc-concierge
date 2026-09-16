'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PanelBackdrop from '@/components/PanelBackdrop'
import { usePublicSiteContent } from '@/lib/use-site-content'
import { Eye, EyeOff } from 'lucide-react'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import { MARKETING_CONSENT_WORDING } from '@/lib/consent-wording'
import { LAUNCH_OFFER_TALENT, launchOfferClosesLabel, launchOfferOpen } from '@/lib/launch-offers'
import { DEFAULT_VISIBILITY, VISIBILITY_COPY, type TalentVisibility } from '@/lib/talent-visibility'

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 64

type PublicStats = { liveRoles: number | null; properties: number | null; verifiedReviews: number | null; showLiveNumbers?: boolean }

export default function TalentRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const site = usePublicSiteContent()
  const [loading, setLoading] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [refCode, setRefCode] = useState('')
  // The campaign code. Prefilled from ?code= so a link out of an email or an
  // Instagram bio fills it in and nobody has to type anything off a poster.
  const [signupCode, setSignupCode] = useState('')
  // Private until she says otherwise. The platform used to decide this for
  // her and decide it wrong: registration published her, by name, to every
  // verified property, without asking. In an industry this small that is the
  // single thing professionals say they are afraid of.
  const [visibility, setVisibility] = useState<TalentVisibility>(DEFAULT_VISIBILITY)
  // Set when somebody arrives through the consultancy door, so the account is
  // pointed at a listing from the first screen rather than at a treatment
  // profile they will never fill in.
  const [consultantFocus, setConsultantFocus] = useState(false)
  const [stats, setStats] = useState<PublicStats | null>(null)

  // Where they were going before they were asked to make an account.
  //
  // The sign-in page sends people here with ?redirect= on it, and so does a
  // brand page, and this read the referral code and the consultant flag and
  // threw the rest away. Somebody sent to sign up from the match deck made an
  // account and landed on an empty profile editor, with no way back to the
  // thing they were looking at. The most motivated moment in the whole funnel,
  // spent on a form.
  const [back, setBack] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const r = params.get('ref')
    if (r) setRefCode(r.slice(0, 30))
    const code = params.get('code')
    if (code) setSignupCode(code.slice(0, 30))
    if (params.get('focus') === 'consultant') setConsultantFocus(true)
    // Same-origin only. An open redirect on a registration form sends new
    // accounts to whatever a link says.
    const wanted = params.get('redirect') || ''
    if (wanted.startsWith('/') && !wanted.startsWith('//')) setBack(wanted)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/public-stats', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (!cancelled && data) setStats(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const createAccount = async () => {
    setError('')
    if (!fullName.trim()) return setError('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    if (password.length > MAX_PASSWORD_LENGTH) return setError(`Use no more than ${MAX_PASSWORD_LENGTH} characters.`)
    if (!agreedTerms) return setError('Please accept the Terms & Conditions and Privacy Policy.')

    setLoading(true)
    try {
      const initResponse = await fetch('/api/register/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: 'talent',
          marketingOptIn,
          agreedTerms,
          displayName: fullName,
          visibility,
          refCode: refCode || undefined,
          signupCode: signupCode || undefined,
        }),
      })
      const init = await initResponse.json().catch(() => ({}))

      if (!initResponse.ok || !init.userId) {
        setError(init.error || 'We could not create your account. Please check your details and try again.')
        return
      }

      if (init.session?.access_token && init.session?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession(init.session)
        if (sessionError) {
          setError('Your account was created, but sign-in could not be completed. Please use the login page.')
          return
        }
      }

      if (init.requiresEmailConfirmation) {
        // The destination travels through the confirmation too, or it is lost
        // in the inbox, which is the longest gap in the journey.
        const carry = back ? `&redirect=${encodeURIComponent(back)}` : ''
        router.push(consultantFocus
          ? `/login?registered=1&confirm=1&role=consultant${carry}`
          : `/login?registered=1&confirm=1${carry}`)
        return
      }

      if (consultantFocus) {
        // Recorded before the redirect so the workspace is already trimmed
        // when the listing page loads.
        await fetch('/api/consultancy/mine', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account_focus: 'consultant' }),
        }).catch(() => {})
        router.push('/talent/consultancy')
        return
      }

      router.push(back || '/talent/profile?welcome=1')
    } catch {
      setError('We could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Ruled fact rows for the charcoal panel.
  //
  // The counts appear only when an administrator has judged them worth
  // showing. The sign-in page has always honoured that setting and this page
  // did not, so "1 live role open right now" was being shown to the exact
  // person we are asking to join - which does not read as a young platform,
  // it reads as an empty one. The two standing promises always show, because
  // they are true on day one and on day one thousand.
  const showCounts = stats?.showLiveNumbers === true
  const factRows: Array<{ value: string | null; label: string }> = [
    showCounts && stats?.liveRoles ? { value: String(stats.liveRoles), label: `live role${stats.liveRoles === 1 ? '' : 's'} open right now` } : null,
    showCounts && stats?.properties ? { value: String(stats.properties), label: `approved propert${stats.properties === 1 ? 'y' : 'ies'} hiring through Talent House` } : null,
    { value: null, label: 'Salary expectations stay private until you choose' },
    { value: null, label: 'Verified employers only' },
  ].filter(Boolean) as Array<{ value: string | null; label: string }>

  return (
    <main id="main-content" className="min-h-screen bg-[#ede8df] flex items-stretch">
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-16">
        <div className="w-full max-w-[430px]">
          <Wordmark />
          <div className="mt-10 bg-white border border-[#dcd4c8] p-7 lg:p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6e6a60] font-semibold">Talent House Collective</p>
            <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.02em] font-serif font-semibold text-[#222321]">Create your Talent account</h1>
            <p className="mt-2 mb-7 text-[13px] leading-6 text-[#57544c]">Three fields now. You build your professional profile once you are inside - nothing is asked twice.</p>

            {/* The opening season, and the code box, which are two different
                things and used to be one.
                The box lived inside this panel, so on the first of November it
                would have vanished from the form along with the offer, and
                every code printed on anything would have stopped working with
                nothing on screen to say why. A code carries its own expiry and
                its own number of places: that is the reason for issuing one
                from a screen instead of hardcoding it, and it is worthless if
                the field to type it into is seasonal. */}
            {launchOfferOpen() && (
              <div className="mb-3 border border-[#dcd4c8] bg-[#ede8df] px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#222321]">Opening season</p>
                <p className="mt-1.5 text-[12.5px] leading-5 text-[#3a4239]">{LAUNCH_OFFER_TALENT}</p>
                <p className="mt-1.5 text-[11px] text-[#6e6a60]">
                  Both courses are yours either way. Closes {launchOfferClosesLabel()}.
                </p>
              </div>
            )}

            {/* Optional on purpose, and it says so. A field that looks
                compulsory and is not is a field people abandon a form over. */}
            <label className="mb-5 block">
              <span className="text-[11px] text-[#6e6a60]">Code, if you have one</span>
              <input
                value={signupCode}
                onChange={event => setSignupCode(event.target.value.slice(0, 40))}
                placeholder="SPA-WELL26"
                aria-label="Sign-up code"
                className="mt-1 w-full border border-[#dcd4c8] bg-white px-3 py-2 text-[13px] uppercase tracking-[.06em] text-[#222321] placeholder:normal-case placeholder:tracking-normal placeholder:text-[#7e7a70]"
              />
            </label>

            {error && <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-[13px] px-3 py-2.5 mb-5">{error}</div>}

            <div className="space-y-4">
              <div>
                <label htmlFor="reg-full-name" className="block text-[12px] font-semibold text-[#57544c] uppercase tracking-[0.1em] mb-1.5">Full name</label>
                <input id="reg-full-name" type="text" value={fullName} onChange={(e) => { setError(''); setFullName(e.target.value) }} className="input-field" autoComplete="name" />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-[12px] font-semibold text-[#57544c] uppercase tracking-[0.1em] mb-1.5">Email</label>
                <input id="reg-email" type="email" value={email} onChange={(e) => { setError(''); setEmail(e.target.value) }} className="input-field" autoComplete="email" />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-[12px] font-semibold text-[#57544c] uppercase tracking-[0.1em] mb-1.5">Password</label>
                <div className="relative">
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setError(''); setPassword(e.target.value) }} className="input-field pr-10" maxLength={MAX_PASSWORD_LENGTH} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted hover:text-[#222321]">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                <p className="mt-1.5 text-[11px] text-[#6e6a60]">Use {MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH} characters.</p>
              </div>

              {/* Asked on the form, not buried in settings.
                  A therapist joining is taking a risk her employer will see
                  it, and the honest answer to that is to let her decide
                  before the account exists rather than after. Private is
                  preselected because the wrong default here is not a small
                  inconvenience: it is her job. */}
              <fieldset className="border border-[#dcd4c8] p-4">
                <legend className="px-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[#6e6a60]">Who can see you</legend>
                <p className="text-[12px] leading-relaxed text-[#57544c]">
                  You are private until you choose otherwise, and you can change this at any time.
                </p>
                <div className="mt-3 space-y-2">
                  {(['private', 'discreet', 'open'] as TalentVisibility[]).map(option => (
                    <label key={option}
                      className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${visibility === option ? 'border-[#222321] bg-[#f6f6f6]' : 'border-[#dcd4c8]'}`}>
                      <input
                        type="radio"
                        name="visibility"
                        value={option}
                        checked={visibility === option}
                        onChange={() => setVisibility(option)}
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <span>
                        <span className="block text-[13px] font-semibold text-[#222321]">{VISIBILITY_COPY[option].label}</span>
                        <span className="mt-0.5 block text-[11.5px] leading-5 text-[#57544c]">{VISIBILITY_COPY[option].detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Required, and asked here rather than three screens later.
                  The account is created on this button, so this is where the
                  agreement has to be made - the employer form has always
                  asked at this point and the talent form never did. */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={event => { setError(''); setAgreedTerms(event.target.checked) }}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span className="text-[11.5px] leading-5 text-[#57544c]">
                  I have read and agree to the <Link href="/terms" className="underline text-[#222321]">Terms &amp; Conditions</Link> and <Link href="/privacy" className="underline text-[#222321]">Privacy Policy</Link>.
                </span>
              </label>

              {/* Unticked, always. A pre-ticked box is not consent under the
                  UK GDPR, and the wording shown here is the wording recorded
                  against the account so the two can never disagree. */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={event => setMarketingOptIn(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span className="text-[11.5px] leading-5 text-[#57544c]">
                  {MARKETING_CONSENT_WORDING}
                  {' '}Optional, and separate from the emails needed to run your account.
                </span>
              </label>

              <button type="button" onClick={createAccount} disabled={loading || !agreedTerms} className="w-full bg-[#222321] hover:bg-[#3a4239] text-white px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-40">
                {loading ? 'Creating account...' : 'Create account and build profile'}
              </button>
            </div>

            {refCode && <p className="mt-4 text-[11px] text-[#6e6a60]">Referral code <span className="font-semibold text-[#222321]">{refCode}</span> will be applied to your account.</p>}

            <p className="text-[12.5px] text-[#57544c] mt-5 border-t border-[#dcd4c8] pt-5">
              Would rather not do this yourself?{' '}
              <Link href="/set-up-my-profile" className="font-semibold text-[#222321] underline">Send us your CV and we will build it for you</Link>, free.
            </p>
            <p className="text-[13px] text-muted mt-7">Already have an account? <Link href="/login?role=talent" className="text-[#222321] font-semibold hover:underline">Sign in →</Link></p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-[42%] bg-charcoal relative isolate overflow-hidden items-center">
        <PanelBackdrop panel={site.panels.authPanel} placement="auth_panel" />
        <div className="relative p-12 xl:p-16 max-w-xl w-full">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold mb-4">Talent House Collective</p>
          <p className="text-white text-[30px] leading-tight tracking-[-0.03em] font-serif font-semibold">The professional platform for spa and wellness careers.</p>

          <dl className="mt-10">
            {factRows.map(row => (
              <div key={row.label} className="border-t border-white/15 py-4">
                {row.value ? (
                  <div className="flex items-baseline gap-3">
                    <dt className="sr-only">{row.label}</dt>
                    <dd className="text-[26px] font-serif font-semibold text-white leading-none">{row.value}</dd>
                    <dd className="text-[13px] text-white/70 leading-5">{row.label}</dd>
                  </div>
                ) : (
                  <>
                    <dt className="sr-only">Talent House standard</dt>
                    <dd className="text-[14px] font-serif font-medium text-white/85 leading-6">{row.label}</dd>
                  </>
                )}
              </div>
            ))}
            <div className="border-t border-white/15" />
          </dl>

          <p className="mt-8 text-white/55 text-[13px] leading-6">Live roles, agency cover, residencies and the Academy - one account, one platform.</p>
        </div>
      </div>
    </main>
  )
}
