import Link from 'next/link'

// The brand wordmark - a typographic lockup that replaces the old boxed
// image logo. Classic two-line arrangement: serif house name over a
// letterspaced gold descriptor. `dark` flips it for ink backgrounds.

export default function Wordmark({
  dark = false,
  href = '/',
  compact = false,
}: { dark?: boolean; href?: string | null; compact?: boolean }) {
  const mark = (
    <span className="inline-flex flex-col leading-none select-none">
      <span className={`font-serif font-semibold tracking-wide ${compact ? 'text-[15px]' : 'text-[17px]'} ${dark ? 'text-white' : 'text-ink'}`}>
        Wellness House
      </span>
      <span className={`uppercase ${compact ? 'text-[7.5px]' : 'text-[8.5px]'} font-medium tracking-[0.42em] mt-1 text-gold`}>
        Collective
      </span>
    </span>
  )
  if (!href) return mark
  return <Link href={href} className="shrink-0">{mark}</Link>
}
