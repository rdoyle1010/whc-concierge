'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[WHC Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center mx-auto mb-8">
          <span className="text-[20px]" style={{ color: '#C9A96E' }}>!</span>
        </div>
        <h1 className="text-[28px] font-medium text-ink mb-3">Something went wrong</h1>
        <p className="text-[14px] text-secondary leading-relaxed mb-10">An unexpected error occurred. Please try again or return to the home page.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">Try Again</button>
          <Link href="/" className="btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
