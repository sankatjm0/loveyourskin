import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("category")
      .select("id, name")
      .order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error("Categories API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
