import { Link } from 'react-router-dom';
import { LegalPage, Section } from '../../components/legal/LegalPage';

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="26 July 2026">
      <Section title="1. Introduction">
        <p>
          This Privacy Policy explains how the RIVERS Initiative ("RIVERS", "we", "us")
          collects, uses, stores, and protects personal information through the RIVERS
          digital community impact platform (the "Platform"). It applies to community
          leaders, sponsors, volunteers, beneficiaries, and administrators who use the
          Platform.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p>We collect the following categories of information:</p>
        <ul>
          <li><strong>Account information:</strong> full name, email address, phone number, organisation, community/district, and the role(s) you select (community leader, sponsor, volunteer, beneficiary).</li>
          <li><strong>Google sign-in:</strong> if you use "Sign in with Google," we receive your name, email address, and profile photo from Google.</li>
          <li><strong>Sponsor activity:</strong> donation amount, payment method, payment reference, and any message left with a donation.</li>
          <li><strong>Volunteer applications:</strong> phone number, LinkedIn profile, languages spoken, emergency contact details, CV, and identity document, submitted when applying to a volunteer opportunity.</li>
          <li><strong>Beneficiary support records:</strong> needs category, household size, district/sector, and assistance history. Beneficiary records are entered by verified community leaders using anonymised record identifiers — real names are never stored in the beneficiary register.</li>
          <li><strong>Uploaded files:</strong> receipts, evidence photos, CVs, and identity documents, stored in our Supabase Storage bucket.</li>
          <li><strong>Platform activity:</strong> an audit log of actions taken by administrators and community leaders (e.g. campaign approvals, role changes), kept for accountability.</li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <ul>
          <li>To operate your account and the features associated with your role(s).</li>
          <li>To process and record donations, campaigns, expenditures, and disbursements.</li>
          <li>To send transactional emails — pledge reminders, abandoned-donation nudges, and (for admins) broadcast announcements. You can unsubscribe from non-essential emails at any time; our email log stores only your user ID, message kind, and delivery status — never message content.</li>
          <li>To enforce access control: our database uses Row Level Security so that what you can see and do is restricted to your role, enforced independently of the Platform's interface.</li>
          <li>To publish transparency reporting — aggregate figures such as funds raised, expenditures, and impact outcomes are shown publicly for approved campaigns, in line with the Platform's transparency mission. Personal beneficiary identities are never made public.</li>
        </ul>
      </Section>

      <Section title="4. Legal Basis and Compliance">
        <p>
          RIVERS processes personal data in accordance with Rwanda's Law N°058/2021 of
          22/10/2021 relating to the Protection of Personal Data and Privacy. Where you
          provide sensitive information (e.g. as part of a beneficiary or volunteer
          application), we rely on your consent given at the point of submission.
        </p>
      </Section>

      <Section title="5. Sharing With Third Parties">
        <p>We do not sell your personal data. We share data only with the service providers that operate the Platform:</p>
        <ul>
          <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
          <li><strong>Google</strong> — if you choose to sign in with Google.</li>
          <li><strong>Resend</strong> — delivery of transactional and broadcast emails.</li>
          <li><strong>Vercel</strong> — hosting of the web application.</li>
        </ul>
      </Section>

      <Section title="6. Data Retention">
        <p>
          Records that support the Platform's transparency mission — donations,
          expenditures, disbursements, and audit logs — are retained indefinitely, so
          that the public trail of how funds were used remains intact. Personal profile
          information (name, contact details, avatar) can be corrected at any time from
          your account settings, or deleted on request, subject to retaining the
          anonymised transaction records described above.
        </p>
      </Section>

      <Section title="7. Your Rights">
        <ul>
          <li>Access and correct your account information from Settings.</li>
          <li>Unsubscribe from broadcast or reminder emails at any time.</li>
          <li>Request deletion of your personal profile data by contacting us below.</li>
          <li>Ask us what personal data we hold about you.</li>
        </ul>
      </Section>

      <Section title="8. Security">
        <p>
          Access to Platform data is enforced at the database level through Row Level
          Security, independent of the application layer. Passwords are managed entirely
          by our authentication provider and are never visible to RIVERS. Uploaded
          documents (identity documents, CVs, receipts) are stored in an access-controlled
          storage bucket.
        </p>
      </Section>

      <Section title="9. Children and Beneficiary Data">
        <p>
          The Platform's beneficiary program may include support for minors. In these
          cases, information is recorded exclusively by verified community leaders using
          anonymised identifiers — minors do not create accounts or submit data directly.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be
          reflected by updating the date at the top of this page.
        </p>
      </Section>

      <Section title="11. Contact Us">
        <p>
          Questions about this policy or your data can be sent to{' '}
          <a href="mailto:hello@riversrwanda.rw" className="text-brand-600 font-semibold hover:underline">hello@riversrwanda.rw</a>.
        </p>
        <p>
          See also our <Link to="/terms" className="text-brand-600 font-semibold hover:underline">Terms of Service</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
