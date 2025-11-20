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
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadFeaturedProducts()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user || null)
    setIsLoading(false)
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
        products.map(async (product) => {
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
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
            Premium Store
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-sm hover:text-primary transition">
              Products
            </Link>
            <Link href="/about" className="text-sm hover:text-primary transition">
              About
            </Link>
            <Link href="/contact" className="text-sm hover:text-primary transition">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {!isLoading && user && <Notifications isAdmin={user.user_metadata?.is_admin} />}
            {!isLoading && user ? (
              <>
                <Link href="/profile" className="p-2 hover:bg-muted rounded-lg transition" title="View Profile">
                  <Mail size={20} />
                </Link>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.email}</p>
                    <Link href="/orders" className="text-xs text-muted-foreground hover:text-primary">
                      My Orders
                    </Link>
                  </div>
                </div>
                {user.user_metadata?.is_admin && (
                  <Link href="/admin" className="text-xs hover:text-primary transition font-medium">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="p-2 hover:bg-muted rounded-lg transition">
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm hover:text-primary transition">
                  Login
                </Link>
                <Link href="/auth/sign-up" className="text-sm hover:text-primary transition">
                  Sign Up
                </Link>
              </>
            )}
            <Link href="/cart" className="p-2 hover:bg-muted rounded-lg transition">
              <ShoppingCart size={20} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 text-balance">
              Optimal organization meets exquisite design
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Transform your space with carefully curated, premium products that combine functional excellence with
              timeless aesthetics.
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

      {/* Featured Products - Top Sales */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold mb-12 text-center">Flash Sale</h2>
        
        {featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg">
            <p className="text-lg text-muted-foreground">Theo dõi trang để cập nhật khuyến mãi sớm nhất bạn nhé</p>
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

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16 mt-24">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg mb-8 opacity-90">Get early access to new collections and exclusive offers</p>
          <button className="px-8 py-3 bg-primary-foreground text-primary rounded-lg font-medium hover:opacity-90 transition">
            Subscribe Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Shop</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/products" className="hover:text-foreground transition">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=furniture" className="hover:text-foreground transition">
                    Furniture
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=lighting" className="hover:text-foreground transition">
                    Lighting
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-foreground transition">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/shipping" className="hover:text-foreground transition">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-foreground transition">
                    Returns
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Follow Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Facebook
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Pinterest
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Premium Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
