import { createAdminClient } from '@/lib/supabase/admin'

export type BillingInterval = 'month' | 'year' | 'one_off'

export type CommercialSetting = {
  product_key: string
  label: string
  description: string
  price_pence: number
  billing_interval: BillingInterval
  is_active: boolean
  updated_at?: string
}

export async function getCommercialSetting(productKey: string): Promise<CommercialSetting | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('commercial_settings')
    .select('product_key,label,description,price_pence,billing_interval,is_active,updated_at')
    .eq('product_key', productKey)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as CommercialSetting | null
}

export function formatCommercialPrice(setting: Pick<CommercialSetting, 'price_pence' | 'billing_interval'>) {
  const pounds = setting.price_pence / 100
  const amount = Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`
  if (setting.billing_interval === 'month') return `${amount}/month`
  if (setting.billing_interval === 'year') return `${amount}/year`
  return amount
}
