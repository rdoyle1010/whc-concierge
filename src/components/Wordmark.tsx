import Image from 'next/image'
import Link from 'next/link'

// The official brand artwork is shared by public, registration and dashboard
// navigation. The wide viewport crops only the artwork's decorative top and
// bottom space, keeping the complete logo lockup visible at header size.

export default function Wordmark({
  dark = false,
  href = '/',
  compact = false,
}: { dark?: boolean; href?: string | null; compact?: boolean }) {
  const mark = (
    <span
      className={`relative block shrink-0 overflow-hidden bg-[#111111] ${compact ? 'h-[42px] w-[168px]' : 'h-[48px] w-[192px]'} ${dark ? '' : 'ring-1 ring-black/5'}`}
    >
      <Image
        src="/images/whc-logo.jpg"
        alt="Wellness House Collective"
        fill
        priority
        sizes={compact ? '168px' : '192px'}
        className="select-none object-cover object-center"
      />
    </span>
  )
  if (!href) return mark
  return <Link href={href} className="shrink-0">{mark}</Link>
}
