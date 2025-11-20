// /app/admin/page.tsx
"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { LogOut, Plus, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/Modal"
import { Notifications } from "@/components/notifications"
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
  image_url?: string[]
  stock: number
  category?: string
  details?: string
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
  const [tab, setTab] = useState<"dashboard" | "products" | "users" | "orders" | "promotions" | "history">("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({ name: "", price: "", image_url: "", stock: "", category: "", categories: [] as string[], details: "" })
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([]) // For preview
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [productPromoMode, setProductPromoMode] = useState<"none" | "manual" | "auto">("none")
  const [productAutoPromo, setProductAutoPromo] = useState<{ enabled: boolean; discount_percent: number }>({ enabled: false, discount_percent: 0 })
  const [productManualPromo, setProductManualPromo] = useState<{ enabled: boolean; discount_percent: number }>({ enabled: false, discount_percent: 0 })

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
  const [userProfileEdit, setUserProfileEdit] = useState({ full_name: "", phone: "", address: "", city: "", postal_code: "", country: "" })
  const [isEditingUserProfile, setIsEditingUserProfile] = useState(false)
  const [promotions, setPromotions] = useState<any[]>([])
  const [promoSlides, setPromoSlides] = useState<any[]>([])
  const [historyRecords, setHistoryRecords] = useState<any[]>([])
  const [selectedPromotion, setSelectedPromotion] = useState<any | null>(null)
  const [promoForm, setPromoForm] = useState({
    name: "",
    mode: "manual",
    start_at: "",
    end_at: "",
    is_active: true,
  })
  const [promoSlidesFiles, setPromoSlidesFiles] = useState<File[]>([])
  const [promoSlidesPreview, setPromoSlidesPreview] = useState<File[]>([]) // Not yet uploaded
  const [selectedPromoSlideIndex, setSelectedPromoSlideIndex] = useState(0)
  const [promoSelectedProducts, setPromoSelectedProducts] = useState<Record<string, number>>({}) // productId -> percent
  const [promoDetailsModalOpen, setPromoDetailsModalOpen] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<{ categoriesLoaded: boolean; usersLoaded: boolean }>(
    { categoriesLoaded: false, usersLoaded: false }
  )

  // Realtime channel
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)

  useEffect(() => {
    if (!selectedUser) return
    const fetchData = async () => {
      const supabase = createClient()
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase.from("orders").select("id, order_number, total_amount").eq("user_id", selectedUser.id)
      if (!ordersError) setUserOrders(ordersData || [])
      
      // Fetch user profile details
      const { data: profileData, error: profileError } = await supabase.from("profiles").select("full_name, phone, address, city, postal_code, country").eq("id", selectedUser.id).single()
      if (!profileError && profileData) {
        setUserProfileEdit({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
          city: profileData.city || "",
          postal_code: profileData.postal_code || "",
          country: profileData.country || ""
        })
      }
    }
    fetchData()
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
        
        // Fetch categories and users after auth is verified
        try {
          console.log("[DEBUG] Fetching categories for authenticated user:", user.id)
          const { data: catData, error: catError, status } = await supabase.from("category").select("id, name").order("name")
          console.log("[DEBUG] Category query result:", { status, count: catData?.length, error: catError?.message, data: catData })
          if (catError) {
            console.error("fetchCategories error:", catError)
            setDebugInfo(prev => ({ ...prev, categoriesLoaded: false, categoryError: catError.message }))
          } else {
            console.log("Categories loaded successfully:", catData?.length || 0)
            setCategories(catData || [])
            setDebugInfo(prev => ({ ...prev, categoriesLoaded: true }))
          }
        } catch (err) {
          console.error("Category fetch exception:", err)
          setDebugInfo(prev => ({ ...prev, categoriesLoaded: false, categoryError: String(err) }))
        }

        try {
          console.log("[DEBUG] Fetching profiles for authenticated user:", user.id)
          const { data: userData, error: userError, status } = await supabase.from("profiles").select("id, email, created_at").order("created_at", { ascending: false })
          console.log("[DEBUG] Profiles query result:", { status, count: userData?.length, error: userError?.message, data: userData })
          if (userError) {
            console.error("fetchUsers error:", userError)
            setDebugInfo(prev => ({ ...prev, usersLoaded: false, usersError: userError.message }))
          } else {
            console.log("Users loaded successfully:", userData?.length || 0)
            setUsers(userData || [])
            setDebugInfo(prev => ({ ...prev, usersLoaded: true }))
          }
        } catch (err) {
          console.error("Users fetch exception:", err)
          setDebugInfo(prev => ({ ...prev, usersLoaded: false, usersError: String(err) }))
        }

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

    const [productsRes, usersRes, ordersRes, promotionsRes, slidesRes, historyRes] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("profiles").select("id, email, created_at"),
      supabase.from("orders").select("*, profiles(email)").order("created_at", { ascending: false }),
      supabase.from("promotions").select("*").order("created_at", { ascending: false }),
      supabase.from("promotion_slides").select("*").order("display_order"),
      supabase.from("history").select("*").order("created_at", { ascending: false }).limit(50),
    ])

    setProducts(productsRes.data || [])
    setUsers(usersRes.data || [])
    setOrders(ordersRes.data || [])
    setPromotions(promotionsRes.data || [])
    setPromoSlides(slidesRes.data || [])
    setHistoryRecords(historyRes.data || [])

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

  async function uploadImages(files: File[]) {
    if (files.length === 0) return []
    const supabase = createClient()
    const urls: string[] = []
    
    for (const file of files) {
      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from("product_images")
          .upload(fileName, file, { cacheControl: "3600", upsert: false })
        if (uploadError) throw uploadError
        const { data: publicUrl } = supabase.storage.from("product_images").getPublicUrl(fileName)
        urls.push(publicUrl.publicUrl)
      } catch (err) {
        console.error("Image upload error:", err)
      }
    }
    return urls
  }

  async function handleSaveProduct() {
    if (!productForm.name || !productForm.price) {
      alert("Please fill product name and price")
      return
    }
    if (productForm.categories.length === 0) {
      alert("Please select at least one category")
      return
    }

    const supabase = createClient()
    try {
      // Upload new images from imageFiles
      const newImageUrls: string[] = []
      for (const imgData of imageFiles) {
        const ext = imgData.file.name.split(".").pop()
        const fileName = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("product_images")
          .upload(fileName, imgData.file, { cacheControl: "3600", upsert: false })
        if (uploadError) throw uploadError
        const { data: publicUrl } = supabase.storage.from("product_images").getPublicUrl(fileName)
        newImageUrls.push(publicUrl.publicUrl)
      }
      
      // First image is cover
      const coverImage = newImageUrls[0] || productForm.image_url
      const categoryStr = productForm.categories.join(", ") // Join all selected categories

      let savedProduct: any = null
      if (editingProduct) {
        const allImageUrls = [...newImageUrls]
        // If no new images, keep existing ones
        if (allImageUrls.length === 0 && editingProduct.image_url?.length) {
          allImageUrls.push(...editingProduct.image_url)
        }
        
        const updateData: any = {
          name: productForm.name,
          price: Number.parseFloat(productForm.price),
          image_url: coverImage || editingProduct.image_url,
          image_url: allImageUrls.length > 0 ? allImageUrls : null,
          stock: Number.parseInt(productForm.stock),
          category: categoryStr,
          details: productForm.details,
          updated_at: new Date().toISOString(),
        }
        console.log("[Product Update] Payload:", updateData)
        const { error } = await supabase.from("products").update(updateData).eq("id", editingProduct.id)
        if (error) throw error
        savedProduct = editingProduct // Use existing product as reference
      } else {
        const { data, error } = await supabase.from("products").insert({
          name: productForm.name,
          price: Number.parseFloat(productForm.price),
          image_url: coverImage,
          image_url: newImageUrls.length > 0 ? newImageUrls : null,
          stock: Number.parseInt(productForm.stock),
          category: categoryStr,
          details: productForm.details,
        }).select()
        if (error) throw error
        if (!data || data.length === 0) throw new Error("Product creation failed")
        savedProduct = data[0]
      }

      // Handle promotions (auto or manual)
      if (productPromoMode === "auto" && productAutoPromo.discount_percent > 0) {
        // Create auto promotion
        const { data: promo, error: promoError } = await supabase
          .from("promotions")
          .insert({
            name: `Auto - ${productForm.name}`,
            mode: "auto",
            start_at: new Date().toISOString(),
            end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
          })
          .select()
          .single()

        if (promoError) throw promoError

        // Link product to promotion
        const { error: linkError } = await supabase.from("promotion_products").insert({
          promotion_id: promo.id,
          product_id: savedProduct.id,
          discount_percent: productAutoPromo.discount_percent,
        })

        if (linkError) throw linkError
      } else if (productPromoMode === "manual" && productManualPromo.discount_percent > 0) {
        // For manual, we just store the discount_percent for admin to use when creating promotions
        console.log("Manual promotion mode set - discount %:", productManualPromo.discount_percent)
      }

      setProductForm({ name: "", price: "", image_url: "", stock: "", category: "", categories: [], details: "" })
      setImageFiles([])
      setSelectedImageIndex(0)
      setEditingProduct(null)
      setShowProductForm(false)
      setProductPromoMode("none")
      setProductAutoPromo({ enabled: false, discount_percent: 0 })
      setProductManualPromo({ enabled: false, discount_percent: 0 })
      alert("Product saved successfully!")
      loadAllData()
    } catch (err) {
      console.error("[Product Save Error]", err)
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
        if (uploadError) {
          console.warn("upload slide err", uploadError)
          continue
        }
        // Get full public URL correctly
        const { data } = supabase.storage.from("promotion_images").getPublicUrl(fileName)
        const imageUrl = data.publicUrl // Should be the complete URL with filename
        
        const { error: insertErr } = await supabase.from("promotion_slides").insert({ 
          promotion_id: promoId, 
          image_url: imageUrl 
        })
        if (insertErr) console.warn("insert promotion_slides err", insertErr)
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
      setPromoSlidesPreview([])
      setSelectedPromoSlideIndex(0)
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
    const loadTopProducts = async () => {
      const supabase = createClient()

      const ordersRes = await supabase
        .from("orders")
        .select("id")
        .eq("status", "delivered")

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

      data?.forEach((row: any) => {
        const pid = row.product_id
        const qty = Number(row.quantity || 0)

        agg[pid] = (agg[pid] || 0) + qty

        if (row.products) {
          productMeta[pid] = row.products
        }
      })

      const arr = Object.entries(agg)
        .map(([product_id, quantity]) => ({
          product_id,
          quantity,
          product:
            productMeta[product_id] ||
            products.find((p) => p.id === product_id),
        }))
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
            <Notifications isAdmin={true} />
            <Link href="/" className="text-sm hover:text-primary transition">View Store</Link>
            <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-lg transition"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto pb-2">
          {["dashboard", "products", "users", "orders", "promotions", "history"].map((t) => (
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
              <p className="text-3xl font-bold text-green-600">{stats.totalRevenue.toFixed(2)}VND</p>
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
            <button onClick={() => { setEditingProduct(null); setProductForm({ name: "", price: "", image_url: "", stock: "", category: "", categories: [], details: "" }); setImageFiles([]); setSelectedImageIndex(0); setProductAutoPromo({ enabled: false, discount_percent: 0 }); setShowProductForm(!showProductForm) }} className="mb-6 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"><Plus size={18} /> Add Product</button>

            {showProductForm && (
              <div className="border border-border rounded-lg p-6 mb-8 bg-muted/50">
                <h3 className="text-xl font-bold mb-4">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg" />
                  <input type="number" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="w-full px-4 py-2 border border-border rounded-lg" />

                  {/* Multiple Images with Preview */}
                  <div>
                    <label className="text-sm mb-2 block font-medium">Product Images (Max 10, first is cover)</label>
                    <div className="border border-border rounded-lg p-4 bg-white">
                      {/* Image Preview */}
                      {imageFiles.length > 0 && (
                        <div className="mb-4">
                          <div className="w-full h-64 bg-muted rounded-lg overflow-hidden mb-3">
                            <img 
                              src={imageFiles[selectedImageIndex]?.preview} 
                              alt="preview" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          {/* Image Thumbnails */}
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {imageFiles.map((imgData, idx) => (
                              <div key={idx} className="relative flex-shrink-0">
                                <img 
                                  src={imgData.preview}
                                  alt={`img-${idx}`}
                                  onClick={() => setSelectedImageIndex(idx)}
                                  className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${selectedImageIndex === idx ? 'border-primary' : 'border-border'}`}
                                />
                                <button
                                  onClick={() => {
                                    const newFiles = imageFiles.filter((_, i) => i !== idx)
                                    setImageFiles(newFiles)
                                    if (selectedImageIndex >= newFiles.length) {
                                      setSelectedImageIndex(Math.max(0, newFiles.length - 1))
                                    }
                                  }}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600"
                                >×</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          const totalImages = imageFiles.length + files.length
                          if (totalImages > 10) {
                            alert("Maximum 10 images allowed")
                            return
                          }
                          // Create preview URLs for new files
                          const newImages = files.map(f => ({
                            file: f,
                            preview: URL.createObjectURL(f)
                          }))
                          setImageFiles([...imageFiles, ...newImages])
                        }}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Images will be uploaded when you save. First image becomes the product cover.</p>
                    </div>
                  </div>

                  {/* Category Selection - Multiple */}
                  <div>
                    <label className="text-sm mb-2 block font-medium">Categories ({categories.length}) - Select Multiple</label>
                    <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto bg-blue-50">
                      {categories.length > 0 ? (
                        categories.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 py-2">
                            <input
                              type="checkbox"
                              checked={productForm.categories.includes(c.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProductForm({ ...productForm, categories: [...productForm.categories, c.name] })
                                } else {
                                  setProductForm({ ...productForm, categories: productForm.categories.filter(cat => cat !== c.name) })
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{c.name}</span>
                          </label>
                        ))
                      ) : (
                        <>
                          <label className="flex items-center gap-2 py-2">
                            <input type="checkbox" onChange={(e) => { if (e.target.checked) setProductForm({ ...productForm, categories: [...productForm.categories, "Furniture"] }) }} className="w-4 h-4" />
                            <span className="text-sm">Furniture</span>
                          </label>
                          <label className="flex items-center gap-2 py-2">
                            <input type="checkbox" onChange={(e) => { if (e.target.checked) setProductForm({ ...productForm, categories: [...productForm.categories, "Lighting"] }) }} className="w-4 h-4" />
                            <span className="text-sm">Lighting</span>
                          </label>
                          <label className="flex items-center gap-2 py-2">
                            <input type="checkbox" onChange={(e) => { if (e.target.checked) setProductForm({ ...productForm, categories: [...productForm.categories, "Decor"] }) }} className="w-4 h-4" />
                            <span className="text-sm">Decor</span>
                          </label>
                          <label className="flex items-center gap-2 py-2">
                            <input type="checkbox" onChange={(e) => { if (e.target.checked) setProductForm({ ...productForm, categories: [...productForm.categories, "Accessories"] }) }} className="w-4 h-4" />
                            <span className="text-sm">Accessories</span>
                          </label>
                        </>
                      )}
                    </div>
                    {productForm.categories.length > 0 && <p className="text-xs text-green-600 mt-2">Selected: {productForm.categories.join(", ")}</p>}
                    {categories.length === 0 && <p className="text-xs text-yellow-600 mt-1">No categories loaded, using defaults</p>}
                  </div>

                  <div>
                    <input
                      type="number"
                      placeholder="Stock Quantity"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg" 
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm mb-2 block font-medium">Product Features/Details (one per line)</label>
                    <textarea
                      placeholder="Premium quality materials&#10;Modern minimalist design&#10;Eco-friendly production"
                      value={productForm.details}
                      onChange={(e) => setProductForm({ ...productForm, details: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg h-24"
                    />
                  </div>

                  {/* Product Promotion Section */}
                  <div className="border border-border rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold mb-4">Product Promotion</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={productPromoMode === "none"}
                            onChange={() => setProductPromoMode("none")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">No Promotion</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={productPromoMode === "manual"}
                            onChange={() => setProductPromoMode("manual")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Manual Promotion</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={productPromoMode === "auto"}
                            onChange={() => setProductPromoMode("auto")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Auto Promotion</span>
                        </label>
                      </div>
                      
                      {(productPromoMode === "manual" || productPromoMode === "auto") && (
                        <div className="ml-4 space-y-3 pt-3 border-t border-blue-200">
                          <div>
                            <label className="text-sm mb-2 block">Discount Percentage</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={productPromoMode === "auto" ? productAutoPromo.discount_percent : productManualPromo.discount_percent}
                                onChange={(e) => {
                                  const val = Number(e.target.value)
                                  if (productPromoMode === "auto") {
                                    setProductAutoPromo({ ...productAutoPromo, discount_percent: val })
                                  } else {
                                    setProductManualPromo({ ...productManualPromo, discount_percent: val })
                                  }
                                }}
                                className="w-24 px-3 py-2 border border-border rounded-lg"
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>
                          <p className="text-xs text-blue-700">
                            ℹ️ {productPromoMode === "auto" ? "Auto promotion will create a 30-day promotion with this discount." : "Manual promotion - you select which products get this discount."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleSaveProduct} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90">Save</button>
                    <button onClick={() => { setShowProductForm(false); setEditingProduct(null); setImageFiles([]); setSelectedImageIndex(0) }} className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted">Cancel</button>
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
                    <p className="text-sm text-muted-foreground mb-3">{product.price}VND</p>
                    <div className="flex gap-2">
                      <button onClick={() => { 
                        setEditingProduct(product)
                        setProductForm({ 
                          name: product.name, 
                          price: product.price.toString(), 
                          image_url: product.image_url, 
                          stock: product.stock.toString(), 
                          category: product.category || "", 
                          categories: [], 
                          details: product.details || "" 
                        })
                        // Load existing images
                        if (product.image_url && product.image_url.length > 0) {
                          const existingImages = product.image_url.map((url: string) => ({
                            file: new File([], ''),
                            preview: url,
                            isExisting: true
                          }))
                          setImageFiles(existingImages as any)
                          setSelectedImageIndex(0)
                        } else {
                          setImageFiles([])
                          setSelectedImageIndex(0)
                        }
                        setProductAutoPromo({ enabled: false, discount_percent: 0 })
                        setShowProductForm(true) 
                      }} className="flex-1 p-2 border border-border rounded hover:bg-muted transition flex items-center justify-center gap-1"><Edit size={16} /> Edit</button>
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
              <Modal onClose={() => { setIsModalOpen(false); setSelectedUser(null); setUserOrders([]); setIsEditingUserProfile(false) }}>
                <div className="space-y-6 max-h-screen overflow-y-auto">
                  <button onClick={() => { setIsModalOpen(false); setSelectedUser(null); setUserOrders([]); setIsEditingUserProfile(false) }} className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition self-start">X</button>
                  
                  {/* User Profile Section */}
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedUser.email}</h3>
                    <p className="text-sm text-muted-foreground mb-4">Joined {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    
                    {/* Profile Display View */}
                    {!isEditingUserProfile && (
                      <div className="border border-border rounded-lg p-4 mb-4 bg-muted/30 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase">Full Name</label>
                          <p className="text-sm">{userProfileEdit.full_name || "—"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase">Phone</label>
                          <p className="text-sm">{userProfileEdit.phone || "—"}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase">Address</label>
                          <p className="text-sm">{userProfileEdit.address || "—"}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase">City</label>
                            <p className="text-sm">{userProfileEdit.city || "—"}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase">Postal Code</label>
                            <p className="text-sm">{userProfileEdit.postal_code || "—"}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase">Country</label>
                            <p className="text-sm">{userProfileEdit.country || "—"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Profile Edit Form */}
                    {isEditingUserProfile && (
                      <div className="border border-border rounded-lg p-4 mb-4 space-y-4 bg-muted/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Full Name</label>
                            <input
                              type="text"
                              value={userProfileEdit.full_name}
                              onChange={(e) => setUserProfileEdit({ ...userProfileEdit, full_name: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Phone</label>
                            <input
                              type="tel"
                              value={userProfileEdit.phone}
                              onChange={(e) => setUserProfileEdit({ ...userProfileEdit, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Address</label>
                          <input
                            type="text"
                            value={userProfileEdit.address}
                            onChange={(e) => setUserProfileEdit({ ...userProfileEdit, address: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">City</label>
                            <input
                              type="text"
                              value={userProfileEdit.city}
                              onChange={(e) => setUserProfileEdit({ ...userProfileEdit, city: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Postal Code</label>
                            <input
                              type="text"
                              value={userProfileEdit.postal_code}
                              onChange={(e) => setUserProfileEdit({ ...userProfileEdit, postal_code: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Country</label>
                            <input
                              type="text"
                              value={userProfileEdit.country}
                              onChange={(e) => setUserProfileEdit({ ...userProfileEdit, country: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const supabase = createClient()
                              try {
                                const { error } = await supabase.from("profiles").update(userProfileEdit).eq("id", selectedUser.id)
                                if (error) throw error
                                setIsEditingUserProfile(false)
                                loadAllData()
                                alert("Profile updated successfully")
                              } catch (err) {
                                alert(err instanceof Error ? err.message : "Error updating profile")
                              }
                            }}
                            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingUserProfile(false)}
                            className="flex-1 px-3 py-2 text-sm border border-border rounded hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    {!isEditingUserProfile && (
                      <div className="flex gap-2 mb-6">
                        <button 
                          onClick={() => setIsEditingUserProfile(true)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit Profile
                        </button>
                        <button 
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this user?")) return
                            const supabase = createClient()
                            try {
                              const { error } = await supabase.from("profiles").delete().eq("id", selectedUser.id)
                              if (error) throw error
                              setIsModalOpen(false)
                              setSelectedUser(null)
                              setIsEditingUserProfile(false)
                              loadAllData()
                              alert("User deleted successfully")
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Error deleting user")
                            }
                          }}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete User
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User Orders Section */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Orders ({userOrders.length})</h4>
                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                      {userOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No orders found for this user.</p>
                      ) : (
                        <ul className="space-y-2">
                          {userOrders.map((order) => (
                            <li key={order.id} className="text-sm border-b pb-2">
                              <Link href={`/admin/order/${order.id}`} className="text-primary hover:underline">
                                Order #{order.order_number}
                              </Link>
                              <p className="text-muted-foreground">{order.total_amount.toFixed(2)}VND</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
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
                  <div className="text-right"><p className="font-bold">{order.total_amount.toFixed(2)}VND</p><p className="text-sm">{order.payment_status}</p></div>
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
              <button onClick={() => { setSelectedPromotion(null); setPromoForm({ name: "", mode: "manual", start_at: "", end_at: "", is_active: true }); setPromoSlidesFiles([]); setPromoSlidesPreview([]); setSelectedPromoSlideIndex(0); setPromoSelectedProducts({}) }} className="px-4 py-2 bg-primary text-primary-foreground rounded">New Promotion</button>
            </div>

            {/* Promotion Mode & Schedule Form (before Products)  */}
            <div className="border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Promotion Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mr-3"><input type="radio" name="mode" checked={promoForm.mode === "manual"} onChange={() => setPromoForm({ ...promoForm, mode: "manual" })} /> Manual</label>
                  <label><input type="radio" name="mode" checked={promoForm.mode === "auto"} onChange={() => setPromoForm({ ...promoForm, mode: "auto" })} /> Auto</label>
                </div>
                {promoForm.mode === "auto" && (
                  <>
                    <input type="datetime-local" value={promoForm.start_at} onChange={(e) => setPromoForm({ ...promoForm, start_at: e.target.value })} className="px-3 py-2 border border-border rounded" placeholder="Start date" />
                    <input type="datetime-local" value={promoForm.end_at} onChange={(e) => setPromoForm({ ...promoForm, end_at: e.target.value })} className="px-3 py-2 border border-border rounded" placeholder="End date" />
                  </>
                )}
              </div>
            </div>

            {/* SEPARATED: Promotion Slides Management */}
            <div className="border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Promotion Slides (Max 5)</h3>
              
              {/* Existing Slides from Database */}
              <div className="mb-6">
                <h4 className="font-medium text-sm mb-3">Current Slides ({promoSlides.length})</h4>
                {promoSlides.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No slides uploaded yet</p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {promoSlides.map((slide) => (
                      <div key={slide.id} className="relative w-32 h-32 rounded-lg overflow-hidden border border-border group">
                        <img src={slide.image_url} alt={`slide-${slide.id}`} className="w-full h-full object-cover" />
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this slide?")) return
                            const supabase = createClient()
                            try {
                              // Extract file path from URL for deletion
                              const urlParts = slide.image_url.split("promotion_images/")
                              if (urlParts.length > 1) {
                                const filePath = decodeURIComponent(urlParts[1])
                                await supabase.storage.from("promotion_images").remove([filePath])
                              }
                              // Delete from database
                              await supabase.from("promotion_slides").delete().eq("id", slide.id)
                              setPromoSlides(promoSlides.filter(s => s.id !== slide.id))
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Error deleting slide")
                            }
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition font-bold"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Slides to Upload */}
              {promoSlides.length < 5 && (
                <>
                  <h4 className="font-medium text-sm mb-3">Add New Slides ({promoSlidesFiles.length})</h4>
                  <div className="flex flex-wrap gap-4 items-center mb-4">
                    {promoSlidesFiles.length > 0 && promoSlidesFiles.map((file, idx) => (
                      <div key={idx} className="relative w-32 h-32 rounded-lg overflow-hidden border border-border group">
                        <img src={URL.createObjectURL(file)} alt={`new-slide-${idx}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setPromoSlidesFiles(promoSlidesFiles.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition font-bold"
                        >×</button>
                      </div>
                    ))}

                    {/* Add Slide Button */}
                    <label className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file && (promoSlidesFiles.length + promoSlides.length) < 5) {
                            setPromoSlidesFiles([...promoSlidesFiles, file])
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-3xl text-muted-foreground">+</span>
                    </label>
                  </div>

                  <button 
                    onClick={async () => {
                      if (promoSlidesFiles.length === 0) {
                        alert("Please add at least one slide")
                        return
                      }
                      // Upload slides only - independent of promotion
                      const supabase = createClient()
                      try {
                        for (const file of promoSlidesFiles) {
                          const ext = file.name.split(".").pop()
                          const fileName = `promotions/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
                          const { error: uploadError } = await supabase.storage.from("promotion_images").upload(fileName, file)
                          if (uploadError) throw uploadError
                          const { data } = supabase.storage.from("promotion_images").getPublicUrl(fileName)
                          const imageUrl = data.publicUrl
                          // Insert without linking to a specific promotion
                          await supabase.from("promotion_slides").insert({ 
                            image_url: imageUrl,
                            display_order: promoSlides.length
                          })
                        }
                        alert("Slides uploaded successfully!")
                        setPromoSlidesFiles([])
                        loadAllData()
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Error uploading slides")
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
                  >
                    Upload {promoSlidesFiles.length} Slide{promoSlidesFiles.length !== 1 ? 's' : ''}
                  </button>
                </>
              )}
            </div>

            {/* SEPARATED: Product Discount Selection */}
            <div className="border border-border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Create Promotion with Products</h3>
              
              {/* Promotion Name */}
              <div className="mb-4">
                <label className="text-sm font-medium block mb-2">Promotion Name</label>
                <input placeholder="E.g. Summer Sale, Black Friday..." value={promoForm.name} onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded" />
              </div>

              {/* Select Products */}
              <h4 className="font-medium text-sm mb-3">Select Products & Set Discount %</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border p-3 rounded bg-muted/30">
                {products.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-white rounded border border-border">
                    <input type="checkbox" checked={!!promoSelectedProducts[p.id]} onChange={() => toggleProductSelect(p.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.price}VND</p>
                    </div>
                    {promoSelectedProducts[p.id] && (
                      <input type="number" min={1} max={90} placeholder="%" value={promoSelectedProducts[p.id] ?? ""} onChange={(e) => setProductDiscount(p.id, Number(e.target.value))} className="w-16 px-2 py-1 border rounded text-sm" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleCreatePromotion} className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700">Create Promotion (with products)</button>
                <button onClick={() => { setPromoForm({ name: "", mode: "manual", start_at: "", end_at: "", is_active: true }); setPromoSlidesFiles([]); setPromoSelectedProducts({}) }} className="px-4 py-2 border border-border rounded">Reset</button>
              </div>
            </div>

            {/* Promotions List */}
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">Active Promotions</h3>
              {promotions.length === 0 ? (<p className="text-sm text-muted-foreground">No promotions yet</p>) : (
                promotions.map((pr) => (
                  <div key={pr.id} className="border p-4 rounded">
                    <div className="flex justify-between items-start mb-3">
                      <button onClick={() => { setSelectedPromotion(pr); setPromoDetailsModalOpen(true) }} className="hover:text-primary cursor-pointer">
                        <p className="font-semibold text-lg">{pr.name}</p>
                      </button>
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          const supabase = createClient()
                          const { error } = await supabase.from("promotions").update({ is_active: !pr.is_active }).eq("id", pr.id)
                          if (error) alert("Error toggling")
                          else loadAllData()
                        }} className="px-3 py-2 border rounded text-sm">{pr.is_active ? "Deactivate" : "Activate"}</button>
                        <button onClick={async () => {
                          if (!confirm("Delete promotion?")) return
                          const supabase = createClient()
                          const { error } = await supabase.from("promotions").delete().eq("id", pr.id)
                          if (error) alert("Error deleting")
                          else loadAllData()
                        }} className="px-3 py-2 border text-red-600 rounded text-sm">Delete</button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{pr.mode === "auto" && pr.start_at ? `${new Date(pr.start_at).toLocaleString()} - ${new Date(pr.end_at).toLocaleString()}` : "Manual"}</p>
                  </div>
                ))
              )}
            </div>

            {/* Promotion Details Modal */}
            {promoDetailsModalOpen && selectedPromotion && (
              <Modal onClose={() => { setPromoDetailsModalOpen(false); setSelectedPromotion(null) }}>
                <button onClick={() => { setPromoDetailsModalOpen(false); setSelectedPromotion(null) }} className="text-red-600 font-bold mb-4">Close ×</button>
                <h3 className="text-2xl font-bold mb-4">{selectedPromotion.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{selectedPromotion.mode === "auto" ? `Active: ${new Date(selectedPromotion.start_at).toLocaleString()} - ${new Date(selectedPromotion.end_at).toLocaleString()}` : "Manual"}</p>
                
                {/* Load and display promotion products */}
                <h4 className="text-lg font-semibold mb-3">Discounted Products</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedPromotion.promoProducts && selectedPromotion.promoProducts.length > 0 ? (
                    selectedPromotion.promoProducts.map((pp: any) => {
                      const prod = products.find(p => p.id === pp.product_id)
                      const discountedPrice = prod ? prod.price * (1 - pp.discount_percent / 100) : 0
                      return (
                        <div key={pp.product_id} className="border p-3 rounded flex justify-between items-center">
                          <div>
                            <p className="font-medium">{prod?.name}</p>
                            <p className="text-sm text-muted-foreground">Original: {prod?.price}VND</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-600 font-bold">{discountedPrice.toFixed(0)}VND</p>
                            <p className="text-xs text-primary">-{pp.discount_percent}%</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No products in this promotion</p>
                  )}
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Action History</h2>
            
            {historyRecords.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">No history records yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyRecords.map((record) => {
                  let icon = "📝"
                  let typeLabel = ""
                  let description = ""

                  if (record.type === "product_stock_change") {
                    icon = "📦"
                    typeLabel = "Stock Update"
                    const product = products.find(p => p.id === record.product_id)
                    description = `${product?.name || "Product"}: Stock changed from ${record.old_value} → ${record.new_value}`
                  } else if (record.type === "product_created") {
                    icon = "✨"
                    typeLabel = "New Product"
                    const product = products.find(p => p.id === record.product_id)
                    description = `Added: ${product?.name || "New Product"}`
                  } else if (record.type === "order_completed") {
                    icon = "✅"
                    typeLabel = "Order Completed"
                    description = record.description || "Order marked as completed"
                  }

                  return (
                    <div key={record.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition">
                      <div className="flex gap-4">
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{typeLabel}</h3>
                          <p className="text-sm text-muted-foreground">{description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(record.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
