'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'

export default function StartResidencyConversation({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const start = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/residency/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        router.push(`/login?role=employer&returnTo=/residency/${listingId}`)
        return
      }
      if (!res.ok) {
        alert(data.error || 'Unable to start conversation')
        return
      }
      router.push(data.redirect || '/employer/messages')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={start} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
      <MessageSquare size={15} />{loading ? 'Opening chat…' : 'Start Private Conversation'}
    </button>
  )
}
