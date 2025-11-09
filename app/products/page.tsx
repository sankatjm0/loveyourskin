import Link from "next/link"
import { getProducts } from "@/lib/products"
import { ProductsFilters } from "@/components/products-filters"

export default async function ProductsPage() {
  const productsData = await getProducts()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Premium Store
          </Link>
          <Link href="/cart" className="px-4 py-2 hover:bg-muted rounded-lg transition">
            Cart
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Our Collection</h1>

        {/* Client-side filters component */}
        <ProductsFilters products={productsData} />
      </div>
    </div>
  )
}
