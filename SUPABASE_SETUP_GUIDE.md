# Supabase Setup Guide for E-Commerce Platform

## Step 1: Run Database Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `scripts/001_create_tables.sql`
6. Click **Run**

If successful, you should see all tables created with RLS policies enabled.

## Step 2: Setup Admin User

1. In Supabase dashboard, go to **Authentication → Users**
2. Find your user account and copy the **UUID** (ID column)
3. Go back to **SQL Editor** and click **New Query**
4. Replace `'admin-user-id-here'` in `scripts/002_setup_admin.sql` with your UUID
5. Copy and paste the modified script
6. Click **Run**

Example:
\`\`\`sql
INSERT INTO public.admin_access (user_id, is_admin)
VALUES ('550e8400-e29b-41d4-a716-446655440000', true)  -- Replace with your UUID
ON CONFLICT (user_id) DO UPDATE
SET is_admin = true;
\`\`\`

## Step 3: Configure Environment Variables

Your Vercel environment variables are already set:
- `NEXT_PUBLIC_SUPABASE_URL` ✓
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓
- `SUPABASE_JWT_SECRET` ✓

## Step 4: Configure VNPay

Add these to Vercel environment variables in **Settings → Environment Variables**:

\`\`\`
VNPAY_TMN_CODE=your_merchant_code
VNPAY_SECRET_KEY=your_secret_key
NEXT_PUBLIC_VNPAY_URL=https://sandbox.vnpayment.vn/paygate
VNPAY_RETURN_URL=https://your-domain.vercel.app/payment/callback
\`\`\`

### Get VNPay Credentials:
1. Go to https://sandbox.vnpayment.vn/
2. Register for a merchant account
3. Login to dashboard
4. Go to **System → Merchant Management**
5. Find your merchant and copy **TMN Code** and **Secret Key**

### Test VNPay Payment:
- Card: `9704198526191432198`
- CVV: `123`
- OTP: `123456`
- Date: Any future date (e.g., 12/26)

## Step 5: Test the Application

1. **Sign Up**: Create a new account at `/auth/sign-up`
2. **Browse Products**: Visit `/products` to see the catalog
3. **Add to Cart**: Add items to your cart
4. **Checkout**: Go to `/checkout` and complete the order
5. **Payment**: Click "Pay with VNPay" to test payment
6. **Admin Panel**: Go to `/admin` to manage orders (if you're an admin)

## Database Schema Overview

### Tables Created:
- **profiles** - User profile information
- **products** - Product catalog
- **carts** - Shopping cart items
- **orders** - Customer orders
- **order_items** - Items in each order
- **payments** - Payment transactions
- **admin_access** - Admin user management

### Key Features:
- Row Level Security (RLS) - Data is protected by user
- Auto-profile creation on signup
- Payment tracking with VNPay
- Admin order management
- Product inventory tracking

## Troubleshooting

### "Multiple GoTrueClient instances" warning
This is normal in development. Not an error, just a warning.

### Orders not showing in admin panel
Make sure you've:
1. Run `002_setup_admin.sql` with your user UUID
2. Verified the admin_access table has `is_admin = true` for your user

### Payment fails after redirect
Check:
1. `VNPAY_TMN_CODE` and `VNPAY_SECRET_KEY` are correct
2. `VNPAY_RETURN_URL` matches your domain exactly
3. You're using sandbox URL for testing

### Can't see own orders
Make sure the orders table has the `user_id` set correctly to your user's ID.

## Deployment to Production

When ready to go live:

1. **Update VNPay to Production**:
   - Change `NEXT_PUBLIC_VNPAY_URL` to `https://pay.vnpayment.vn/paygate`
   - Get production TMN Code and Secret Key from VNPay
   - Update `VNPAY_TMN_CODE` and `VNPAY_SECRET_KEY`
   - Update `VNPAY_RETURN_URL` to your live domain

2. **Enable RLS in Supabase**:
   - All RLS policies are already enabled
   - Test thoroughly before production

3. **Backup Data**:
   - Enable backups in Supabase dashboard
   - Set up automated backups

## Support

For issues:
- Supabase docs: https://supabase.com/docs
- VNPay docs: https://sandbox.vnpayment.vn/ (check documentation)
- Next.js docs: https://nextjs.org/docs
