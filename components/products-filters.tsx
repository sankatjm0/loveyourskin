"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import type { Product } from "@/lib/products"
import { getActivePromotionForProduct } from "@/lib/promotions"

interface ProductsFiltersProps {
  products: Product[]
  categories?: any[]
}

export function ProductsFilters({ products, categories: initialCategories }: ProductsFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [categories, setCategories] = useState<any[]>(initialCategories || [])
  const [productDiscounts, setProductDiscounts] = useState<Record<string, { discount_percent: number; promotion_name: string }>>({})
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 })
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "Alert", message: "", type: "info" as "info" | "success" | "error" | "warning" })
  const showAlert = (message: string, type: "info" | "success" | "error" | "warning" = "info", title: string = "Alert") => {
    setAlertModal({ isOpen: true, title, message, type })
  }

  // Fetch categories from database and load promotions
  useEffect(() => {
    const loadData = async () => {
      // Fetch categories from category table
      if (!initialCategories || initialCategories.length === 0) {
        try {
          const res = await fetch("/api/categories")
          if (res.ok) {
            const data = await res.json()
            setCategories(data)
          }
        } catch (err) {
          console.error("Failed to fetch categories:", err)
        }
      }

      // Fetch promotion discounts for all products
      const discounts: Record<string, { discount_percent: number; promotion_name: string }> = {}
      for (const product of products) {
        const promo = await getActivePromotionForProduct(product.id)
        if (promo) {
          discounts[product.id] = {
            discount_percent: promo.discount_percent,
            promotion_name: promo.promotion_name || "Promotion"
          }
        }
      }
      setProductDiscounts(discounts)
    }

    loadData()
  }, [products, initialCategories])

  // Build category list: from DB + dynamic "Sale" if there are discounted products
  const categoryList = useMemo(() => {
    const dbCategories = categories.map((c: any) => c.name)
    const hasDiscounts = Object.keys(productDiscounts).length > 0
    return ["All", ...dbCategories, ...(hasDiscounts ? ["Sale"] : [])]
  }, [categories, productDiscounts])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || "").toLowerCase().includes(searchTerm.toLowerCase())
      
      // Price filter
      if (product.price < priceRange.min || product.price > priceRange.max) {
        return false
      }
      
      if (selectedCategory === "Sale") {
        // Show only products with active discounts
        return matchesSearch && productDiscounts[product.id]
      }
      
      const matchesCategory = selectedCategory === "All" || product.category?.includes(selectedCategory)
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory, products, productDiscounts, priceRange])

  return (
    <>
      {/* Search Bar */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        <div className="flex gap-2 overflow-x-auto items-center">
          {categoryList.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {category}
          </button>
        ))}
        </div>
            <label className="text-sm font-medium">Price Range</label>
            <input 
              type="number" 
              placeholder="Min" 
              value={priceRange.min}
              onChange={(e) => setPriceRange({...priceRange, min: Number(e.target.value)})}
              className="w-24 px-3 py-2 border border-border rounded text-sm"
            />
            <span className="text-sm">-</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={priceRange.max}
              onChange={(e) => setPriceRange({...priceRange, max: Number(e.target.value)})}
              className="w-24 px-3 border border-border rounded text-sm"
            />
        <button
          onClick={() => setPriceRange({ min: 0, max: 1000000000 })}
          className="px-3 text-sm border border-border rounded hover:bg-muted transition"
        >
          Reset Price
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => {
          const discount = productDiscounts[product.id]
          const discountedPrice = discount ? product.price * (1 - discount.discount_percent / 100) : null

          return (
            <Link key={product.id} href={`/products/${product.id}`} className="group">
              <div className="bg-muted rounded-lg overflow-hidden mb-4 aspect-square relative">
                <img
                  src={product.image_url || "/placeholder.svg?height=400&width=400&query=product"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {discount && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{discount.discount_percent}%
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition">{product.name}</h3>
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  {discountedPrice !== null ? (
                    <>
                      <p className="text-sm line-through text-muted-foreground">{product.price}VND</p>
                      <p className="text-primary font-bold text-lg">{discountedPrice.toFixed(0)}VND</p>
                    </>
                  ) : (
                    <p className="text-primary font-bold">{product.price}VND</p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 border-l-4 ${
            alertModal.type === 'success' ? 'border-green-500 bg-green-50' :
            alertModal.type === 'error' ? 'border-red-500 bg-red-50' :
            alertModal.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`text-2xl ${
                alertModal.type === 'success' ? 'text-green-600' :
                alertModal.type === 'error' ? 'text-red-600' :
                alertModal.type === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {alertModal.type === 'success' && '✓'}
                {alertModal.type === 'error' && '✕'}
                {alertModal.type === 'warning' && '⚠'}
                {alertModal.type === 'info' && 'ℹ'}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${
                  alertModal.type === 'success' ? 'text-green-800' :
                  alertModal.type === 'error' ? 'text-red-800' :
                  alertModal.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>{alertModal.title}</h3>
                <p className={`text-sm mt-2 ${
                  alertModal.type === 'success' ? 'text-green-700' :
                  alertModal.type === 'error' ? 'text-red-700' :
                  alertModal.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>{alertModal.message}</p>
              </div>
            </div>
            <button
              onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              className={`mt-6 w-full py-2 rounded font-medium text-white transition ${
                alertModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                alertModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                alertModal.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}
