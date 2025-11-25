// app/api/products/create/route.ts
import { createClient, createAdminClient } from "@/lib/supabase/server"
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
    
    console.log("[API Products Create] User:", user.id)
    console.log("[API Products Create] Data:", body)
    
    // Insert using ADMIN client (SERVICE_ROLE_KEY - has full access, bypasses RLS)
    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from("products")
      .insert([body])
      .select()
    
    if (error) {
      console.error("[API Products Create] Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    console.log("[API Products Create] Success, returned:", data?.length, "rows")
    console.log("[API Products Create] Data:", data)
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API Products Create] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
