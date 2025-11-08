"use client"

import { useCart } from "@/hooks/use-cart"
import Link from "next/link"
import { Trash2, ArrowLeft, ShoppingCart } from "lucide-react"

export default function CartPage() {
  const { cart, removeItem, updateQuantity, total, isLoading } = useCart()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Premium Store
          </Link>
          <Link href="/products" className="text-sm hover:text-primary transition">
            Continue Shopping
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart size={32} />
          <h1 className="text-4xl font-bold">Your Cart</h1>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart size={64} className="mx-auto mb-6 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Start shopping to add items to your cart</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
            >
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="border border-border rounded-lg p-6 flex gap-6">
                  <img
                    src={item.image_url || "/placeholder.svg?height=100&width=100"}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{item.category}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-2 hover:bg-muted transition"
                        >
                          -
                        </button>
                        <span className="px-4 py-2 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-2 hover:bg-muted transition"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">${item.price} each</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition self-start"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-lg p-6 sticky top-24 space-y-4">
                <h2 className="text-2xl font-bold">Order Summary</h2>

                <div className="space-y-3 py-4 border-t border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-green-600">{total > 100 ? "FREE" : "$9.99"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">${(total * 0.1).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${(total * 1.1 + (total > 100 ? 0 : 9.99)).toFixed(2)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-center hover:opacity-90 transition"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/products"
                  className="block w-full py-3 border border-primary text-primary rounded-lg font-semibold text-center hover:bg-primary hover:text-primary-foreground transition"
                >
                  Continue Shopping
                </Link>

                <div className="text-xs text-muted-foreground text-center pt-4">Free shipping on orders over $100</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
