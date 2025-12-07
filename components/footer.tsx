"use client"

import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
              LoveYourScent
            </h3>
            <p className="text-sm text-muted-foreground">
              Premium perfume for everyone. Care for your smell, love yourself.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com/kdiemmm" className="text-muted-foreground hover:text-primary transition">
                Facebook
              </a>
              <a href="https://instagram.com/sankatjm0" className="text-muted-foreground hover:text-primary transition">
                Instagram
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-primary transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary transition">
                  Best Sellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/faq" className="hover:text-primary transition">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/shipping-info" className="hover:text-primary transition">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="/returns" className="hover:text-primary transition">
                  Returns
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="hover:text-primary transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-border my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} LoveYourSkin. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition">
              Terms of Service
            </a>
            <a href="#" className="hover:text-primary transition">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
