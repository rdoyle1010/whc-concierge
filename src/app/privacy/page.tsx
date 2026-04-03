import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold text-white">Privacy Policy</h1>
        </div>
      </section>
      <section className="py-16 bg-parchment">
        <div className="max-w-3xl mx-auto px-4 prose prose-lg">
          <p>Your privacy is important to us at Wellness House Collective. This policy outlines how we collect, use, and protect your personal data.</p>
          <h2 className="font-serif">Data We Collect</h2>
          <p>We collect information you provide when creating an account, building your profile, or using our platform, including your name, email, phone number, professional details, and job preferences.</p>
          <h2 className="font-serif">How We Use Your Data</h2>
          <p>We use your data to match you with relevant opportunities or candidates, facilitate communication between parties, process payments, and improve our platform.</p>
          <h2 className="font-serif">Data Protection</h2>
          <p>We implement industry-standard security measures including encryption, secure hosting, and regular audits to protect your information.</p>
          <h2 className="font-serif">Your Rights</h2>
          <p>Under GDPR, you have the right to access, correct, delete, or export your personal data. Contact us at hello@wellnesshousecollective.co.uk to exercise these rights.</p>
          <h2 className="font-serif">Contact</h2>
          <p>For privacy enquiries, email hello@wellnesshousecollective.co.uk</p>
        </div>
      </section>
      <Footer />
    </div>
  )
}
