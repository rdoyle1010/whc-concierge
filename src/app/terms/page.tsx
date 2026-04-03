import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold text-white">Terms of Service</h1>
        </div>
      </section>
      <section className="py-16 bg-parchment">
        <div className="max-w-3xl mx-auto px-4 prose prose-lg">
          <p>By using WHC Concierge, you agree to these terms. Please read them carefully.</p>
          <h2 className="font-serif">Platform Use</h2>
          <p>WHC Concierge is a recruitment platform connecting wellness professionals with employers. You must provide accurate information and use the platform in good faith.</p>
          <h2 className="font-serif">Accounts</h2>
          <p>You are responsible for maintaining the security of your account. You must be at least 18 years old to use this platform.</p>
          <h2 className="font-serif">Payments</h2>
          <p>Employer job posting fees are non-refundable once a listing is published. All payments are processed securely through Stripe.</p>
          <h2 className="font-serif">Content</h2>
          <p>You retain ownership of content you submit. By posting content, you grant WHC Concierge a licence to display it on the platform.</p>
          <h2 className="font-serif">Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.</p>
          <h2 className="font-serif">Contact</h2>
          <p>For questions about these terms, email hello@wellnesshousecollective.co.uk</p>
        </div>
      </section>
      <Footer />
    </div>
  )
}
