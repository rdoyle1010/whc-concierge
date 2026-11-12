// The two QA accounts, in one place.
//
// Absent credentials are a skip, not a failure: a suite that goes red on every
// machine with no business holding a password is a suite people stop reading.

export type Account = { email: string; password: string }

export const TALENT_STATE = 'e2e/.auth/talent.json'
export const EMPLOYER_STATE = 'e2e/.auth/employer.json'

export function account(role: 'TALENT' | 'EMPLOYER'): Account | null {
  const email = process.env[`E2E_${role}_EMAIL`]
  const password = process.env[`E2E_${role}_PASSWORD`]
  return email && password ? { email, password } : null
}

export const MISSING = (role: string) =>
  `No ${role} QA account configured. Set E2E_${role.toUpperCase()}_EMAIL and ` +
  `E2E_${role.toUpperCase()}_PASSWORD to check the signed-in journeys.`
