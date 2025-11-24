// This file should only be imported in Server Components or Server Actions
import "server-only"

import { createClient } from "@/lib/supabase/server"

export interface Order {
  id: string
  user_id: string
  order_number: string
  status: "pending" | "confirmed" | "rejected" | "shipping" | "delivered"
  payment_status: "pending" | "completed" | "failed" | "refunded"
  total_amount: number
  transaction_id?: string
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
  shipping_country: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products?: {
    name: string
    image_url: string
  }
}

export async function createOrder(data: {
  total_amount: number
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
  shipping_country: string
  cartItems: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("User not authenticated")

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: "pending",
      payment_status: "pending",
      total_amount: data.total_amount,
      shipping_address: data.shipping_address,
      shipping_city: data.shipping_city,
      shipping_postal_code: data.shipping_postal_code,
      shipping_country: data.shipping_country,
    })
    .select()
    .single()

  if (error) throw error

  if (data.cartItems && data.cartItems.length > 0) {
    const orderItems = data.cartItems.map((item) => ({
      order_id: (order as any).id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) throw itemsError
  }

  // Create notification for user about new order
  try {
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "new_order",
      title: "Order Placed",
      message: `Your order #${orderNumber} has been placed successfully. Total: ${data.total_amount}VND`,
      link: `/orders/${(order as any).id}`,
      read: false,
    })
  } catch (notifError) {
    console.error("Failed to create notification for user:", notifError)
  }

  // Create notification for admin
  try {
    const { data: adminUsers } = await supabase
      .from("admin_access")
      .select("user_id")
      .eq("is_admin", true)
      .limit(10)

    if (adminUsers && adminUsers.length > 0) {
      const adminNotifications = adminUsers.map((admin) => ({
        user_id: admin.user_id,
        type: "new_order",
        title: "New Order Received",
        message: `A new order #${orderNumber} has been received. Total: ${data.total_amount}VND`,
        link: `/admin/order/${(order as any).id}`,
        read: false,
      }))

      await supabase.from("notifications").insert(adminNotifications)
    }
  } catch (notifError) {
    console.error("Failed to create notification for admin:", notifError)
  }

  return order as Order
}

export async function getUserOrders() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Order[]
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).single()

  if (error) throw error
  return data as Order
}

export async function getOrderItems(orderId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("order_items")
    .select("*, products(name, image_url)")
    .eq("order_id", orderId)

  if (error) throw error
  return data as OrderItem[]
}

export async function notifyOrderStatusChange(orderId: string, newStatus: string, userId: string) {
  const supabase = await createClient()

  try {
    const statusMessages: { [key: string]: string } = {
      confirmed: "Your order has been confirmed and is being prepared",
      rejected: "Your order has been rejected",
      shipping: "Your order is on the way to you",
      delivered: "Your order has been delivered",
    }

    const message = statusMessages[newStatus] || `Your order status has been updated to ${newStatus}`

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "order_status",
      title: "Order Status Updated",
      message: message,
      link: `/orders/${orderId}`,
      read: false,
    })
  } catch (error) {
    console.error("Failed to create order status notification:", error)
  }
}
