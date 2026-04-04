import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.08em] uppercase text-muted font-medium mb-3">Legal</p>
          <h1 className="text-[36px] font-medium text-ink tracking-tight">Terms of Service</h1>
          <p className="text-[13px] text-muted mt-2">Last updated: April 2026</p>
        </div>
      </section>
      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto text-[14px] text-secondary leading-[1.8] space-y-6">
          <p>By using WHC Concierge (&ldquo;the Platform&rdquo;), operated by Wellness House Collective Ltd, you agree to these Terms of Service. Please read them carefully before registering or using any part of the Platform.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">1. Eligibility</h2>
          <p>You must be at least 18 years old to create an account. By registering, you confirm that all information provided is accurate and that you have the legal right to work in the jurisdictions where you seek employment or offer services.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">2. Account Registration</h2>
          <p>All accounts are subject to review and approval by the WHC Concierge team. We reserve the right to reject or remove any account that contains false, misleading, or inappropriate information. You are responsible for maintaining the security of your login credentials.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">3. For Talent (Candidates)</h2>
          <p>Candidate profiles are free to create. By submitting your profile, you grant WHC Concierge permission to display your professional information to registered employers on the platform. You are responsible for keeping your qualifications, experience, and availability up to date. If you indicate you hold professional insurance, you may be required to provide proof.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">4. For Employers (Properties)</h2>
          <p>Job listings are subject to the pricing tier selected at posting: Bronze (£150, 30 days), Silver (£200, 60 days), Gold (£225, 75 days), or Platinum (£250, 90 days). Fees are non-refundable once a listing is published. Employers agree to handle candidate data in accordance with GDPR and not to share it with third parties.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">5. Agency Marketplace</h2>
          <p>For shifts booked through the WHC agency marketplace, a 10% platform commission applies to the agreed rate between the practitioner and the property. Payment terms for the shift itself are agreed directly between the parties.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">6. Featured Profiles</h2>
          <p>Candidates may subscribe to a Featured Profile for £20/month. Featured profiles receive premium placement in search results and employer newsletters. Subscriptions are managed through Stripe and can be cancelled at any time.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">7. Matching Algorithm</h2>
          <p>WHC Concierge uses a weighted matching algorithm to suggest relevant roles and candidates. Match scores are indicative and do not guarantee suitability. Both parties are responsible for conducting their own due diligence before entering into any employment or engagement agreement.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">8. Professional Conduct</h2>
          <p>All users agree to conduct themselves professionally. Harassment, discrimination, or misuse of the platform will result in immediate account suspension. WHC Concierge is not a party to any employment contract formed between users.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">9. Data Protection</h2>
          <p>We process personal data in accordance with GDPR and our <a href="/privacy" className="underline text-ink">Privacy Policy</a>. You have the right to access, correct, delete, or export your personal data at any time by contacting us.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">10. Intellectual Property</h2>
          <p>All content, design, functionality, and branding of WHC Concierge is the property of Wellness House Collective Ltd. You retain ownership of content you submit but grant us a licence to display it on the platform.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">11. Limitation of Liability</h2>
          <p>WHC Concierge acts as a platform connecting talent with employers. We are not responsible for the outcome of any employment, engagement, or booking arranged through the platform. We do not guarantee the accuracy of information provided by users.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">12. Termination</h2>
          <p>We reserve the right to suspend or remove any account that breaches these terms. You may delete your account at any time by contacting us at hello@wellnesshousecollective.co.uk.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">13. Governing Law</h2>
          <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">Contact</h2>
          <p>For questions about these terms, contact: <a href="mailto:hello@wellnesshousecollective.co.uk" className="underline text-ink">hello@wellnesshousecollective.co.uk</a></p>
        </div>
      </section>
      <Footer />
    </div>
  )
}
