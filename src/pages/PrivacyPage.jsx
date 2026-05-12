import { useEffect } from 'react'
import LegalLayout, { Section, P, Ul, Highlight } from './legal/LegalLayout.jsx'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — Lumina Design'
    const link = document.querySelector("link[rel='canonical']") || document.createElement('link')
    link.rel = 'canonical'; link.href = 'https://lumina-design-rho.vercel.app/privacy'
    if (!link.parentNode) document.head.appendChild(link)
  }, [])

  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Lumina Design collects, uses, and protects your personal information."
      updated="12 May 2026"
    >
      <Section title="1. Introduction">
        <P>Lumina Design ("we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains what personal data we collect, how we use it, who we share it with, and your rights as a data subject under applicable Indian law.</P>
        <P>By using the Service, you acknowledge that you have read and understood this Privacy Policy and consent to the processing of your personal data as described herein.</P>
      </Section>

      <Section title="2. Information We Collect">
        <P><strong style={{ color: '#ffffff' }}>Account Information</strong></P>
        <Ul items={[
          'Email address (required to create and access your account)',
          'Display name (optional, provided by you)',
          'Account creation date and last login timestamp',
        ]} />
        <P><strong style={{ color: '#ffffff' }}>Payment Information</strong></P>
        <Ul items={[
          'Subscription plan and billing history',
          'Payment confirmation IDs from Razorpay',
          'We do not store card numbers, UPI IDs, or bank account details — all payment data is handled directly by Razorpay',
        ]} />
        <P><strong style={{ color: '#ffffff' }}>Usage Data</strong></P>
        <Ul items={[
          'Projects, rooms, and fixture placements you create within the Service',
          'AI usage counts (number of calls made)',
          'Feature usage patterns (aggregated and anonymised for product analytics)',
          'Log data: IP address, browser type, device type, pages visited, timestamps',
        ]} />
        <P><strong style={{ color: '#ffffff' }}>Communications</strong></P>
        <Ul items={[
          'Messages you send via the contact form (name, email, message content)',
          'Support requests and correspondence with our team',
        ]} />
      </Section>

      <Section title="3. How We Use Your Information">
        <P>We use your personal data only for the purposes for which it was collected:</P>
        <Ul items={[
          'To create and maintain your account and authenticate your identity',
          'To provide, operate, and improve the Service',
          'To process payments and manage your subscription',
          'To send transactional emails: welcome messages, trial reminders, payment receipts, and renewal notifications',
          'To respond to your support and contact form enquiries',
          'To detect and prevent fraud, abuse, and security incidents',
          'To comply with applicable legal obligations',
          'To analyse aggregated usage patterns for product development (data is anonymised)',
        ]} />
        <P>We do not sell, rent, or trade your personal data to third parties for marketing purposes.</P>
      </Section>

      <Section title="4. Third-Party Services and Data Sharing">
        <Highlight>We share your data only with trusted third parties who assist us in providing the Service, and only to the extent necessary for those purposes.</Highlight>
        <P><strong style={{ color: '#ffffff' }}>Firebase (Google LLC)</strong></P>
        <P>We use Firebase (a service by Google LLC, USA) for user authentication, database storage (Firestore), and hosting. Your account data and project data are stored in Firebase. Google processes this data in accordance with its Privacy Policy and the Google Cloud Data Processing Addendum. Firebase stores data in Google's global infrastructure; data may be processed outside India. By using our Service, you consent to this transfer.</P>
        <P><strong style={{ color: '#ffffff' }}>Razorpay Software Private Limited</strong></P>
        <P>Payments are processed by Razorpay (an Indian payment gateway). When you make a payment, Razorpay collects your payment credentials directly. We receive only payment confirmation details (order ID, payment ID). Razorpay's data handling is governed by its own Privacy Policy.</P>
        <P><strong style={{ color: '#ffffff' }}>Resend Inc.</strong></P>
        <P>We use Resend to deliver transactional emails. Your email address and the content of transactional emails are processed by Resend in accordance with its Privacy Policy.</P>
        <P><strong style={{ color: '#ffffff' }}>Vercel Inc.</strong></P>
        <P>The Service is hosted on Vercel's infrastructure. Vercel may process request logs and metadata as part of service delivery.</P>
        <P>We may also disclose your information where required by Indian law, a court order, or a government authority.</P>
      </Section>

      <Section title="5. Cookies and Tracking">
        <P>We use the following types of cookies and similar technologies:</P>
        <Ul items={[
          'Session cookies: used by Firebase to maintain your authenticated session. These are strictly necessary for the Service to function.',
          'Preference cookies: to remember UI settings such as your active project.',
          'Analytics: we may use anonymised, aggregated analytics to understand how the Service is used. No personally identifiable information is used for analytics purposes.',
        ]} />
        <P>You can control cookie settings through your browser. Disabling session cookies will prevent you from logging in to the Service.</P>
      </Section>

      <Section title="6. Data Retention">
        <P>We retain your personal data for as long as your account is active or as needed to provide the Service. Specifically:</P>
        <Ul items={[
          'Account and project data: retained for the duration of your account and for 90 days after account deletion',
          'Payment records: retained for 7 years as required by Indian accounting and GST regulations',
          'Log data: retained for up to 90 days',
          'Contact form messages: retained for up to 2 years',
        ]} />
        <P>After the applicable retention period, your data is securely deleted or anonymised.</P>
      </Section>

      <Section title="7. Data Security">
        <P>We implement industry-standard security measures to protect your personal data:</P>
        <Ul items={[
          'All data in transit is encrypted using TLS/HTTPS',
          'Firestore security rules prevent unauthorised access to your project data',
          'Payment processing uses PCI-DSS-compliant infrastructure via Razorpay',
          'Access to production systems is restricted to authorised personnel',
          'Regular security audits of our codebase and infrastructure',
        ]} />
        <P>No method of data transmission or storage is 100% secure. If you believe your account has been compromised, contact us immediately at support@lightillumina.com.</P>
      </Section>

      <Section title="8. Your Rights Under Indian Law">
        <P>Under applicable Indian law, including the Information Technology Act 2000 and the emerging data protection framework, you have the following rights with respect to your personal data:</P>
        <Ul items={[
          'Right to access: request a copy of the personal data we hold about you',
          'Right to correction: request correction of inaccurate or incomplete data',
          'Right to deletion: request deletion of your account and associated data (subject to legal retention requirements)',
          'Right to withdraw consent: withdraw consent to data processing at any time (this may affect your ability to use the Service)',
          'Right to grievance redressal: raise a complaint with us or with the relevant supervisory authority',
        ]} />
        <P>To exercise any of these rights, contact our Grievance Officer at support@lightillumina.com. We will respond within 30 days of receiving your request.</P>
      </Section>

      <Section title="9. Children's Privacy">
        <P>The Service is not directed to children under 18 years of age. We do not knowingly collect personal data from anyone under 18. If you believe we have inadvertently collected such data, please contact us and we will delete it promptly.</P>
      </Section>

      <Section title="10. Changes to This Policy">
        <P>We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email and update the "Last updated" date above. Your continued use of the Service after changes are posted constitutes your acceptance of the revised policy.</P>
      </Section>

      <Section title="11. Contact and Grievance Officer">
        <P>If you have questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact:</P>
        <Ul items={[
          'Email: support@lightillumina.com',
          'Contact form: lightillumina.com/contact',
          'Response time: within 30 days for data-related requests',
        ]} />
      </Section>
    </LegalLayout>
  )
}
