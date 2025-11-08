"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { LogOut, Plus, Edit2, Trash2 } from "lucide-react"
import { products as initialProducts } from "@/lib/products"

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState("")
  const [adminPassword] = useState("admin123") // Demo password - change this!
  const [products, setProducts] = useState(initialProducts)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    category: "",
    description: "",
    stock: 0,
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === adminPassword) {
      setIsLoggedIn(true)
      setPassword("")
    } else {
      alert("Invalid password")
    }
  }

  const handleAddProduct = () => {
    setFormData({ name: "", price: 0, category: "", description: "", stock: 0 })
    setEditingId(null)
    setShowForm(true)
  }

  const handleEdit = (id: number) => {
    const product = products.find((p) => p.id === id)
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        stock: product.stock,
      })
      setEditingId(id)
      setShowForm(true)
    }
  }

  const handleSave = () => {
    if (editingId) {
      setProducts(products.map((p) => (p.id === editingId ? { ...p, ...formData } : p)))
    } else {
      setProducts([
        ...products,
        {
          id: Math.max(...products.map((p) => p.id), 0) + 1,
          image: "/placeholder.svg",
          ...formData,
        },
      ])
    }
    setShowForm(false)
  }

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="border border-border rounded-lg p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
              <p className="text-muted-foreground">Enter your password to access the admin panel</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Demo: admin123"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
              >
                Login
              </button>
            </form>

            <div className="text-sm text-muted-foreground text-center">
              Demo credentials: password is <span className="font-mono">admin123</span>
            </div>

            <Link href="/" className="block text-center text-primary hover:underline text-sm">
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm hover:text-primary transition">
              View Store
            </Link>
            <button onClick={() => setIsLoggedIn(false)} className="p-2 hover:bg-muted rounded-lg transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Products</h2>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="border border-border rounded-lg p-6 mb-8 bg-muted/50">
            <h3 className="text-xl font-bold mb-6">{editingId ? "Edit Product" : "New Product"}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Stock"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="md:col-span-2 px-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-border rounded-lg font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-6 py-4 text-left font-semibold">Product</th>
                <th className="px-6 py-4 text-left font-semibold">Category</th>
                <th className="px-6 py-4 text-left font-semibold">Price</th>
                <th className="px-6 py-4 text-left font-semibold">Stock</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition">
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4 font-bold text-primary">${product.price}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleEdit(product.id)} className="p-2 hover:bg-muted rounded-lg transition">
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Demo Note:</strong> This is a demo admin panel with in-memory storage. Changes will reset on page
            refresh. To persist data, connect a database.
          </p>
        </div>
      </div>
    </div>
  )
}
