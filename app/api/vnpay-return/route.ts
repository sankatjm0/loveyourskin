import { createClient } from "@/lib/supabase/server"
import { verifyVNPayResponse } from "@/lib/vnpay"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const params: Record<string, string> = {}
    const searchParams = request.nextUrl.searchParams

    searchParams.forEach((value, key) => {
      params[key] = value
    })

    // Verify signature
    if (!verifyVNPayResponse(params)) {
      return NextResponse.json({ code: "97", message: "Invalid signature" }, { status: 400 })
    }

    const supabase = await createClient()
    const responseCode = params.vnp_ResponseCode
    const txnRef = params.vnp_TxnRef
    const [orderId] = txnRef.split("-")

    if (responseCode === "00") {
      // Update order
      await supabase
        .from("orders")
        .update({
          payment_status: "completed",
          transaction_id: params.vnp_TransactionNo,
          status: "confirmed",
        })
        .eq("id", orderId)

      // Record payment
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("payments").insert({
          order_id: orderId,
          user_id: user.id,
          amount: Number.parseInt(params.vnp_Amount) / 100,
          vnpay_transaction_id: params.vnp_TransactionNo,
          status: "completed",
          response_data: params,
        })
      }

      return NextResponse.json({ code: "00", message: "success" })
    } else {
      // Update order as failed
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
        })
        .eq("id", orderId)

      return NextResponse.json({ code: "01", message: "Payment failed" })
    }
  } catch (error) {
    console.error("VNPay return error:", error)
    return NextResponse.json({ code: "99", message: "Error" }, { status: 500 })
  }
}
