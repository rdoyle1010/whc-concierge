// The exact words somebody agreed to, and the version of the policy they
// agreed to it under.
//
// Held apart from the rest of privacy-consent.ts, which sends email and signs
// tokens with node:crypto. Two client pages import the wording, and importing
// it from there dragged the email sender and the service-role client it
// reaches into a browser bundle. That is not a style point: the same shape of
// import, one module over, took the shop down.
//
// These four strings are the consent record. They are quoted back in the
// preference centre, in the unsubscribe confirmation and in the audit trail,
// so they live in one place and change deliberately.

export const PRIVACY_POLICY_VERSION = '2026-08-26'

export const MARKETING_CONSENT_WORDING = 'I would like Talent House Collective (Wellness House Collective Ltd) to send me marketing emails about jobs, Academy courses, platform features, events and relevant Talent House services. I can unsubscribe at any time.'

export const TERMS_ACCEPTANCE_WORDING = 'I have read and agree to the Talent House Collective Terms & Conditions and Privacy Policy.'

export const NEWSLETTER_CONSENT_WORDING = 'I would like Talent House Collective (Wellness House Collective Ltd) to email me its newsletter, including industry news, jobs, Academy updates, events and relevant Talent House services. I can unsubscribe at any time.'
