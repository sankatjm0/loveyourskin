// /app/api/debug/rls-check/route.ts
// This endpoint bypasses RLS using service role key to show actual data
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // With server client and proper session, this should work
    // If this shows data but admin page doesn't, it's an RLS issue

    const queries = await Promise.all([
      supabase.from("category").select("id, name"),
      supabase.from("profiles").select("id, email, created_at"),
    ])

    const [{ data: categories, error: catError }, { data: profiles, error: profError }] = queries

    const response = {
      timestamp: new Date().toISOString(),
      data: {
        categories: {
          count: categories?.length || 0,
          data: categories || [],
          error: catError?.message
        },
        profiles: {
          count: profiles?.length || 0,
          data: profiles || [],
          error: profError?.message
        }
      },
      diagnosis: {
        categories_found: (categories?.length || 0) > 0,
        profiles_found: (profiles?.length || 0) > 0,
        likely_rls_issue: (categories?.length || 0) === 0 && catError === null,
        instructions: [
          "If 'categories_found' and 'profiles_found' are true but admin shows 0, it's an RLS policy issue",
          "Go to Supabase dashboard > Authentication > Policies",
          "For 'category' table: ensure authenticated users can SELECT",
          "For 'profiles' table: ensure authenticated users can SELECT"
        ]
      }
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error("RLS check error:", err)
    return NextResponse.json({ 
      error: String(err),
      message: "If you see this, there's a server error. Check Supabase connection."
    }, { status: 500 })
  }
}
