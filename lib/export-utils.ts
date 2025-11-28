export function generateCSV(stats: any): string {
  let csv = "Love Your Skin - Business Statistics Report\n"
  csv += `Generated: ${new Date(stats.generatedAt).toLocaleString("vi-VN")}\n\n`

  // Product Statistics
  csv += "PRODUCT STATISTICS\n"
  csv += `Total Products,${stats.totalProducts}\n`
  csv += `Total Inventory Value,"${stats.totalProductsValue.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}"\n`
  csv += `Low Stock Items (<10),${stats.lowStockProducts}\n`
  csv += `Product Categories,${stats.productCategories}\n\n`

  // Order Statistics
  csv += "ORDER STATISTICS\n"
  csv += `Total Orders,${stats.totalOrders}\n`
  csv += `Total Revenue,"${stats.totalRevenue.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}"\n`
  csv += `Average Order Value,"${stats.averageOrderValue.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}"\n`
  csv += `Completed Orders,${stats.completedOrders}\n`
  csv += `Pending Orders,${stats.pendingOrders}\n\n`

  // Order Status Breakdown
  csv += "ORDER STATUS BREAKDOWN\n"
  csv += "Status,Count\n"
  Object.entries(stats.ordersByStatus).forEach(([status, count]) => {
    csv += `${status},${count}\n`
  })
  csv += "\n"

  // User Statistics
  csv += "USER STATISTICS\n"
  csv += `Total Users,${stats.totalUsers}\n`
  csv += `Total Profiles,${stats.totalProfiles}\n`
  csv += `New Users This Month,${stats.newUsersThisMonth}\n\n`

  // Contact Statistics
  csv += "CONTACT MESSAGES\n"
  csv += `Total Messages,${stats.totalContactMessages}\n`
  csv += `Unread Messages,${stats.unreadContacts}\n\n`

  // Monthly Revenue
  csv += "MONTHLY REVENUE\n"
  csv += "Month,Revenue (VND)\n"
  Object.entries(stats.monthlyRevenue).forEach(([month, revenue]: [string, any]) => {
    csv += `${month},"${revenue.toLocaleString("vi-VN")}"\n`
  })
  csv += "\n"

  // Top Products
  csv += "TOP 10 SELLING PRODUCTS\n"
  csv += "Product Name,Units Sold,Total Revenue (VND)\n"
  stats.topProducts.forEach((product: any) => {
    csv += `${product.name},${product.count},"${product.revenue.toLocaleString("vi-VN")}"\n`
  })

  return csv
}

export function downloadCSV(csv: string, filename: string = "business_statistics.csv") {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export function downloadJSON(stats: any, filename: string = "business_statistics.json") {
  const blob = new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
