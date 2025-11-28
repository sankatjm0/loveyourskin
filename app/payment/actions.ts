"use server"

import { notifyAdminsOfNewOrder } from "@/lib/notifications"
import { notifyUserOfOrderSuccess } from "@/lib/notifications"
import { createAdminClient } from "@/lib/supabase/server"

export async function notifyPaymentSuccess(orderId: string) {
  try {
    const adminClient = await createAdminClient()
    
    // Get order details
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .select("*, users(email)")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.error("[Payment Actions] Error fetching order:", orderError)
      return { success: false, error: "Order not found" }
    }

    const userEmail = order.users?.email || "Unknown"
    const totalAmount = order.total_amount || 0

    // Notify admins of new order
    await notifyAdminsOfNewOrder(orderId, userEmail, totalAmount)

    // Notify user of successful order
    if (order.user_id) {
      await notifyUserOfOrderSuccess(order.user_id, orderId)
    }

    return { success: true }
  } catch (error) {
    console.error("[Payment Actions] Error in notifyPaymentSuccess:", error)
    return { success: false, error }
  }
}
