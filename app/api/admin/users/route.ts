import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET all users with their profiles
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if admin
    const { data: adminData } = await supabase.from("admin_access").select("is_admin").eq("user_id", currentUser.id).single()

    if (!adminData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all users from auth
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw error

    // Get profiles for all users
    const { data: profiles, error: profileError } = await supabase.from("profiles").select("*")
    if (profileError) throw profileError

    // Combine user data with profiles
    const users = data.users.map((user) => {
      const profile = profiles.find((p) => p.id === user.id)
      return {
        id: user.id,
        email: user.email,
        ...profile,
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("GET /api/admin/users error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch users" }, { status: 500 })
  }
}

// UPDATE user profile
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if admin
    const { data: adminData } = await supabase.from("admin_access").select("is_admin").eq("user_id", currentUser.id).single()

    if (!adminData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, full_name, phone, address, city, postal_code, country } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        address,
        city,
        postal_code,
        country,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("PUT /api/admin/users error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update user" }, { status: 500 })
  }
}

// DELETE user (also deletes auth user)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if admin
    const { data: adminData } = await supabase.from("admin_access").select("is_admin").eq("user_id", currentUser.id).single()

    if (!adminData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Delete auth user (cascades to profile)
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete user" }, { status: 500 })
  }
}
