// Who the seller is, on every document that leaves the platform.
//
// A hotel's accounts payable team does not pay a website. It pays a legal
// entity with a company number and a registered office, and it files the
// document against a purchase order. A receipt that says only "Wellness House
// Collective" and a domain gets bounced back, and the delay is not the
// hotel being difficult - their auditors require it.
//
// VAT matters more than it looks. Below the registration threshold an invoice
// must not show VAT and should say so plainly; above it, every document needs
// a VAT number and a VAT line, and issuing one without is an error worth
// money. So the position is a setting Rebecca changes on the day she
// registers, never a sentence hardcoded into a page.

export type VatMode = 'not_registered' | 'registered'

export type BillingIdentity = {
  legalName: string
  tradingName: string
  companyNumber: string
  registeredAddress: string
  vatMode: VatMode
  vatNumber: string
  vatRatePct: number
  billingEmail: string
  paymentTermsDays: number
  bankName: string
  bankAccountName: string
  bankSortCode: string
  bankAccountNumber: string
}

// Deliberately blank rather than invented. A placeholder company number on a
// real invoice is worse than an obvious gap: it looks correct and is not.
export const DEFAULT_BILLING_IDENTITY: BillingIdentity = {
  legalName: '',
  tradingName: 'Talent House Collective',
  companyNumber: '',
  registeredAddress: '',
  vatMode: 'not_registered',
  vatNumber: '',
  vatRatePct: 20,
  billingEmail: '',
  paymentTermsDays: 14,
  bankName: '',
  bankAccountName: '',
  bankSortCode: '',
  bankAccountNumber: '',
}

const str = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, 300) : fallback

export function parseBillingIdentity(value: unknown): BillingIdentity {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const vatMode: VatMode = raw.vatMode === 'registered' ? 'registered' : 'not_registered'
  const termsDays = Number(raw.paymentTermsDays)
  const vatRate = Number(raw.vatRatePct)
  return {
    legalName: str(raw.legalName, DEFAULT_BILLING_IDENTITY.legalName),
    tradingName: str(raw.tradingName, DEFAULT_BILLING_IDENTITY.tradingName),
    companyNumber: str(raw.companyNumber),
    registeredAddress: str(raw.registeredAddress),
    vatMode,
    // A VAT number only means anything alongside a registered position, and a
    // stale one left behind after deregistering would be printed as fact.
    vatNumber: vatMode === 'registered' ? str(raw.vatNumber) : '',
    vatRatePct: Number.isFinite(vatRate) && vatRate >= 0 && vatRate <= 100 ? vatRate : 20,
    billingEmail: str(raw.billingEmail),
    paymentTermsDays: Number.isFinite(termsDays) && termsDays >= 0 && termsDays <= 120 ? Math.round(termsDays) : 14,
    bankName: str(raw.bankName),
    bankAccountName: str(raw.bankAccountName),
    bankSortCode: str(raw.bankSortCode),
    bankAccountNumber: str(raw.bankAccountNumber),
  }
}

/** The name that should head a document: the legal entity where one is set. */
export function documentSellerName(identity: BillingIdentity): string {
  return identity.legalName || identity.tradingName || 'Talent House Collective'
}

/**
 * The VAT sentence for the foot of a document. Never invents a position: with
 * no VAT number recorded against a registered seller it says nothing at all,
 * because a wrong VAT statement is a worse document than a quiet one.
 */
export function vatStatement(identity: BillingIdentity): string {
  if (identity.vatMode === 'registered') {
    return identity.vatNumber ? `VAT registered. VAT number ${identity.vatNumber}.` : ''
  }
  return 'Not VAT registered - no VAT has been charged on this document.'
}

/**
 * What a hotel's accounts payable team needs to file the document: who they
 * bought from, and how to reach whoever can answer a query about it. Lines
 * that were never filled in are left out rather than printed empty.
 */
export function sellerLines(identity: BillingIdentity): string[] {
  return [
    identity.registeredAddress,
    identity.companyNumber ? `Company number ${identity.companyNumber}` : '',
    identity.vatMode === 'registered' && identity.vatNumber ? `VAT number ${identity.vatNumber}` : '',
    identity.billingEmail,
  ].filter(Boolean)
}

/**
 * A document is only safe to hand to a finance team once it says who issued
 * it and where they are registered. Anything missing is listed so the admin
 * screen can say what still has to be filled in.
 */
export function missingForInvoicing(identity: BillingIdentity): string[] {
  const missing: string[] = []
  if (!identity.legalName) missing.push('Registered company name')
  if (!identity.companyNumber) missing.push('Company number')
  if (!identity.registeredAddress) missing.push('Registered office address')
  if (!identity.billingEmail) missing.push('Billing email for queries')
  if (identity.vatMode === 'registered' && !identity.vatNumber) missing.push('VAT number')
  return missing
}

/** Payment due date for an invoice raised on a given day. */
export function dueDate(issued: Date, identity: BillingIdentity): Date {
  const due = new Date(issued)
  due.setDate(due.getDate() + identity.paymentTermsDays)
  return due
}
