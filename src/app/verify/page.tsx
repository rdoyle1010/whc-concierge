'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ShieldCheck } from 'lucide-react'

// Public certificate verification - an employer types the code from a
// candidate's certificate and sees instantly whether it is genuine.

export default function VerifyPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main id="main-content">
      <div className="flex-1 flex items-center justify-center px-6 pt-[76px]">
        <div className="bg-white border border-border rounded-2xl p-10 max-w-md w-full text-center">
          <ShieldCheck size={32} className="mx-auto text-accent mb-4" />
          <h1 className="font-serif text-[24px] font-bold text-ink mb-2">Verify a Certificate</h1>
          <p className="text-[13px] text-secondary mb-6">Every Talent House Academy certificate carries a unique code. Enter it below to confirm the certificate is genuine.</p>
          <form onSubmit={e => { e.preventDefault(); if (code.trim()) router.push(`/verify/${encodeURIComponent(code.trim().toUpperCase())}`) }}>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. Talent House-A7K2M9PX" aria-label="Certificate code"
              className="input-field text-center font-mono tracking-wider mb-3" />
            <button type="submit" className="btn-primary w-full text-[13px]">Verify</button>
          </form>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
