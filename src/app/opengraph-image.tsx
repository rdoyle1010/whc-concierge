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
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8F7F5',
          padding: '80px',
          position: 'relative',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Brand eyebrow */}
        <div
          style={{
            display: 'flex',
            fontSize: 18,
            fontWeight: 600,
            color: '#C9A96E',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            marginBottom: 56,
          }}
        >
          WHC Concierge
        </div>

        {/* Gold rule */}
        <div
          style={{
            display: 'flex',
            width: 80,
            height: 1,
            background: '#C9A96E',
            marginBottom: 40,
          }}
        />

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            textAlign: 'center',
            fontSize: 68,
            fontWeight: 500,
            color: '#1a1a1a',
            lineHeight: 1.12,
            letterSpacing: '-1px',
            maxWidth: 940,
            marginBottom: 32,
          }}
        >
          Where Luxury Wellness Meets Exceptional Talent
        </div>

        {/* Subhead */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            fontWeight: 400,
            color: '#6B7280',
            textAlign: 'center',
            maxWidth: 760,
            lineHeight: 1.5,
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          }}
        >
          The UK&apos;s specialist platform for spa and wellness professionals.
        </div>

        {/* URL bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            right: 80,
            display: 'flex',
            fontSize: 16,
            color: '#9CA3AF',
            letterSpacing: '1px',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          }}
        >
          talent.wellnesshousecollective.co.uk
        </div>
      </div>
    ),
    { ...size }
  )
}
