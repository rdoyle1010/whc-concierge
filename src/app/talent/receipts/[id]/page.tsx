'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import PurchaseReceipt from '@/components/PurchaseReceipt'
import { createClient } from '@/lib/supabase/client'

export default function TalentReceiptPage() {
  const params = useParams()
  const [buyerName, setBuyerName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('candidate_profiles').select('full_name').eq('user_id', data.user.id).maybeSingle()
        .then(({ data: profile }) => setBuyerName(profile?.full_name || ''))
    })
  }, [])

  return <PurchaseReceipt id={String(params?.id || '')} backHref="/talent/billing" backLabel="Billing" buyerName={buyerName} />
}
