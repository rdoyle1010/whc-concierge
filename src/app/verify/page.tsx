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
      <div className="flex-1 flex items-center justify-center px-6 pt-16">
        <div className="bg-white border border-border rounded-2xl p-10 max-w-md w-full text-center">
          <ShieldCheck size={32} className="mx-auto text-accent mb-4" />
          <h1 className="font-serif text-[24px] font-bold text-ink mb-2">Verify a Certificate</h1>
          <p className="text-[13px] text-gray-500 mb-6">Every WHC Academy certificate carries a unique code. Enter it below to confirm the certificate is genuine.</p>
          <form onSubmit={e => { e.preventDefault(); if (code.trim()) router.push(`/verify/${encodeURIComponent(code.trim().toUpperCase())}`) }}>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. WHC-A7K2M9PX"
              className="input-field text-center font-mono tracking-wider mb-3" />
            <button type="submit" className="btn-primary w-full text-[13px]">Verify</button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
