import { Link } from 'react-router-dom';
import { LegalPage, Section } from '../../components/legal/LegalPage';

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" updated="26 July 2026">
      <Section title="1. Acceptance of Terms">
        <p>
          By creating an account or otherwise using the RIVERS digital community impact
          platform (the "Platform"), you agree to these Terms of Service and to our{' '}
          <Link to="/privacy" className="text-brand-600 font-semibold hover:underline">Privacy Policy</Link>.
          If you do not agree, please do not use the Platform.
        </p>
      </Section>

      <Section title="2. Eligibility and Accounts">
        <ul>
          <li>You must provide accurate information when creating your account and keep it up to date.</li>
          <li>Each person may hold one account, which may carry one or more roles: community leader, sponsor, volunteer, and/or beneficiary.</li>
          <li>Certain roles and actions require verification before they become fully active.</li>
          <li>Accounts may be suspended if they violate these Terms; suspension blocks access while preserving existing records for accountability.</li>
        </ul>
      </Section>

      <Section title="3. Role Responsibilities">
        <ul>
          <li><strong>Community leaders</strong> are responsible for the accuracy of campaigns, beneficiary records, and evidence they submit, and for verifying beneficiaries in their community in good faith.</li>
          <li><strong>Sponsors</strong> donate voluntarily to campaigns of their choosing and are responsible for the accuracy of their own payment details.</li>
          <li><strong>Volunteers</strong> apply for opportunities in good faith and are responsible for the accuracy of information and documents they submit.</li>
          <li><strong>Beneficiaries</strong> receive support recorded on their behalf by verified community leaders.</li>
        </ul>
      </Section>

      <Section title="4. Donations">
        <ul>
          <li>Donations are voluntary contributions to specific campaigns and are processed through the payment methods offered on the Platform (mobile money, bank transfer, card, or cash).</li>
          <li>The Platform does not guarantee any specific outcome from a campaign, though every approved campaign publishes an evidence-based expenditure and impact record.</li>
          <li>Refunds are handled on a case-by-case basis at the discretion of RIVERS administrators.</li>
          <li>Funds are disbursed against approved campaign budgets and milestones, and expenditures are logged for public transparency.</li>
        </ul>
      </Section>

      <Section title="5. Campaigns and Content">
        <ul>
          <li>All campaigns are reviewed by RIVERS administrators before being published, and may be rejected, paused, or archived at their discretion.</li>
          <li>You must have the right to use any images, evidence, or other content you upload, and you grant RIVERS a licence to display it on the Platform in connection with your campaign or profile.</li>
          <li>While campaigns are reviewed before approval, RIVERS is not a guarantor of every factual claim made by a community leader and relies on the verification evidence submitted.</li>
        </ul>
      </Section>

      <Section title="6. Prohibited Conduct">
        <p>You agree not to:</p>
        <ul>
          <li>Misrepresent your identity, role, or the needs of a beneficiary.</li>
          <li>Submit fraudulent campaigns, expenditures, or verification evidence.</li>
          <li>Attempt to circumvent the Platform's verification or access-control mechanisms.</li>
          <li>Use volunteer, beneficiary, or donor information for any purpose outside the Platform's stated mission.</li>
        </ul>
      </Section>

      <Section title="7. Intellectual Property">
        <p>
          The RIVERS name, logo, and platform design are the property of the RIVERS
          Initiative. You retain ownership of content you upload, subject to the licence
          granted in Section 5.
        </p>
      </Section>

      <Section title="8. Suspension and Termination">
        <p>
          RIVERS may suspend or terminate an account for violation of these Terms, at the
          user's request, or in cases of prolonged inactivity. Financial and transparency
          records associated with a terminated account are retained as described in our{' '}
          <Link to="/privacy" className="text-brand-600 font-semibold hover:underline">Privacy Policy</Link>.
        </p>
      </Section>

      <Section title="9. Disclaimer and Limitation of Liability">
        <p>
          The Platform is provided "as is." RIVERS facilitates connections between
          community leaders, sponsors, volunteers, and beneficiaries but is not a party to
          any transaction between them beyond processing the donation itself. To the
          fullest extent permitted by law, RIVERS is not liable for indirect or
          consequential losses arising from use of the Platform.
        </p>
      </Section>

      <Section title="10. Governing Law">
        <p>These Terms are governed by the laws of the Republic of Rwanda.</p>
      </Section>

      <Section title="11. Changes to These Terms">
        <p>
          We may update these Terms from time to time. Material changes will be reflected
          by updating the date at the top of this page.
        </p>
      </Section>

      <Section title="12. Contact Us">
        <p>
          Questions about these Terms can be sent to{' '}
          <a href="mailto:hello@riversrwanda.rw" className="text-brand-600 font-semibold hover:underline">hello@riversrwanda.rw</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
