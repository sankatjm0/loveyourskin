// /components/PromoSlider.tsx
"use client"

import { useEffect, useState } from "react"
import { getActiveSlides } from "@/lib/promotions" // if getActiveSlides is server-side only, we fetch via fetch('/api/promotions/slides') instead

type Slide = { id: string; image_url: string; link_to?: string | null }

export default function PromoSlider() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // Fetch slides via client helper (uses supabase client inside)
    ;(async () => {
      try {
        // If getActiveSlides is server-only, replace with API endpoint
        const s = await (await fetch("/api/promotions/slides")).json()
        setSlides(s || [])
      } catch (err) {
        console.warn("fetch slides", err)
      }
    })()
  }, [])

  useEffect(() => {
    if (!slides.length) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides])

  if (!slides.length) {
    return (
      <img
        src="/modern-minimalist-interior-design-premium.jpg"
        alt="Hero"
        className="rounded-lg w-full h-full object-cover"
      />
    )
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden">
      {slides.map((s, i) => (
        <a
          key={s.id}
          href={s.link_to || "#"}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <img src={s.image_url} alt={`slide-${i}`} className="w-full h-full object-cover" />
        </a>
      ))}
      {/* simple indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  )
}
