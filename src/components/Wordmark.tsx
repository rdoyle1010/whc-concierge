'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSiteLogo } from '@/components/SiteBrandProvider'
import { safeLogoUrl } from '@/lib/site-content'

// The brand artwork is shared by public, registration and dashboard
// navigation, and is uploaded in Website & Brand rather than shipped in the
// repository. Two fits are supported: 'fill' crops to the header box, which
// suits the supplied block artwork; 'contain' shows a whole logo on a clear
// background, which suits an uploaded transparent PNG.

export default function Wordmark({
  dark = false,
  href = '/',
  compact = false,
}: { dark?: boolean; href?: string | null; compact?: boolean }) {
  const logo = useSiteLogo()
  const contain = logo.fit === 'contain'
  const box = compact ? 'h-[42px] w-[168px]' : 'h-[48px] w-[192px]'
  const mark = (
    <span
      className={`relative block shrink-0 overflow-hidden ${box} ${contain ? '' : 'bg-[#1c1b1a]'} ${dark || contain ? '' : 'ring-1 ring-black/5'}`}
    >
      <Image
        src={safeLogoUrl(logo.url)}
        alt={logo.alt || 'Talent House Collective'}
        fill
        priority
        sizes={compact ? '168px' : '192px'}
        className={`select-none object-center ${contain ? 'object-contain' : 'object-cover'}`}
      />
    </span>
  )
  if (!href) return mark
  return <Link href={href} className="shrink-0">{mark}</Link>
}
