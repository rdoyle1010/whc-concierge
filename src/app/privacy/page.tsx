import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold text-white">Privacy Policy</h1>
          <p className="text-white/70 mt-3 text-[14px]">Last updated: 6 April 2026</p>
        </div>
      </section>
      <section className="py-16 bg-parchment">
        <div className="max-w-3xl mx-auto px-4 prose prose-lg">

          {/* 1. Who We Are */}
          <h2 className="font-serif">1. Who We Are</h2>
          <p>Wellness House Collective (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a United Kingdom-based company that operates a recruitment platform connecting spa and wellness professionals (&ldquo;Talent&rdquo;) with luxury hotel and spa employers (&ldquo;Employers&rdquo;). Our platform is available at <strong>talent.wellnesshousecollective.co.uk</strong>.</p>
          <p>We are the data controller for the personal data processed through our platform. If you have any questions about how we handle your data, you can reach us at:</p>
          <ul>
            <li>Email: <a href="mailto:rebecca.whc@outlook.com">rebecca.whc@outlook.com</a></li>
            <li>Website: talent.wellnesshousecollective.co.uk</li>
          </ul>

          {/* 2. What Data We Collect */}
          <h2 className="font-serif">2. What Data We Collect</h2>
          <p>We collect and process the following categories of personal data:</p>
          <h3>Account Information</h3>
          <ul>
            <li>Full name, email address, and password (encrypted)</li>
            <li>Account role (Talent or Employer)</li>
            <li>Authentication tokens and session data</li>
          </ul>
          <h3>Profile Data</h3>
          <p><strong>For Talent users:</strong></p>
          <ul>
            <li>Professional headline, biography, and current job title</li>
            <li>Location, right to work status, and willingness to relocate</li>
            <li>Treatment skills, business skills, and proficiency levels</li>
            <li>Qualifications, certifications, and expiry dates</li>
            <li>Product house and hotel brand experience</li>
            <li>Systems knowledge (booking systems, POS, etc.)</li>
            <li>Day rate expectations, availability dates, and employment type preferences</li>
            <li>Transport method, commute preferences, shift preferences, and location preferences</li>
            <li>Accommodation requirements</li>
            <li>Insurance status and uploaded insurance documents</li>
            <li>CV, certificates, and profile photographs</li>
            <li>Languages spoken</li>
          </ul>
          <p><strong>For Employer users:</strong></p>
          <ul>
            <li>Company name, property name, and company type</li>
            <li>Location, postcode, and contact details</li>
            <li>Product houses used and systems in use</li>
            <li>Job listings including role requirements, salary ranges, and descriptions</li>
          </ul>
          <h3>Usage Data</h3>
          <ul>
            <li>Pages visited, features used, and time spent on the platform</li>
            <li>Swipe actions, job applications, and match interactions</li>
            <li>Messages sent and received between users</li>
            <li>Search queries and filter selections</li>
          </ul>
          <h3>Cookies and Technical Data</h3>
          <ul>
            <li>IP address, browser type, device type, and operating system</li>
            <li>Referring URLs and page navigation paths</li>
            <li>Authentication cookies and session identifiers</li>
          </ul>

          {/* 3. How We Use Your Data */}
          <h2 className="font-serif">3. How We Use Your Data</h2>
          <p>We use your personal data for the following purposes:</p>
          <h3>Matching and Recruitment</h3>
          <ul>
            <li>Running our matching algorithm to connect Talent with suitable job listings based on skills, qualifications, experience, location preferences, and other profile data</li>
            <li>Generating match scores, match explanations, and ranked candidate lists for Employers</li>
            <li>Powering the swipe-to-match feature and job recommendations</li>
          </ul>
          <h3>Communication</h3>
          <ul>
            <li>Facilitating messages between Talent and Employers</li>
            <li>Sending transactional emails (account verification, password resets, application confirmations)</li>
            <li>Sending platform updates and new role notifications (with your consent)</li>
          </ul>
          <h3>Payments</h3>
          <ul>
            <li>Processing subscription payments, featured listing purchases, and agency booking commissions</li>
            <li>Generating invoices and managing billing records</li>
          </ul>
          <h3>Platform Improvement and Analytics</h3>
          <ul>
            <li>Analysing usage patterns to improve matching accuracy and user experience</li>
            <li>Monitoring platform performance and diagnosing technical issues</li>
            <li>Generating anonymised, aggregated statistics about platform usage</li>
          </ul>
          <h3>Safety and Compliance</h3>
          <ul>
            <li>Verifying professional qualifications and insurance status</li>
            <li>Preventing fraud, abuse, and unauthorised access</li>
            <li>Complying with legal obligations</li>
          </ul>

          {/* 4. Legal Basis for Processing */}
          <h2 className="font-serif">4. Legal Basis for Processing</h2>
          <p>Under the UK General Data Protection Regulation (UK GDPR), we process your data on the following legal bases:</p>
          <ul>
            <li><strong>Contract:</strong> Processing necessary to fulfil our contract with you &mdash; for example, creating your account, running the matching algorithm, facilitating applications, and processing payments.</li>
            <li><strong>Consent:</strong> Where you have given us specific consent &mdash; for example, receiving marketing emails, allowing your profile to appear in Employer search results, or uploading optional documents such as photographs.</li>
            <li><strong>Legitimate interest:</strong> Processing necessary for our legitimate business interests, provided these do not override your rights &mdash; for example, improving our matching algorithm, preventing fraud, and analysing platform usage. We carry out a balancing test for each legitimate interest to ensure your rights are protected.</li>
            <li><strong>Legal obligation:</strong> Where we are required by law to process your data &mdash; for example, maintaining financial records for tax purposes or responding to lawful data access requests.</li>
          </ul>

          {/* 5. Data Retention */}
          <h2 className="font-serif">5. Data Retention</h2>
          <p>We retain your personal data only for as long as necessary to fulfil the purposes described in this policy. Our standard retention periods are:</p>
          <ul>
            <li><strong>Profile data:</strong> Retained until you delete your account. You may request account deletion at any time.</li>
            <li><strong>Messages:</strong> Retained for 2 years from the date sent, then permanently deleted.</li>
            <li><strong>Analytics and usage data:</strong> Retained in identifiable form for 1 year, then anonymised for aggregate reporting.</li>
            <li><strong>Payment records:</strong> Retained for 7 years as required by UK tax law (HMRC).</li>
            <li><strong>Application and match history:</strong> Retained for 2 years after the relevant job listing closes.</li>
            <li><strong>Authentication logs:</strong> Retained for 6 months for security purposes.</li>
          </ul>
          <p>When your data is no longer required, it is securely deleted or irreversibly anonymised.</p>

          {/* 6. Third-Party Processors */}
          <h2 className="font-serif">6. Third-Party Processors</h2>
          <p>We use the following third-party services to operate our platform. Each processor has been selected for their security standards and compliance with data protection law:</p>
          <ul>
            <li><strong>Supabase</strong> (database and authentication) &mdash; Stores user accounts, profile data, job listings, messages, and application records. Supabase applies row-level security policies and encrypts data at rest and in transit. Data is hosted in the EU.</li>
            <li><strong>Stripe</strong> (payment processing) &mdash; Processes subscription payments, one-off purchases, and manages billing. Stripe is PCI DSS Level 1 certified and processes data in accordance with their <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>.</li>
            <li><strong>Resend</strong> (transactional email) &mdash; Sends account verification emails, password resets, application confirmations, and platform notifications. Email addresses and message content are processed in accordance with their privacy policy.</li>
            <li><strong>Netlify</strong> (hosting and deployment) &mdash; Hosts and serves the platform. Netlify processes server logs including IP addresses, request paths, and user agents. Data may be processed in the United States under Standard Contractual Clauses.</li>
          </ul>
          <p>We do not sell your personal data to any third party. We do not share your data with third parties for their own marketing purposes.</p>

          {/* 7. Cookies Policy */}
          <h2 className="font-serif">7. Cookies</h2>
          <p>Our platform uses cookies and similar technologies. Here is what we set and why:</p>
          <h3>Strictly Necessary Cookies</h3>
          <p>These cookies are essential for the platform to function and cannot be switched off.</p>
          <ul>
            <li><strong>sb-*-auth-token</strong> &mdash; Supabase authentication session cookie. Keeps you logged in securely. Expires when you log out or after 7 days of inactivity.</li>
            <li><strong>sb-*-auth-token-code-verifier</strong> &mdash; Used during the authentication flow (PKCE). Temporary, deleted after login completes.</li>
          </ul>
          <h3>Functional Cookies</h3>
          <ul>
            <li><strong>theme / user-preferences</strong> &mdash; Stores your display preferences (if applicable). Persistent, expires after 1 year.</li>
          </ul>
          <h3>Analytics Cookies</h3>
          <p>We do not currently use third-party analytics cookies (such as Google Analytics). If this changes, we will update this policy and request your consent before setting any analytics cookies.</p>
          <h3>Third-Party Cookies</h3>
          <ul>
            <li><strong>Stripe</strong> may set cookies when you interact with payment forms, for fraud prevention and PCI compliance. These are governed by Stripe&apos;s own cookie policy.</li>
          </ul>
          <p>You can manage cookies through your browser settings. Disabling strictly necessary cookies may prevent you from using the platform.</p>

          {/* 8. Your Rights Under GDPR */}
          <h2 className="font-serif">8. Your Rights Under GDPR</h2>
          <p>Under the UK GDPR, you have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Right of access:</strong> You can request a copy of all personal data we hold about you.</li>
            <li><strong>Right to rectification:</strong> You can ask us to correct any inaccurate or incomplete data. You can also update most profile data directly through the platform.</li>
            <li><strong>Right to erasure (&ldquo;right to be forgotten&rdquo;):</strong> You can request that we delete your personal data. We will comply unless we have a legal obligation to retain it.</li>
            <li><strong>Right to data portability:</strong> You can request your data in a structured, commonly used, machine-readable format (JSON or CSV) so that you can transfer it to another service.</li>
            <li><strong>Right to restrict processing:</strong> You can ask us to limit how we use your data in certain circumstances, for example while we investigate a complaint.</li>
            <li><strong>Right to object:</strong> You can object to processing based on legitimate interest. We will stop processing unless we can demonstrate compelling legitimate grounds.</li>
            <li><strong>Right to withdraw consent:</strong> Where we process your data based on consent, you can withdraw that consent at any time. This does not affect the lawfulness of processing carried out before withdrawal.</li>
            <li><strong>Right not to be subject to automated decision-making:</strong> Our matching algorithm generates scores and rankings to assist recruitment decisions, but no hiring decision is made solely by automated means. Employers review all matches before taking action.</li>
          </ul>
          <p>We will respond to all data rights requests within one calendar month, as required by law. In complex cases, we may extend this by a further two months, and will inform you if so.</p>

          {/* 9. Data Subject Requests */}
          <h2 className="font-serif">9. How to Make a Data Subject Request</h2>
          <p>To exercise any of your rights, please contact us at:</p>
          <ul>
            <li>Email: <a href="mailto:rebecca.whc@outlook.com">rebecca.whc@outlook.com</a></li>
          </ul>
          <p>Please include your full name and the email address associated with your account so we can verify your identity. We may ask for additional verification before processing your request.</p>
          <p>You may also delete your account directly through the platform settings, which will trigger deletion of your profile data in accordance with the retention periods described above.</p>

          {/* 10. Data Protection Officer */}
          <h2 className="font-serif">10. Data Protection Officer</h2>
          <p>Our Data Protection Officer can be contacted at:</p>
          <ul>
            <li>Email: <a href="mailto:rebecca.whc@outlook.com">rebecca.whc@outlook.com</a></li>
            <li>Post: Wellness House Collective, United Kingdom</li>
          </ul>
          <p>If you are unsatisfied with how we handle your data, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO):</p>
          <ul>
            <li>Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a></li>
            <li>Helpline: 0303 123 1113</li>
          </ul>

          {/* 11. International Transfers */}
          <h2 className="font-serif">11. International Data Transfers</h2>
          <p>Your data is primarily processed within the United Kingdom and European Economic Area. Where data is transferred outside the UK/EEA (for example, to service providers based in the United States), we ensure appropriate safeguards are in place:</p>
          <ul>
            <li><strong>Standard Contractual Clauses (SCCs):</strong> We use EU/UK-approved Standard Contractual Clauses with processors that transfer data outside the UK/EEA.</li>
            <li><strong>Adequacy decisions:</strong> Where applicable, we rely on UK adequacy decisions recognising that the destination country provides an adequate level of data protection.</li>
          </ul>
          <p>You may request a copy of the safeguards we use by contacting us at the email address above.</p>

          {/* 12. Changes to This Policy */}
          <h2 className="font-serif">12. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will:</p>
          <ul>
            <li>Update the &ldquo;Last updated&rdquo; date at the top of this page</li>
            <li>Notify registered users by email if the changes significantly affect how we process personal data</li>
            <li>Where required, seek fresh consent before applying new processing activities</li>
          </ul>
          <p>We encourage you to review this policy periodically. Your continued use of the platform after changes are published constitutes acceptance of the updated policy.</p>

        </div>
      </section>
      <Footer />
    </div>
  )
}
