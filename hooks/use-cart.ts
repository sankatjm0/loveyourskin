"use client"

import { useEffect, useState } from "react"
import type { Product } from "@/lib/products"

export interface CartItem extends Product {
  quantity: number
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart")
    if (stored) {
      try {
        setCart(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse cart:", e)
      }
    }
    setIsLoading(false)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [cart, isLoading])

  const addItem = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item))
      }
      return [...prev, { ...product, quantity }]
    })
  }

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
    } else {
      setCart((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)))
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    isLoading,
  }
}
