// /app/admin/page.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { LogOut, Plus, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/Modal"
import { getActiveSlides, uploadSlideImage } from "@/lib/promotions"

// Charts
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"

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
  const [tab, setTab] = useState<"dashboard" | "products" | "users" | "orders" | "promotions">("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ name: "", price: "", image_url: "", category: "" })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

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

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userOrders, setUserOrders] = useState<Order[]>([])

  // Promotions state
  const [promotions, setPromotions] = useState<any[]>([])
  const [selectedPromotion, setSelectedPromotion] = useState<any | null>(null)
  const [promoForm, setPromoForm] = useState({
    name: "",
    mode: "manual",
    start_at: "",
    end_at: "",
    is_active: true,
  })
  const [promoSlidesFiles, setPromoSlidesFiles] = useState<File[]>([])
  const [promoSelectedProducts, setPromoSelectedProducts] = useState<Record<string, number>>({}) // productId -> percent

  const [isModalOpen, setIsModalOpen] = useState(false)

  // Realtime channel
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("category").select("id, name")
      if (error) console.error("fetchCategories", error)
      setCategories(data || [])
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("profiles").select("id, email, created_at")
      if (error) console.error(error)
      setUsers(data || [])
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    const fetchOrders = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("orders").select("id, order_number, total_amount").eq("user_id", selectedUser.id)
      if (error) console.error(error)
      setUserOrders(data || [])
    }
    fetchOrders()
  }, [selectedUser])

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
    setIsLoading(true)
    const supabase = createClient()

    const [productsRes, usersRes, ordersRes, promotionsRes] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("profiles").select("id, email, created_at"),
      supabase.from("orders").select("*, profiles(email)").order("created_at", { ascending: false }),
      supabase.from("promotions").select("*").order("created_at", { ascending: false }),
    ])

    setProducts(productsRes.data || [])
    setUsers(usersRes.data || [])
    setOrders(ordersRes.data || [])
    setPromotions(promotionsRes.data || [])

    // Calculate stats
    const completedOrders = (ordersRes.data || []).filter((o) => o.status === "delivered")
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    setStats({
      totalOrders: ordersRes.data?.length || 0,
      pendingOrders: (ordersRes.data || []).filter((o) => o.status === "pending").length,
      totalRevenue,
    })

    setIsLoading(false)

    // realtime subscriptions
    try {
      if (realtimeChannel && realtimeChannel.unsubscribe) {
        await realtimeChannel.unsubscribe()
      }

      const channel = supabase.channel("public:admin-dashboard")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, payload => loadAllData())
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, payload => loadAllData())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_items" }, payload => loadAllData())
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "order_items" }, payload => loadAllData())
        .subscribe()
      setRealtimeChannel(channel)
    } catch (err) {
      console.warn("Realtime channel failed", err)
    }
  }

  async function uploadImage() {
    if (!imageFile) return null
    const supabase = createClient()
    const fileExt = imageFile.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from("product_images")
      .upload(filePath, imageFile, { cacheControl: "3600", upsert: false })
    if (uploadError) throw uploadError
    const { data: publicUrl } = supabase.storage.from("product_images").getPublicUrl(filePath)
    return publicUrl.publicUrl
  }

  async function handleSaveProduct() {
    if (!productForm.name || !productForm.price) {
      alert("Please fill product name and price")
      return
    }

    const supabase = createClient()
    try {
      let imageUrl = productForm.image_url
      if (imageFile) imageUrl = await uploadImage()

      if (editingProduct) {
        const { error } = await supabase.from("products").update({
          name: productForm.name,
          price: Number.parseFloat(productForm.price),
          image_url: imageUrl,
          category: productForm.category,
        }).eq("id", editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("products").insert({
          name: productForm.name,
          price: Number.parseFloat(productForm.price),
          image_url: imageUrl,
          category: productForm.category,
        })
        if (error) throw error
      }

      setProductForm({ name: "", price: "", image_url: "", category: "" })
      setImageFile(null)
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

  // ---------- Order status helpers ----------
  const allowedTransitions: Record<string, string[]> = {
    pending: ["confirmed", "rejected"],
    confirmed: ["shipping", "rejected"],
    shipping: ["delivered", "rejected"],
    delivered: [],
    rejected: [],
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", orderId)
      if (error) throw error
      loadAllData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating order")
    }
  }

  // ---------- Promotions: create/update ----------
  // Upload slide files (client File list), store URLs into promotion_slides
  async function handleCreatePromotion() {
    const supabase = createClient()
    try {
      // 1. create promotion row
      const toUTC = (local: string) => new Date(local + ":00").toISOString()
      const { data: promoRow, error: promoErr } = await supabase.from("promotions").insert({
        name: promoForm.name,
        mode: promoForm.mode,
        start_at: promoForm.mode === "auto" ? toUTC(promoForm.start_at) : null,
        end_at: promoForm.mode === "auto" ? toUTC(promoForm.end_at) : null,
        is_active: promoForm.is_active,
      }).select().single()
      if (promoErr) throw promoErr

      const promoId = promoRow.id

      // 2. upload slides and insert promotion_slides
      for (const file of promoSlidesFiles) {
        // upload to storage
        const ext = file.name.split(".").pop()
        const fileName = `promotions/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from("promotion_images").upload(fileName, file)
        if (uploadError) console.warn("upload slide err", uploadError)
        const { data: pu } = supabase.storage.from("promotion_images").getPublicUrl(fileName)
        const imageUrl = pu.publicUrl
        await supabase.from("promotion_slides").insert({ promotion_id: promoId, image_url: imageUrl })
      }

      // 3. insert promotion_products for selected products with percent
      const inserts: any[] = []
      for (const productId of Object.keys(promoSelectedProducts)) {
        const percent = Number(promoSelectedProducts[productId])
        if (!isNaN(percent) && percent > 0) {
          inserts.push({
            promotion_id: promoId,
            product_id: productId,
            discount_percent: percent,
          })
        }
      }
      if (inserts.length) {
        const { error: ipErr } = await supabase.from("promotion_products").insert(inserts)
        if (ipErr) console.warn("promotion_products insert err", ipErr)
      }

      // reset form
      setPromoForm({ name: "", mode: "manual", start_at: "", end_at: "", is_active: true })
      setPromoSlidesFiles([])
      setPromoSelectedProducts({})
      loadAllData()
      alert("Promotion created")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating promotion")
    }
  }

  // Toggle selecting a product for promotion
  const toggleProductSelect = (productId: string) => {
    setPromoSelectedProducts(prev => {
      const newState = { ...prev };

      // Nếu đã chọn -> bỏ chọn
      if (newState[productId]) {
        delete newState[productId];
      } 
      else {
        // Nếu chưa chọn -> auto điền discount = 5
        newState[productId] = 5;
      }

      return newState;
    });
  };

  const setProductDiscount = (productId: string, value: number) => {
    setPromoSelectedProducts(prev => ({
      ...prev,
      [productId]: value,
    }));
  };

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  // Dashboard derived metrics
  const orderStatusCounts = useMemo(() => {
    const map: Record<string, number> = {}
    orders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [orders])

  const revenueByDay = useMemo(() => {
    const DAYS = 7
    const buckets: Record<string, number> = {}
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      buckets[key] = 0
    }
    orders.forEach((o) => {
      if (o.status === "delivered") {
        const key = new Date(o.created_at).toISOString().slice(0, 10)
        if (buckets[key] !== undefined) buckets[key] += o.total_amount || 0
      }
    })
    return Object.entries(buckets).map(([date, total]) => ({ date, total }))
  }, [orders])

  const [topProducts, setTopProducts] = useState<{ product_id: string; quantity: number; product?: Product }[]>([])

  useEffect(() => {
    console.log("createClient in admin =", createClient)

    const loadTopProducts = async () => {
      const supabase = createClient()
      // fetch delivered orders ids
      const ordersRes = await supabase.from("orders").select("id").eq("status", "delivered")
      const deliveredIds = (ordersRes.data || []).map((o: any) => o.id)
      if (deliveredIds.length === 0) {
        setTopProducts([])
        return
      }
      const { data, error } = await supabase
        .from("order_items")
        .select("product_id, quantity, products(id, name, image_url)")
        .in("order_id", deliveredIds)
      if (error) {
        console.warn("loadTopProducts", error)
        setTopProducts([])
        return
      }
      const agg: Record<string, number> = {}
      const productMeta: Record<string, any> = {}
      (data || []).forEach((row: any) => {
        const pid = row.product_id
        const qty = Number(row.quantity || 0)
        agg[pid] = (agg[pid] || 0) + qty
        if (row.products) productMeta[pid] = row.products
      })
      const arr = Object.entries(agg)
        .map(([product_id, quantity]) => ({ product_id, quantity, product: productMeta[product_id] || products.find(p => p.id === product_id) }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 6)
      setTopProducts(arr)
    }
    loadTopProducts()
  }, [orders, products])

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
          <Link href="/" className="text-primary hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "shipping": return "bg-purple-100 text-purple-800"
      case "delivered": return "bg-green-100 text-green-800"
      case "rejected": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f", "#a4de6c", "#d0ed57"]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm hover:text-primary transition">View Store</Link>
            <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-lg transition"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border">
          {["dashboard", "products", "users", "orders", "promotions"].map((t) => (
            <button key={t} onClick={() => setTab(t as any)} className={`px-4 py-2 font-medium capitalize border-b-2 transition ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
              <p className="text-sm text-muted-foreground mt-2">Pending: {stats.pendingOrders}</p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Revenue (delivered)</p>
              <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-2">Last 7 days shown below</p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Active Products</p>
              <p className="text-3xl font-bold">{products.length}</p>
              <p className="text-sm text-muted-foreground mt-2">Top product: {topProducts[0]?.product?.name || "-"}</p>
            </div>

            {/* Charts */}
            <div className="col-span-1 lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div className="border border-border rounded-lg p-4 h-80">
                <h4 className="font-semibold mb-2">Order Status Distribution</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={orderStatusCounts} outerRadius={80} label>
                      {orderStatusCounts.map((entry, idx) => (<Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="border border-border rounded-lg p-4 h-80">
                <h4 className="font-semibold mb-2">Revenue (last 7 days)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ReTooltip />
                    <Legend />
                    <Bar dataKey="total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2 mt-4">
              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Top Selling Products</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topProducts.length === 0 ? (<p className="text-sm text-muted-foreground">No product sales data yet.</p>) : (
                    topProducts.map((tp) => (
                      <div key={tp.product_id} className="border p-3 rounded-lg flex items-center gap-3">
                        <img src={tp.product?.image_url || "/placeholder.svg"} className="w-16 h-16 object-cover rounded" />
                        <div><p className="font-semibold">{tp.product?.name || "Unknown"}</p><p className="text-sm text-muted-foreground">{tp.quantity} sold</p></div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <div>
            <button onClick={() => { setEditingProduct(null); setProductForm({ name: "", price: "", image_url: "", category: "" }); setShowProductForm(!showProductForm) }} className="mb-6 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"><Plus size={18} /> Add Product</button>

            {showProductForm && (
              <div className="border border-border rounded-lg p-6 mb-8 bg-muted/50">
                <h3 className="text-xl font-bold mb-4">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg" />
                  <input type="number" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg" />

                  <div>
                    <label className="text-sm mb-2 block">Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full" />
                    <p className="text-xs text-muted-foreground">If you upload an image, it will be saved to Supabase Storage (product_images).</p>
                  </div>

                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg">
                    <option value="">Select Category</option>
                    {categories.map((c) => (<option key={c.id} value={c.name}>{c.name}</option>))}
                  </select>

                  <div className="flex gap-2">
                    <button onClick={handleSaveProduct} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90">Save</button>
                    <button onClick={() => { setShowProductForm(false); setEditingProduct(null) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border border-border rounded-lg overflow-hidden">
                  <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">${product.price}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingProduct(product); setProductForm({ name: product.name, price: product.price.toString(), image_url: product.image_url, category: product.category }); setShowProductForm(true) }} className="flex-1 p-2 border border-border rounded hover:bg-muted transition flex items-center justify-center gap-1"><Edit size={16} /> Edit</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 p-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition flex items-center justify-center gap-1"><Trash2 size={16} /> Delete</button>
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
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><button onClick={() => { setSelectedUser(user); setIsModalOpen(true) }} className="text-primary hover:underline">View Orders</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {isModalOpen && selectedUser && (
              <Modal onClose={() => { setIsModalOpen(false); setSelectedUser(null); setUserOrders([]) }}>
                <button onClick={() => { setIsModalOpen(false); setSelectedUser(null); setUserOrders([]) }} className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition self-start">X</button>
                <h3 className="text-xl font-bold mb-4">{selectedUser.email}</h3>
                <p className="mb-6">Joined on {new Date(selectedUser.created_at).toLocaleDateString()}</p>

                <h4 className="text-lg font-semibold mb-4">Orders</h4>
                <div className="max-h-60 overflow-y-scroll">
                  {userOrders.length === 0 ? (<p>No orders found for this user.</p>) : (
                    <ul>{userOrders.map((order) => (<li key={order.id} className="mb-4"><Link href={`/admin/order/${order.id}`} className="text-primary"><p>Order #{order.order_number} - ${order.total_amount.toFixed(2)}</p></Link></li>))}</ul>
                  )}
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Link href={`/admin/order/${order.id}`}><h3 className="font-semibold">{order.order_number}</h3><p className="text-sm text-muted-foreground">{order.profiles?.email}</p></Link>
                  </div>
                  <div className="text-right"><p className="font-bold">${order.total_amount.toFixed(2)}</p><p className="text-sm">{order.payment_status}</p></div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>

                {/* ACTION: replace buttons with select dropdown (keeps transition rules) */}
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={order.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value
                      if (!allowedTransitions[order.status].includes(newStatus)) {
                        alert("Transition not allowed")
                        return
                      }
                      if (newStatus === "rejected" && !confirm("Bạn có chắc muốn huỷ đơn này?")) return
                      await updateOrderStatus(order.id, newStatus)
                    }}
                    className="px-3 py-2 border border-border rounded-lg bg-white text-sm"
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="shipping">shipping</option>
                    <option value="delivered">delivered</option>
                    <option value="rejected">rejected</option>
                  </select>

                  <span className={`px-2 py-1 text-xs rounded ${getStatusColor(order.status)}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Promotions Tab */}
        {tab === "promotions" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Promotions</h2>
              <button onClick={() => { setSelectedPromotion(null); setPromoForm({ name: "", mode: "manual", start_at: "", end_at: "", is_active: true }); setPromoSlidesFiles([]); setPromoSelectedProducts({}) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">New Promotion</button>
            </div>

            {/* Promotion form */}
            <div className="border border-border rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="Promotion name" value={promoForm.name} onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} className="px-3 py-2 border border-border rounded" />
                <div>
                  <label className="mr-3"><input type="radio" name="mode" checked={promoForm.mode === "manual"} onChange={() => setPromoForm({ ...promoForm, mode: "manual" })} /> Manual</label>
                  <label><input type="radio" name="mode" checked={promoForm.mode === "auto"} onChange={() => setPromoForm({ ...promoForm, mode: "auto" })} /> Auto</label>
                </div>

                {promoForm.mode === "auto" && (
                  <>
                    <input type="datetime-local" value={promoForm.start_at} onChange={(e) => setPromoForm({ ...promoForm, start_at: e.target.value })} className="px-3 py-2 border border-border rounded" />
                    <input type="datetime-local" value={promoForm.end_at} onChange={(e) => setPromoForm({ ...promoForm, end_at: e.target.value })} className="px-3 py-2 border border-border rounded" />
                  </>
                )}

                <div className="col-span-1 md:col-span-2">
                  <label className="block mb-2">Upload slides (multiple)</label>
                  <input type="file" multiple accept="image/*" onChange={(e) => setPromoSlidesFiles(Array.from(e.target.files || []))} />
                  <p className="text-xs text-muted-foreground">Uploaded images will be stored in Supabase Storage (promotion_images).</p>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <h4 className="font-semibold mb-2">Select products & discount %</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-scroll border p-2 rounded">
                    {products.map(p => (
                      <div key={p.id} className="flex items-center gap-3">
                        <input type="checkbox" checked={!!promoSelectedProducts[p.id]} onChange={() => toggleProductSelect(p.id)} />
                        <div className="flex-1">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-muted-foreground">${p.price}</p>
                        </div>
                        <input type="number" min={1} max={90} placeholder="%" value={promoSelectedProducts[p.id] ?? ""} onChange={(e) => setProductDiscount(p.id, Number(e.target.value))} className="w-20 px-2 py-1 border rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 flex gap-2">
                  <button onClick={handleCreatePromotion} className="px-4 py-2 bg-primary text-primary-foreground rounded">Create Promotion</button>
                  <button onClick={() => { setPromoForm({ name: "", mode: "manual", start_at: "", end_at: "", is_active: true }); setPromoSlidesFiles([]); setPromoSelectedProducts({}) }} className="px-4 py-2 border rounded">Reset</button>
                </div>
              </div>
            </div>

            {/* List of promotions */}
            <div className="grid gap-4">
              {promotions.length === 0 ? (<p className="text-sm text-muted-foreground">No promotions yet</p>) : (
                promotions.map((pr) => (
                  <div key={pr.id} className="border p-4 rounded flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{pr.name}</p>
                      <p className="text-sm text-muted-foreground">{pr.mode} {pr.mode === "auto" ? `| ${new Date(pr.start_at).toLocaleString()} - ${new Date(pr.end_at).toLocaleString()}` : ""}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        // simple activate/deactivate toggle
                        const supabase = createClient()
                        const { error } = await supabase.from("promotions").update({ is_active: !pr.is_active }).eq("id", pr.id)
                        if (error) alert("Error toggling")
                        else loadAllData()
                      }} className="px-3 py-2 border rounded">{pr.is_active ? "Deactivate" : "Activate"}</button>
                      <button onClick={async () => {
                        if (!confirm("Delete promotion?")) return
                        const supabase = createClient()
                        const { error } = await supabase.from("promotions").delete().eq("id", pr.id)
                        if (error) alert("Error deleting")
                        else loadAllData()
                      }} className="px-3 py-2 border text-red-600 rounded">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
