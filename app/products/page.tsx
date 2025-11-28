import Link from "next/link"
import { getProducts } from "@/lib/products"
import { ProductsFilters } from "@/components/products-filters"

export default async function ProductsPage() {
  const productsData = await getProducts()

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Our Collection</h1>

        {/* Client-side filters component */}
        <ProductsFilters products={productsData} />
      </div>
    </div>
  )
}
