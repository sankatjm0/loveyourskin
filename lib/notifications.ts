import { createAdminClient } from "@/lib/supabase/server"

// Helper to get only changed fields
function getChangedFields(changes: Record<string, any>): string {
  const ignoreFields = ["updated_at", "created_at", "id"]
  const changedKeys = Object.keys(changes).filter(key => !ignoreFields.includes(key))
  return changedKeys.length > 0 ? changedKeys.join(", ") : "Unknown changes"
}

export async function createNotification(data: {
  user_id?: string
  admin_id?: string
  type: "order_status" | "new_promotion" | "new_order" | "user_message" | "contact_form" | "user_registered" | "product_edit" | "user_profile_edit"
  title: string
  message: string
  link?: string
  read?: boolean
}) {
  try {
    const adminClient = await createAdminClient()
    const { error } = await adminClient.from("notifications").insert({
      user_id: data.user_id || null,
      admin_id: data.admin_id || null,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link || null,
      read: data.read ?? false,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[Notification] Error creating notification:", error)
    } else {
      console.log("[Notification] Created:", data.type, data.title)
    }

    return { success: !error, error }
  } catch (error) {
    console.error("[Notification] Error:", error)
    return { success: false, error }
  }
}

// Admin notification: Product edited
export async function notifyAdminsOfProductEdit(productName: string, changes: Record<string, any>) {
  try {
    const adminClient = await createAdminClient()
    
    // Get all admins
    const { data: admins, error: adminsError } = await adminClient
      .from("admin_access")
      .select("user_id")
      .eq("is_admin", true)
    
    console.log("[Notifications] Product Edit - Found admins:", admins?.length, "Error:", adminsError)

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: null,
        admin_id: admin.user_id,
        type: "product_edit" as const,
        title: `Product Edited: ${productName}`,
        message: `Product "${productName}" has been edited.`,
        link: "/admin?tab=history",
        read: false,
        created_at: new Date().toISOString(),
      }))

      console.log("[Notifications] About to insert:", notifications.length, "notifications")
      const { error } = await adminClient.from("notifications").insert(notifications)
      
      if (error) {
        console.error("[Notifications] Insert error:", error)
        return { success: false }
      }
      
      console.log("[Notifications] Product edit notifications inserted successfully")
      return { success: true }
    } else {
      console.warn("[Notifications] No admins found in admin_access table")
      return { success: false }
    }
  } catch (error) {
    console.error("[Notifications] Error in notifyAdminsOfProductEdit:", error)
  }
  return { success: false }
}

// Admin notification: New user registered
export async function notifyAdminsOfNewUser(email: string, userName?: string) {
  try {
    const adminClient = await createAdminClient()
    
    const { data: admins } = await adminClient
      .from("admin_access")
      .select("user_id")
      .eq("is_admin", true)

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: null,
        admin_id: admin.user_id,
        type: "user_registered" as const,
        title: "New User Registration",
        message: `New user registered: ${userName || email}`,
        link: "/admin?tab=history",
        read: false,
        created_at: new Date().toISOString(),
      }))

      const { error } = await adminClient.from("notifications").insert(notifications)
      if (error) console.error("[Notification] Error notifying admins:", error)
      return { success: !error }
    }
  } catch (error) {
    console.error("[Notification] Error in notifyAdminsOfNewUser:", error)
  }
  return { success: false }
}

// Admin notification: User profile edited
export async function notifyAdminsOfProfileEdit(userEmail: string, changes: Record<string, any>) {
  try {
    const adminClient = await createAdminClient()
    
    const { data: admins } = await adminClient
      .from("admin_access")
      .select("user_id")
      .eq("is_admin", true)

    if (admins && admins.length > 0) {
      const changedFields = getChangedFields(changes)
      const notifications = admins.map(admin => ({
        user_id: null,
        admin_id: admin.user_id,
        type: "user_profile_edit" as const,
        title: `User Profile Updated: ${userEmail}`,
        message: `User profile updated. Changes: ${changedFields}`,
        link: "/admin?tab=history",
        read: false,
        created_at: new Date().toISOString(),
      }))

      const { error } = await adminClient.from("notifications").insert(notifications)
      if (error) console.error("[Notification] Error notifying admins:", error)
      return { success: !error }
    }
  } catch (error) {
    console.error("[Notification] Error in notifyAdminsOfProfileEdit:", error)
  }
  return { success: false }
}

// Admin notification: Contact form submitted
export async function notifyAdminsOfContactSubmission(senderName: string, senderEmail: string, message: string) {
  try {
    const adminClient = await createAdminClient()
    
    const { data: admins } = await adminClient
      .from("admin_access")
      .select("user_id")
      .eq("is_admin", true)

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: null,
        admin_id: admin.user_id,
        type: "contact_form" as const,
        title: `New Contact from ${senderName}`,
        message: `${senderName} (${senderEmail}): ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`,
        link: "/admin?tab=history",
        read: false,
        created_at: new Date().toISOString(),
      }))

      const { error } = await adminClient.from("notifications").insert(notifications)
      if (error) console.error("[Notification] Error notifying admins:", error)
      return { success: !error }
    }
  } catch (error) {
    console.error("[Notification] Error in notifyAdminsOfContactSubmission:", error)
  }
  return { success: false }
}

// User notification: Order status changed
export async function notifyUserOfOrderStatus(userId: string, orderId: string, status: string) {
  try {
    const adminClient = await createAdminClient()
    
    await createNotification({
      user_id: userId,
      type: "order_status",
      title: `Order Status Updated`,
      message: `Your order #${orderId} status is now: ${status}`,
      link: `/orders/${orderId}`,
    })
    
    return { success: true }
  } catch (error) {
    console.error("[Notification] Error in notifyUserOfOrderStatus:", error)
  }
  return { success: false }
}

// User notification: Order successful
export async function notifyUserOfOrderSuccess(userId: string, orderId: string) {
  try {
    await createNotification({
      user_id: userId,
      type: "new_order",
      title: `Order Placed Successfully`,
      message: `Your order #${orderId} has been placed successfully. Thank you for your purchase!`,
      link: `/orders/${orderId}`,
    })
    
    return { success: true }
  } catch (error) {
    console.error("[Notification] Error in notifyUserOfOrderSuccess:", error)
  }
  return { success: false }
}

// User notification: New promotion
export async function notifyUserOfPromotion(userId: string, promoTitle: string) {
  try {
    await createNotification({
      user_id: userId,
      type: "new_promotion",
      title: `New Promotion Available`,
      message: `${promoTitle}`,
      link: `/products`,
    })
    
    return { success: true }
  } catch (error) {
    console.error("[Notification] Error in notifyUserOfPromotion:", error)
  }
  return { success: false }
}

// Admin notification: New order placed
export async function notifyAdminsOfNewOrder(orderId: string, userEmail: string, totalAmount: number) {
  try {
    const adminClient = await createAdminClient()
    
    const { data: admins } = await adminClient
      .from("admin_access")
      .select("user_id")
      .eq("is_admin", true)

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: null,
        admin_id: admin.user_id,
        type: "new_order" as const,
        title: `New Order #${orderId}`,
        message: `New order from ${userEmail}. Total: ${totalAmount.toLocaleString('vi-VN')} VND`,
        link: "/admin?tab=orders",
        read: false,
        created_at: new Date().toISOString(),
      }))

      const { error } = await adminClient.from("notifications").insert(notifications)
      if (error) console.error("[Notification] Error notifying admins of new order:", error)
      return { success: !error }
    }
  } catch (error) {
    console.error("[Notification] Error in notifyAdminsOfNewOrder:", error)
  }
  return { success: false }
}
