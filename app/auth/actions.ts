"use server"

import { notifyAdminsOfNewUser } from "@/lib/notifications"

export async function notifyNewUserSignup(email: string) {
  try {
    await notifyAdminsOfNewUser(email)
    return { success: true }
  } catch (error) {
    console.error("[Auth Actions] Error notifying admins:", error)
    return { success: false, error }
  }
}
