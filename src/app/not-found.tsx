import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light flex items-center justify-center mx-auto mb-8">
          <span className="text-white font-serif font-bold text-3xl">?</span>
        </div>
        <h1 className="text-5xl font-serif font-bold text-white mb-4">404</h1>
        <p className="text-white/60 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  )
}
