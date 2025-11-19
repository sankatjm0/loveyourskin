# Copilot Instructions for loveyourskin

## Project Overview
**loveyourskin** is a Next.js 16 e-commerce platform with Supabase backend, focused on modern UI/UX using React 19, Radix UI components, and Tailwind CSS v4. The project is divided into public storefronts (products, cart, checkout) and admin dashboard (product/order/promotion management).

## Architecture & Data Flow

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, PostCSS, shadcn/ui (Radix-based)
- **State**: React Hooks + localStorage (cart), Supabase Realtime (admin)
- **Backend**: Supabase (Auth, Database, Storage)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

### Key Data Models
**Products**: `id, name, price, category, description, image_url, stock, created_at`
- Single image per product (stored in `product_images` bucket)
- Categories are enumerated strings ("skincare", "makeup", etc.)

**Promotions**: Two-mode system:
- `manual`: Admin-controlled, immediate effect
- `auto`: Time-based (start_at, end_at)
- Connected to products via `promotion_products` (many-to-many with `discount_percent`)
- Slides stored in `promotion_images` bucket → `promotion_slides` table

**Orders**: Complete flow from cart → orders → order_items
- Status workflow: pending → confirmed → shipping → delivered (or rejected at any step)
- Payment status: separate field for payment method tracking

**Authentication**: Supabase Auth via SSR pattern
- Server client (`@supabase/ssr`) in `lib/supabase/server.ts`
- Browser client singleton in `lib/supabase/client.ts`
- Middleware enforces auth protection (except `/`, `/auth/**`, `/products/**`)

### Supabase Storage Buckets
- **product_images**: Single product image (public)
- **promotion_images**: Promotion slides (public)
- Both use path naming: `products/{timestamp}.ext` and `promotions/{timestamp}.ext`
- **Public URLs**: `https://{PROJECT}.supabase.co/storage/v1/object/public/{bucket}/{path}`

## Critical Workflows

### Adding/Editing Products
Located in `app/admin/page.tsx` (Products tab):
1. Form state: `productForm` + `imageFile` state
2. On save: upload image via `uploadImage()` → get public URL → insert/update DB
3. **Convention**: Always set `imageFile` to null after successful upload
4. **File naming**: `products/{timestamp}.{ext}` pattern required for consistency

### Promotion System
Two independent flows:
1. **Promotion metadata + products**: `handleCreatePromotion()` creates promotion row, then `promotion_products` entries with discount percentages
2. **Promotion slides**: Uploaded after promotion creation, stored in `promotion_slides` table with `image_url` field
   - **Bug**: Currently truncating image URLs—use full result from `getPublicUrl()`

### Admin Dashboard Realtime
`loadAllData()` in admin page:
- Fetches: products, users, orders, promotions
- Subscribes to postgres_changes on orders & order_items
- **Pattern**: Unsubscribe old channel → create new → call `loadAllData()` on change
- **Do not** add subscriptions in individual event handlers (causes memory leaks)

### Cart Management
`hooks/use-cart.ts` provides:
- `addToCart(productId, quantity)` - creates cart row or updates qty
- `removeFromCart(cartId)` - soft delete via DB
- Uses Supabase RLS: users can only modify their own cart rows
- **No client-side state** - single source of truth is DB

## Project-Specific Patterns

### Component Structure
- **UI components**: `components/ui/` - Radix-based primitives (button, input, card, etc.)
- **Feature components**: `components/{feature}.tsx` - e.g., `add-to-cart-button.tsx`, `payment-client.tsx`
- **Admin components**: `components/admin/` - e.g., `order-status-dialog.tsx`
- **Modal pattern**: `components/Modal.tsx` accepts `onClose` callback, renders children with backdrop

### Form Patterns
- **Controlled inputs** with direct `onChange` handlers (no React Hook Form in admin yet)
- Zod used in checkout (`app/checkout/page.tsx`) for payment validation
- **VND currency** - prices stored as numbers, formatted with `.toFixed(2)` + "VND" suffix

### Status & Color Coding
Products Tab:
- No status colors (simple grid)

Orders Tab:
- **Status colors**: `getStatusColor()` function (pending=yellow, confirmed=blue, shipping=purple, delivered=green, rejected=red)
- **State transitions**: `allowedTransitions` object enforces workflow rules
- Vietnamese confirmation text: "Bạn có chắc muốn huỷ đơn này?" for rejection

Promotions Tab:
- Manual/Auto radio buttons control date field visibility
- Product selection is checkbox-based with discount % input

### Image Handling
**Consistent pattern across the app**:
```typescript
// 1. Upload file to Supabase Storage
const fileName = `bucket-path/${Date.now()}_${randomId}.${ext}` // randomId prevents collisions
const { error } = await supabase.storage.from("bucket").upload(fileName, file)

// 2. Get public URL IMMEDIATELY after upload (do not re-fetch)
const { data: { publicUrl } } = supabase.storage.from("bucket").getPublicUrl(fileName)

// 3. Store URL in DB
await supabase.from("table").insert({ image_url: publicUrl })
```
**Note**: Use `Date.now()` + `Math.random().toString(36)` to avoid overwriting files

## File References for Common Tasks

| Task | File |
|------|------|
| Add new product API | `lib/products.ts` |
| Promotion logic | `lib/promotions.ts` + `lib/orders.ts` |
| Cart operations | `lib/cart.ts` + `hooks/use-cart.ts` |
| Auth middleware | `middleware.ts` + `lib/supabase/middleware.ts` |
| Admin dashboard | `app/admin/page.tsx` |
| Product display | `app/products/page.tsx` + `app/products/[id]/page.tsx` |
| Checkout flow | `app/checkout/page.tsx` |
| Payment integration | `lib/vnpay.ts` + `components/payment-client.tsx` |
| Database queries | `lib/{admin,orders,products,promotions}.ts` |

## Development Commands

```bash
npm run dev      # Start dev server on :3000
npm run build    # Next.js build
npm run start    # Production server
npm run lint     # ESLint check
```

## Common Pitfalls & Solutions

| Issue | Fix |
|-------|-----|
| Image URL truncated in promo slides | Check `getPublicUrl()` return value - don't concatenate strings manually |
| Cart not updating after add | Ensure `createClient()` is called inside async function (browser client) |
| Admin realtime not firing | Verify `unsubscribe()` called before creating new channel subscription |
| Category not showing on product | Category is stored as string, not lookup—ensure it matches exactly |
| Order status stuck | Check `allowedTransitions` - may need to update workflow rules |
| Images not loading after upload | Verify bucket is **public** (not private); check storage RLS policies |

## Next Steps When Adding Features

1. **Database changes**: Create SQL migration in `scripts/` with numbered prefix
2. **New admin feature**: Add to appropriate tab state in `app/admin/page.tsx`
3. **New public feature**: Create in `app/` with corresponding `lib/` helper functions
4. **Storage uploads**: Always follow image handling pattern above
5. **Auth-required pages**: Wrap with `createClient()` in client components; use middleware for redirect

## Vietnamese Notes
- Dates use `.toLocaleDateString()` for display
- Currency: always append "VND" (not "$")
- Toast/alerts sometimes use Vietnamese: "Bạn có chắc..." (do you want to confirm)
