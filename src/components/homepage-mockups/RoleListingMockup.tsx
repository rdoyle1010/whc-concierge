import { MapPin, Star } from 'lucide-react'

export default function RoleListingMockup() {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-white shadow-[0_18px_55px_rgba(16,40,59,.08)]">
      <div className="relative min-h-[170px] overflow-hidden bg-[#0b2f4d]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b2f4d] via-[#123f64] to-[#10283b]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/15" />
        <div className="absolute left-4 top-4"><span className="badge-gold">Gold</span></div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="mb-1 text-[10px] uppercase tracking-[.14em] text-white/70">Property</p>
          <p className="text-[17px] font-semibold">The Mayfair Hotel Spa</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/80">
            <span className="inline-flex items-center gap-1"><MapPin size={11}/>London</span>
            <span className="inline-flex items-center gap-1"><Star size={11} fill="currentColor"/>4.8</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="dashboard-eyebrow">Best-fit role</p>
            <h3 className="text-[22px] font-semibold leading-[1.08] tracking-[-.03em] text-ink">Senior Spa Therapist</h3>
            <p className="mt-2 text-[12px] text-muted">Full time · £34k–£38k</p>
          </div>
          <div className="shrink-0 rounded-2xl border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-center">
            <div className="text-[26px] font-semibold tracking-[-.04em] text-[#287548]">94%</div>
            <div className="text-[9px] font-semibold uppercase tracking-[.08em] text-[#287548]">Excellent</div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-4">
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-[.14em] text-[#10283b]">Why this role is showing</p>
          <p className="text-[11px] leading-5 text-secondary">Your treatment skills, qualifications, experience and location align strongly with this role.</p>
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 text-[11px]">Pass</button>
          <button type="button" className="btn-primary flex-1 text-[11px]">Save interest</button>
        </div>
      </div>
    </div>
  )
}
