'use client'

import { useEffect, useState } from 'react'

const ALLOWED_TARGETS = new Set(['billing','agency','residency'])
const DEFAULT_LINK = 'whctalent://billing?status=complete'

function buildDeepLink(search:string){
  const params=new URLSearchParams(search)
  const requestedTarget=String(params.get('target')||'')
  const target=ALLOWED_TARGETS.has(requestedTarget)?requestedTarget:'billing'
  const status=String(params.get('status')||'complete').replace(/[^a-z_-]/gi,'')||'complete'
  const sessionId=String(params.get('session_id')||'')
  const booking=String(params.get('booking')||'')
  return `whctalent://${target}?status=${encodeURIComponent(status)}${sessionId?`&session_id=${encodeURIComponent(sessionId)}`:''}${booking?`&booking=${encodeURIComponent(booking)}`:''}`
}

export default function MobileReturnPage(){
  const [deepLink,setDeepLink]=useState(DEFAULT_LINK)

  useEffect(()=>{
    const link=buildDeepLink(window.location.search)
    setDeepLink(link)
    const timer=window.setTimeout(()=>{window.location.href=link},250)
    return()=>window.clearTimeout(timer)
  },[])

  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f5f3ee',padding:24,fontFamily:'Arial, sans-serif',color:'#17344d'}}>
    <div style={{maxWidth:480,width:'100%',background:'#fff',border:'1px solid #dedbd3',borderRadius:18,padding:28,textAlign:'center'}}>
      <div style={{fontSize:11,letterSpacing:1.7,fontWeight:700,color:'#718078'}}>WELLNESS HOUSE</div>
      <h1 style={{fontFamily:'Georgia, serif',fontWeight:400,fontSize:30,margin:'12px 0'}}>Returning to the app…</h1>
      <p style={{fontSize:14,lineHeight:1.6,color:'#60707a'}}>Your secure browser step is complete. Talent House should reopen automatically.</p>
      <a href={deepLink} style={{display:'inline-block',marginTop:16,background:'#17344d',color:'#fff',padding:'13px 18px',borderRadius:10,textDecoration:'none',fontWeight:700,fontSize:13}}>Open Talent House</a>
    </div>
  </main>
}
