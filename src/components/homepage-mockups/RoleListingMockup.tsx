import { MapPin } from 'lucide-react'

export default function RoleListingMockup() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm p-5 max-w-sm w-full mx-auto relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: 'linear-gradient(90deg, transparent, #C9A96E, transparent)' }}
      />

      <div className="mt-1 flex items-center justify-between">
        <span
          className="text-[10px] font-semibold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full"
          style={{ background: '#FDF6EC', color: '#C9A96E' }}
        >
          Gold
        </span>
        <span className="text-[11px]" style={{ color: '#9CA3AF' }}>Posted 3 days ago</span>
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: '#6B7280' }}>
          5★ Country House Hotel
        </p>
        <h4 className="text-[17px] font-medium leading-tight" style={{ color: '#1a1a1a' }}>
          Senior Spa Therapist
        </h4>
      </div>

      <div className="mt-3 flex items-center justify-between text-[13px]">
        <span className="inline-flex items-center gap-1" style={{ color: '#6B7280' }}>
          <MapPin size={12} /> South West England
        </span>
        <span className="font-medium" style={{ color: '#C9A96E' }}>£32,000 – £38,000</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Full-time', 'Permanent', 'On-site'].map((chip) => (
          <span
            key={chip}
            className="text-[11px] px-2 py-0.5 rounded-md"
            style={{ background: '#F8F7F5', color: '#374151' }}
          >
            {chip}
          </span>
        ))}
      </div>

      <p className="text-[12px] leading-[1.6] mt-3" style={{ color: '#6B7280' }}>
        Lead role in a renowned spa with a luxury international brand presence.
      </p>

      <div className="mt-4 pt-4 border-t border-[#F0EEEA] flex items-center justify-end">
        <button
          type="button"
          className="text-[12px] font-semibold text-white px-3.5 py-1.5 rounded-md transition-all hover:shadow-md hover:shadow-[#C9A96E]/25"
          style={{ backgroundColor: '#C9A96E' }}
        >
          Apply Now
        </button>
      </div>
    </div>
  )
}
