import { createClient } from "@/lib/supabase/server"

export async function isAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminAccess } = await supabase.from("admin_access").select("is_admin").eq("user_id", user.id).single()

  return adminAccess?.is_admin ?? false
}

export async function getAllOrders() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select("*, profiles(email)")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "confirmed" | "rejected" | "shipping" | "delivered",
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)

  if (error) throw error
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "completed" | "failed" | "refunded",
) {
  const supabase = await createClient()

  const { error } = await supabase.from("orders").update({ payment_status: paymentStatus }).eq("id", orderId)

  if (error) throw error
}
