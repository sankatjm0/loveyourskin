// /components/PromoSlider.tsx
"use client"

import { useEffect, useState } from "react"

type Slide = { id: string; image_url: string; link_to?: string | null }

export default function PromoSlider() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/promotions/slides")
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        console.log("Slides fetched from API:", data)
        
        if (Array.isArray(data) && data.length > 0) {
          // Filter out slides with invalid image URLs
          const validSlides = data.filter(slide => slide.image_url && slide.image_url.trim())
          console.log("Valid slides:", validSlides)
          setSlides(validSlides)
          setError(null)
        } else {
          console.warn("No slides received from API or invalid format")
          setSlides([])
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Failed to fetch promotion slides:", errorMsg)
        setError(errorMsg)
        setSlides([])
      } finally {
        setLoading(false)
      }
    }

    fetchSlides()
  }, [])

  useEffect(() => {
    if (!slides.length) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(timer)
  }, [slides])

  // Loading or error state
  if (loading) {
    return (
      <img
        src="/modern-minimalist-interior-design-premium.jpg"
        alt="Loading hero"
        className="rounded-lg w-full h-96 object-cover"
      />
    )
  }

  // No slides available
  if (!slides.length) {
    console.log("No slides available, showing fallback image")
    return (
      <img
        src="/modern-minimalist-interior-design-premium.jpg"
        alt="Hero"
        className="rounded-lg w-full h-96 object-cover"
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
          <img 
            src={s.image_url} 
            alt={`slide-${i}`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error(`Failed to load image: ${s.image_url}`)
              ;(e.target as HTMLImageElement).src = "/modern-minimalist-interior-design-premium.jpg"
            }}
          />
        </a>
      ))}
      
      {/* Slide indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition ${i === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  )
}
