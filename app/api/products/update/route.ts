// app/api/products/update/route.ts
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { notifyAdminsOfProductEdit } from "@/lib/notifications"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check auth first with regular client
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }
    
    console.log("[API Products Update] User:", user.id, "Product ID:", id)
    console.log("[API Products Update] Data:", updateData)
    
    // Update using ADMIN client (SERVICE_ROLE_KEY - has full access, bypasses RLS)
    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
    
    if (error) {
      console.error("[API Products Update] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    console.log("[API Products Update] Success, returned:", data?.length, "rows")
    console.log("[API Products Update] Data:", data)
    
    // Notify admins of product update
    try {
      const productName = updateData.name || "Product"
      await notifyAdminsOfProductEdit(productName, updateData)
    } catch (notifError) {
      console.error("[API Products Update] Notification error:", notifError)
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API Products Update] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
