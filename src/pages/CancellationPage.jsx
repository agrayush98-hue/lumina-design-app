import { useEffect } from 'react'
import LegalLayout, { Section, P, Ul, Highlight } from './legal/LegalLayout.jsx'

export default function CancellationPage() {
  useEffect(() => {
    document.title = 'Cancellation Policy — Lumina Design'
    const link = document.querySelector("link[rel='canonical']") || document.createElement('link')
    link.rel = 'canonical'; link.href = 'https://lumina-design-rho.vercel.app/cancellation'
    if (!link.parentNode) document.head.appendChild(link)
  }, [])

  return (
    <LegalLayout
      title="Cancellation Policy"
      subtitle="Cancel anytime — no fees, no hassle, no lock-in."
      updated="12 May 2026"
    >
      <Section title="1. Cancel Anytime">
        <Highlight>You may cancel your Lumina Design subscription at any time. There are no cancellation fees, no penalties, and no minimum commitment period.</Highlight>
        <P>Cancellation takes effect at the end of your current billing period. You will not be billed again after cancellation, and your account will revert to the Free plan when the paid period ends.</P>
      </Section>

      <Section title="2. How to Cancel">
        <P>You can cancel your subscription in one of the following ways:</P>
        <Ul items={[
          'Dashboard: Go to Account Settings → Subscription → Cancel Plan. The cancellation is immediate and takes effect at the end of the current billing cycle.',
          'Email: Send a cancellation request to support@lightillumina.com from your registered email address. Include your account email and a brief note that you wish to cancel.',
          'Contact form: lightillumina.com/contact — we will process the request within 1 business day.',
        ]} />
        <P>We recommend cancelling via the dashboard for the fastest result. Email and contact form cancellations are processed within 1 business day of receipt.</P>
      </Section>

      <Section title="3. Access After Cancellation">
        <P>When you cancel a paid subscription:</P>
        <Ul items={[
          'Your paid access continues until the last day of your current billing period — you are not cut off immediately',
          'No pro-rata credit or refund is issued for the unused portion of the billing period (see our Refund Policy if you are within the 7-day refund window)',
          'On the day your paid period ends, your account automatically downgrades to the Free plan',
          'Free plan limits apply: up to 3 projects, 5 AI calls per month, no DALI planning, no Excel export',
        ]} />
      </Section>

      <Section title="4. What Happens to Your Data">
        <P>Your data is never deleted when you cancel. We retain your account and project data as follows:</P>
        <Ul items={[
          'All your projects remain in your account and are accessible in read-only mode if you exceed Free plan limits',
          'Projects within the Free plan limit (3 projects) remain fully editable',
          'Account data and project data are retained for 90 days after account deletion (if you choose to delete your account)',
          'You can resubscribe at any time and immediately regain full access to all your data',
        ]} />
        <P>If you wish to permanently delete your account and all associated data, submit a deletion request to support@lightillumina.com. See our Privacy Policy for full details on data retention.</P>
      </Section>

      <Section title="5. Resubscribing">
        <P>You can resubscribe to a paid plan at any time from your account dashboard. When you resubscribe:</P>
        <Ul items={[
          'Your new billing cycle starts from the date of resubscription',
          'All your previously created projects are immediately accessible again',
          'There are no re-activation fees',
          'If you resubscribe within the same calendar month you cancelled, you will be charged a full monthly fee (not a pro-rata amount)',
        ]} />
      </Section>

      <Section title="6. Cancellation by Lumina Design">
        <P>We reserve the right to suspend or cancel your account in certain circumstances, including but not limited to:</P>
        <Ul items={[
          'Breach of our Terms & Conditions or Acceptable Use Policy',
          'Non-payment or repeated payment failures',
          'Where required by applicable Indian law or a regulatory authority',
          'Where continued provision of the Service becomes commercially unviable (with 30 days\' prior notice)',
        ]} />
        <P>In the event of cancellation by us due to a breach on your part, no refund will be issued for the remaining period. In other cases (e.g., service discontinuation), we will provide a pro-rata refund for the unused portion of your billing period.</P>
      </Section>

      <Section title="7. Contact">
        <P>For questions about cancellation or your account, please contact us:</P>
        <Ul items={[
          'Email: support@lightillumina.com',
          'Contact form: lightillumina.com/contact',
          'Response time: within 1–2 business days',
        ]} />
      </Section>
    </LegalLayout>
  )
}
