import type React from "react"

export interface ProfileFormData {
  email: string
  full_name: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
}

interface ProfileFormProps {
  data: ProfileFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  isLoading?: boolean
  submitText?: string
}

export function ProfileForm({ data, onChange, onSubmit, isLoading = false, submitText = "Save Profile" }: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={data.email}
            onChange={onChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={data.full_name}
            onChange={onChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <input
            type="tel"
            name="phone"
            value={data.phone}
            onChange={onChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Address</label>
          <input
            type="text"
            name="address"
            value={data.address}
            onChange={onChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">City</label>
          <input
            type="text"
            name="city"
            value={data.city}
            onChange={onChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Postal Code</label>
          <input
            type="text"
            name="postal_code"
            value={data.postal_code}
            onChange={onChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Country</label>
          <input
            type="text"
            name="country"
            value={data.country}
            onChange={onChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {isLoading ? "Saving..." : submitText}
      </button>
    </form>
  )
}
