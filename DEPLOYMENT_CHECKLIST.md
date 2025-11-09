# Deployment Checklist

## Before Deployment

### Database Setup (5 minutes)
- [ ] Run `scripts/001_create_tables.sql` in Supabase SQL Editor
- [ ] Verify all 7 tables created successfully
- [ ] Run `scripts/002_setup_admin.sql` with your user UUID as admin
- [ ] Test: Check admin_access table has your user with `is_admin = true`

### VNPay Configuration (10 minutes)
- [ ] Create account at https://sandbox.vnpayment.vn/
- [ ] Copy `VNPAY_TMN_CODE` and `VNPAY_SECRET_KEY`
- [ ] Add to Vercel environment variables:
  \`\`\`
  VNPAY_TMN_CODE=your_value
  VNPAY_SECRET_KEY=your_value
  NEXT_PUBLIC_VNPAY_URL=https://sandbox.vnpayment.vn/paygate
  VNPAY_RETURN_URL=https://your-domain.vercel.app/payment/callback
  \`\`\`

### Environment Variables Verification
- [ ] NEXT_PUBLIC_SUPABASE_URL ✓ (already set)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY ✓ (already set)
- [ ] SUPABASE_SERVICE_ROLE_KEY ✓ (already set)
- [ ] SUPABASE_JWT_SECRET ✓ (already set)
- [ ] VNPAY_TMN_CODE ✓
- [ ] VNPAY_SECRET_KEY ✓
- [ ] NEXT_PUBLIC_VNPAY_URL ✓
- [ ] VNPAY_RETURN_URL ✓

## Local Testing (20 minutes)

### Test User Authentication
- [ ] Sign up at `/auth/sign-up` with test email
- [ ] Verify email confirmation
- [ ] Login with credentials
- [ ] Check profile page

### Test Product Browsing
- [ ] Visit `/products` - see 4 sample products
- [ ] Click on a product - see product details
- [ ] Add product to cart

### Test Shopping & Checkout
- [ ] View cart - see added items
- [ ] Adjust quantities
- [ ] Proceed to checkout
- [ ] Fill in shipping address
- [ ] See order summary

### Test Payment (VNPay Sandbox)
- [ ] Click "Pay with VNPay"
- [ ] Use test card: `9704198526191432198`
- [ ] CVV: `123`, OTP: `123456`
- [ ] Payment should succeed
- [ ] Order status should change to "confirmed"

### Test Admin Features
- [ ] As admin, go to `/admin`
- [ ] See list of orders
- [ ] Update order status (confirm → shipping → delivered)
- [ ] See order details and customer info

### Test User Order Tracking
- [ ] Go to `/orders` as regular user
- [ ] See your orders with status
- [ ] Click on order to see details
- [ ] See payment status

## Deployment to Vercel

1. **Push to GitHub**
   - Commit all changes
   - Push to main branch

2. **Deploy**
   - Go to Vercel dashboard
   - Click "Publish" in v0 or Vercel UI
   - Wait for build to complete

3. **Verify Live Site**
   - [ ] Home page loads
   - [ ] Can browse products
   - [ ] Can add to cart
   - [ ] Can checkout
   - [ ] Admin panel accessible

## Post-Deployment

### Monitor
- [ ] Check Vercel logs for errors
- [ ] Test a complete purchase flow
- [ ] Verify emails are received (if email enabled)

### Performance
- [ ] Page load times acceptable
- [ ] No console errors
- [ ] Payment redirect works

### Security
- [ ] All data protected by RLS
- [ ] Only admins can see admin panel
- [ ] Users can only see their own orders

## Going to Production

When ready for real payments:

1. **Update VNPay**
   - Get production credentials from VNPay
   - Change `NEXT_PUBLIC_VNPAY_URL` to `https://pay.vnpayment.vn/paygate`
   - Update `VNPAY_TMN_CODE` and `VNPAY_SECRET_KEY`
   - Real cards will now be charged

2. **Domain Setup**
   - Add custom domain to Vercel
   - Update `VNPAY_RETURN_URL` to match custom domain
   - Update all references in docs

3. **Backup & Security**
   - Enable Supabase automated backups
   - Setup error tracking (Sentry, etc.)
   - Monitor payment transactions

## Troubleshooting

### Build Fails
- Check that all .env variables are set in Vercel
- Check for import errors in terminal
- Run `pnpm install` locally to verify dependencies

### Payment Fails
- Verify VNPAY credentials are correct
- Check VNPAY_RETURN_URL is exact match to your domain
- Check browser console for errors

### Admin Panel Empty
- Verify admin_access table has `is_admin = true`
- Check orders table has data
- Verify RLS policies allow admin access

### Orders Not Showing
- Check user_id in orders table matches auth user
- Verify RLS policies are enabled
- Check Supabase row security policies
\`\`\`
