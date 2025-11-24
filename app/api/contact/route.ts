import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Store contact message (optional - if you have a contacts table)
    // await supabase.from("contacts").insert({ name, email, message, created_at: new Date().toISOString() })

    // Create notification for all admins
    try {
      const { data: adminUsers } = await supabase
        .from("admin_access")
        .select("user_id")
        .eq("is_admin", true)
        .limit(10)

      if (adminUsers && adminUsers.length > 0) {
        const adminNotifications = adminUsers.map((admin) => ({
          user_id: admin.user_id,
          type: "contact_form",
          title: "New Contact Form Submission",
          message: `New message from ${name} (${email}): "${message.substring(0, 50)}..."`,
          link: `/admin`, // Or create a dedicated admin contact page
          read: false,
        }))

        const { error: notifError } = await supabase.from("notifications").insert(adminNotifications)
        if (notifError) console.error("Failed to create admin notification:", notifError)
      }
    } catch (notifError) {
      console.error("Error notifying admins:", notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, message: "Message sent successfully" })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
