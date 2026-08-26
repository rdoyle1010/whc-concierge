import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  AGENCY_LISTING_TIERS,
  AGENCY_PLATFORM_FEE_PCT,
  EMPLOYER_MEMBERSHIPS,
  FEATURED_TALENT,
  JOB_TIERS,
  PREFERRED_EMPLOYER_PRICE,
  TALENT_MEMBERSHIPS,
} from '@/lib/constants'

const pounds = (pence: number) => `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`
const agencyFeePct = Math.round(AGENCY_PLATFORM_FEE_PCT * 100)

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] tracking-[0.08em] uppercase text-muted font-medium mb-3">Legal</p>
          <h1 className="text-[36px] font-medium text-ink tracking-tight">Terms of Service</h1>
          <p className="text-[13px] text-muted mt-2">Last updated: August 2026</p>
        </div>
      </section>
      <section className="pb-24 px-4">
        <div className="max-w-3xl mx-auto text-[14px] text-secondary leading-[1.8] space-y-6">
          <p>By using WHC Concierge (&ldquo;the Platform&rdquo;), operated by Wellness House Collective Ltd, you agree to these Terms of Service. Please read them carefully before registering, buying a paid service or arranging work through the Platform.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">1. Eligibility</h2>
          <p>You must be at least 18 years old to create an account. By registering, you confirm that the information you provide is accurate and that you have the legal right to work in the jurisdictions where you seek employment or offer services.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">2. Account Registration &amp; Approval</h2>
          <p>Talent and Employer accounts may be reviewed by WHC before certain features become available. We may request supporting documents, reject an application, suspend access or remove information that is false, misleading, unsafe or inappropriate. You are responsible for keeping your login credentials secure.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">3. Talent Accounts &amp; Memberships</h2>
          <p>Talent Free is available at no charge. Optional Talent Standard membership is {pounds(TALENT_MEMBERSHIPS.standard.price)}/month and Talent Pro is {pounds(TALENT_MEMBERSHIPS.pro.price)}/month. Paid memberships provide the benefits shown at checkout and on the Pricing page, including Interview Ready credits and Academy discounts. Membership subscriptions are processed through Stripe and may be cancelled through the available billing controls.</p>
          <p>Featured Talent is a separate visibility purchase rather than a monthly membership. Current options are {pounds(FEATURED_TALENT.seven_days.price)} for 7 days or {pounds(FEATURED_TALENT.thirty_days.price)} for 30 days. Featured placement improves visibility but does not guarantee contact, interview or employment.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">4. Employers, Job Advertising &amp; Memberships</h2>
          <p>A Standard Job costs {pounds(JOB_TIERS.Bronze.price)} for {JOB_TIERS.Bronze.days} days. A Featured Job costs {pounds(JOB_TIERS.Platinum.price)} for {JOB_TIERS.Platinum.days} days. Legacy Silver and Gold packages are not offered for new purchases.</p>
          <p>Employer Pro costs {pounds(EMPLOYER_MEMBERSHIPS.pro.price)}/year and currently includes Standard Jobs at {pounds(EMPLOYER_MEMBERSHIPS.pro.discountedStandardJobPrice)} each. Employer Group costs {pounds(EMPLOYER_MEMBERSHIPS.group.price)}/year and currently includes up to {EMPLOYER_MEMBERSHIPS.group.includedJobs} Standard Jobs per membership year. Featured Jobs remain separately chargeable unless a written commercial agreement says otherwise.</p>
          <p>Once a paid job listing is published, advertising fees are generally non-refundable except where required by law or expressly agreed by WHC. Employers must advertise genuine opportunities and handle Talent data in accordance with applicable data-protection law.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">5. Agency Marketplace</h2>
          <p>Agency professionals set or agree their own hourly rate. The professional keeps 100% of the agreed shift value. WHC charges the property an additional {agencyFeePct}% platform fee on top of that agreed shift value.</p>
          <p>For an accepted Agency shift, the property pays the professional&apos;s agreed shift value plus the WHC platform fee through the Platform. WHC records the payment and manages the professional payout after the completed shift, subject to any open cancellation, dispute, adjustment or safeguarding process. Where an approved shift adjustment creates extra professional pay, the same platform-fee percentage applies to that additional amount.</p>
          <p>Agency professionals may separately subscribe to the Agency Register. Basic is {AGENCY_LISTING_TIERS.basic.display} and Featured is {AGENCY_LISTING_TIERS.featured.display}. A paid Agency listing does not replace WHC approval, verification, insurance requirements or availability checks.</p>
          <p>Properties may be required to hold Preferred Employer registration before booking Agency cover. The current registration price is {pounds(PREFERRED_EMPLOYER_PRICE)}/year.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">6. Residency</h2>
          <p>Residency is a specialist marketplace for longer-form placements. Listing, membership, booking and sourcing charges are shown before purchase. Where WHC processes a Residency booking payment, the applicable platform fee and total are shown before the Employer confirms payment. Separate recruitment or executive-search fees may apply if WHC is engaged to source or manage a search rather than simply provide marketplace access.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">7. Academy &amp; Interview Ready</h2>
          <p>Academy courses and Interview Ready tools are digital services. Prices, included credits, membership discounts and access conditions are shown before purchase or use. Completion certificates are issued only where the relevant course requirements and assessment pass mark are met.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">8. Payments, Renewals &amp; Cancellations</h2>
          <p>Online payments are processed securely through Stripe or another payment provider WHC may introduce. Subscription products may renew automatically until cancelled. The amount, billing interval and renewal basis are shown at checkout. Cancelling a subscription normally stops future renewal and does not automatically refund a period already paid for, except where required by law or expressly agreed.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">9. Matching &amp; Recommendations</h2>
          <p>WHC uses matching logic to suggest relevant roles, Talent and opportunities. Match scores and recommendations are decision-support tools only. They do not guarantee suitability, availability, interview, employment or successful performance. Employers and Talent remain responsible for their own due diligence and decisions.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">10. Professional Conduct, Reviews &amp; References</h2>
          <p>Users must behave professionally and must not harass, discriminate against, mislead or abuse other users. Reviews and references must be fair, factual and based on genuine work or engagement through the Platform. WHC may moderate, restrict or remove content that breaches these terms or creates a safety, legal or integrity concern.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">11. Data Protection</h2>
          <p>We process personal data in accordance with applicable data-protection law and our <a href="/privacy" className="underline text-ink">Privacy Policy</a>. Users must only access and use another person&apos;s information for legitimate Platform purposes and must not share it with unauthorised third parties.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">12. Intellectual Property</h2>
          <p>WHC&apos;s branding, platform design, software and original content remain the property of Wellness House Collective Ltd or its licensors. You retain ownership of content you submit but grant WHC the rights reasonably required to host, display, process and use that content to operate the Platform and the services you request.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">13. Limitation of Liability</h2>
          <p>WHC provides a platform, recruitment and marketplace service. Except where WHC expressly contracts otherwise, WHC does not employ Talent on behalf of an Employer and does not guarantee the accuracy of user-supplied information or the outcome of any application, engagement or booking. Nothing in these terms excludes liability that cannot lawfully be excluded.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">14. Suspension &amp; Termination</h2>
          <p>We may suspend or remove accounts, listings or access where these terms are breached, payment is overdue, verification fails, safety is at risk or misuse is suspected. You may request account deletion subject to any legal, payment, dispute or record-retention obligations that still apply.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">15. Changes to Services &amp; Pricing</h2>
          <p>WHC may change features or pricing from time to time. The price shown and accepted at checkout applies to that purchase. For recurring subscriptions, material pricing changes will be handled in accordance with applicable law and the payment provider&apos;s subscription process.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">16. Governing Law</h2>
          <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the jurisdiction of the courts of England and Wales unless applicable consumer law requires otherwise.</p>

          <h2 className="text-[18px] font-medium text-ink mt-8">Contact</h2>
          <p>For questions about these terms, contact <a href="mailto:hello@wellnesshousecollective.co.uk" className="underline text-ink">hello@wellnesshousecollective.co.uk</a>.</p>
        </div>
      </section>
      <Footer />
    </div>
  )
}
