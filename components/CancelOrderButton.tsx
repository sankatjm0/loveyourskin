"use client"

import { createClient } from "@/lib/supabase/client"

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const handleCancel = async () => {
    if (!confirm("Cancel this order?")) return

    const supabase = createClient()

    const { error } = await supabase
      .from("orders")
      .update({ status: "rejected" })
      .eq("id", orderId)

    if (error) {
      alert("Failed to cancel order")
      return
    }

    location.reload()
  }

  return (
    <button
    onClick={handleCancel}
    className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition flex items-center justify-center gap-1"
    >
    Cancel order
    </button>
  )
}
