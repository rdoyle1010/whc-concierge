// What a role pays, in the money it actually pays in.
//
// Every salary on the platform was hardcoded to pounds. That was correct while
// the platform was British and became a liability the moment it was not: a
// senior therapist role in Hong Kong at HK$45,000 rendered as "£45,000" - out
// by roughly a factor of ten, in the direction that makes the offer look
// absurd. A therapist reads it and dismisses a good role; a hotel reads it and
// dismisses the platform.
//
// No conversion happens anywhere. Rates move, a stored conversion goes stale
// the day after it is written, and a salary quoted in the wrong currency at
// yesterday's rate is worse than one quoted plainly in its own. The number a
// property types is the number a professional sees, with the right symbol in
// front of it.

import { countryCode, DEFAULT_COUNTRY } from './countries'

export type Currency = {
  code: string
  symbol: string
  name: string
}

export const CURRENCIES: Currency[] = [
  { code: 'GBP', symbol: '£', name: 'British pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US dollar' },
  { code: 'AED', symbol: 'AED ', name: 'UAE dirham' },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi riyal' },
  { code: 'QAR', symbol: 'QAR ', name: 'Qatari riyal' },
  { code: 'OMR', symbol: 'OMR ', name: 'Omani rial' },
  { code: 'BHD', symbol: 'BHD ', name: 'Bahraini dinar' },
  { code: 'KWD', symbol: 'KWD ', name: 'Kuwaiti dinar' },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss franc' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai baht' },
  { code: 'IDR', symbol: 'Rp ', name: 'Indonesian rupiah' },
  { code: 'MYR', symbol: 'RM ', name: 'Malaysian ringgit' },
  { code: 'INR', symbol: '₹', name: 'Indian rupee' },
  { code: 'LKR', symbol: 'LKR ', name: 'Sri Lankan rupee' },
  { code: 'MUR', symbol: 'MUR ', name: 'Mauritian rupee' },
  { code: 'ZAR', symbol: 'R ', name: 'South African rand' },
  { code: 'MAD', symbol: 'MAD ', name: 'Moroccan dirham' },
  { code: 'EGP', symbol: 'EGP ', name: 'Egyptian pound' },
  { code: 'TRY', symbol: '₺', name: 'Turkish lira' },
  { code: 'JPY', symbol: '¥', name: 'Japanese yen' },
  { code: 'CNY', symbol: 'CN¥', name: 'Chinese yuan' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian real' },
  { code: 'NOK', symbol: 'NOK ', name: 'Norwegian krone' },
  { code: 'SEK', symbol: 'SEK ', name: 'Swedish krona' },
  { code: 'DKK', symbol: 'DKK ', name: 'Danish krone' },
  { code: 'ISK', symbol: 'ISK ', name: 'Icelandic krona' },
]

export const DEFAULT_CURRENCY = 'GBP'

const BY_CODE = new Map(CURRENCIES.map(currency => [currency.code, currency]))

// The currency a property in each country would quote in. A default, never a
// rule: a Maldives resort quoting in dollars and a Swiss hotel quoting in euros
// are both ordinary, so the form lets them change it.
const BY_COUNTRY: Record<string, string> = {
  GB: 'GBP',
  IE: 'EUR', FR: 'EUR', ES: 'EUR', PT: 'EUR', IT: 'EUR', AT: 'EUR', DE: 'EUR',
  NL: 'EUR', BE: 'EUR', MC: 'EUR', GR: 'EUR', HR: 'EUR', ME: 'EUR', CY: 'EUR', MT: 'EUR',
  FI: 'EUR',
  CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', IS: 'ISK', TR: 'TRY',
  AE: 'AED', SA: 'SAR', QA: 'QAR', OM: 'OMR', BH: 'BHD', KW: 'KWD', JO: 'USD',
  // Maldives resorts price in dollars, not rufiyaa, and every offer letter
  // reflects that.
  MV: 'USD',
  TH: 'THB', ID: 'IDR', SG: 'SGD', MY: 'MYR', VN: 'USD', LK: 'LKR', IN: 'INR',
  MU: 'MUR', SC: 'USD', HK: 'HKD', JP: 'JPY', CN: 'CNY',
  ZA: 'ZAR', MA: 'MAD', EG: 'EGP', TZ: 'USD', KE: 'USD',
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL',
  BB: 'USD', LC: 'USD', AG: 'USD', BS: 'USD', JM: 'USD', TC: 'USD',
  AU: 'AUD', NZ: 'NZD', FJ: 'USD',
}

export function currencyForCountry(country: string | null | undefined): string {
  const code = countryCode(country) || DEFAULT_COUNTRY
  return BY_COUNTRY[code] || DEFAULT_CURRENCY
}

export function currencySymbol(code: string | null | undefined): string {
  return BY_CODE.get(String(code || '').toUpperCase())?.symbol || '£'
}

export function currencyName(code: string | null | undefined): string {
  return BY_CODE.get(String(code || '').toUpperCase())?.name || 'British pound'
}

/**
 * A salary range, written the way the property quoted it.
 *
 * Thousands are abbreviated only where that reads naturally. "¥4.8m" is how a
 * Japanese salary is spoken and "Rp 120m" an Indonesian one, but a currency
 * whose unit is large - a dinar, a rial - is quoted in full, because "OMR 1.2k"
 * is nobody's idea of a salary.
 */
export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency?: string | null,
  options?: { abbreviate?: boolean },
): string | null {
  const symbol = currencySymbol(currency)
  const low = Number(min) || 0
  const high = Number(max) || 0
  if (!low && !high) return null

  const abbreviate = options?.abbreviate !== false
  const write = (value: number) => {
    // Below ten thousand an abbreviation loses more than it saves: "£8k" hides
    // whether the role pays 8,000 or 8,499, and at that end of the range the
    // difference matters to the person reading it.
    if (abbreviate && value >= 10_000 && value % 1000 === 0) return `${symbol}${value / 1000}k`
    if (abbreviate && value >= 10_000) return `${symbol}${Math.round(value / 1000)}k`
    return `${symbol}${value.toLocaleString('en-GB')}`
  }

  if (low && high) return low === high ? write(low) : `${write(low)} - ${write(high)}`
  return low ? `From ${write(low)}` : `Up to ${write(high)}`
}

/** The same, spelled out in full - for an offer, a contract or an invoice. */
export function formatExact(value: number | null | undefined, currency?: string | null): string {
  return `${currencySymbol(currency)}${(Number(value) || 0).toLocaleString('en-GB')}`
}
