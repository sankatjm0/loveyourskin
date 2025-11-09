"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: adminData, error: adminError } = await supabase
        .from("admin_access")
        .select("is_admin")
        .eq("user_id", user.id)
        .single()

      if (adminData?.is_admin) {
        setIsAuthenticated(true)
        loadOrders()
      } else {
        setError("You do not have admin access")
        setIsLoading(false)
      }
    } catch (err) {
      setError("Authentication failed")
      setIsLoading(false)
    }
  }

  async function loadOrders() {
    const supabase = createClient()

    const { data, error: loadError } = await supabase
      .from("orders")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false })

    if (!loadError) {
      setOrders(data || [])
    }
    setIsLoading(false)
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)

    if (!updateError) {
      loadOrders()
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    confirmedOrders: orders.filter((o) => o.status === "confirmed").length,
    shippingOrders: orders.filter((o) => o.status === "shipping").length,
    deliveredOrders: orders.filter((o) => o.status === "delivered").length,
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm hover:text-primary transition">
              View Store
            </Link>
            <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-lg transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Orders</h2>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-12">
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-3xl font-bold text-blue-600">{stats.confirmedOrders}</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Shipping</p>
            <p className="text-3xl font-bold text-purple-600">{stats.shippingOrders}</p>
          </div>
          <div className="border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-3xl font-bold text-green-600">{stats.deliveredOrders}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-6 py-4 text-left font-semibold">Order #</th>
                <th className="px-6 py-4 text-left font-semibold">Customer</th>
                <th className="px-6 py-4 text-left font-semibold">Amount</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-left font-semibold">Payment</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition">
                  <td className="px-6 py-4 font-mono text-sm">{order.order_number}</td>
                  <td className="px-6 py-4 text-sm">{order.profiles?.email}</td>
                  <td className="px-6 py-4 font-bold">${order.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize">{order.payment_status}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="px-3 py-1 border border-border rounded text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipping">Shipping</option>
                      <option value="delivered">Delivered</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
