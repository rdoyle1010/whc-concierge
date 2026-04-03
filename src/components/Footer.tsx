import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light flex items-center justify-center">
                <span className="text-white font-serif font-bold text-lg">W</span>
              </div>
              <span className="font-serif text-xl font-semibold">WHC Concierge</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              The specialist careers platform for luxury wellness. Connecting exceptional professionals with the world&apos;s finest properties.
            </p>
          </div>

          {/* For Candidates */}
          <div>
            <h4 className="font-serif text-gold text-lg mb-4">For Candidates</h4>
            <ul className="space-y-3">
              <li><Link href="/jobs" className="text-white/60 hover:text-gold text-sm transition-colors">Browse Roles</Link></li>
              <li><Link href="/agency" className="text-white/60 hover:text-gold text-sm transition-colors">Agency Shifts</Link></li>
              <li><Link href="/residency" className="text-white/60 hover:text-gold text-sm transition-colors">Residency Programme</Link></li>
              <li><Link href="/register/talent" className="text-white/60 hover:text-gold text-sm transition-colors">Create Profile</Link></li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-serif text-gold text-lg mb-4">For Employers</h4>
            <ul className="space-y-3">
              <li><Link href="/pricing" className="text-white/60 hover:text-gold text-sm transition-colors">Post a Role</Link></li>
              <li><Link href="/register/employer" className="text-white/60 hover:text-gold text-sm transition-colors">Find Staff</Link></li>
              <li><Link href="/properties" className="text-white/60 hover:text-gold text-sm transition-colors">Properties</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-serif text-gold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/blog" className="text-white/60 hover:text-gold text-sm transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-gold text-sm transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-white/60 hover:text-gold text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-white/60 hover:text-gold text-sm transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Wellness House Collective. Founded by Rebecca Doyle. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
