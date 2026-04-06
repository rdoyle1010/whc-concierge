'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[WHC Global Error]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(145deg, #0a0a14 0%, #1a1a2e 50%, #0f0f1e 100%)',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 32px',
              }}
            >
              <span style={{ fontSize: 20, color: '#C9A96E' }}>!</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 500, color: '#FFFFFF', margin: '0 0 12px' }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 40px' }}>
              An unexpected error occurred. Please try again or return to the home page.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 24px', background: '#FFFFFF', color: '#0a0a14',
                  fontSize: 13, fontWeight: 500, borderRadius: 8, border: 'none',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: '10px 24px', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500,
                  borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
                  textDecoration: 'none', cursor: 'pointer',
                }}
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
