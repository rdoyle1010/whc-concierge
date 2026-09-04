import { profileDistanceMiles } from './geo.ts'

export type DiscoverableCandidate = {
  id: string
  approval_status?: string | null
  profile_visible?: boolean | null
  stealth_mode?: boolean | null
  travel_radius_miles?: number | null
  latitude?: number | null
  longitude?: number | null
}

/**
 * The one place that decides whether an employer may see a professional.
 *
 * Stealth Mode was missing from this test. The database enforced it, and the
 * app's own copy told the professional it meant "hide me from every
 * employer" - but every server route that actually serves employers uses the
 * service-role client, which bypasses row-level security and comes through
 * here instead. So the control worked only on the paths nobody used and
 * failed on the ones everybody did.
 *
 * Note the asymmetry between the two flags, which is deliberate and matches
 * the database predicate. `profile_visible` is opt-out: null means visible,
 * because most professionals never touch it. `stealth_mode` is opt-in: only
 * an explicit true hides someone, so a null does not quietly remove people
 * from the register.
 */
export function canEmployerDiscoverCandidate(
  candidate: DiscoverableCandidate,
  blockedCandidateIds: ReadonlySet<string>,
): boolean {
  return candidate.approval_status === 'approved'
    && candidate.profile_visible !== false
    && candidate.stealth_mode !== true
    && !blockedCandidateIds.has(candidate.id)
}

export function mutualRadiusResult(
  origin: { latitude?: number | null; longitude?: number | null },
  candidate: DiscoverableCandidate,
  employerRadiusMiles?: number | null,
) {
  const distance = profileDistanceMiles(origin, candidate)
  const employerRadius = employerRadiusMiles && employerRadiusMiles > 0 ? employerRadiusMiles : null
  const candidateRadius = candidate.travel_radius_miles && candidate.travel_radius_miles > 0
    ? candidate.travel_radius_miles
    : null

  if (distance == null) {
    const distanceIsRequired = employerRadius != null || candidateRadius != null
    return {
      distanceMiles: null,
      withinRadius: !distanceIsRequired,
      reason: distanceIsRequired ? 'location_required' : 'distance_unknown',
    } as const
  }

  const withinEmployerRadius = employerRadius == null || distance <= employerRadius
  const withinCandidateRadius = candidateRadius == null || distance <= candidateRadius
  return {
    distanceMiles: Math.round(distance * 10) / 10,
    withinRadius: withinEmployerRadius && withinCandidateRadius,
    reason: withinEmployerRadius && withinCandidateRadius
      ? 'within_both_radii'
      : !withinCandidateRadius
        ? 'outside_talent_radius'
        : 'outside_employer_radius',
  } as const
}

export function travelAccessSummary(profile: {
  commute_car_required?: boolean | null
  nearest_transport?: string | null
  transport_walk_minutes?: number | null
  parking_available?: boolean | null
  taxi_support?: boolean | null
  taxi_notes?: string | null
  travel_notes?: string | null
}) {
  const parts: string[] = []
  if (profile.nearest_transport) {
    const walk = profile.transport_walk_minutes
      ? ` (${profile.transport_walk_minutes} min walk)`
      : ''
    parts.push(`Nearest public transport: ${profile.nearest_transport}${walk}`)
  }
  if (profile.commute_car_required) parts.push('A car is required')
  else if (profile.parking_available) parts.push('Parking is available')
  if (profile.taxi_support) parts.push(profile.taxi_notes || 'Taxi or shuttle support is available')
  if (profile.travel_notes) parts.push(profile.travel_notes)
  return parts
}
