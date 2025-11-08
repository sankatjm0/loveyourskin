# Deployment Guide - Premium Store

Your e-commerce website is ready to deploy! Follow these steps to launch on Vercel (recommended) or other platforms.

## Option 1: Deploy to Vercel (Recommended & Free)

Vercel is the best choice for Next.js applications. It's free to start and has built-in optimizations.

### Step 1: Push to GitHub
1. Click the GitHub icon in the top right of v0
2. Follow the prompts to create a new repository
3. Your code will be pushed to GitHub automatically

### Step 2: Import to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub (if you haven't already)
3. Click "New Project"
4. Select your repository
5. Click "Import"
6. Click "Deploy"

Your site will be live in 2-3 minutes!

### Step 3: Get Your Live URL
After deployment, Vercel will give you a URL like: `https://your-store.vercel.app`

---

## Option 2: Export & Self-Host

### Prerequisites
- Node.js 18+ installed
- A server (VPS, shared hosting, etc.)

### Steps
1. In v0, click the three dots → "Download ZIP"
2. Extract the ZIP file
3. Open terminal in the project folder
4. Run:
   \`\`\`bash
   npm install
   npm run build
   npm start
   \`\`\`
5. Your site will run at `http://localhost:3000`

To deploy to a server:
1. Upload files to your server
2. Run `npm install && npm run build && npm start`
3. Use a process manager like PM2 to keep it running

---

## Features & How to Use

### Store Features
- **Home Page**: Hero section with featured products
- **Products Page**: Browse all products with search & filters
- **Product Details**: View item details and add to cart
- **Shopping Cart**: Manage items, quantities, and checkout
- **Checkout**: Demo payment page (not real payments)
- **Admin Dashboard**: Manage products (password: `admin123`)

### Access Points
- **Store**: `https://your-domain.com`
- **Products**: `https://your-domain.com/products`
- **Cart**: `https://your-domain.com/cart`
- **Admin**: `https://your-domain.com/admin` (password: `admin123`)

---

## Customization Guide

### Change Store Name
1. Edit `app/layout.tsx` - update the title in metadata
2. Edit `app/page.tsx` - change "Premium Store" to your name
3. Edit all page files and replace "Premium Store" with your store name

### Add Your Logo
1. Create `public/logo.png` (replace with your logo)
2. In files, update: `<h1>Your Store Name</h1>` to include your logo

### Customize Colors
1. Open `app/globals.css`
2. Modify the color values in the `:root` section
3. Colors use OKLCH format - easier to adjust than traditional hex colors

### Change Products
1. Go to Admin Dashboard (`/admin`)
2. Login with password `admin123`
3. Add/edit/delete products
4. Note: Changes reset on page refresh (need database for persistence)

---

## Connecting a Database (Optional - For Real E-commerce)

To make this production-ready, connect a database:

### Option A: Supabase (Easy, Free tier available)
1. Go to [https://supabase.com](https://supabase.com)
2. Create an account and new project
3. Follow their setup guide
4. Update `lib/products.ts` to fetch from Supabase

### Option B: MongoDB (Popular, Free tier)
1. Go to [https://mongodb.com](https://mongodb.com)
2. Create a free cluster
3. Use Mongoose library to connect

### Option C: PostgreSQL (Professional)
1. Use Neon ([https://neon.tech](https://neon.tech)) for easy PostgreSQL hosting
2. Update your queries to use the database

---

## Payment Integration (Currently Demo)

The checkout page is currently a demo. To accept real payments:

### Stripe Integration (Recommended)
1. Sign up at [https://stripe.com](https://stripe.com)
2. Get API keys from dashboard
3. Install Stripe library: `npm install stripe`
4. Update checkout page to use Stripe Elements
5. See [Stripe Documentation](https://stripe.com/docs) for implementation

---

## Next Steps

1. Deploy to Vercel (takes 5 minutes)
2. Test all features on live URL
3. Add real products and images
4. Connect a database for persistence
5. Set up Stripe or PayPal for real payments
6. Add your branding (logo, colors, name)
7. Configure custom domain

---

## Troubleshooting

### Issue: "Module not found" error
**Solution**: Run `npm install` in terminal

### Issue: Images not showing
**Solution**: 
- Ensure images are in `public/` folder
- Update image paths in code

### Issue: Cart data lost on refresh
**Solution**: This is normal for the demo. Use a database to persist data.

### Issue: Admin changes don't save
**Solution**: Same as above - need a database for persistence.

---

## Support

- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Tailwind CSS**: [https://tailwindcss.com](https://tailwindcss.com)

---

**Your store is ready! Deploy now and start selling!**
