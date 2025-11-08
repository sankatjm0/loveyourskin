import { createClient } from "@/lib/supabase/server"

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  products: {
    name: string
    price: number
    image_url: string
  }
}

export async function getCartItems() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("carts")
    .select("*, products(name, price, image_url)")
    .eq("user_id", user.id)

  if (error) throw error
  return data as CartItem[]
}

export async function removeFromCart(cartId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("carts").delete().eq("id", cartId)

  if (error) throw error
}

export async function updateCartQuantity(cartId: string, quantity: number) {
  const supabase = await createClient()

  const { error } = await supabase.from("carts").update({ quantity }).eq("id", cartId)

  if (error) throw error
}
