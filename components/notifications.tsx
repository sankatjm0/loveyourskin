"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export interface Notification {
  id: string
  type: "order_status" | "new_promotion" | "new_order" | "user_message"
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

interface NotificationsProps {
  isAdmin?: boolean
}

export function Notifications({ isAdmin = false }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()

    // Refresh notifications every 5 seconds
    const interval = setInterval(loadNotifications, 5000)
    return () => clearInterval(interval)
  }, [isAdmin])

  async function loadNotifications() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch user notifications
      const { data: userNotifs, error: userError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      // Fetch admin notifications
      const { data: adminNotifs, error: adminError } = await supabase
        .from("notifications")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (userError || adminError) {
        console.error("Error loading notifications:", userError || adminError)
        return
      }

      // Merge and sort by date
      const allNotifs = [...(userNotifs || []), ...(adminNotifs || [])]
      allNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      const notifs = allNotifs.slice(0, 50)
      setNotifications(notifs)
      setUnreadCount(notifs.filter((n) => !n.read).length)
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  async function markAsRead(id: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, read: true }),
      })
      if (!response.ok) throw new Error("Failed to mark as read")
      const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      setNotifications(updated)
      setUnreadCount(updated.filter((n) => !n.read).length)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  async function deleteNotification(id: string) {
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      })
      if (!response.ok) throw new Error("Failed to delete notification")
      const updated = notifications.filter((n) => n.id !== id)
      setNotifications(updated)
      setUnreadCount(updated.filter((n) => !n.read).length)
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted transition cursor-pointer ${!notification.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Link
                        href={notification.link || "#"}
                        onClick={() => {
                          markAsRead(notification.id)
                          setIsOpen(false)
                        }}
                        className="text-sm text-foreground hover:text-primary"
                      >
                        <p className={`${!notification.read ? "font-semibold" : ""}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </Link>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        deleteNotification(notification.id)
                      }}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
