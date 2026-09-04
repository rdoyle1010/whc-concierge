import { NextResponse } from 'next/server'
import { getBillingIdentity } from '@/lib/billing-identity-server'

// The seller block for documents rendered in the browser. Everything here is
// already printed on the foot of every invoice a company issues - it is public
// by design. Bank details are deliberately withheld: they belong on an invoice
// raised for payment, not on a receipt for money already taken, and a public
// endpoint is exactly where account details get harvested.
export async function GET() {
  const identity = await getBillingIdentity()
  const { bankName, bankAccountName, bankSortCode, bankAccountNumber, ...publicIdentity } = identity
  return NextResponse.json({ identity: publicIdentity })
}
