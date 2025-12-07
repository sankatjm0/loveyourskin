export const metadata = {
  title: "Shipping Information | LoveYourScent",
  description: "Shipping policies, delivery time, and fees at LoveYourScent.",
}

export default function ShippingInfoPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Shipping Information</h1>

      <section className="space-y-6 text-gray-700">
        <p>
          LoveYourScent is committed to delivering your orders safely, quickly, and reliably.
          All orders are processed and shipped within Vietnam.
        </p>

        <div>
          <h3 className="font-semibold text-lg">Shipping Provider</h3>
          <p>
            We use <strong>VNPost</strong> as our primary shipping partner to ensure nationwide coverage
            and reliable delivery.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Shipping Fees</h3>
          <ul className="list-disc list-inside">
            <li>Orders below <strong>100,000 VND</strong>: shipping fee applies</li>
            <li>Orders from <strong>100,000 VND</strong> or more: <strong>FREE SHIPPING</strong></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Delivery Time</h3>
          <p>
            Estimated delivery time is 2–5 business days depending on your location and VNPost
            delivery schedule.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg">Taxes</h3>
          <p>
            A standard <strong>10% VAT</strong> is applied to each order as required by Vietnamese regulations.
            The tax amount is clearly displayed during checkout.
          </p>
        </div>
      </section>
    </main>
  )
}
