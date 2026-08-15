export type AccountRole = 'admin' | 'employer' | 'candidate'
export type RegistrationAccount = 'talent' | 'employer'

export function normaliseAccountRole(role: unknown): AccountRole | null {
  if (role === 'admin' || role === 'employer') return role
  if (role === 'candidate' || role === 'talent') return 'candidate'
  return null
}

export function dashboardForRole(role: AccountRole): string {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'employer') return '/employer/dashboard'
  return '/talent/dashboard'
}

export function canRoleAccessPath(role: AccountRole, pathname: string): boolean {
  if (role === 'admin') {
    return pathname.startsWith('/admin') || pathname.startsWith('/employer') || pathname.startsWith('/hotel') || pathname.startsWith('/talent')
  }
  if (role === 'employer') return pathname.startsWith('/employer') || pathname.startsWith('/hotel')
  return pathname.startsWith('/talent')
}

// A registration may complete when the shared profile does not exist yet, or
// when it already has the same authoritative role. It may never convert an
// existing talent account into an employer account (or vice versa).
export function canCompleteRegistration(existingRole: unknown, registration: RegistrationAccount): boolean {
  const role = normaliseAccountRole(existingRole)
  if (!role) return true
  return registration === 'employer' ? role === 'employer' : role === 'candidate'
}
