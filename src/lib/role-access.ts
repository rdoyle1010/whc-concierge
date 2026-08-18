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
    return pathname.startsWith('/admin') || pathname.startsWith('/employer') || pathname.startsWith('/hotel') || pathname.startsWith('/talent') || pathname === '/roles/match'
  }
  if (role === 'employer') return pathname.startsWith('/employer') || pathname.startsWith('/hotel')
  return pathname.startsWith('/talent') || pathname === '/roles/match'
}

export function canCompleteRegistration(existingRole: unknown, registration: RegistrationAccount): boolean {
  const role = normaliseAccountRole(existingRole)
  if (!role) return true
  return registration === 'employer' ? role === 'employer' : role === 'candidate'
}
