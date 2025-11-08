"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AddToCartButtonProps {
  productId: string
  productName: string
}

export function AddToCartButton({ productId, productName }: AddToCartButtonProps) {
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

      const { error } = await supabase.from("carts").upsert(
        {
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        },
        {
          onConflict: "user_id,product_id",
        },
      )

      if (error) throw error

      router.refresh()
      alert(`${productName} added to cart!`)
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
