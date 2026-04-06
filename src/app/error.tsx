'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[WHC Error]', error)
  }, [error])

  return (
    <div style={{ background: 'linear-gradient(145deg, #0a0a14 0%, #1a1a2e 50%, #0f0f1e 100%)' }} className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-8">
          <span className="text-[20px]" style={{ color: '#C9A96E' }}>!</span>
        </div>
        <h1 className="text-[28px] font-medium text-white mb-3">Something went wrong</h1>
        <p className="text-[14px] text-white/40 leading-relaxed mb-10">An unexpected error occurred. Please try again or return to the home page.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={reset} className="px-6 py-2.5 bg-white text-[#0a0a14] text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors">Try Again</button>
          <Link href="/" className="px-6 py-2.5 border border-white/15 text-white/60 text-[13px] font-medium rounded-lg hover:border-white/30 hover:text-white/80 transition-colors">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
