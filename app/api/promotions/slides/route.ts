// /app/api/promotions/slides/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    console.log("API: Fetching promotion slides...")
    const { data, error } = await supabase
      .from("promotion_slides")
      .select("id, image_url, link_to")
      .order("display_order", { ascending: true })
      .limit(5)

    if (error) {
      console.error("API: Database error fetching slides:", error)
      return NextResponse.json([], { status: 500 })
    }

    console.log("API: Slides fetched successfully:", data)
    
    // Filter out invalid entries
    const validSlides = (data || []).filter(slide => slide.image_url && slide.image_url.trim())
    console.log("API: Valid slides count:", validSlides.length)
    
    return NextResponse.json(validSlides, { status: 200 })
  } catch (err) {
    console.error("API: Exception fetching slides:", err)
    return NextResponse.json([], { status: 500 })
  }
}
