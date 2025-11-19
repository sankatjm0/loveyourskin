// /app/api/debug/tables/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check category table with count
    const { data: categories, count: catCount, error: catError } = await supabase.from("category").select("*", { count: "exact" }).limit(5)
    console.log("Categories from server:", { count: catCount, error: catError, sample: categories })

    // Check profiles table with count
    const { data: profiles, count: profCount, error: profError } = await supabase.from("profiles").select("*", { count: "exact" }).limit(5)
    console.log("Profiles from server:", { count: profCount, error: profError, sample: profiles })

    // Check promotion_slides table with count
    const { data: slides, count: slidesCount, error: slidesError } = await supabase.from("promotion_slides").select("*", { count: "exact" }).limit(5)
    console.log("Promotion slides from server:", { count: slidesCount, error: slidesError, sample: slides })

    return NextResponse.json({
      server_side: {
        categories: { total_count: catCount, error: catError?.message, sample: categories },
        profiles: { total_count: profCount, error: profError?.message, sample: profiles },
        promotion_slides: { total_count: slidesCount, error: slidesError?.message, sample: slides }
      },
      timestamp: new Date().toISOString(),
      note: "Categories and profiles should load in admin panel if counts > 0 here"
    })
  } catch (err) {
    console.error("Debug error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
