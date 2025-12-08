import { getOrderById, getOrderItems } from "@/lib/orders"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { CancelOrderButton } from "@/components/CancelOrderButton"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const order = await getOrderById(id)
  const items = await getOrderItems(id)

  const getStatusSteps = (status: string) => {
    const steps = ["pending", "confirmed", "shipping", "delivered"]
    return steps.map((step) => ({
      step,
      completed: steps.indexOf(step) <= steps.indexOf(status),
    }))
  }

  const statusSteps = getStatusSteps(order.status)

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link href="/orders" className="text-primary hover:underline mb-8 block">
          Back to Orders
        </Link>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Order {order.order_number}</CardTitle>
                </div>
                <Badge className="capitalize">{order.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Order Status Tracking <span className="text-muted-foreground">(Last updated: {new Date(order.updated_at).toLocaleString()})</span></h3>
                <div className="flex gap-4">
                  {statusSteps.map((item, idx) => (
                    <div key={item.step} className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          item.completed ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.completed ? "✓" : idx + 1}
                      </div>
                      <span className="text-sm capitalize">{item.step}</span>
                      {idx < statusSteps.length - 1 && (
                        <div className={`w-8 h-0.5 ${item.completed ? "bg-green-600" : "bg-muted"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 border-t border-border pt-6">
                <div>
                  <h3 className="font-semibold mb-4">Shipping Address</h3>
                  <p>{order.shipping_address}</p>
                  <p>
                    {order.shipping_city}, {order.shipping_postal_code}
                  </p>
                  <p>{order.shipping_country}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date:</span>
                      <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold">{order.total_amount.toFixed(2)}VND</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Status:</span>
                      <span className="font-semibold capitalize">{order.payment_status}</span>
                    </div>
                    {order.transaction_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono text-xs">{order.transaction_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {["pending", "confirmed"].includes(order.status) && (
                <CancelOrderButton orderId={order.id} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-muted rounded-lg">
                    {item.products?.image_url && (
                      <img
                        src={item.products.image_url || "/placeholder.svg"}
                        alt={item.products?.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.products?.name}</h4>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">each</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
