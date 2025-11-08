"use client"

import { updateOrderStatus } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface OrderStatusDialogProps {
  order: any
}

export function OrderStatusDialog({ order }: OrderStatusDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const statuses: ("pending" | "confirmed" | "rejected" | "shipping" | "delivered")[] = [
    "pending",
    "confirmed",
    "rejected",
    "shipping",
    "delivered",
  ]

  const handleStatusUpdate = async (status: "pending" | "confirmed" | "rejected" | "shipping" | "delivered") => {
    setIsLoading(true)
    try {
      await updateOrderStatus(order.id, status)
      router.refresh()
      setIsOpen(false)
    } catch (error) {
      alert("Failed to update order status")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {statuses.map((status) => (
            <Button
              key={status}
              onClick={() => handleStatusUpdate(status)}
              disabled={isLoading}
              variant={order.status === status ? "default" : "outline"}
              className="w-full"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
