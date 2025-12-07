export const metadata = {
  title: "Returns & Refunds | LoveYourScent",
  description: "Return and refund policy at LoveYourScent.",
}

export default function ReturnsPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Returns & Refund Policy</h1>

      <section className="space-y-6 text-gray-700">
        <p>
          At LoveYourScent, customer satisfaction is our priority. Our return and refund policy
          follows standard e-commerce practices similar to Shopee’s guidelines.
        </p>

        <div>
          <h3 className="font-semibold text-lg">Return Conditions</h3>
          <ul className="list-disc list-inside">
            <li>Product must be unused and in original packaging</li>
            <li>Return request must be submitted within 7 days of delivery</li>
            <li>Proof of purchase (order ID or invoice) is required</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Non-returnable Items</h3>
          <p>
            Opened fragrance products, used personal care items, and items damaged due to customer
            misuse are not eligible for return.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Refund Processing</h3>
          <p>
            Approved refunds will be processed within 7–14 business days depending on your payment
            method. VNPay transactions will be refunded to the original payment source.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Return Shipping</h3>
          <p>
            Return shipping fees may be borne by the customer unless the product is defective
            or incorrectly delivered.
          </p>
        </div>
      </section>
    </main>
  )
}
