# Premium E-commerce Store

A modern, fully-functional e-commerce website built with Next.js, React, and Tailwind CSS.

## Features

- **Modern Design**: Clean, minimalist interface inspired by luxury brands
- **Product Catalog**: Browse, search, and filter products by category
- **Shopping Cart**: Add items, manage quantities, calculate totals
- **Checkout**: Complete checkout flow with order summary
- **Admin Dashboard**: Manage products, inventory, and pricing
- **Responsive**: Works perfectly on desktop, tablet, and mobile
- **Fast**: Built with Next.js for optimal performance

## Quick Start

### Local Development
\`\`\`bash
npm install
npm run dev
\`\`\`
Visit `http://localhost:3000`

### Deploy to Vercel (Recommended)
See `DEPLOYMENT.md` for step-by-step instructions.

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx              # Home page
│   ├── products/
│   │   ├── page.tsx          # Products catalog
│   │   └── [id]/page.tsx     # Product details
│   ├── cart/page.tsx         # Shopping cart
│   ├── checkout/page.tsx     # Checkout page
│   ├── admin/page.tsx        # Admin dashboard
│   └── globals.css           # Theme & styles
├── lib/
│   └── products.ts           # Product data
├── hooks/
│   └── use-cart.ts           # Cart management hook
└── public/                   # Static assets
\`\`\`

## Admin Panel

Access the admin dashboard at `/admin`
- **Default Password**: `admin123`
- **Features**: Add/edit/delete products, manage inventory

## Technologies

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS v4
- **State Management**: React Hooks + localStorage
- **Icons**: Lucide React
- **Deployment**: Vercel

## Customization

See `DEPLOYMENT.md` for:
- Changing store name and branding
- Adding your logo and colors
- Connecting a database
- Setting up payment processing

## License

MIT - Feel free to use for your project!
