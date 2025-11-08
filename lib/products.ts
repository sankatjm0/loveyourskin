export interface Product {
  id: number
  name: string
  price: number
  category: string
  description: string
  image: string
  stock: number
}

export const products: Product[] = [
  {
    id: 1,
    name: "Minimalist Chair",
    price: 299,
    category: "Furniture",
    description:
      "A sleek and comfortable chair designed with Scandinavian minimalism. Perfect for modern living spaces.",
    image: "modern-minimalist-chair-design.jpg",
    stock: 15,
  },
  {
    id: 2,
    name: "Nordic Lamp",
    price: 149,
    category: "Lighting",
    description: "Elegant pendant light inspired by Nordic design. Warm, ambient lighting for any room.",
    image: "modern-nordic-lamp-lighting.jpg",
    stock: 8,
  },
  {
    id: 3,
    name: "Ceramic Vase",
    price: 89,
    category: "Decor",
    description: "Handcrafted ceramic vase with contemporary design. A statement piece for your interior.",
    image: "modern-ceramic-vase-art.jpg",
    stock: 20,
  },
  {
    id: 4,
    name: "Marble Tray",
    price: 129,
    category: "Accessories",
    description: "Luxurious marble serving tray with metal handles. Combines elegance with functionality.",
    image: "luxury-marble-serving-tray.jpg",
    stock: 12,
  },
  {
    id: 5,
    name: "Wooden Desk Organizer",
    price: 79,
    category: "Office",
    description: "Natural wood organizer to keep your workspace tidy and stylish.",
    image: "/placeholder.svg?key=desk01",
    stock: 10,
  },
  {
    id: 6,
    name: "Glass Storage Containers",
    price: 59,
    category: "Kitchen",
    description: "Set of 3 glass containers with bamboo lids for modern storage solutions.",
    image: "/placeholder.svg?key=glass01",
    stock: 25,
  },
]
