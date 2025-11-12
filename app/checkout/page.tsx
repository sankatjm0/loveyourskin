"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/hooks/use-cart"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart()
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Premium Store
            </Link>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add items before checking out</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            <ArrowLeft size={18} />
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Create order
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const shippingCost = total > 100 ? 0 : 9.99
      const tax = total * 0.1
      const finalTotal = total + tax + shippingCost

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: "pending",
          payment_status: "pending",
          total_amount: finalTotal,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_postal_code: formData.zip,
          shipping_country: formData.state,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Add order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id, // Keep as string (UUID)
        quantity: item.quantity,
        price: item.price,
      }))

      for (const item of orderItems) {
        await supabase.from("order_items").insert(item)
      }

      // Redirect to payment
      router.push(`/payment/${order.id}`)
      await clearCart()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create order")
    } finally {
      setIsProcessing(false)
    }
  }

  const finalTotal = total * 1.1 + (total > 100 ? 0 : 9.99)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Premium Store
          </Link>
          <Link href="/cart" className="text-sm hover:text-primary transition flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Cart
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-12">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
            {/* Shipping Information */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary mt-4"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary mt-4"
              />
              <input
                type="text"
                name="address"
                placeholder="Street Address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary mt-4"
              />
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  name="zip"
                  placeholder="ZIP Code"
                  value={formData.zip}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">You will be redirected to VNPay to complete payment securely.</p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : `Proceed to Payment - $${finalTotal.toFixed(2)}`}
              </button>
            </div>
          </form>

          {/* Order Summary */}
          <div>
            <div className="border border-border rounded-lg p-6 sticky top-24 space-y-6">
              <h2 className="text-2xl font-bold">Order Summary</h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} <span className="font-medium text-foreground">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={total > 100 ? "text-green-600 font-medium" : ""}>
                    {total > 100 ? "FREE" : "$9.99"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span>${(total * 0.1).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
