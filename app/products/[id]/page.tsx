"use client"

import { useState } from "react"
import Link from "next/link"
import { products } from "@/lib/products"
import { ShoppingCart, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default function ProductPage({ params }: Props) {
  const { id } = params as unknown as { id: string }
  const product = products.find((p) => p.id === Number(id))
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/products" className="text-sm hover:text-primary transition flex items-center gap-2">
              <ChevronLeft size={16} /> Back to Products
            </Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Return to catalog
          </Link>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cart.find((item: any) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push({ ...product, quantity })
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    router.push("/cart")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Premium Store
          </Link>
          <Link href="/cart" className="px-4 py-2 hover:bg-muted rounded-lg transition">
            Cart
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Link href="/products" className="text-sm hover:text-primary transition flex items-center gap-2 mb-8">
          <ChevronLeft size={16} /> Back to Products
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-muted rounded-lg overflow-hidden aspect-square">
            <img
              src={product.image.startsWith("/") ? product.image : `/public/${product.image}`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">{product.category}</p>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-baseline gap-4 mb-8">
                <p className="text-3xl font-bold text-primary">${product.price}</p>
                <p
                  className={`text-sm px-3 py-1 rounded ${
                    product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </p>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">{product.description}</p>

              {/* Product Features */}
              <div className="space-y-4 mb-12">
                <h3 className="font-semibold text-lg">Features</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Premium quality materials
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Modern minimalist design
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Eco-friendly production
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Free shipping on orders over $100
                  </li>
                </ul>
              </div>
            </div>

            {/* Purchase Section */}
            <div className="border-t border-border pt-8 space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-muted transition"
                  >
                    -
                  </button>
                  <span className="px-6 py-2">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:bg-muted transition"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
