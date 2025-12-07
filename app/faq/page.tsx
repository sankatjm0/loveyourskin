export const metadata = {
  title: "FAQ | LoveYourScent",
  description: "Frequently Asked Questions about LoveYourScent products, orders, and payments.",
}

export default function FAQPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions (FAQ)</h1>

      <section className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg">1. What products does LoveYourScent offer?</h3>
          <p className="text-gray-700">
            LoveYourScent specializes in premium fragrance products including perfumes, body scents,
            and skincare-infused aromas, carefully sourced to ensure quality and authenticity.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">2. How do I place an order?</h3>
          <p className="text-gray-700">
            Simply browse our products, add items to your cart, proceed to checkout, and complete
            payment using your preferred method such as VNPay or Cash on Delivery (if available).
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">3. Can I pay after placing an order?</h3>
          <p className="text-gray-700">
            Yes. You may create an order first and complete payment later through the “Pay Now”
            option in your order details page, provided the order has not expired or been canceled.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">4. What payment methods are supported?</h3>
          <p className="text-gray-700">
            We currently support secure online payments via VNPay (ATM cards, internet banking,
            QR code). All transactions are encrypted and processed through the VNPay gateway.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">5. How can I track my order?</h3>
          <p className="text-gray-700">
            Once your order is shipped, you will receive a tracking number via email or your account
            dashboard. Orders are delivered through VNPost.
          </p>
        </div>
      </section>
    </main>
  )
}
