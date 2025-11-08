# Quick Start Guide - E-Commerce Store

## Setup (5 minutes)

### 1. Initialize Database
\`\`\`bash
# Run in Supabase Dashboard > SQL Editor
# Copy and paste scripts/001_create_tables.sql
\`\`\`

### 2. Set Environment Variables
In your Vercel project settings, add:
\`\`\`
VNPAY_TMN_CODE=TMNCODE123
VNPAY_HASH_SECRET=YOURSECRETKEY
VNPAY_URL=https://sandbox.vnpayment.vn/paygate
VNPAY_RETURN_URL=http://localhost:3000/payment/callback
\`\`\`

### 3. Deploy
- Click "Publish" in v0
- Deploy to Vercel

## Testing (10 minutes)

### Create Test Account
1. Go to `/auth/sign-up`
2. Create account with test email
3. Confirm email (sandbox mode auto-confirms)

### Make Test Purchase
1. Go to `/products`
2. Click any product → "Add to Cart"
3. Go to `/cart` → "Proceed to Checkout"
4. Fill shipping info
5. Click "Pay with VNPay"
6. Use card: `4111111111111111` / CVV: `123`

### Check Order
1. Go to `/orders`
2. Click order to see tracking
3. Payment status should be "completed"

### Admin Panel
1. Create second test account (admin)
2. In Supabase:
   \`\`\`sql
   INSERT INTO public.admin_access (user_id, is_admin)
   SELECT id, true FROM auth.users WHERE email='admin@example.com';
   \`\`\`
3. Go to `/admin`
4. Update order status to "confirmed"

## Key URLs

- Homepage: `/`
- Products: `/products`
- Product Detail: `/products/[id]`
- Shopping Cart: `/cart`
- Checkout: `/checkout`
- Payment: `/payment/[orderId]`
- Orders: `/orders`
- Order Detail: `/orders/[id]`
- Profile: `/profile`
- Admin: `/admin`
- Login: `/auth/login`
- Sign Up: `/auth/sign-up`

## Customization

### Change Store Name
Edit `app/layout.tsx` and `app/page.tsx` - replace "Premium Store"

### Add Products
Go to Supabase Dashboard > Tables > products > Insert row

### Update Product Images
Replace image URLs in products table

### Modify Status Options
Edit status enum in `scripts/001_create_tables.sql` and re-run

## Support

For issues, check:
1. Supabase connection status in v0 dashboard
2. Browser console for errors
3. VNPay sandbox credentials are correct
4. Email is verified (not just signed up)
