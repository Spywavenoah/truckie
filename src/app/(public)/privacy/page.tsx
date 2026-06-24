export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: June 22, 2026</p>

      <div className="mt-8 space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900">1. Information We Collect</h2>
          <p className="mt-2">We collect information you provide during registration including your name, email address, phone number, and payment details. We also collect usage data such as pages visited, features used, and transaction history.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">2. How We Use Your Information</h2>
          <p className="mt-2">We use your information to: provide and improve our services; process transactions; send notifications related to your account and bookings; communicate with you about platform updates; and detect and prevent fraud.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">3. Data Sharing</h2>
          <p className="mt-2">We share your information with: other users as necessary for bookings (e.g., owners see renter details for delivery); payment processors for transaction processing; and law enforcement when required by law. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">4. Data Security</h2>
          <p className="mt-2">We implement industry-standard security measures including encryption, secure servers, and access controls. However, no method of transmission over the Internet is 100% secure. You are responsible for keeping your account credentials safe.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">5. Data Retention</h2>
          <p className="mt-2">We retain your personal data for as long as your account is active or as needed to provide services. After account closure, we retain certain data as required by law or for legitimate business purposes such as fraud prevention.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">6. Your Rights</h2>
          <p className="mt-2">You have the right to: access your personal data; correct inaccurate data; request deletion of your data; object to processing; and export your data. To exercise these rights, contact us at support@truckleasepro.com.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">7. Cookies</h2>
          <p className="mt-2">We use cookies and similar technologies to enhance your experience, analyze usage, and support our marketing efforts. You can control cookie settings through your browser preferences.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">8. Third-Party Services</h2>
          <p className="mt-2">Our platform integrates with third-party services including payment processors (Monnify), email services, and analytics providers. These services have their own privacy policies governing data handling.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">9. Children&apos;s Privacy</h2>
          <p className="mt-2">Our platform is not intended for users under 18 years of age. We do not knowingly collect data from children. If we become aware of such collection, we will delete the information promptly.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">10. Changes to Policy</h2>
          <p className="mt-2">We may update this privacy policy periodically. Material changes will be communicated via email or platform notification. Your continued use after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">11. Contact Us</h2>
          <p className="mt-2">For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:privacy@truckleasepro.com" className="text-accent underline">privacy@truckleasepro.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
