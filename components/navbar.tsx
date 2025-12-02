"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ShoppingCart, User, Package, LogOut } from "lucide-react"
import { Notifications } from "@/components/notifications"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkAuth()

    // Subscribe to auth state changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ]

  const authLinks = user ? [
    { href: "/cart", label: "Cart" },
    { href: "/profile", label: "Profile" },
    { href: "/orders", label: "Orders" },
    { href: "#", label: "Logout", onClick: handleLogout, isButton: true },
  ] : [
    { href: "/cart", label: "Cart" },
    { href: "/auth/login", label: "Login" },
  ]

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <span className="bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent hidden sm:inline">
                LoveYourSkin
              </span>
            </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Links */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && (
              <>
                {/* Cart Icon */}
                <Link
                  href="/cart"
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                </Link>

                {user ? (
                  <>
                    {/* Notifications Component */}
                    <Notifications />

                    {/* Profile Icon */}
                    <Link
                      href="/profile"
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Profile"
                    >
                      <User className="w-5 h-5" />
                    </Link>

                    {/* Logout Icon */}
                    <button
                      onClick={handleLogout}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>

                    {/* User Info */}
                    <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.email}</p>
                        <Link href="/orders" className="text-xs text-muted-foreground hover:text-primary">
                          My Orders
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Login Link */}
                    <Link
                      href="/auth/login"
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Login
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2" />
            {!loading && (
              <>
                {/* Mobile Cart */}
                <Link
                  href="/cart"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                </Link>

                {user ? (
                  <>
                    {/* Mobile Notifications - removed, using Notifications component on desktop only */}

                    {/* Mobile Profile */}
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                    >
                      <User className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>

                    {/* Mobile Orders */}
                    <Link
                      href="/orders"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                    >
                      <Package className="w-5 h-5" />
                      <span>Orders</span>
                    </Link>

                    {/* Mobile Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>

                    {/* Mobile User Info */}
                    <div className="px-3 py-2 border-t border-border mt-2">
                      <p className="text-sm font-medium mb-1">{user.email}</p>
                      <Link href="/orders" className="text-xs text-muted-foreground hover:text-primary">
                        My Orders
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mobile Login */}
                    <Link
                      href="/auth/login"
                      className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Login
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
