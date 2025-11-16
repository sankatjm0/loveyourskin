// /lib/promotions.ts
import { createClient } from "@/lib/supabase/client"

export type ActivePromotionResult = {
  promotion_id: string
  discount_percent: number
  promotion_name?: string
  start_at?: string | null
  end_at?: string | null
}

// Lấy promotion active áp dụng cho 1 product (nếu nhiều thì trả promotion ưu tiên mới nhất)
export async function getActivePromotionForProduct(productId: string) {
  const supabase = createClient()

  // Lấy tất cả promotion_products kèm promotion meta
  const { data, error } = await supabase
    .from("promotion_products")
    .select("discount_percent, promotion_id, promotions(name, mode, is_active, start_at, end_at)")
    .eq("product_id", productId)

  if (error) {
    console.warn("getActivePromotionForProduct", error)
    return null
  }

  const now = new Date().toISOString()

  for (const row of data || []) {
    const pr = row.promotions
    if (!pr) continue
    if (pr.mode === "manual" && pr.is_active) {
      return {
        promotion_id: row.promotion_id,
        discount_percent: row.discount_percent,
        promotion_name: pr.name,
        start_at: pr.start_at,
        end_at: pr.end_at,
      } as ActivePromotionResult
    }
    if (pr.mode === "auto" && pr.is_active) {
      if (pr.start_at && pr.end_at) {
        if (now >= pr.start_at && now <= pr.end_at) {
          return {
            promotion_id: row.promotion_id,
            discount_percent: row.discount_percent,
            promotion_name: pr.name,
            start_at: pr.start_at,
            end_at: pr.end_at,
          } as ActivePromotionResult
        }
      }
    }
  }

  return null
}

// Lấy slides hiện tại (ordered)
export async function getActiveSlides() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("promotion_slides")
    .select("id, image_url, link_to, promotion_id")
    .order("display_order", { ascending: true })

  if (error) {
    console.warn("getActiveSlides", error)
    return []
  }
  return data || []
}

// Upload slide image to Supabase Storage and return public URL
export async function uploadSlideImage(file: File) {
  const supabase = createClient()
  const ext = file.name.split(".").pop()
  const fileName = `promotions/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from("promotion_images").upload(fileName, file)
  if (error) throw error
  const { data } = supabase.storage.from("promotion_images").getPublicUrl(fileName)
  return data.publicUrl
}
