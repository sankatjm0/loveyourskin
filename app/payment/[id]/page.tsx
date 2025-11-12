import { getOrderById } from "@/lib/orders"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PaymentClient } from "@/components/payment-client"
import { notFound } from "next/navigation"

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params

  let order
  try {
    order = await getOrderById(orderId)
  } catch (error) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
            Premium Store
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-12">Payment</h1>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Order Number</span>
                <span className="font-semibold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className="font-semibold capitalize">{order.status}</span>
              </div>
            </CardContent>
          </Card>

          <PaymentClient order={order} />

          <Link href="/orders" className="text-center text-sm text-muted-foreground hover:text-foreground underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
