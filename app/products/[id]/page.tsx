// /app/product/[id]/page.tsx
import { getProductById, getProducts } from "@/lib/products"
import { AddToCartButton } from "@/components/add-to-cart-button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getActivePromotionForProduct } from "@/lib/promotions" // optional, if you want server-side fetch

export async function generateStaticParams() {
  try {
    const products = await getProducts()
    return products.map((product) => ({ id: product.id }))
  } catch {
    return []
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { id } = await params
  try {
    const product = await getProductById(id)
    // Optional: fetch active promotion for product server-side
    const promo = await getActivePromotionForProduct(product.id)
    if (promo) {
      // attach discount_percent on product for UI usage
      ;(product as any).discount_percent = promo.discount_percent
    }
    const finalPrice = (product as any).discount_percent ? Math.round((product.price * (1 - (product as any).discount_percent / 100)) * 100) / 100 : product.price

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight">Premium Store</Link>
            <Link href="/cart" className="px-4 py-2 hover:bg-muted rounded-lg transition">Cart</Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link href="/products" className="text-sm hover:text-primary transition flex items-center gap-2 mb-8"><ChevronLeft size={16} /> Back to Products</Link>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="bg-muted rounded-lg overflow-hidden aspect-square">
              <img src={product.image_url || "/placeholder.svg?height=600&width=600&query=product"} alt={product.name} className="w-full h-full object-cover" />
            </div>

            {/* Product Details */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wide">{product.category}</p>
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

                {/* Price display with promotion */}
                <div className="flex items-baseline gap-4 mb-8">
                  {(product as any).discount_percent ? (
                    <>
                      <p className="text-3xl font-bold text-primary">${finalPrice}</p>
                      <p className="text-lg line-through text-muted-foreground">{product.price}VND</p>
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">-{(product as any).discount_percent}%</span>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-primary">{product.price}VND</p>
                  )}

                  <p className={`text-sm px-3 py-1 rounded ${product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </p>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed mb-8">{product.description}</p>

                {/* Product Features */}
                <div className="space-y-4 mb-12">
                  <h3 className="font-semibold text-lg">Features</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span>Premium quality materials</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span>Modern minimalist design</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span>Eco-friendly production</li>
                    <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span>Free shipping on orders over $100</li>
                  </ul>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="border-t border-border pt-8">
                <AddToCartButton productId={product.id} productName={product.name} productPrice={finalPrice} productImage={product.image_url} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/products" className="text-sm hover:text-primary transition flex items-center gap-2"><ChevronLeft size={16} /> Back to Products</Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link href="/products" className="text-primary hover:underline">Return to catalog</Link>
        </div>
      </div>
    )
  }
}
