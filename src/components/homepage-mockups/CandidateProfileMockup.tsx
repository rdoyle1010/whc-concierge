import { Heart, MapPin, Star, X } from 'lucide-react'

export default function CandidateProfileMockup() {
  return (
    <div className="dashboard-card relative mx-auto w-full max-w-sm bg-white p-5">
      <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-white">★ Featured</span>

      <div className="mb-3 flex items-center space-x-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          <span className="text-lg font-bold text-gray-300">A</span>
        </div>
        <div className="min-w-0 flex-1 pr-20 text-left">
          <h3 className="truncate font-semibold text-ink">Amelia Taylor</h3>
          <p className="truncate text-sm text-gray-500">Senior Spa Therapist</p>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-[#edf8f0] px-2.5 py-1 text-[11px] font-semibold text-[#287548]">94% · Excellent match</span>
          <span className="truncate text-[10px] text-gray-400">for Senior Spa Therapist</span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-gray-500">Strong treatment, qualification, experience and location fit for this live role.</p>
      </div>

      <p className="mb-2 flex items-center gap-1 text-sm text-gray-500"><MapPin size={14} /><span>London · 7 miles from property</span></p>
      <p className="mb-3 text-xs text-gray-400">Travels up to 25 miles</p>

      <div className="mb-3 flex flex-wrap gap-1">
        {['Deep Tissue', 'Facials', 'Hot Stone'].map(skill => <span key={skill} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">{skill}</span>)}
      </div>
      <p className="mb-3 text-xs text-gray-400">6 years experience</p>

      <button type="button" className="mb-2 w-full rounded-lg border border-[rgba(16,47,77,0.35)] bg-[#f5f6f8] py-2 text-[12px] font-medium text-accent">View Full Profile</button>
      <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
        <button type="button" className="flex items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-xs text-gray-400"><X size={13} />Pass</button>
        <button type="button" className="flex items-center justify-center gap-1 rounded-lg bg-gray-50 py-2 text-xs text-gray-500"><Star size={13} />Save</button>
        <button type="button" className="flex items-center justify-center gap-1 rounded-lg bg-[#0b2f4d] py-2 text-xs text-white"><Heart size={13} />Interested</button>
      </div>
    </div>
  )
}
