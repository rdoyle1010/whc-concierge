'use client'

import type { WebsiteContent } from '@/lib/site-content'
import { websiteCssVariables } from '@/lib/site-content'

export default function WebsiteEditorPreview({ content }: { content: WebsiteContent }) {
  const hero = content.hero.slides[0]
  const visible = content.sections.filter(section => section.visible)
  const labels: Record<string, string> = {
    proof: 'Proof bar', howItWorks: content.howItWorks.heading, product: content.product.heading,
    trust: content.trust.eyebrow, roles: content.roles.heading, cta: content.cta.talent.heading,
    services: 'Agency, Academy & Residency', testimonials: content.testimonials.heading,
  }

  return (
    <div className="website-theme overflow-hidden bg-white border border-neutral-200 shadow-sm" style={websiteCssVariables(content)}>
      <div className="h-11 px-4 flex items-center justify-between border-b border-black/10 bg-white">
        <span className="text-[11px] font-semibold tracking-[0.16em]" style={{ color: 'var(--site-ink)' }}>TALENT HOUSE COLLECTIVE</span>
        <div className="flex gap-2 text-[7px] text-neutral-500">
          <span>{content.navigation.jobs}</span><span>{content.navigation.agency}</span><span>{content.navigation.academy}</span>
        </div>
      </div>
      <div className="relative h-[280px]">
        <img
          src={hero.image.url}
          alt={hero.image.alt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: hero.image.focalX + '% ' + hero.image.focalY + '%' }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 p-8 flex flex-col justify-center text-white">
          <p className="text-[7px] tracking-[0.2em] uppercase mb-3" style={{ color: 'var(--site-accent)' }}>{hero.eyebrow}</p>
          <h2 className="site-heading !text-white text-[28px] leading-[1.05] max-w-sm mb-3">{hero.heading}</h2>
          <p className="text-[9px] leading-relaxed max-w-sm text-white/85">{hero.text}</p>
          <div className="flex gap-2 mt-5">
            <span className="site-button text-[7px] px-3 py-2 text-white" style={{ background: 'var(--site-accent)' }}>{content.hero.primaryLabel}</span>
            <span className="site-button text-[7px] px-3 py-2 bg-white text-black">{content.hero.secondaryLabel}</span>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3" style={{ background: 'var(--site-background)' }}>
        {visible.map((section, index) => (
          <div key={section.id} className="p-4 border border-black/10" style={{ background: index % 2 ? 'var(--site-surface)' : 'var(--site-background)' }}>
            <p className="text-[6px] tracking-[0.16em] uppercase mb-1" style={{ color: 'var(--site-accent)' }}>Section {index + 1}</p>
            <p className="site-heading text-[13px]" style={{ color: 'var(--site-ink)' }}>{labels[section.id]}</p>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 text-[7px] text-neutral-400 border-t border-black/10">{content.footer.copyright}</div>
    </div>
  )
}
