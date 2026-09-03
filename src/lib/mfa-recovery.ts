import { createHash, randomBytes, timingSafeEqual } from 'crypto'

// Recovery codes for two-step verification.
//
// Two-step verification is now enforced on every page and every API route,
// which is right - but on its own it means a professional who loses or wipes
// their phone is permanently locked out of their own account: their
// applications, their Agency earnings, their Residency bookings, all of it,
// with no self-service route and no admin unlock. Closing a security hole by
// creating a way to destroy somebody's livelihood is not a trade worth making.
//
// So enrolment now issues ten single-use recovery codes. Redeeming one
// removes the authenticator from the account, which lets the person back in
// on their password alone and prompts them to enrol again. That is the
// standard shape, and the security reasoning holds: redeeming a code requires
// BOTH a valid password session and a secret that was only ever shown once,
// so it is still two factors.
//
// Only hashes are stored. Talent House cannot read a recovery code, cannot email one
// back to somebody who lost them, and a database leak yields nothing usable.

export const RECOVERY_CODE_COUNT = 10

/** Ten characters from an unambiguous alphabet, shown as XXXXX-XXXXX. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(10)
    let code = ''
    for (let c = 0; c < 10; c++) code += ALPHABET[bytes[c] % ALPHABET.length]
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`)
  }
  return codes
}

/** Normalised so a person can type it in lower case, with or without the dash. */
export function normaliseRecoveryCode(input: string): string {
  return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function hashRecoveryCode(code: string, userId: string): string {
  // Salted with the user id so an identical code on two accounts does not
  // produce an identical hash, and a stolen hash cannot be replayed elsewhere.
  return createHash('sha256').update(`${userId}:${normaliseRecoveryCode(code)}`).digest('hex')
}

export function recoveryCodeMatches(candidateHash: string, storedHash: string): boolean {
  const a = Buffer.from(candidateHash)
  const b = Buffer.from(storedHash)
  return a.length === b.length && timingSafeEqual(a, b)
}
