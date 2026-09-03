// Where Talent House operates, and which of its three products work there.
//
// The three lines are not equally portable, and pretending otherwise is a
// legal problem rather than a product one.
//
// AGENCY is UK only, and that is not squeamishness. Placing somebody into a
// shift makes Talent House an employment business, which in the UK means the
// Conduct of Employment Agencies and Employment Businesses Regulations 2003,
// and abroad means a licence in most of the markets worth having - the AUeG
// in Germany, WAADI in the Netherlands, an ETT licence in Spain, MOHRE
// approval in the UAE. Right-to-work checking is Home Office machinery and
// stops at the border too. Each new country is a legal build, not a config
// change, so agency stays home until one is deliberately paid for.
//
// ROLES, RESIDENCY and CONSULTANCY are advertising and introduction. The
// property employs or contracts directly, does its own right-to-work checking
// and carries its own payroll. That travels anywhere, and it is where the
// inbound demand is coming from.
//
// The one to watch is Residency. It is safe worldwide while Talent House
// introduces and the property contracts. The moment Talent House contracts
// the professional and supplies them, it is an employment business again and
// the agency reasoning above applies in full.

export type ProductLine = 'agency' | 'roles' | 'residency' | 'consultancy'

export type Country = {
  code: string
  name: string
  region: string
}

// Ordered by where luxury spa and wellness hiring actually happens, grouped so
// a long select is scannable rather than alphabetical from Antigua.
export const COUNTRIES: Country[] = [
  { code: 'GB', name: 'United Kingdom', region: 'United Kingdom & Ireland' },
  { code: 'IE', name: 'Ireland', region: 'United Kingdom & Ireland' },

  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'ES', name: 'Spain', region: 'Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe' },
  { code: 'IT', name: 'Italy', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', region: 'Europe' },
  { code: 'AT', name: 'Austria', region: 'Europe' },
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', region: 'Europe' },
  { code: 'BE', name: 'Belgium', region: 'Europe' },
  { code: 'MC', name: 'Monaco', region: 'Europe' },
  { code: 'GR', name: 'Greece', region: 'Europe' },
  { code: 'HR', name: 'Croatia', region: 'Europe' },
  { code: 'ME', name: 'Montenegro', region: 'Europe' },
  { code: 'CY', name: 'Cyprus', region: 'Europe' },
  { code: 'MT', name: 'Malta', region: 'Europe' },
  { code: 'TR', name: 'Turkey', region: 'Europe' },
  { code: 'IS', name: 'Iceland', region: 'Europe' },
  { code: 'NO', name: 'Norway', region: 'Europe' },
  { code: 'SE', name: 'Sweden', region: 'Europe' },
  { code: 'DK', name: 'Denmark', region: 'Europe' },
  { code: 'FI', name: 'Finland', region: 'Europe' },

  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East' },
  { code: 'QA', name: 'Qatar', region: 'Middle East' },
  { code: 'OM', name: 'Oman', region: 'Middle East' },
  { code: 'BH', name: 'Bahrain', region: 'Middle East' },
  { code: 'KW', name: 'Kuwait', region: 'Middle East' },
  { code: 'JO', name: 'Jordan', region: 'Middle East' },

  { code: 'MV', name: 'Maldives', region: 'Asia & Indian Ocean' },
  { code: 'TH', name: 'Thailand', region: 'Asia & Indian Ocean' },
  { code: 'ID', name: 'Indonesia', region: 'Asia & Indian Ocean' },
  { code: 'SG', name: 'Singapore', region: 'Asia & Indian Ocean' },
  { code: 'MY', name: 'Malaysia', region: 'Asia & Indian Ocean' },
  { code: 'VN', name: 'Vietnam', region: 'Asia & Indian Ocean' },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia & Indian Ocean' },
  { code: 'IN', name: 'India', region: 'Asia & Indian Ocean' },
  { code: 'MU', name: 'Mauritius', region: 'Asia & Indian Ocean' },
  { code: 'SC', name: 'Seychelles', region: 'Asia & Indian Ocean' },
  { code: 'HK', name: 'Hong Kong', region: 'Asia & Indian Ocean' },
  { code: 'JP', name: 'Japan', region: 'Asia & Indian Ocean' },
  { code: 'CN', name: 'China', region: 'Asia & Indian Ocean' },

  { code: 'ZA', name: 'South Africa', region: 'Africa' },
  { code: 'MA', name: 'Morocco', region: 'Africa' },
  { code: 'EG', name: 'Egypt', region: 'Africa' },
  { code: 'TZ', name: 'Tanzania', region: 'Africa' },
  { code: 'KE', name: 'Kenya', region: 'Africa' },

  { code: 'US', name: 'United States', region: 'Americas & Caribbean' },
  { code: 'CA', name: 'Canada', region: 'Americas & Caribbean' },
  { code: 'MX', name: 'Mexico', region: 'Americas & Caribbean' },
  { code: 'BB', name: 'Barbados', region: 'Americas & Caribbean' },
  { code: 'LC', name: 'Saint Lucia', region: 'Americas & Caribbean' },
  { code: 'AG', name: 'Antigua & Barbuda', region: 'Americas & Caribbean' },
  { code: 'BS', name: 'Bahamas', region: 'Americas & Caribbean' },
  { code: 'JM', name: 'Jamaica', region: 'Americas & Caribbean' },
  { code: 'TC', name: 'Turks & Caicos', region: 'Americas & Caribbean' },
  { code: 'BR', name: 'Brazil', region: 'Americas & Caribbean' },

  { code: 'AU', name: 'Australia', region: 'Oceania' },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania' },
  { code: 'FJ', name: 'Fiji', region: 'Oceania' },
]

export const DEFAULT_COUNTRY = 'GB'

const BY_CODE = new Map(COUNTRIES.map(country => [country.code, country]))

// Free-text country names are already on live rows - 'United Kingdom' from a
// column default, 'UK' and 'England' typed by people. Matching on the raw
// string means a candidate in 'UK' never matches a role in 'United Kingdom',
// which reads as no results rather than as a data problem.
const ALIASES: Record<string, string> = {
  'UK': 'GB', 'U.K.': 'GB', 'GREAT BRITAIN': 'GB', 'ENGLAND': 'GB', 'SCOTLAND': 'GB',
  'WALES': 'GB', 'NORTHERN IRELAND': 'GB', 'BRITAIN': 'GB', 'UNITED KINGDOM': 'GB',
  'UAE': 'AE', 'U.A.E.': 'AE', 'DUBAI': 'AE', 'ABU DHABI': 'AE', 'EMIRATES': 'AE',
  'USA': 'US', 'U.S.A.': 'US', 'AMERICA': 'US', 'UNITED STATES OF AMERICA': 'US',
  'KSA': 'SA', 'HOLLAND': 'NL', 'BALI': 'ID', 'IRELAND (REPUBLIC)': 'IE',
  'REPUBLIC OF IRELAND': 'IE', 'EIRE': 'IE',
}

/** A country code from anything a person or an old row might hold. Null if unknown. */
export function countryCode(raw: string | null | undefined): string | null {
  const value = String(raw || '').trim()
  if (!value) return null
  const upper = value.toUpperCase()
  if (BY_CODE.has(upper)) return upper
  if (ALIASES[upper]) return ALIASES[upper]
  const byName = COUNTRIES.find(country => country.name.toUpperCase() === upper)
  return byName ? byName.code : null
}

export function countryName(raw: string | null | undefined): string | null {
  const code = countryCode(raw)
  return code ? BY_CODE.get(code)?.name || null : null
}

export function isUnitedKingdom(raw: string | null | undefined): boolean {
  // An empty country means a row created before this existed, and every one of
  // those is British - the column defaulted to United Kingdom and the platform
  // took no one else. Treating blank as "not UK" would remove agency from the
  // people who already use it.
  const value = String(raw || '').trim()
  if (!value) return true
  return countryCode(value) === 'GB'
}

/** Whether two locations are close enough that a distance in miles means anything. */
export function comparableLocations(a: string | null | undefined, b: string | null | undefined): boolean {
  const first = countryCode(a) || DEFAULT_COUNTRY
  const second = countryCode(b) || DEFAULT_COUNTRY
  return first === second
}

// Agency is the only line with a border. The others are advertising and
// introduction, and they travel.
const UK_ONLY: ProductLine[] = ['agency']

export function productAvailableIn(product: ProductLine, country: string | null | undefined): boolean {
  if (!UK_ONLY.includes(product)) return true
  return isUnitedKingdom(country)
}

/** Why a product is unavailable, in words a member should read rather than an error code. */
export function unavailableReason(product: ProductLine): string {
  if (product !== 'agency') return ''
  return 'Agency Cover is available in the United Kingdom only. Placing somebody into a shift makes us an '
    + 'employment business, which is licensed country by country. Roles, Residency and Consultancy are open '
    + 'to you wherever you are.'
}

export function countriesByRegion(): { region: string; countries: Country[] }[] {
  const regions: string[] = []
  for (const country of COUNTRIES) if (!regions.includes(country.region)) regions.push(country.region)
  return regions.map(region => ({ region, countries: COUNTRIES.filter(country => country.region === region) }))
}
