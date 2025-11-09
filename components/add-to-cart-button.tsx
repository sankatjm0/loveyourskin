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
      const existingItem = cart.find((item: any) => item.id === productId)

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

      localStorage.setItem("cart", JSON.stringify(cart))
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
