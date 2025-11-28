import { NextResponse } from "next/server"

export async function GET() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  return NextResponse.json({
    hasServiceRoleKey: !!serviceRoleKey,
    serviceRoleKeyLength: serviceRoleKey?.length || 0,
    hasAnonKey: !!anonKey,
    anonKeyLength: anonKey?.length || 0,
    hasSupabaseUrl: !!supabaseUrl,
    supabaseUrl: supabaseUrl || "NOT SET",
  })
}
