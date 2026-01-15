import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2026</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Kadosh AI ("we", "our", or "us") is committed to protecting your personal data and respecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the
                Feedback Normalizer application ("Service").
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                This policy complies with the Personal Data Protection Act 2010 (PDPA) of Malaysia and other applicable
                data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-3">We may collect the following types of personal data:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, company name, and role when you register for an account.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our Service, including feedback submissions, request management activities, and feature usage.</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies for authentication and service improvement.</li>
                <li><strong>Feedback Content:</strong> Any feedback, comments, or communications you submit through the Service.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">We use your personal data for the following purposes:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>To provide, maintain, and improve our Service</li>
                <li>To process and manage feedback requests</li>
                <li>To communicate with you about your account and service updates</li>
                <li>To provide customer support and respond to inquiries</li>
                <li>To analyze usage patterns and enhance user experience</li>
                <li>To ensure security and prevent fraud</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. AI Processing</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Service uses artificial intelligence to analyze and categorize feedback. This processing is performed
                to extract insights such as sentiment, priority levels, and suggested actions. AI-processed data is used
                solely to improve the Service's functionality and provide you with better feedback management capabilities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-600 leading-relaxed mb-3">We may share your personal data with:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our Service (e.g., cloud hosting, AI processing).</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
                <li><strong>Business Transfers:</strong> In connection with any merger, acquisition, or sale of assets.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                We do not sell your personal data to third parties for marketing purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against
                unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers,
                and access controls. However, no method of transmission over the Internet is 100% secure, and we cannot
                guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal data only for as long as necessary to fulfill the purposes for which it was
                collected, including to satisfy legal, accounting, or reporting requirements. When data is no longer
                needed, it will be securely deleted or anonymized.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Your Rights Under PDPA</h2>
              <p className="text-gray-600 leading-relaxed mb-3">Under the Personal Data Protection Act 2010, you have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request access to your personal data held by us.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete personal data.</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for processing of your personal data.</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format.</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal retention requirements.</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                To exercise any of these rights, please contact us using the information provided below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar tracking technologies to maintain your session, remember your preferences,
                and analyze Service usage. You can control cookie settings through your browser, but disabling cookies
                may affect the functionality of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by
                posting the new policy on this page and updating the "Last updated" date. Your continued use of the
                Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Kadosh AI</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Email:</strong> asha@kadoshai.com</p>
                  <p><strong>Address:</strong> Petaling Jaya, Malaysia</p>
                  <p><strong>Data Protection Officer:</strong> Colin Benedict Raj</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          2026 Feedback Normalizer. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
