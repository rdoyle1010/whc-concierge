import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AdvertisingTermsPage() {
  return <div className="min-h-screen bg-[#f1f1f1] text-[#1c1c1c]">
    <Navbar />
    <main id="main-content" className="pt-[76px]">
      <section className="bg-[#f1f1f1] text-ink">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555555]">Wellness House Collective</p>
          <h1 className="mt-3 text-[40px] font-semibold tracking-[-0.04em]">Advertising Terms & Conditions</h1>
          <p className="mt-4 text-[13px] text-secondary">Version 25 August 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="rounded-[22px] border border-[#dddddd] bg-white p-7 md:p-10 space-y-7 text-[13px] leading-7 text-[#555555]">
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">1. The booking</h2><p>A sponsored placement is a rolling monthly advertising subscription for the placement selected at checkout. The price shown at checkout is charged monthly until the subscription is cancelled, subject to any valid promotion or discount applied by Stripe.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">2. Billing and duration</h2><p>Billing begins when Stripe checkout is completed. The subscription renews automatically each month until cancelled. A promotion code may reduce a charge, including to £0 where the code permits, but does not change the recurring nature of the subscription unless Stripe states otherwise.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">3. Approval before publication</h2><p>Payment does not guarantee publication. Talent House reviews the supplied brand name, wording, website destination and creative before the advert appears publicly. Talent House may request changes or reject material that is inaccurate, unlawful, misleading, unsuitable for the audience, inconsistent with platform standards or technically unsafe.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">4. When the advert goes live</h2><p>The public display period starts when Talent House approves and activates the advert. Talent House aims to review submissions within two working days, but this is not a guaranteed service level. The subscription billing cycle remains the Stripe billing cycle that began at checkout.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">5. Placement</h2><p>The advert will be displayed in the placement purchased, subject to platform availability, responsive layouts and normal product changes. Sponsored content will be clearly identified as sponsored advertising.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">6. Advertiser responsibilities</h2><p>You confirm that you are authorised to use the supplied logos, images, wording, trademarks and destination links and that your advert complies with applicable law and advertising rules. You remain responsible for claims made in the advert and on the linked website.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">7. Tracking and performance</h2><p>Talent House may report impressions and clicks generated through the platform. Talent House does not guarantee a minimum number of impressions, clicks, enquiries, applications, sales or other commercial outcomes.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">8. Pausing, rejection and removal</h2><p>Talent House may pause or remove an advert where there is a payment issue, policy issue, legal concern, broken destination, misleading claim or material change that makes the advert unsuitable. If creative is rejected, Talent House may work with the advertiser on reasonable amendments before publication.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">9. Cancellation</h2><p>You may cancel the recurring subscription so that it does not renew for a further billing period. Cancellation does not ordinarily refund a billing period already started, except where required by law or agreed by Talent House.</p></div>
          <div><h2 className="text-[18px] font-semibold text-[#1c1c1c]">10. Contact</h2><p>Questions about an advertising booking, approval, cancellation or creative changes should be directed to Wellness House Collective through the contact details published on the platform.</p></div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
}
