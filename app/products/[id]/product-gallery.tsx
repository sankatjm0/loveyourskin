"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  image_urls?: string[] | null
  stock: number
  category?: string
  details?: string
}

export default function ProductGallery({ product }: { product: Product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  useEffect(() => {
    // Normalize various stored formats for image_urls and protect against malformed values
    function normalizeUrls(raw: any): string[] {
      if (!raw) return []
      let out: string[] = []
      
      // If already an array, copy + filter
      if (Array.isArray(raw)) {
        out = raw.map((u: any) => String(u || "").trim())
      } else if (typeof raw === 'string') {
        let s = raw.trim()
        
        // eslint-disable-next-line no-console
        console.debug('[ProductGallery] Raw string input:', s.substring(0, 200))
        
        try {
          // Try to unescape double-escaping (e.g., "\\\"" -> "\"")
          let unescaped = s
          if (s.includes('\\\"') || s.includes('\\\\')) {
            try {
              unescaped = JSON.parse(`"${s}"`)
            } catch {
              // If that fails, try manual unescape
              unescaped = s.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            }
            // eslint-disable-next-line no-console
            console.debug('[ProductGallery] After unescape:', unescaped.substring(0, 200))
          }
          
          // Remove surrounding single/double quotes
          let cleaned = unescaped
          if ((cleaned.startsWith("'[") && cleaned.endsWith("]'")) || (cleaned.startsWith('"[') && cleaned.endsWith(']"'))) {
            cleaned = cleaned.slice(1, -1)
          }
          
          // Try JSON parse if it looks like an array
          if ((cleaned.startsWith('[') && cleaned.endsWith(']')) || cleaned.startsWith('%5B')) {
            // Decode URI if needed
            try {
              const decoded = decodeURIComponent(cleaned)
              cleaned = decoded
            } catch {}
            
            const parsed = JSON.parse(cleaned)
            if (Array.isArray(parsed)) {
              out = parsed.map((u: any) => String(u || "").trim())
              // eslint-disable-next-line no-console
              console.debug('[ProductGallery] Parsed JSON array:', out.length, 'URLs')
            }
          } else if (cleaned.includes('","') || cleaned.includes('\",\"')) {
            // Handle quoted comma-separated like "url1","url2"
            const items = cleaned.split(/\",\"|","/).map(x => x.replace(/^\"|\"$/g, '').trim())
            out = items
          } else if (cleaned.includes(',') && cleaned.includes('http')) {
            // Comma-separated URLs (but not just any comma)
            out = cleaned.split(',').map((x) => x.replace(/^\s+|\s+$/g, '').replace(/^\"|\"$/g, ''))
          } else {
            // Single string URL
            out = [cleaned]
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[ProductGallery] Parse error, fallback to single URL:', e)
          const cleaned = s.replace(/^\[|\]$/g, '').replace(/^\"|\"$/g, '').trim()
          if (cleaned.length > 0) out = [cleaned]
        }
      } else {
        // other types -> coerce to string
        out = [String(raw)]
      }

      // Final cleaning & normalize common URL issues
      out = out
        .map((u) => {
          let url = String(u || '').trim()
          // Remove stray surrounding quotes
          url = url.replace(/^\"|\"$/g, '')
          url = url.replace(/^\'+|\'+$/g, '')
          // Decode percent-encoding if any
          try { url = decodeURIComponent(url) } catch {}
          // Fix common missing-slash issue: 'https:/' -> 'https://'
          url = url.replace(/^https?:\:\/\/(?=\/)/, 'https://')

          if (url.startsWith('https:/') && !url.startsWith('https://')) url = url.replace('https:/', 'https://')
          if (url.startsWith('http:/') && !url.startsWith('http://')) url = url.replace('http:/', 'http://')
          // Remove accidental surrounding square brackets
          url = url.replace(/^\[+|\]+$/g, '')
          return url
        })
        .filter((u) => u && u.length > 0)

      return out
    }

    // Debug logging to help track malformed stored data
    try {
      // eslint-disable-next-line no-console
      console.debug('[ProductGallery] raw image_urls for product', product?.id, product?.image_urls)
    } catch {}

    let urls = normalizeUrls(product.image_urls)
    if (urls.length === 0 && product.image_url) urls = [String(product.image_url).trim()]
    // eslint-disable-next-line no-console
    console.debug('[ProductGallery] parsed imageUrls', product?.id, urls)
    setImageUrls(urls)
  }, [product])

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
  }

  if (imageUrls.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-muted rounded-lg overflow-hidden aspect-square flex items-center justify-center">
          <img src="/placeholder.svg?height=600&width=600&query=product" alt={product.name} className="w-full h-full object-cover" />
        </div>
      </div>
    )
  }

  const currentImage = imageUrls[currentImageIndex]
  const hasMultipleImages = imageUrls.length > 1

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image with Navigation */}
      <div className="bg-muted rounded-lg overflow-hidden aspect-square relative group">
        <img 
          src={currentImage}
          alt={`${product.name} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover" 
        />
        
        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentImageIndex + 1} / {imageUrls.length}
          </div>
        )}
        
        {/* Navigation Buttons */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 transition opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 transition opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnail Gallery */}
      {hasMultipleImages && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {imageUrls.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`w-20 h-20 flex-shrink-0 border-2 rounded-lg overflow-hidden transition ${
                currentImageIndex === idx 
                  ? 'border-primary' 
                  : 'border-border hover:border-primary'
              }`}
              aria-label={`View image ${idx + 1}`}
            >
              <img 
                src={imgUrl}
                alt={`product-thumbnail-${idx}`}
                className="w-full h-full object-cover" 
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
