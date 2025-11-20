import { getOrderById, getOrderItems } from "@/lib/orders"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OrderDetailClient from "./order-detail-client"

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

  return <OrderDetailClient order={order} items={items} />
}
