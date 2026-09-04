'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import PurchaseReceipt from '@/components/PurchaseReceipt'
import { createClient } from '@/lib/supabase/client'

export default function EmployerReceiptPage() {
  const params = useParams()
  const [buyerName, setBuyerName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('employer_profiles').select('company_name, contact_name').eq('user_id', data.user.id).maybeSingle()
        .then(({ data: profile }) => setBuyerName(profile?.company_name || profile?.contact_name || ''))
    })
  }, [])

  return <PurchaseReceipt id={String(params?.id || '')} backHref="/employer/billing" backLabel="Billing" buyerName={buyerName} />
}
