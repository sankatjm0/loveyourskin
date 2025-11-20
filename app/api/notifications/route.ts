import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET notifications for current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get notifications for user
    const { data: userNotifications, error: userError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (userError) {
      console.error("GET user notifications error:", userError)
    }

    // Get notifications for admin
    const { data: adminNotifications, error: adminError } = await supabase
      .from("notifications")
      .select("*")
      .eq("admin_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (adminError) {
      console.error("GET admin notifications error:", adminError)
    }

    // Merge and sort by date
    const allNotifications = [...(userNotifications || []), ...(adminNotifications || [])]
    allNotifications.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(allNotifications.slice(0, limit))
  } catch (error) {
    console.error("GET /api/notifications error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch notifications" }, { status: 500 })
  }
}

// CREATE notification
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { user_id, admin_id, type, title, message, link } = body

    if (!type || !message) {
      return NextResponse.json({ error: "type and message are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id,
        admin_id,
        type,
        title: title || type,
        message,
        link,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("POST /api/notifications error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create notification" }, { status: 500 })
  }
}

// UPDATE notification (mark as read)
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { notificationId, read } = body

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ read, updated_at: new Date().toISOString() })
      .eq("id", notificationId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("PUT /api/notifications error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update notification" }, { status: 500 })
  }
}

// DELETE notification
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId is required" }, { status: 400 })
    }

    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/notifications error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete notification" }, { status: 500 })
  }
}
