import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Stripe is not configured')
  stripeClient ??= new Stripe(key, { typescript: true })
  return stripeClient
}
