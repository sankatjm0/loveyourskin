// Separated from server component to keep build clean

"use client"

import { createVNPayUrl } from "@/lib/vnpay"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface PaymentClientProps {
  order: {
    id: string
    order_number: string
    total_amount: number
  }
}

export function PaymentClient({ order }: PaymentClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleVNPayPayment = () => {
    setIsLoading(true)

    try {
      const createDate = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .substring(0, 14)
      const txnRef = `${order.id}`
      const amount = Math.round(order.total_amount * 100)

      const vnpayUrl = createVNPayUrl({
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Payment for order ${order.order_number}`,
        vnp_Amount: amount,
        vnp_CreateDate: createDate,
      })

      window.location.href = vnpayUrl
    } catch (error) {
      alert("Failed to initiate payment")
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground mb-4">Please select a payment method to complete your order.</p>
        <Button onClick={handleVNPayPayment} disabled={isLoading} className="w-full py-6 text-lg">
          {isLoading ? "Processing..." : "Pay with VNPay"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          You will be redirected to VNPay to complete the payment securely.
        </p>
      </CardContent>
    </Card>
  )
}
