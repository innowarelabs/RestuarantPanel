import LegalDocumentLayout from "./LegalDocumentLayout";

export default function PrivacyPolicy() {
  return (
    <LegalDocumentLayout title="Privacy Policy" lastUpdated="April 22, 2026">
      <section className="space-y-3">
        <h2 className="legal-doc__h2">1. Information We Collect</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            We collect information you provide directly to us, including when you create an account, update
            your profile, make purchases, or communicate with us. This may include your name, email address,
            payment information, and other details you choose to provide.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">2. How We Use Your Information</h2>
        <div className="legal-doc__prose space-y-2">
          <p>We use the information we collect to provide, maintain, and improve our services, including:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Providing and delivering the services you request;</li>
            <li>Processing and completing transactions;</li>
            <li>Sending administrative information;</li>
            <li>Responding to your inquiries and support requests.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">3. Information Sharing</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            We do not sell your personal information. We may share information with service providers who
            assist us in operating our business, subject to confidentiality obligations, or when required by
            law.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">4. Data Security</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            We implement appropriate technical and organizational measures designed to protect your personal
            information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">5. Your Rights</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            Depending on your location, you may have the right to access, correct, update, or delete your
            personal information. To exercise these rights, contact us at{" "}
            <a href="mailto:privacy@example.com">privacy@example.com</a>.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">6. Cookies and Tracking</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            We use cookies and similar technologies to understand how you use our service, improve
            performance, and personalize your experience. You can control cookies through your browser
            settings.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">7. Changes to This Policy</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            We may update this Privacy Policy from time to time. We will notify you by updating the
            &quot;Last updated&quot; date above. We encourage you to review this policy periodically.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">8. Contact Us</h2>
        <div className="legal-doc__prose space-y-2">
          <p>If you have questions about this Privacy Policy, please contact us:</p>
        </div>
        <div className="legal-doc__contact flex flex-col gap-2">
          <p>Email: privacy@example.com</p>
          <p>Address: 123 Privacy Street, Suite 100, City, State 12345</p>
        </div>
      </section>
    </LegalDocumentLayout>
  );
}
