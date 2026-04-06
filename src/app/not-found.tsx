import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[120px] font-serif font-bold leading-none" style={{ color: 'rgba(201, 169, 110, 0.2)' }}>404</p>
        <h1 className="text-[28px] font-medium text-ink mt-2 mb-3">Page Not Found</h1>
        <p className="text-[14px] text-secondary leading-relaxed mb-10">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary">Back to Home</Link>
          <Link href="/jobs" className="btn-secondary">Browse Roles</Link>
        </div>
      </div>
    </div>
  )
}
