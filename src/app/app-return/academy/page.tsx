'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AcademyAppReturnPage() {
  const params = useSearchParams()
  const status = params.get('status') || 'success'
  const result = params.get('result') || ''
  const deepLink = `whctalent://academy?status=${encodeURIComponent(status)}&result=${encodeURIComponent(result)}`

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = deepLink
    }, 250)
    return () => window.clearTimeout(timer)
  }, [deepLink])

  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#fff',padding:'24px'}}>
      <section style={{maxWidth:'420px',textAlign:'center'}}>
        <p style={{fontSize:'11px',letterSpacing:'0.18em',color:'#71808a'}}>WELLNESS HOUSE</p>
        <h1 style={{fontSize:'28px',lineHeight:1.2,color:'#092b45',margin:'12px 0'}}>{status === 'cancelled' ? 'Checkout cancelled.' : 'Payment complete.'}</h1>
        <p style={{fontSize:'14px',lineHeight:1.6,color:'#66747c'}}>{status === 'cancelled' ? 'Return to the app when you are ready.' : 'Opening Wellness House Talent so you can continue in the Academy.'}</p>
        <a href={deepLink} style={{display:'inline-block',marginTop:'22px',padding:'13px 18px',background:'#092b45',color:'#fff',textDecoration:'none'}}>Open Wellness House Talent</a>
      </section>
    </main>
  )
}
