// One marketplace, several doors. A door is the part of the industry someone
// is hiring in or working in; a sector is the specific trade inside it. Every
// role has exactly one sector, a professional has as many as they work in,
// and Agency prices each one separately.
//
// is_live is the only gate. A door or sector that is not live never reaches a
// form, a filter or a public page, so the whole of Hospitality can sit in the
// database, fully wired, until there are employers behind it.

export type Door = {
  id: string
  slug: string
  label: string
  sort_order: number
  is_live: boolean
}

export type Sector = {
  id: string
  slug: string
  label: string
  door_id: string | null
  sort_order: number
  is_live: boolean
}

export type RateCard = {
  sector_id: string
  min_hourly_rate: number
  platform_fee_pct: number
  min_shift_minutes: number
}

export type Taxonomy = { doors: Door[]; sectors: Sector[] }

export type SectorGroup = { door: Door; sectors: Sector[] }

/** The sector every role posted before Phase 0 belongs to. */
export const DEFAULT_SECTOR_SLUG = 'spa'

export function liveDoors(taxonomy: Taxonomy): Door[] {
  return taxonomy.doors.filter(door => door.is_live).sort(bySortOrder)
}

/** Live sectors in a live door. A live sector in a dark door stays dark. */
export function liveSectorsForDoor(taxonomy: Taxonomy, doorId: string): Sector[] {
  const door = taxonomy.doors.find(item => item.id === doorId)
  if (!door?.is_live) return []
  return taxonomy.sectors
    .filter(sector => sector.is_live && sector.door_id === doorId)
    .sort(bySortOrder)
}

/**
 * Everything selectable, grouped by door, in display order. Used by the
 * profile's multi-select and by any filter that shows the whole taxonomy at
 * once. Sectors with no door - Education - are deliberately excluded: until
 * one is chosen there is nowhere to show them.
 */
export function liveSectorGroups(taxonomy: Taxonomy): SectorGroup[] {
  return liveDoors(taxonomy)
    .map(door => ({ door, sectors: liveSectorsForDoor(taxonomy, door.id) }))
    .filter(group => group.sectors.length > 0)
}

/** True when this sector may be chosen: itself live, and inside a live door. */
export function isSectorSelectable(taxonomy: Taxonomy, sectorId: string): boolean {
  const sector = taxonomy.sectors.find(item => item.id === sectorId)
  if (!sector?.is_live) return false
  if (!sector.door_id) return false
  return Boolean(taxonomy.doors.find(door => door.id === sector.door_id)?.is_live)
}

function bySortOrder(a: { sort_order: number; label: string }, b: { sort_order: number; label: string }) {
  return a.sort_order - b.sort_order || a.label.localeCompare(b.label)
}

/**
 * Which door a sector belongs to, by slug.
 *
 * The job form asks for a door before a sector, but a saved role only stores
 * the sector - the door is implied. Anything editing a role afterwards has to
 * work back the other way, and the shape of the form depends on the answer.
 */
export function doorSlugForSector(taxonomy: Taxonomy, sectorId: string | null | undefined): string | null {
  if (!sectorId) return null
  const sector = taxonomy.sectors.find(s => s.id === sectorId || s.slug === sectorId)
  if (!sector?.door_id) return null
  return taxonomy.doors.find(d => d.id === sector.door_id)?.slug || null
}
