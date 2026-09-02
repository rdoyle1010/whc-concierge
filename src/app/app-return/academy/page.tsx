'use client'

import { useEffect, useState } from 'react'

export default function AcademyAppReturnPage() {
  const [status, setStatus] = useState('success')
  const [result, setResult] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const nextStatus = params.get('status') || 'success'
    const nextResult = params.get('result') || ''
    setStatus(nextStatus)
    setResult(nextResult)

    const deepLink = `whctalent://academy?status=${encodeURIComponent(nextStatus)}&result=${encodeURIComponent(nextResult)}`
    const timer = window.setTimeout(() => {
      window.location.href = deepLink
    }, 250)
    return () => window.clearTimeout(timer)
  }, [])

  const deepLink = `whctalent://academy?status=${encodeURIComponent(status)}&result=${encodeURIComponent(result)}`

  return (
    <main id="main-content" style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#fff',padding:'24px'}}>
      <section style={{maxWidth:'420px',textAlign:'center'}}>
        <p style={{fontSize:'11px',letterSpacing:'0.18em',color:'#71808a'}}>WELLNESS HOUSE</p>
        <h1 style={{fontSize:'28px',lineHeight:1.2,color:'#1c1c1c',margin:'12px 0'}}>{status === 'cancelled' ? 'Checkout cancelled.' : 'Payment complete.'}</h1>
        <p style={{fontSize:'14px',lineHeight:1.6,color:'#66747c'}}>{status === 'cancelled' ? 'Return to the app when you are ready.' : 'Opening Talent House Collective so you can continue in the Academy.'}</p>
        <a href={deepLink} style={{display:'inline-block',marginTop:'22px',padding:'13px 18px',background:'#1c1c1c',color:'#fff',textDecoration:'none'}}>Open Talent House Collective</a>
      </section>
    </main>
  )
}
