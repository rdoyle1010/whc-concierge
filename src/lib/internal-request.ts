import { timingSafeEqual } from 'node:crypto'

export function getInternalApiSecret() {
  return process.env.INTERNAL_API_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ''
}

export function isInternalApiRequest(request: Request) {
  const expected = getInternalApiSecret()
  const supplied = request.headers.get('x-whc-internal-secret') || ''
  if (!expected || !supplied) return false
  const expectedBytes = Buffer.from(expected)
  const suppliedBytes = Buffer.from(supplied)
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes)
}
