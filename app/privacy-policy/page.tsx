export const metadata = {
  title: "Privacy Policy | LoveYourScent",
  description: "Privacy and data protection policy at LoveYourScent.",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <section className="space-y-6 text-gray-700">
        <p>
          LoveYourScent respects your privacy and is committed to protecting your personal data.
          This policy explains how we collect, use, and safeguard your information.
        </p>

        <div>
          <h3 className="font-semibold text-lg">Information We Collect</h3>
          <p>
            We may collect personal information including your name, email address, phone number,
            shipping address, and payment-related data when you place an order or register an account.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">How We Use Your Information</h3>
          <ul className="list-disc list-inside">
            <li>To process orders and payments</li>
            <li>To deliver products via shipping partners</li>
            <li>To provide customer support</li>
            <li>To improve our services and user experience</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Data Security</h3>
          <p>
            All payment transactions are processed securely via VNPay. We implement industry-standard
            security measures to protect your personal data.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Third-party Sharing</h3>
          <p>
            Your information is shared only with trusted third parties such as payment providers
            and shipping services (VNPost) strictly for order fulfillment purposes.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Policy Updates</h3>
          <p>
            LoveYourScent may update this Privacy Policy at any time. Changes will be reflected on
            this page with immediate effect.
          </p>
        </div>
      </section>
    </main>
  )
}
