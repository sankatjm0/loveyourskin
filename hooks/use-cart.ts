"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { getActivePromotionForProduct } from "@/lib/promotions"

interface CartItem {
  id: string
  product_id: string
  name: string
  category?: string
  image_url?: string
  price: number
  quantity: number
  discount_percent?: number
  discount_price?: number
}

export function useCart() {
  const supabase = createClient()

  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchCart = useCallback(async () => {
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setCart([])
      setUserId(null)
      setIsLoading(false)
      return
    }

    setUserId(user.id)

    const { data, error } = await supabase
      .from("carts")
      .select(
        `
        id,
        quantity,
        products (
          id,
          name,
          price,
          image_url,
          category
        )
      `
      )
      .eq("user_id", user.id)

    if (error) {
      console.error(error)
      setCart([])
    } else {
      const formatted = await Promise.all(
        data.map(async (item: any) => {
          // Fetch promotion for this product
          const promo = await getActivePromotionForProduct(item.products.id)
          const discount_percent = promo?.discount_percent || 0
          const originalPrice = item.products.price
          const discount_price = discount_percent > 0 
            ? Math.round((originalPrice * (1 - discount_percent / 100)) * 100) / 100
            : originalPrice

          return {
            id: item.id,
            product_id: item.products.id,
            name: item.products.name,
            price: originalPrice,
            image_url: item.products.image_url,
            category: item.products.category,
            quantity: item.quantity,
            discount_percent,
            discount_price,
          }
        })
      )
      setCart(formatted)
    }

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const total = cart.reduce((sum, item) => sum + (item.discount_price || item.price) * item.quantity, 0)

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!userId) return

      const existing = cart.find((i) => i.product_id === productId)

      if (existing) {
        await supabase
          .from("carts")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id)
      } else {
        await supabase.from("carts").insert({
          user_id: userId,
          product_id: productId,
          quantity,
        })
      }

      await fetchCart()
    },
    [userId, cart, supabase, fetchCart]
  )

  const updateQuantity = useCallback(
    async (id: string, newQuantity: number) => {
      const item = cart.find((i) => i.id === id)
      if (!item || newQuantity < 1) return

      await supabase.from("carts").update({ quantity: newQuantity }).eq("id", id)
      await fetchCart()
    },
    [cart, supabase, fetchCart]
  )

  const removeItem = useCallback(
    async (id: string) => {
      await supabase.from("carts").delete().eq("id", id)
      await fetchCart()
    },
    [supabase, fetchCart]
  )

  const clearCart = useCallback(async () => {
    if (!userId) return
    await supabase.from("carts").delete().eq("user_id", userId)
    setCart([])
  }, [userId, supabase])

  return {
    cart,
    total,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refresh: fetchCart,
  }
}
