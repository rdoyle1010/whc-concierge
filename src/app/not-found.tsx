import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ background: 'linear-gradient(145deg, #0a0a14 0%, #1a1a2e 50%, #0f0f1e 100%)' }} className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[120px] font-serif font-bold leading-none" style={{ color: 'rgba(201, 169, 110, 0.15)' }}>404</p>
        <h1 className="text-[28px] font-medium text-white mt-2 mb-3">Page Not Found</h1>
        <p className="text-[14px] text-white/40 leading-relaxed mb-10">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="px-6 py-2.5 bg-white text-[#0a0a14] text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors">Back to Home</Link>
          <Link href="/jobs" className="px-6 py-2.5 border border-white/15 text-white/60 text-[13px] font-medium rounded-lg hover:border-white/30 hover:text-white/80 transition-colors">Browse Roles</Link>
        </div>
      </div>
    </div>
  )
}
