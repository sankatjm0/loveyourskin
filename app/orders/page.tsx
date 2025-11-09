"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      const supabase = createClient()

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        window.location.href = "/auth/login"
        return
      }

      setUser(currentUser)

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setOrders(data)
      }
    } catch (err) {
      console.error("Error loading orders:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "shipping":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "pending":
        return "text-yellow-600"
      case "failed":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
            Premium Store
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/products" className="text-sm hover:text-primary transition">
              Products
            </Link>
            <Link href="/cart" className="text-sm hover:text-primary transition">
              Cart
            </Link>
            <Link href="/profile" className="text-sm hover:text-primary transition">
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-12">My Orders</h1>

        {isLoading ? (
          <div className="text-center py-12 bg-card rounded-lg">
            <p className="text-muted-foreground mb-4">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg">
            <p className="text-muted-foreground mb-4">You haven't placed any orders yet</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                <div className="bg-card rounded-lg p-6 border border-border hover:border-primary transition">
                  <div className="grid md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Number</p>
                      <p className="font-semibold">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={`capitalize ${getStatusColor(order.status)}`}>{order.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment</p>
                      <p className={`font-semibold capitalize ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
