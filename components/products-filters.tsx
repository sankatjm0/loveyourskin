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
      
      if (selectedCategory === "Sale") {
        // Show only products with active discounts
        return matchesSearch && productDiscounts[product.id]
      }
      
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory, products, productDiscounts])

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
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
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
    </>
  )
}
