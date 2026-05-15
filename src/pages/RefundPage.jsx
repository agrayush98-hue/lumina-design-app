import LegalLayout, { Section, P, Ul, Highlight } from './legal/LegalLayout.jsx'
import useSEO from '../hooks/useSEO.js'

export default function RefundPage() {
  useSEO({
    title:       'Refund Policy — Lumina Design',
    description: '7-day refund window on all paid plans. No charges during the 14-day free trial. Refunds processed via Razorpay within 5–12 business days.',
    canonical:   'https://app.lightillumina.com/refund',
  })

  return (
    <LegalLayout
      title="Refund Policy"
      subtitle="Our commitment to fair billing and how to request a refund."
      updated="12 May 2026"
    >
      <Section title="1. Free Trial">
        <Highlight>All new accounts receive a 14-day free trial with Pro-level access. No credit card is required during the trial period, and you will not be charged anything.</Highlight>
        <P>At the end of your trial, your account automatically reverts to the Free plan. You will only be charged if you explicitly choose to activate a paid subscription. There are no surprise charges at the end of a trial.</P>
      </Section>

      <Section title="2. Refund Eligibility">
        <P>We offer refunds subject to the following conditions:</P>
        <Ul items={[
          'Refund requests must be submitted within 7 calendar days of the payment date',
          'Only the most recent subscription payment is eligible for a refund',
          'Refunds are available for both the Pro and Professional plans',
          'The Free plan has no charges and therefore no refunds apply',
        ]} />
        <P>If you believe you were charged in error (e.g., a duplicate charge, a charge after cancellation), please contact us immediately regardless of the 7-day window. We will investigate and resolve such cases on a case-by-case basis.</P>
      </Section>

      <Section title="3. Non-Refundable Circumstances">
        <P>Refunds will not be issued in the following situations:</P>
        <Ul items={[
          'Requests made more than 7 days after the payment date',
          'Partial months — we do not offer pro-rata refunds for unused days within a billing period',
          'Accounts suspended or terminated due to a violation of our Terms & Conditions',
          'Payments for previous billing cycles that have already been used',
          'Downgrade from a higher plan to a lower plan (your access continues until the end of the paid period)',
        ]} />
      </Section>

      <Section title="4. How to Request a Refund">
        <P>To request a refund, please contact us using one of the following methods:</P>
        <Ul items={[
          'Email: support@lightillumina.com — include your registered email address, the payment date, and the Razorpay payment ID (found in your payment receipt)',
          'Contact form: lightillumina.com/contact — select "Billing" as the subject',
        ]} />
        <P>Please include the following details in your request to help us process it quickly:</P>
        <Ul items={[
          'Your registered email address',
          'The date of the payment you wish to refund',
          'The Razorpay Order ID or Payment ID (available in your email receipt)',
          'A brief reason for the refund request (optional but helpful)',
        ]} />
      </Section>

      <Section title="5. Processing Time">
        <P>Once your refund request is approved:</P>
        <Ul items={[
          'We will initiate the refund within 2 business days of approval',
          'Razorpay will process the refund to your original payment method within 5–7 business days',
          'The actual credit to your bank account or card may take an additional 2–5 business days depending on your bank',
          'Total expected time from approval to credit: 5–12 business days',
        ]} />
        <P>You will receive an email confirmation once the refund has been initiated on our end. If you do not receive the refund within 15 business days of our confirmation, please contact your bank before reaching out to us.</P>
      </Section>

      <Section title="6. Effect of Refund on Account">
        <P>When a refund is issued for a subscription payment:</P>
        <Ul items={[
          'Your account will be downgraded to the Free plan immediately upon refund approval',
          'Any projects exceeding the Free plan limit (3 projects) will be read-only until you reduce your project count or resubscribe',
          'Your data will not be deleted — it remains accessible in read-only mode',
          'You may resubscribe at any time after a refund',
        ]} />
      </Section>

      <Section title="7. Payment Gateway">
        <P>All payments are processed by Razorpay Software Private Limited. Refunds are returned via the same payment method used for the original transaction (UPI, credit card, debit card, net banking). We are unable to issue refunds to a different payment method.</P>
        <P>In the event of a payment dispute or chargeback raised with your bank, please contact us first at support@lightillumina.com. We will do our best to resolve the issue directly without the need for a formal dispute process.</P>
      </Section>

      <Section title="8. Contact">
        <P>For any billing or refund questions, please reach out to us:</P>
        <Ul items={[
          'Email: support@lightillumina.com',
          'Contact form: lightillumina.com/contact',
          'Response time: within 2 business days',
        ]} />
      </Section>
    </LegalLayout>
  )
}
