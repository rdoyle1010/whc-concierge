import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'WHC Blog'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function BlogOGImage({ params }: { params: { slug: string } }) {
  let title = 'WHC Blog'
  let category = ''

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, category')
      .eq('slug', params.slug)
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
          background: 'linear-gradient(145deg, #0a0a14 0%, #1a1a2e 50%, #0f0f1e 100%)',
        }}
      >
        {/* Top: branding + category */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: 20, fontWeight: 600, letterSpacing: '2px',
              color: '#C9A96E', textTransform: 'uppercase' as const,
              display: 'flex',
            }}
          >
            WHC Blog
          </div>
          {category && (
            <div
              style={{
                fontSize: 14, fontWeight: 500, letterSpacing: '1px',
                color: 'rgba(201, 169, 110, 0.7)',
                border: '1px solid rgba(201, 169, 110, 0.3)',
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
          <div style={{ width: 40, height: 2, background: '#C9A96E', display: 'flex' }} />
          <div
            style={{
              fontSize: 14, color: 'rgba(255, 255, 255, 0.25)',
              letterSpacing: '1px', display: 'flex',
            }}
          >
            talent.wellnesshousecollective.co.uk
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
