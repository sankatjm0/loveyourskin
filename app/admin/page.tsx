"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut, Plus, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  category: string
}

interface User {
  id: string
  email: string
  created_at: string
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  profiles?: { email: string }
  created_at: string
}

export default function AdminPage() {
  const [tab, setTab] = useState<"dashboard" | "products" | "users" | "orders">("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ name: "", price: "", image_url: "", category: "" })

  // Users state
  const [users, setUsers] = useState<User[]>([])

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  })

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

      const { data: adminData } = await supabase.from("admin_access").select("is_admin").eq("user_id", user.id).single()

      if (adminData?.is_admin) {
        setIsAuthenticated(true)
        loadAllData()
      } else {
        setError("You do not have admin access")
        setIsLoading(false)
      }
    } catch (err) {
      setError("Authentication failed")
      setIsLoading(false)
    }
  }

  async function loadAllData() {
    const supabase = createClient()

    const [productsRes, usersRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("profiles").select("id, email, created_at"),
      supabase.from("orders").select("*, profiles(email)").order("created_at", { ascending: false }),
    ])

    setProducts(productsRes.data || [])
    setUsers(usersRes.data || [])
    setOrders(ordersRes.data || [])

    // Calculate stats
    const totalRevenue = (ordersRes.data || [])
      .filter((o) => o.payment_status === "completed")
      .reduce((sum, o) => sum + o.total_amount, 0)

    setStats({
      totalOrders: ordersRes.data?.length || 0,
      pendingOrders: (ordersRes.data || []).filter((o) => o.status === "pending").length,
      totalRevenue,
    })

    setIsLoading(false)
  }

  async function handleSaveProduct() {
    if (!productForm.name || !productForm.price || !productForm.image_url) {
      alert("Please fill all fields")
      return
    }

    const supabase = createClient()
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update({
            name: productForm.name,
            price: Number.parseFloat(productForm.price),
            image_url: productForm.image_url,
            category: productForm.category,
          })
          .eq("id", editingProduct.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("products").insert({
          name: productForm.name,
          price: Number.parseFloat(productForm.price),
          image_url: productForm.image_url,
          category: productForm.category,
        })

        if (error) throw error
      }

      setProductForm({ name: "", price: "", image_url: "", category: "" })
      setEditingProduct(null)
      setShowProductForm(false)
      loadAllData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving product")
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Are you sure?")) return

    const supabase = createClient()
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) throw error
      loadAllData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting product")
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error
      loadAllData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating order")
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

  if (!isAuthenticated) return null

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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {["dashboard", "products", "users", "orders"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 font-medium capitalize border-b-2 transition ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === "dashboard" && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Pending Orders</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <div className="border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <div>
            <button
              onClick={() => {
                setEditingProduct(null)
                setProductForm({ name: "", price: "", image_url: "", category: "" })
                setShowProductForm(!showProductForm)
              }}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
            >
              <Plus size={18} /> Add Product
            </button>

            {showProductForm && (
              <div className="border border-border rounded-lg p-6 mb-8 bg-muted/50">
                <h3 className="text-xl font-bold mb-4">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProduct}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowProductForm(false)
                        setEditingProduct(null)
                      }}
                      className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border border-border rounded-lg overflow-hidden">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">${product.price}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(product)
                          setProductForm({
                            name: product.name,
                            price: product.price.toString(),
                            image_url: product.image_url,
                            category: product.category,
                          })
                          setShowProductForm(true)
                        }}
                        className="flex-1 p-2 border border-border rounded hover:bg-muted transition flex items-center justify-center gap-1"
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 p-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition flex items-center justify-center gap-1"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-6 py-4 text-left font-semibold">Email</th>
                  <th className="px-6 py-4 text-left font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{order.order_number}</h3>
                    <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${order.total_amount.toFixed(2)}</p>
                    <p className="text-sm">{order.payment_status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => updateOrderStatus(order.id, "confirmed")}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition text-sm font-medium"
                  >
                    Xác Nhận
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, "shipping")}
                    className="px-4 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 transition text-sm font-medium"
                  >
                    Giao Hàng
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, "delivered")}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition text-sm font-medium"
                  >
                    Đã Giao
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, "rejected")}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition text-sm font-medium"
                  >
                    Huỷ Đơn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
