import LegalDocumentLayout from "./LegalDocumentLayout";

export default function TermsOfService() {
  return (
    <LegalDocumentLayout title="Terms of Service" lastUpdated="April 22, 2024">
      <section className="space-y-3">
        <h2 className="legal-doc__h2">1. Acceptance of Terms</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            By accessing or using our service, you agree to be bound by these Terms of Service. If you do not
            agree, please do not use the service.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">2. Use License</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            We grant you a limited, non-exclusive, non-transferable license to access and use the service for
            personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer
            of title, and under this license you may not:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Modify or copy the materials;</li>
            <li>Use the materials for any commercial purpose;</li>
            <li>Attempt to decompile or reverse engineer any software;</li>
            <li>Remove any copyright or other proprietary notations from the materials.</li>
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">3. User Accounts</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activity under your account. You agree to provide accurate information when creating an account
            and to notify us promptly of any unauthorized use.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">4. Prohibited Activities</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            You may not use the service for any unlawful purpose or in violation of any applicable laws or
            regulations. You agree to comply with all local laws regarding online conduct and acceptable
            content.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">5. Payment Terms</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            If you purchase paid features or subscriptions, you agree to pay all fees as described at
            checkout. You must provide accurate billing information. We may suspend or terminate access for
            non-payment.
          </p>
          <div className="rounded-[10px] border border-amber-200/80 bg-amber-50 px-[16.67px] py-4">
            <p>
              <strong>Important:</strong> All fees are non-refundable unless otherwise stated in our refund
              policy.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">6. Intellectual Property</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            The service and its original content, features, and functionality are owned by us and are
            protected by applicable intellectual property laws.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">7. Termination</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            We may suspend or terminate your access to the service at any time, with or without notice, for
            conduct that we believe violates these Terms or is harmful to other users or the service.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">8. Limitation of Liability</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            To the fullest extent permitted by law, we shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred
            directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">9. Governing Law</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            These Terms shall be governed by the laws of the jurisdiction in which we operate, without regard
            to conflict of law provisions.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">10. Changes to Terms</h2>
        <div className="legal-doc__prose space-y-2">
          <p>
            We reserve the right to modify these Terms at any time. We will notify you by updating the
            &quot;Last updated&quot; date above. Continued use of the service after changes constitutes
            acceptance of the new Terms.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="legal-doc__h2">11. Contact Information</h2>
        <div className="legal-doc__prose space-y-2">
          <p>For questions about these Terms, please contact us:</p>
        </div>
        <div className="legal-doc__contact flex flex-col gap-2">
          <p>Email: legal@example.com</p>
          <p>Address: 123 Legal Street, Suite 200, City, State 12345</p>
        </div>
      </section>
    </LegalDocumentLayout>
  );
}
