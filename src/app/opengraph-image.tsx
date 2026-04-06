import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'WHC Concierge — Luxury Wellness Careers Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(145deg, #0a0a14 0%, #1a1a2e 50%, #0f0f1e 100%)',
          padding: '60px',
        }}
      >
        {/* Decorative line */}
        <div style={{ width: 60, height: 2, background: '#C9A96E', marginBottom: 40, display: 'flex' }} />

        {/* Main title */}
        <div
          style={{
            fontSize: 72, fontWeight: 700, letterSpacing: '-1px',
            background: 'linear-gradient(135deg, #C9A96E, #E8D5A8)',
            backgroundClip: 'text', color: 'transparent',
            marginBottom: 20, display: 'flex',
          }}
        >
          WHC Concierge
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28, fontWeight: 400, color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '3px', textTransform: 'uppercase' as const,
            display: 'flex',
          }}
        >
          Luxury Wellness Careers Platform
        </div>

        {/* Bottom decorative line */}
        <div style={{ width: 60, height: 2, background: '#C9A96E', marginTop: 40, display: 'flex' }} />

        {/* URL */}
        <div
          style={{
            position: 'absolute', bottom: 40,
            fontSize: 14, color: 'rgba(255, 255, 255, 0.25)',
            letterSpacing: '1px', display: 'flex',
          }}
        >
          talent.wellnesshousecollective.co.uk
        </div>
      </div>
    ),
    { ...size }
  )
}
