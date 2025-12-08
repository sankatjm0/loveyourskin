"use client"

import Link from "next/link"
import { ShoppingCart, LogOut, Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import PromoSlider from "@/components/PromoSlider"
import { Notifications } from "@/components/notifications"
import { getActivePromotionForProduct } from "@/lib/promotions"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadFeaturedProducts()
    loadBestSellers()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user || null)
    setIsLoading(false)
  }

  async function getTopSellingProducts(limit = 4) {
    const supabase = createClient()

    const { data: topSelling, error: viewError } = await supabase
      .from("product_sales_summary")
      .select("id, total_sold")
      .order("total_sold", { ascending: false })
      .limit(limit)

    if (viewError || !topSelling?.length) {
      console.error("View error:", viewError)
      return []
    }

    const productIds = topSelling.map((p) => p.id)

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)

    if (productsError || !products) {
      console.error("Products error:", productsError)
      return []
    }

    const merged = await Promise.all(
      products.map(async (product) => {
        const soldRecord = topSelling.find((p) => p.id === product.id)
        const promo = await getActivePromotionForProduct(product.id)

        const discountedPrice = promo
          ? product.price * (1 - promo.discount_percent / 100)
          : null

        return {
          ...product,
          total_sold: soldRecord?.total_sold || 0,
          discount_percent: promo?.discount_percent || 0,
          discountedPrice,
          isTopSelling: true,
        }
      })
    )

    return merged.sort(
      (a, b) => (b.total_sold ?? 0) - (a.total_sold ?? 0)
    )
  }


  async function loadBestSellers() {
    try {
      const products = await getTopSellingProducts(4)
      setBestSellers(products)
    } catch (err) {
      console.error("Error loading best sellers:", err)
    }
  }

  async function loadFeaturedProducts() {
    try {
      const supabase = createClient()
      
      // Fetch all products
      const { data: products, error } = await supabase.from("products").select("*")
      
      if (error || !products) {
        console.error("Error fetching products:", error)
        return
      }

      // Get promotions for each product
      const productsWithPromos = await Promise.all(
        products.map(async (product: any) => {
          const promo = await getActivePromotionForProduct(product.id)
          const discountedPrice = promo 
            ? product.price * (1 - promo.discount_percent / 100)
            : null
          
          return {
            ...product,
            discount_percent: promo?.discount_percent || 0,
            discountedPrice,
          }
        })
      )

      // Sort by discount percentage (highest first) and take top 4
      const topSalesProducts = productsWithPromos
        .filter(p => p.discount_percent > 0)
        .sort((a, b) => b.discount_percent - a.discount_percent)
        .slice(0, 4)

      setFeaturedProducts(topSalesProducts)
    } catch (err) {
      console.error("Error loading featured products:", err)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-balance">
              Where scent becomes your signature
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Authentic perfumes, carefully selected for quality, longevity, and character. Enjoy exclusive deals, fast shipping, and secure payments.
            </p>
            <div className="flex gap-4">
              <Link
                href="/products"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
              >
                Shop Now
              </Link>
              <Link
                href="/about"
                className="px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden">
            <PromoSlider />
          </div>
        </div>
      </section>

      {/* Best Seller Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-12 text-center">Best Sellers</h2>
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {bestSellers.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="bg-muted rounded-lg overflow-hidden mb-4 aspect-square relative">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* 🔥 TOP SELLING TAG */}
                <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Top Selling
                </div>

                {/* 🏷️ DISCOUNT TAG */}
                {product.discount_percent > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{product.discount_percent}%
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition">
                {product.name}
              </h3>

              <p className="text-sm text-muted-foreground mb-2">
                Sold: {product.total_sold}
              </p>

              <div className="flex flex-col gap-1">
                {product.discountedPrice ? (
                  <>
                    <p className="text-sm line-through text-muted-foreground">
                      {product.price} VND
                    </p>
                    <p className="text-primary font-bold text-lg">
                      {product.discountedPrice.toFixed(0)} VND
                    </p>
                  </>
                ) : (
                  <p className="text-primary font-bold">
                    {product.price} VND
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* Featured Products - Top Sales */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-12 text-center">Flash Sale</h2>
        
        {featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg">
            <p className="text-lg text-muted-foreground">Follow us to be the earliest to earn our promotions!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="group">
                <div className="bg-muted rounded-lg overflow-hidden mb-4 aspect-square relative">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {product.discount_percent > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{product.discount_percent}%
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition">{product.name}</h3>
                <div className="flex flex-col gap-1">
                  {product.discountedPrice ? (
                    <>
                      <p className="text-sm line-through text-muted-foreground">{product.price}VND</p>
                      <p className="text-primary font-bold text-lg">{product.discountedPrice.toFixed(0)}VND</p>
                    </>
                  ) : (
                    <p className="text-primary font-bold">{product.price}VND</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
