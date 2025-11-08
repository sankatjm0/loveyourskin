"use client"

import { getOrderById } from "@/lib/orders"
import { createVNPayUrl } from "@/lib/vnpay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadOrder() {
      try {
        const orderData = await getOrderById(orderId)
        setOrder(orderData)
      } catch (error) {
        alert("Failed to load order")
        router.push("/")
      }
    }

    loadOrder()
  }, [orderId, router])

  const handleVNPayPayment = () => {
    if (!order) return

    setIsLoading(true)

    try {
      const createDate = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .substring(0, 14)
      const txnRef = `${order.id}-${createDate}`
      const amount = Math.round(order.total_amount * 100)

      const vnpayUrl = createVNPayUrl({
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Payment for order ${order.order_number}`,
        vnp_Amount: amount,
        vnp_CreateDate: createDate,
      })

      // Redirect to VNPay
      window.location.href = vnpayUrl
    } catch (error) {
      alert("Failed to initiate payment")
      setIsLoading(false)
    }
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
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

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Please select a payment method to complete your order.
              </p>
              <Button onClick={handleVNPayPayment} disabled={isLoading} className="w-full py-6 text-lg">
                {isLoading ? "Processing..." : "Pay with VNPay"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You will be redirected to VNPay to complete the payment securely.
              </p>
            </CardContent>
          </Card>

          <Link href="/orders" className="text-center text-sm text-muted-foreground hover:text-foreground underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
