import { MapPin, Star, ShieldCheck } from 'lucide-react'

export default function CandidateProfileMockup() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm p-5 max-w-sm w-full mx-auto relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: 'linear-gradient(90deg, transparent, #C9A96E, transparent)' }}
      />

      <div className="flex items-start gap-4 mt-1">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F8F7F5, #E8E5E0)' }}
        >
          <span className="text-[18px] font-serif font-medium" style={{ color: '#C9A96E' }}>AT</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-ink leading-tight">A. (Senior Therapist)</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: '#FDF6EC', color: '#C9A96E' }}>
              Senior Spa Therapist
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              <ShieldCheck size={10} /> Insured
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: '#1a1a1a' }}>
              <Star size={11} className="fill-current" style={{ color: '#C9A96E' }} /> 4.9
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[13px]">
        <span className="inline-flex items-center gap-1 text-secondary">
          <MapPin size={12} /> London
        </span>
        <span className="font-medium" style={{ color: '#C9A96E' }}>From £180/day</span>
      </div>

      <div className="mt-4 pt-4 border-t border-[#F0EEEA] flex flex-wrap gap-1.5">
        {['ESPA', 'CIDESCO', 'Deep Tissue', 'Hot Stone'].map((skill) => (
          <span
            key={skill}
            className="text-[11px] px-2 py-0.5 rounded-md"
            style={{ background: '#F8F7F5', color: '#374151' }}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}
