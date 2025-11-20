import { createClient } from "@/lib/supabase/server"

export interface Product {
  id: string
  name: string
  price: number
  category: string
  description: string
  details?: string
  image_url: string
  image_urls?: string[] // Multiple images
  stock: number
}

// Local fallback products for static generation
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Minimalist Chair",
    price: 299,
    category: "Furniture",
    description: "A sleek and modern chair perfect for any contemporary space",
    image_url: "/modern-minimalist-chair-design.jpg",
    stock: 10,
  },
  {
    id: "2",
    name: "Nordic Lamp",
    price: 149,
    category: "Lighting",
    description: "Elegant Nordic-inspired lighting solution for your home",
    image_url: "/modern-nordic-lamp-lighting.jpg",
    stock: 15,
  },
  {
    id: "3",
    name: "Ceramic Vase",
    price: 89,
    category: "Decor",
    description: "Beautiful handcrafted ceramic vase for your collection",
    image_url: "/modern-ceramic-vase-art.jpg",
    stock: 8,
  },
  {
    id: "4",
    name: "Marble Tray",
    price: 129,
    category: "Accessories",
    description: "Luxurious marble tray for serving and display",
    image_url: "/luxury-marble-serving-tray.jpg",
    stock: 12,
  },
]

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return data || FALLBACK_PRODUCTS
  } catch {
    // Return fallback during build or if Supabase is unavailable
    return FALLBACK_PRODUCTS
  }
}

export async function getProductById(id: string): Promise<Product> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()
    if (error) throw error
    return data
  } catch {
    // Return fallback product if not found
    const product = FALLBACK_PRODUCTS.find((p) => p.id === id)
    if (!product) throw new Error("Product not found")
    return product
  }
}
