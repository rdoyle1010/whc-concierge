import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <p className="text-black font-semibold text-lg tracking-tight">WHC Concierge</p>
            <p className="text-neutral-400 text-sm leading-relaxed">
              The specialist careers platform for luxury wellness. Connecting exceptional professionals with the world&apos;s finest properties.
            </p>
          </div>

          <div>
            <p className="text-black text-xs font-semibold uppercase tracking-widest mb-4">For Candidates</p>
            <ul className="space-y-2.5">
              <li><Link href="/jobs" className="text-neutral-400 hover:text-black text-sm transition-colors">Browse Roles</Link></li>
              <li><Link href="/agency" className="text-neutral-400 hover:text-black text-sm transition-colors">Agency Shifts</Link></li>
              <li><Link href="/residency" className="text-neutral-400 hover:text-black text-sm transition-colors">Residency Programme</Link></li>
              <li><Link href="/register/talent" className="text-neutral-400 hover:text-black text-sm transition-colors">Create Profile</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-black text-xs font-semibold uppercase tracking-widest mb-4">For Employers</p>
            <ul className="space-y-2.5">
              <li><Link href="/pricing" className="text-neutral-400 hover:text-black text-sm transition-colors">Post a Role</Link></li>
              <li><Link href="/register/employer" className="text-neutral-400 hover:text-black text-sm transition-colors">Find Staff</Link></li>
              <li><Link href="/properties" className="text-neutral-400 hover:text-black text-sm transition-colors">Properties</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-black text-xs font-semibold uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-2.5">
              <li><Link href="/blog" className="text-neutral-400 hover:text-black text-sm transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="text-neutral-400 hover:text-black text-sm transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="text-neutral-400 hover:text-black text-sm transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-neutral-400 hover:text-black text-sm transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200 mt-12 pt-8">
          <p className="text-neutral-300 text-sm">
            &copy; {new Date().getFullYear()} Wellness House Collective. Founded by Rebecca Doyle.
          </p>
        </div>
      </div>
    </footer>
  )
}
