import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import ProfileForm from "@/components/profile-form"

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
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-12">My Profile</h1>

        <div className="border border-border rounded-lg p-6 space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Account Email</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          <div className="border-t pt-8">
            <h2 className="text-xl font-bold mb-4">Profile Information</h2>
            <ProfileForm 
              userId={user.id}
              initialData={{
                full_name: profile?.full_name || "",
                phone: profile?.phone || "",
                address: profile?.address || "",
                city: profile?.city || "",
                postal_code: profile?.postal_code || "",
                country: profile?.country || "",
              }}
            />
          </div>

          <form action={handleLogout} className="border-t pt-8">
            <button 
              type="submit"
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
