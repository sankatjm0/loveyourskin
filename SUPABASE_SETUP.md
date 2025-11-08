# Supabase E-Commerce Setup Guide

## Overview

This guide walks you through setting up your Supabase-powered e-commerce store with authentication, products, shopping cart, VNPay payment integration, and admin panel.

## Prerequisites

- Supabase project created and connected
- All environment variables configured (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
- Node.js 18+ installed
- VNPay merchant account (sandbox or production)

## Step 1: Initialize Database Schema

Run the database migration script to create all necessary tables:

1. Go to the Scripts section in your v0 project
2. Run `scripts/001_create_tables.sql`

This creates:
- **profiles** - User profile information
- **products** - Product catalog
- **carts** - Shopping cart items
- **orders** - Order records
- **order_items** - Items in each order
- **admin_access** - Admin user management
- **payments** - Payment transaction records

## Step 2: Configure VNPay

### For Sandbox Testing:

1. Get VNPay test credentials:
   - TMN Code: `TMNCODE123` (test)
   - Hash Secret: `YOURSECRETKEY` (test)

2. Set environment variables in your Vercel project:
   \`\`\`
   VNPAY_TMN_CODE=TMNCODE123
   VNPAY_HASH_SECRET=YOURSECRETKEY
   VNPAY_URL=https://sandbox.vnpayment.vn/paygate
   VNPAY_RETURN_URL=http://localhost:3000/payment/callback
   \`\`\`

3. For production, update with your actual VNPay merchant credentials

### Test Payment:

- Card Number: `4111111111111111`
- CVV: `123`
- Expiry: Any valid future date

## Step 3: Setup Admin Access

1. Create an admin user account through the sign-up page
2. Find your user ID:
   - Go to Supabase Dashboard
   - Auth → Users
   - Copy the UUID of your admin user

3. Create admin access:
   \`\`\`sql
   INSERT INTO public.admin_access (user_id, is_admin)
   VALUES ('YOUR_USER_ID_HERE', true);
   \`\`\`

4. Access admin panel at `/admin`

## Features Overview

### User Features

**Authentication**
- Email/password signup and login
- Auto-profile creation on signup
- Secure session management

**Shopping**
- Browse all products (`/products`)
- View product details and stock
- Add items to cart (`/cart`)
- Update quantities and remove items

**Checkout**
- Enter shipping address
- Review order summary
- Proceed to payment

**Payment**
- VNPay integration for secure payments
- Real-time payment status updates
- Payment confirmation via email

**Order Tracking**
- View all orders (`/orders`)
- Track order status in real-time:
  - Pending (awaiting confirmation)
  - Confirmed (payment verified)
  - Shipping (in transit)
  - Delivered (completed)
- View order details and items
- Access payment information

**User Profile**
- View account information
- Manage profile details
- Logout functionality

### Admin Features

**Dashboard** (`/admin`)
- Real-time order statistics
- Total orders, revenue tracking
- Status breakdown (pending, confirmed, shipping, delivered)

**Order Management**
- View all customer orders
- Update order status:
  - Pending → Confirmed (approve order)
  - Confirmed → Shipping (mark as shipped)
  - Shipping → Delivered (mark delivered)
  - Any status → Rejected (reject order)
- View customer details and shipping address
- See payment status

**Payment Tracking**
- Monitor payment status per order
- Track VNPay transaction IDs
- View completed vs failed payments

## Database Schema

### profiles
- `id` - User ID (FK to auth.users)
- `email` - User email
- `full_name` - User's name
- `phone` - Contact phone
- `address` - Street address
- `city` - City
- `postal_code` - Postal code
- `country` - Country

### products
- `id` - UUID
- `name` - Product name
- `description` - Product details
- `price` - Price in VND
- `category` - Product category
- `image_url` - Product image
- `stock` - Available quantity

### carts
- `id` - UUID
- `user_id` - FK to auth.users
- `product_id` - FK to products
- `quantity` - Item quantity

### orders
- `id` - UUID
- `user_id` - FK to auth.users
- `order_number` - Unique order ID
- `status` - pending|confirmed|rejected|shipping|delivered
- `payment_status` - pending|completed|failed|refunded
- `total_amount` - Order total
- `transaction_id` - VNPay transaction ID
- `shipping_*` - Shipping details (address, city, postal_code, country)

### order_items
- `id` - UUID
- `order_id` - FK to orders
- `product_id` - FK to products
- `quantity` - Item quantity
- `price` - Price at time of purchase

### admin_access
- `id` - UUID
- `user_id` - FK to auth.users
- `is_admin` - Boolean admin flag

### payments
- `id` - UUID
- `order_id` - FK to orders
- `user_id` - FK to auth.users
- `amount` - Payment amount
- `vnpay_transaction_id` - VNPay txn ID
- `status` - pending|completed|failed|cancelled
- `response_data` - Full VNPay response

## API Endpoints

### Authentication
- `POST /auth/sign-up` - User registration
- `POST /auth/login` - User login
- `GET /auth/user` - Get current user

### Products
- `GET /api/products` - All products
- `GET /api/products/[id]` - Product details
- `GET /api/products?category=[name]` - Filter by category

### Cart
- `GET /cart` - View cart
- `POST /carts` - Add to cart
- `PUT /carts/[id]` - Update quantity
- `DELETE /carts/[id]` - Remove from cart

### Orders
- `POST /orders` - Create order
- `GET /orders` - User's orders
- `GET /orders/[id]` - Order details
- `GET /orders/[id]/items` - Order items

### Payments
- `GET /payment/[id]` - Payment page
- `GET /payment/callback` - VNPay callback

### Admin
- `GET /admin` - Dashboard
- `PUT /orders/[id]/status` - Update status
- `PUT /orders/[id]/payment-status` - Update payment status

## Testing Workflow

1. **Sign Up**
   - Go to `/auth/sign-up`
   - Create account
   - Confirm email (check inbox)

2. **Browse Products**
   - Go to `/products`
   - Click on product to view details

3. **Shopping**
   - Add items to cart
   - Go to `/cart`
   - Modify quantities

4. **Checkout**
   - Click "Proceed to Checkout"
   - Enter shipping address
   - Click "Continue to Payment"

5. **Payment**
   - Click "Pay with VNPay"
   - Use test card: `4111111111111111`
   - Complete payment

6. **Order Tracking**
   - Go to `/orders`
   - Click order to view details
   - Admin updates status

7. **Admin Panel**
   - Go to `/admin`
   - View dashboard stats
   - Click "Update Status" on orders

## Security

- Row Level Security (RLS) enabled on all user-related tables
- Users can only access their own data
- Admin-only endpoints protected
- VNPay responses verified with HMAC-SHA512
- Secure password hashing via Supabase Auth
- HTTPS required for production

## Troubleshooting

**Order not created after checkout:**
- Ensure user is authenticated
- Check browser console for errors
- Verify Supabase connection

**Payment gateway errors:**
- Check VNPay credentials in environment variables
- Verify return URL is correctly set
- Test with sandbox credentials first

**Cart items not saving:**
- Ensure user is logged in
- Check browser storage is enabled
- Verify product exists in database

**Admin can't access dashboard:**
- Confirm user is in admin_access table with is_admin=true
- Try logging out and back in
- Check browser console for redirect

## Next Steps

1. Add more products via Supabase dashboard or API
2. Customize product images
3. Setup email notifications for orders
4. Add order tracking by email
5. Implement order refunds
6. Add product reviews and ratings
7. Setup inventory management
8. Add customer support chat
