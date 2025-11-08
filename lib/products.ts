import { createClient } from "@/lib/supabase/server"

export interface Product {
  id: string
  name: string
  price: number
  category: string
  description: string
  image_url: string
  stock: number
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProductById(id: string): Promise<Product> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error) throw error
  return data
}
