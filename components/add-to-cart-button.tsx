"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AddToCartButtonProps {
  productId: string
  productName: string
  productPrice: number
  productImage?: string
}

export function AddToCartButton({ productId, productName, productPrice, productImage }: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAddToCart = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      const { data: existingItem, error: fetchError } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .limit(1)

      if (fetchError) throw fetchError

      if (existingItem) {
        existingItem.quantity += 1
      } else {
        cart.push({
          id: productId,
          name: productName,
          quantity: 1,
          price: productPrice,
          image: productImage,
        })
      }

      if (existingItem && existingItem.length > 0) {
        const existing = existingItem[0]
        const { error: updateError } = await supabase
          .from("carts")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from("carts")
          .insert([
            {
              user_id: user.id,
              product_id: productId,
              quantity: 1,
              created_at: new Date().toISOString(),
            },
          ])
        if (insertError) throw insertError
      }
      alert(`${productName} added to cart!`)
      router.refresh()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to add to cart")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleAddToCart} disabled={isLoading} className="w-full py-6 text-lg">
      {isLoading ? "Adding..." : "Add to Cart"}
    </Button>
  )
}
