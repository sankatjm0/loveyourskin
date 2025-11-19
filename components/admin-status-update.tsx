"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface AdminStatusUpdateProps {
  orderId: string
  currentStatus: string
  orderNumber: string
  onStatusUpdate?: () => void
}

export function AdminStatusUpdate({ orderId, currentStatus, orderNumber, onStatusUpdate }: AdminStatusUpdateProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("admin_access").select("is_admin").eq("user_id", user.id).single()
        setIsAdmin(!!data?.is_admin)
      }
    } catch (err) {
      console.error("Error checking admin status:", err)
    }
  }

  const getStatusTransitions = (status: string) => {
    const transitions: Record<string, string[]> = {
      pending: ["confirmed", "rejected"],
      confirmed: ["shipping", "cancelled"],
      shipping: ["delivered", "cancelled"],
      rejected: [],
      cancelled: [],
      delivered: [],
    }
    return transitions[status] || []
  }

  async function updateStatus(newStatus: string) {
    setIsUpdating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)

      if (error) throw error

      // Add notification
      const notification = {
        id: `notif-${Date.now()}`,
        type: "order_status",
        message: `Your order ${orderNumber} status: ${newStatus}`,
        link: `/orders/${orderId}`,
        read: false,
        created_at: new Date().toISOString(),
      }
      const existing = JSON.parse(localStorage.getItem("user_notifications") || "[]")
      localStorage.setItem("user_notifications", JSON.stringify([notification, ...existing]))

      alert("Status updated!")
      onStatusUpdate?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating status")
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isAdmin) return null

  const transitions = getStatusTransitions(currentStatus)
  if (transitions.length === 0) return null

  return (
    <div className="border border-border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
      <h3 className="font-semibold mb-3 text-sm">Update Order Status</h3>
      <div className="flex gap-2 flex-wrap">
        {transitions.map((newStatus) => (
          <button
            key={newStatus}
            onClick={() => updateStatus(newStatus)}
            disabled={isUpdating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition disabled:opacity-50 capitalize"
          >
            → {newStatus}
          </button>
        ))}
      </div>
    </div>
  )
}
