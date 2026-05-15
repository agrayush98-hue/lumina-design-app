import LegalLayout, { Section, P, Ul, Highlight } from './legal/LegalLayout.jsx'
import useSEO from '../hooks/useSEO.js'

export default function TermsPage() {
  useSEO({
    title:     'Terms & Conditions — Lumina Design',
    description: 'Terms & Conditions governing your use of Lumina Design lighting design software. Governed by Indian law, jurisdiction in Bengaluru.',
    canonical: 'https://app.lightillumina.com/terms',
  })

  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="Please read these terms carefully before using Lumina Design."
      updated="12 May 2026"
    >
      <Section title="1. Agreement to Terms">
        <P>By accessing or using Lumina Design ("the Service") at lightillumina.com or any associated application, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not access or use the Service.</P>
        <P>These Terms constitute a legally binding agreement between you ("User") and Lumina Design ("we," "us," or "our"), governed by the laws of India.</P>
      </Section>

      <Section title="2. Description of Service">
        <P>Lumina Design is a cloud-based lighting design software platform that provides:</P>
        <Ul items={[
          'Real-time lux calculation tools based on the zonal cavity method (EN 12464-1 / CIBSE)',
          'AI-assisted fixture placement and room planning',
          'DALI 2.0 circuit planning and driver scheduling',
          'Fixture library with branded and generic luminaires',
          'PDF and Excel export for professional reports and BOQ',
          'Project management and collaboration tools',
        ]} />
        <P>The Service is intended for lighting designers, electrical consultants, architects, and building professionals. It is not a substitute for site surveys, structural assessments, or professional engineering sign-off.</P>
      </Section>

      <Section title="3. User Accounts">
        <P>To access the Service, you must create an account using a valid email address. You are responsible for:</P>
        <Ul items={[
          'Maintaining the confidentiality of your account credentials',
          'All activity that occurs under your account',
          'Notifying us immediately at support@lightillumina.com of any unauthorised access',
          'Ensuring all information you provide is accurate and kept up to date',
        ]} />
        <P>You must be at least 18 years of age to create an account. By registering, you represent that you meet this requirement.</P>
        <P>We reserve the right to suspend or terminate accounts that violate these Terms, without prior notice.</P>
      </Section>

      <Section title="4. Subscription Plans and Payment">
        <Highlight>All prices are in Indian Rupees (INR) and are inclusive of applicable GST. Payment is processed securely by Razorpay and is subject to Razorpay's terms of service.</Highlight>
        <P>We offer the following plans:</P>
        <Ul items={[
          'Free: ₹0/month — limited to 3 projects and 5 AI calls per month',
          'Pro: ₹1,179/month — 10 projects, 50 AI calls, DALI planning, Excel export',
          'Professional: ₹1,499/month — unlimited projects, 200 AI calls, branded reports',
        ]} />
        <P><strong style={{ color: '#ffffff' }}>Free Trial:</strong> New accounts receive a 14-day trial with Pro-level access. No credit card is required for the trial. At the end of the trial period, the account automatically reverts to the Free plan unless a paid subscription is activated.</P>
        <P><strong style={{ color: '#ffffff' }}>Auto-Renewal:</strong> Paid subscriptions renew automatically at the end of each monthly billing cycle. You will be charged the subscription fee on the renewal date using the payment method on file. You may cancel auto-renewal at any time from your account dashboard.</P>
        <P><strong style={{ color: '#ffffff' }}>Failed Payments:</strong> If a payment fails, we will notify you by email. Access to paid features may be suspended until the outstanding amount is settled.</P>
        <P>We reserve the right to change subscription prices with 30 days' prior notice by email. Continued use of the Service after a price change constitutes acceptance of the new pricing.</P>
      </Section>

      <Section title="5. Acceptable Use Policy">
        <P>You agree not to use the Service to:</P>
        <Ul items={[
          'Violate any applicable law or regulation, including those of India',
          'Upload or transmit malicious code, viruses, or harmful content',
          'Attempt to gain unauthorised access to any part of the Service or its infrastructure',
          'Reverse engineer, decompile, or disassemble any part of the Service',
          'Use automated tools (bots, scrapers) to access the Service without prior written consent',
          'Resell or sublicense access to the Service without written permission',
          'Use the AI features to generate content that violates applicable laws',
          'Impersonate another user or any person',
        ]} />
        <P>We reserve the right to investigate and take appropriate action against any User who violates this policy, including suspension, termination, and referral to law enforcement.</P>
      </Section>

      <Section title="6. Intellectual Property">
        <P>All content, software, algorithms, designs, and intellectual property comprising the Service are owned by or licensed to Lumina Design and are protected under the Copyright Act 1957 and applicable Indian intellectual property laws.</P>
        <P>You retain ownership of the project data, designs, and reports you create using the Service. By using the Service, you grant us a limited, non-exclusive licence to store and process your data solely for the purpose of delivering the Service to you.</P>
        <P>You may not use our brand name, logo, or trademarks without our prior written consent.</P>
      </Section>

      <Section title="7. Data and Privacy">
        <P>Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your data as described in the Privacy Policy.</P>
      </Section>

      <Section title="8. Disclaimer of Warranties">
        <P>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.</P>
        <P>Lux calculations and AI recommendations provided by the Service are estimates based on standard methodologies and input data. They do not constitute a professional engineering assessment and should be verified by a qualified lighting engineer before use in construction or compliance documentation.</P>
        <P>We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.</P>
      </Section>

      <Section title="9. Limitation of Liability">
        <Highlight>To the fullest extent permitted by applicable Indian law, Lumina Design shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of or inability to use the Service.</Highlight>
        <P>Our total cumulative liability to you for any claim arising out of or relating to these Terms or the Service shall not exceed the total amount paid by you to us in the twelve (12) months preceding the event giving rise to the claim.</P>
        <P>Nothing in these Terms shall exclude or limit our liability for death or personal injury caused by our negligence, fraud, or fraudulent misrepresentation, or any other liability that cannot be excluded under applicable Indian law.</P>
      </Section>

      <Section title="10. Termination">
        <P>You may terminate your account at any time by cancelling your subscription from the dashboard and submitting a deletion request to support@lightillumina.com.</P>
        <P>We may suspend or terminate your account immediately, without liability, if:</P>
        <Ul items={[
          'You breach any provision of these Terms',
          'We are required to do so by law or a regulatory authority',
          'We reasonably believe your account has been compromised',
          'Continued provision of the Service becomes commercially unviable',
        ]} />
        <P>On termination, your right to use the Service ceases immediately. Sections 6, 8, 9, and 11 of these Terms survive termination.</P>
      </Section>

      <Section title="11. Governing Law and Dispute Resolution">
        <P>These Terms are governed by and construed in accordance with the laws of India, including the Information Technology Act 2000, the Consumer Protection Act 2019, and all rules and regulations made thereunder.</P>
        <P>Any dispute arising from these Terms or your use of the Service shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.</P>
      </Section>

      <Section title="12. Changes to Terms">
        <P>We may update these Terms from time to time. When we do, we will revise the "Last updated" date at the top of this page and, for material changes, notify you by email. Your continued use of the Service after changes are posted constitutes acceptance of the revised Terms.</P>
      </Section>

      <Section title="13. Contact">
        <P>For questions about these Terms, please contact us at:</P>
        <Ul items={[
          'Email: support@lightillumina.com',
          'Website: lightillumina.com/contact',
        ]} />
      </Section>
    </LegalLayout>
  )
}
