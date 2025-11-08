"use client"

import { type CartItem, removeFromCart, updateCartQuantity } from "@/lib/cart"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface CartItemRowProps {
  item: CartItem
}

export function CartItemRow({ item }: CartItemRowProps) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1) return

    setIsLoading(true)
    try {
      setQuantity(newQuantity)
      await updateCartQuantity(item.id, newQuantity)
      router.refresh()
    } catch (error) {
      setQuantity(item.quantity)
      alert("Failed to update quantity")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    setIsLoading(true)
    try {
      await removeFromCart(item.id)
      router.refresh()
    } catch (error) {
      alert("Failed to remove item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-4 bg-card p-4 rounded-lg">
      <img
        src={item.products.image_url || "/placeholder.svg?height=100&width=100"}
        alt={item.products.name}
        className="w-24 h-24 object-cover rounded"
      />

      <div className="flex-1">
        <h3 className="font-semibold mb-2">{item.products.name}</h3>
        <p className="text-primary font-bold">${item.products.price.toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleUpdateQuantity(quantity - 1)}
          disabled={isLoading || quantity === 1}
          className="px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-50"
        >
          -
        </button>
        <span className="w-8 text-center">{quantity}</span>
        <button
          onClick={() => handleUpdateQuantity(quantity + 1)}
          disabled={isLoading}
          className="px-2 py-1 border border-border rounded hover:bg-muted disabled:opacity-50"
        >
          +
        </button>
      </div>

      <Button
        onClick={handleRemove}
        disabled={isLoading}
        variant="outline"
        className="text-red-600 hover:text-red-700 bg-transparent"
      >
        Remove
      </Button>
    </div>
  )
}
