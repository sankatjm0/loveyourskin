import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { notifyAdminsOfContactSubmission } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, phone } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    // Store contact message in database
    try {
      const { error: dbError } = await adminClient
        .from("contact_messages")
        .insert({
          name,
          email,
          phone: phone || null,
          message,
          created_at: new Date().toISOString(),
        })

      if (dbError) {
        console.error("[Contact API] DB Error:", dbError)
        return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
      }

      console.log("[Contact API] Message stored in database")
    } catch (dbError) {
      console.error("[Contact API] Error storing message:", dbError)
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    // Notify admins using notification helper
    try {
      await notifyAdminsOfContactSubmission(name, email, message)
    } catch (notifError) {
      console.error("[Contact API] Error notifying admins:", notifError)
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully! We'll get back to you soon.",
    })
  } catch (error) {
    console.error("[Contact API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
