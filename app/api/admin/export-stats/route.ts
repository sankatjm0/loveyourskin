import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin access
    const adminClient = await createAdminClient()
    const { data: adminAccess } = await adminClient
      .from("admin_access")
      .select("is_admin")
      .eq("user_id", user.id)
      .single()

    if (!adminAccess?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all required data
    const [productsRes, ordersRes, usersRes, profilesRes, contactRes] = await Promise.all([
      adminClient.from("products").select("*"),
      adminClient.from("orders").select("*, profiles(email, full_name)"),
      adminClient.from("auth.users").select("id, email, created_at"),
      adminClient.from("profiles").select("*"),
      adminClient.from("contact_messages").select("*"),
    ])

    const products = productsRes.data || []
    const orders = ordersRes.data || []
    const users = usersRes.data || []
    const profiles = profilesRes.data || []
    const contacts = contactRes.data || []

    // Calculate statistics
    const stats = {
      // Product stats
      totalProducts: products.length,
      totalProductsValue: products.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0),
      lowStockProducts: products.filter((p: any) => p.stock < 10).length,
      productCategories: [...new Set(products.map((p: any) => p.category))].filter(Boolean).length,

      // Order stats
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) / orders.length : 0,
      completedOrders: orders.filter((o: any) => o.status === "delivered").length,
      pendingOrders: orders.filter((o: any) => o.status !== "delivered").length,

      // Order status breakdown
      ordersByStatus: {
        pending: orders.filter((o: any) => o.status === "pending").length,
        processing: orders.filter((o: any) => o.status === "processing").length,
        shipped: orders.filter((o: any) => o.status === "shipped").length,
        delivered: orders.filter((o: any) => o.status === "delivered").length,
        cancelled: orders.filter((o: any) => o.status === "cancelled").length,
      },

      // User stats
      totalUsers: users.length,
      totalProfiles: profiles.length,
      newUsersThisMonth: users.filter((u: any) => {
        const createdDate = new Date(u.created_at)
        const now = new Date()
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
      }).length,

      // Contact stats
      totalContactMessages: contacts.length,
      unreadContacts: contacts.filter((c: any) => !c.read).length,

      // Revenue breakdown
      monthlyRevenue: calculateMonthlyRevenue(orders),
      topProducts: getTopProducts(orders, products),

      // Timestamp
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error("[Export Stats API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate statistics" },
      { status: 500 }
    )
  }
}

function calculateMonthlyRevenue(orders: any[]) {
  const monthlyData: Record<string, number> = {}

  orders.forEach((order: any) => {
    const date = new Date(order.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    monthlyData[key] = (monthlyData[key] || 0) + (order.total_amount || 0)
  })

  return monthlyData
}

function getTopProducts(orders: any[], products: any[]) {
  const productSales: Record<string, { count: number; revenue: number; name: string }> = {}

  orders.forEach((order: any) => {
    if (order.items) {
      const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items
      items.forEach((item: any) => {
        const product = products.find((p: any) => p.id === item.product_id)
        if (product) {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = { count: 0, revenue: 0, name: product.name }
          }
          productSales[item.product_id].count += item.quantity || 1
          productSales[item.product_id].revenue += (item.price || product.price) * (item.quantity || 1)
        }
      })
    }
  })

  return Object.entries(productSales)
    .map(([id, data]) => ({
      productId: id,
      ...data,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}
