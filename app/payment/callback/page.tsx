"use client"

import { createClient } from "@/lib/supabase/client"
import { verifyVNPayResponse } from "@/lib/vnpay"
import { notifyPaymentSuccess } from "@/app/payment/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "failure">("loading")
  const [message, setMessage] = useState("")
  const [orderId, setOrderId] = useState("")

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get all query parameters
        const params: Record<string, string> = {}
        searchParams.forEach((value, key) => {
          params[key] = value
        })

        // Verify VNPay response
        if (!verifyVNPayResponse(params)) {
          setStatus("failure")
          setMessage("Invalid payment signature")
          return
        }

        const responseCode = params.vnp_ResponseCode
        const txnRef = params.vnp_TxnRef

        // Extract order ID from txnRef
        const [id] = txnRef.split("-")
        setOrderId(id)

        if (responseCode === "00") {
          // Payment successful
          const supabase = createClient()

          // Update order payment status
          const { error } = await supabase
            .from("orders")
            .update({
              payment_status: "completed",
              transaction_id: params.vnp_TransactionNo,
              status: "confirmed",
            })
            .eq("id", id)

          if (error) throw error

          // Create payment record
          await supabase.from("payments").insert({
            order_id: id,
            user_id: params.vnp_TmnCode as any, // This should be replaced with actual user_id
            amount: Number.parseInt(params.vnp_Amount) / 100,
            vnpay_transaction_id: params.vnp_TransactionNo,
            status: "completed",
            response_data: params,
          })

          // Send notifications to admin and user
          await notifyPaymentSuccess(id)

          setStatus("success")
          setMessage("Payment successful! Your order has been confirmed.")
        } else {
          setStatus("failure")
          setMessage(`Payment failed. Code: ${responseCode}`)
        }
      } catch (error) {
        setStatus("failure")
        setMessage("An error occurred while processing payment")
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>
              {status === "loading" && "Processing Payment..."}
              {status === "success" && "Payment Successful"}
              {status === "failure" && "Payment Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{message}</p>
            {status === "success" && (
              <Link
                href={`/orders/${orderId}`}
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
              >
                View Order
              </Link>
            )}
            {status === "failure" && (
              <Link
                href="/orders"
                className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
              >
                Back to Orders
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
