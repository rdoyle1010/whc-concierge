import { calculateProfileStrength } from '@/lib/profile-strength'

// The email an hour after somebody signs up.
//
// A platform with six things in it is a platform somebody bounces off. They
// arrive for one reason - a job, a therapist, a shift - fill in half a profile,
// and never find the other five. An hour later is the right moment: long
// enough that the welcome email has been read and they have had a look round,
// short enough that they still remember signing up.
//
// One email, written for the door they came in through. Not a tour of
// everything: the two or three things that make the platform work for them,
// and the offer of a person if they would rather not do it themselves.

export type OnboardingAudience = 'talent' | 'employer' | 'consultant' | 'residency' | 'agency'

const SITE = 'https://talenthousecollective.co.uk'

export type OnboardingContext = {
  firstName: string
  audience: OnboardingAudience
  /** How complete their profile is, when there is one to measure. */
  strength?: { score: number; missing: string[] } | null
  /** The hand-holding offer, while it is still open. */
  setupOfferOpen: boolean
  /**
   * True on the intended hour-after send. False when the sweep is catching up
   * on somebody who signed up before this existed, because telling a person
   * who joined last week that they signed up an hour ago reads as a machine
   * talking to itself.
   */
  justSignedUp?: boolean
}

type Step = { title: string; text: string; href: string; cta: string }

function stepsFor(audience: OnboardingAudience): Step[] {
  if (audience === 'employer') {
    return [
      {
        title: 'Post your first role',
        text: 'It is free this month. The more you tell us about the role - treatments, systems, product houses, the level you are really open to - the better the matching gets, because that is what it scores against.',
        href: `${SITE}/employer/post-role`, cta: 'Post a role',
      },
      {
        title: 'Fill in your property',
        text: 'Photographs, your spa\'s size, the brands you stock, what it is like to work there. A professional deciding whether to apply is reading this, and an empty property page loses good people to a better-presented one.',
        href: `${SITE}/employer/profile`, cta: 'Complete your property',
      },
      {
        title: 'Look at who is already here',
        text: 'Discover Talent ranks the register against your live roles rather than showing you a list. You can register interest before anybody applies.',
        href: `${SITE}/employer/candidates`, cta: 'See the talent',
      },
      {
        title: 'Cover a shift without hiring',
        text: 'Agency puts verified freelance professionals in front of you for a single day. Useful long before you need a permanent hire.',
        href: `${SITE}/agency/about`, cta: 'How Agency works',
      },
    ]
  }

  if (audience === 'consultant') {
    return [
      {
        title: 'Finish your listing',
        text: 'What you do, who you have done it for, and what a project with you actually looks like. Specific beats impressive: "opened four spas in the Middle East" gets more calls than "strategic wellness consultant".',
        href: `${SITE}/talent/consultancy`, cta: 'Complete my listing',
      },
      {
        title: 'It costs nothing to be listed',
        text: 'Getting your name in front of the right people is the hard part of consulting, and we are not charging you for it.',
        href: `${SITE}/consultancy`, cta: 'See the directory',
      },
    ]
  }

  if (audience === 'residency') {
    return [
      {
        title: 'Set out what you offer',
        text: 'Your specialism, where you will travel, how long you want to stay and what you charge. Properties book residencies months ahead, so the detail is what gets you on next season\'s list.',
        href: `${SITE}/talent/residency`, cta: 'Complete my listing',
      },
      {
        title: 'See who is looking',
        text: 'Residency is where properties find a specialist for a season rather than a shift.',
        href: `${SITE}/residency`, cta: 'Browse residencies',
      },
    ]
  }

  const talent: Step[] = [
    {
      title: 'Finish your profile',
      text: 'This is the whole thing. Talent House matches on what you can actually do - treatments, qualifications, product houses, systems, how far you will travel - not on the words in a CV. A half-finished profile is invisible to the matching, however good you are.',
      href: `${SITE}/talent/profile`, cta: 'Complete my profile',
    },
    {
      title: 'Two Academy courses are already yours',
      text: 'They are sitting in your Academy now, including the Carol Joy London Masterclass. Certificates an employer can verify, which is the part that counts.',
      href: `${SITE}/talent/academy`, cta: 'Open my Academy',
    },
    {
      title: 'Decide how visible you want to be',
      text: 'Private Career Mode lets properties find you without seeing your name until you agree to an introduction. Worth setting up before you look, not after.',
      href: `${SITE}/talent/privacy`, cta: 'Privacy settings',
    },
    {
      title: 'Pick up a shift while you look',
      text: 'Agency is single days at real properties, at a rate you set. You keep the whole rate; the property pays our fee on top.',
      href: `${SITE}/talent/agency/settings`, cta: 'Set my availability',
    },
  ]

  // Somebody who has already ticked themselves available for shifts came here
  // for the shifts. Lead with them; the profile still matters, and still sits
  // directly underneath.
  if (audience === 'agency') return [talent[3], talent[0], talent[1], talent[2]]
  return talent
}

export function onboardingSubject(context: OnboardingContext): string {
  if (context.audience === 'employer') return 'Getting the most out of Talent House'
  if (context.audience === 'consultant') return 'Your consultancy listing, and how to make it work'
  if (context.audience === 'residency') return 'Your residency listing, and how to make it work'
  if (context.audience === 'agency') return 'Getting shifts through Talent House'
  return 'Three things worth doing on Talent House'
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function onboardingEmailHtml(context: OnboardingContext): string {
  const steps = stepsFor(context.audience)
  const name = escape(context.firstName || 'there')

  // Said plainly rather than as a progress bar. Somebody at 30% does not need
  // a chart, they need to know which two things are worth ten minutes.
  const strength = context.strength
  const strengthBlock = strength && strength.score < 100
    ? `<div style="border:1px solid #dddddd;background:#f1f1f1;padding:18px 20px;margin:0 0 24px;">
         <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b6b;">Where you are</p>
         <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:#1c1c1c;">Your profile is <strong>${strength.score}% complete</strong>.${
           strength.missing.length
             ? ` The next things worth adding are ${escape(strength.missing.slice(0, 3).map(item => item.toLowerCase()).join(', '))}.`
             : ''
         }</p>
       </div>`
    : ''

  const setupBlock = context.setupOfferOpen
    ? `<div style="border:1px solid #1c1c1c;padding:18px 20px;margin:24px 0 0;">
         <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#1c1c1c;">Or we will do it for you</p>
         <p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:#1c1c1c;">
           You are one of the first fifty people here, and for the first fifty we will set the whole thing up ourselves.
           Send us what you have - a CV, an old profile, a few lines in an email - and we will build it properly and send it
           back for you to approve. No charge, and no catch.
         </p>
         <p style="margin:14px 0 0;">
           <a href="mailto:hello@talenthousecollective.co.uk?subject=Please%20set%20my%20profile%20up"
              style="display:inline-block;background:#1c1c1c;color:#ffffff;text-decoration:none;padding:11px 20px;font-size:13px;font-weight:600;">Ask us to set it up</a>
         </p>
       </div>`
    : ''

  const stepsHtml = steps.map((step, index) => `
    <div style="border-top:1px solid #dddddd;padding:20px 0 0;margin:20px 0 0;">
      <p style="margin:0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6b6b6b;">${String(index + 1).padStart(2, '0')}</p>
      <p style="margin:6px 0 0;font-size:17px;font-weight:600;color:#1c1c1c;">${escape(step.title)}</p>
      <p style="margin:8px 0 0;font-size:15px;line-height:1.7;color:#3a3a3a;">${escape(step.text)}</p>
      <p style="margin:14px 0 0;">
        <a href="${step.href}" style="font-size:13px;font-weight:600;color:#1c1c1c;text-decoration:underline;">${escape(step.cta)}</a>
      </p>
    </div>`).join('')

  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:580px;margin:32px auto;border:1px solid #dddddd;">
      <div style="background:#262626;padding:26px 32px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;opacity:.75;">Talent House Collective</p>
        <p style="margin:0;color:#ffffff;font-size:23px;font-weight:600;">Welcome in, ${name}</p>
      </div>
      <div style="padding:28px 32px;">
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#3a3a3a;">
          ${context.justSignedUp === false
            ? 'You have an account with us, so here is the short version of what is worth doing first.'
            : 'You signed up an hour or so ago, so here is the short version of what is worth doing first.'}
          Nothing here takes long, and each one changes what the platform can do for you.
        </p>
        ${strengthBlock}
        ${stepsHtml}
        ${setupBlock}
        <p style="margin:28px 0 0;font-size:14px;line-height:1.7;color:#3a3a3a;">
          If anything does not make sense, reply to this email. It comes to us, and we answer.
        </p>
        <p style="margin:26px 0 0;font-size:12px;color:#6b6b6b;">Talent House Collective &middot; talenthousecollective.co.uk</p>
      </div>
    </div>
  </body></html>`
}

/** The audience an account belongs to, from what it actually is. */
export function audienceFor(opts: {
  role?: string | null
  accountFocus?: string | null
  hasResidencyListing?: boolean
  agencyAvailable?: boolean | null
}): OnboardingAudience {
  if (String(opts.role || '') === 'employer') return 'employer'
  if (String(opts.accountFocus || '') === 'consultant') return 'consultant'
  if (opts.hasResidencyListing) return 'residency'
  if (opts.agencyAvailable === true) return 'agency'
  return 'talent'
}

export { calculateProfileStrength }
