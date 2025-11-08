import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const handleLogout = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight text-foreground">
            Premium Store
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/products" className="text-sm hover:text-primary transition">
              Products
            </Link>
            <Link href="/cart" className="text-sm hover:text-primary transition">
              Cart
            </Link>
            <Link href="/orders" className="text-sm hover:text-primary transition">
              Orders
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-12">My Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Full Name</p>
              <p className="font-semibold">{profile?.full_name || "Not set"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Phone</p>
              <p className="font-semibold">{profile?.phone || "Not set"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Address</p>
              <p className="font-semibold">{profile?.address || "Not set"}</p>
            </div>

            <form action={handleLogout}>
              <Button type="submit" variant="destructive" className="w-full">
                Logout
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
