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
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "Alert", message: "", type: "info" as "info" | "success" | "error" | "warning" })
  const router = useRouter()

  const showAlert = (message: string, type: "info" | "success" | "error" | "warning" = "info", title: string = "Alert") => {
    setAlertModal({ isOpen: true, title, message, type })
  }

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

      const { data: existingItem, error: fetchError } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .limit(1)

      if (fetchError) throw fetchError

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
      showAlert(`${productName} added to cart!`, "success", "Success")
      router.refresh()
    } catch (error: unknown) {
      showAlert(error instanceof Error ? error.message : "Failed to add to cart", "error", "Error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handleAddToCart} disabled={isLoading} className="w-full py-6 text-lg">
        {isLoading ? "Adding..." : "Add to Cart"}
      </Button>

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 border-l-4 ${
            alertModal.type === 'success' ? 'border-green-500 bg-green-50' :
            alertModal.type === 'error' ? 'border-red-500 bg-red-50' :
            alertModal.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`text-2xl ${
                alertModal.type === 'success' ? 'text-green-600' :
                alertModal.type === 'error' ? 'text-red-600' :
                alertModal.type === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {alertModal.type === 'success' && '✓'}
                {alertModal.type === 'error' && '✕'}
                {alertModal.type === 'warning' && '⚠'}
                {alertModal.type === 'info' && 'ℹ'}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${
                  alertModal.type === 'success' ? 'text-green-800' :
                  alertModal.type === 'error' ? 'text-red-800' :
                  alertModal.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>{alertModal.title}</h3>
                <p className={`text-sm mt-2 ${
                  alertModal.type === 'success' ? 'text-green-700' :
                  alertModal.type === 'error' ? 'text-red-700' :
                  alertModal.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>{alertModal.message}</p>
              </div>
            </div>
            <button
              onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              className={`mt-6 w-full py-2 rounded font-medium text-white transition ${
                alertModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                alertModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                alertModal.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}
