// /app/api/promotions/slides/route.ts
import { NextResponse } from "next/server"
import { getActiveSlides } from "@/lib/promotions"

export async function GET() {
  const slides = await getActiveSlides()
  return NextResponse.json(slides)
}
