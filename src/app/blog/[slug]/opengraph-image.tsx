import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const alt = 'Talent House Blog'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function BlogOGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let title = 'Talent House Blog'
  let category = ''

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, category')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (post) {
      title = post.title
      category = post.category || ''
    }
  } catch {
    // Fall back to defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '60px 70px',
          background: 'linear-gradient(145deg, #0f0f0f 0%, #1c1c1c 50%, #0f0f0f 100%)',
        }}
      >
        {/* Top: branding + category */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: 20, fontWeight: 600, letterSpacing: '2px',
              color: '#555555', textTransform: 'uppercase' as const,
              display: 'flex',
            }}
          >
            Talent House Blog
          </div>
          {category && (
            <div
              style={{
                fontSize: 14, fontWeight: 500, letterSpacing: '1px',
                color: 'rgba(28,28,28, 0.7)',
                border: '1px solid rgba(28,28,28, 0.3)',
                borderRadius: 20, padding: '6px 16px',
                textTransform: 'uppercase' as const,
                display: 'flex',
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* Centre: title */}
        <div
          style={{
            fontSize: title.length > 60 ? 42 : 52,
            fontWeight: 700, color: '#FFFFFF',
            lineHeight: 1.2, letterSpacing: '-0.5px',
            display: 'flex', maxWidth: '90%',
          }}
        >
          {title}
        </div>

        {/* Bottom: URL + decorative line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 2, background: '#555555', display: 'flex' }} />
          <div
            style={{
              fontSize: 14, color: 'rgba(255, 255, 255, 0.25)',
              letterSpacing: '1px', display: 'flex',
            }}
          >
            talenthousecollective.co.uk
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
