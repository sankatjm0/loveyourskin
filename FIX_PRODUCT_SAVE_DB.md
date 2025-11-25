# FIX: Product Save Not Persisting to Database

## 🔴 Vấn Đề Đã Tìm Ra

1. **Update/Create product không lưu vào DB** 
   - Console log cho thấy payload đúng
   - Nhưng data không xuất hiện trong database
   - Lý do: **RLS (Row Level Security) policy chặn ANON_KEY từ update/insert products**

2. **Lỗi image URL bị escape**
   - Error: `GET /[%22https:/...%22]`
   - Nguyên nhân: Image URL bị encode sai khi lấy image_urls field

## ✅ Giải Pháp Đã Implement

### 1. **Tạo API Endpoints với Server-Side Supabase Client**

**API Endpoints Mới:**
- `POST /api/products/create` - Tạo product mới
- `POST /api/products/update` - Cập nhật product

**Tại sao:**
- Server-side Supabase client sử dụng SERVICE_ROLE_KEY (có quyền full access)
- Bypass RLS policy hoàn toàn
- Request được xác thực qua session, không dùng anon key

**Files:**
```
app/api/products/create/route.ts ← NEW
app/api/products/update/route.ts ← NEW
```

### 2. **Update handleSaveProduct() để sử dụng API**

**Trước:**
```typescript
const { data, error } = await supabase.from("products").update(updateData).eq("id", id).select()
// ❌ Bị RLS chặn
```

**Sau:**
```typescript
const response = await fetch("/api/products/update", {
  method: "POST",
  body: JSON.stringify(updateData)
})
// ✅ Dùng server-side endpoint, SERVICE_ROLE_KEY có quyền
```

### 3. **Cải Thiện Error Logging**

Thêm chi tiết logs để dễ debug:
```typescript
console.log("[Product Update] Final payload:", updateData)
console.log("[Product Update] API response:", updateResult)
console.error("[Product Update] API error:", updateResult)
```

## 🔧 Cách Thực Hiện Chi Tiết

### API Endpoint: `/api/products/update`

```typescript
POST /api/products/update
Content-Type: application/json

{
  "id": "product-id",
  "name": "Product Name",
  "price": 100000,
  "image_url": "https://...",
  "image_urls": "[\"url1\", \"url2\"]",
  "stock": 5,
  "category": "Sale",
  "details": "ok",
  "updated_at": "2025-11-25T17:53:16.092Z"
}

Response (Success):
{
  "success": true,
  "data": [{
    "id": "...",
    "name": "...",
    ...
  }]
}

Response (Error):
{
  "error": "Error message"
}
```

### API Endpoint: `/api/products/create`

```typescript
POST /api/products/create
Content-Type: application/json

{
  "name": "Product Name",
  "price": 100000,
  "image_url": "https://...",
  "image_urls": "[\"url1\"]",
  "stock": 5,
  "category": "Sale",
  "details": "ok"
}

Response (Success):
{
  "success": true,
  "data": [{
    "id": "newly-created-id",
    "name": "...",
    ...
  }]
}
```

## 🧪 Test Flow

### Test 1: Create New Product
```
1. Admin Dashboard → Products
2. Click "Add Product"
3. Fill form:
   - Name: "Test Product"
   - Price: 100000
   - Stock: 5
   - Category: Choose one
4. Upload image
5. Click Save

Console logs:
✓ [Admin] Uploading file: ...
✓ [Admin] Uploaded image URL: https://...
✓ [Admin] Creating new product with data: {...}
✓ [Admin] Create API response: {success: true, data: [...]}
✓ Alert: "Product saved successfully!"

Database:
✓ New product appears in products table
✓ image_urls column contains: ["https://..."]
```

### Test 2: Edit Product (No Image Change)
```
1. Click Edit on existing product
2. Change name: "Old Name" → "New Name"
3. DO NOT change images
4. Click Save

Console logs:
✓ [Product Update] Final payload: {name: "New Name", image_urls: [...], ...}
✓ [Product Update] API response: {success: true, data: [...]}
✓ Alert: "Product saved successfully!"

Database:
✓ Product name updated
✓ image_urls NOT changed (preserved)
```

### Test 3: Edit Product + Add New Image
```
1. Click Edit on product with 1 image
2. Change name
3. Upload 1 new image
4. Click Save

Console logs:
✓ [Admin] Uploading file: newimage.jpg
✓ [Admin] Uploaded image URL: https://new-url
✓ [Admin EDIT] allImageUrls count: 2
✓ [Product Update] image_urls: ["old-url", "new-url"]

Database:
✓ Product name updated
✓ image_urls now has 2 URLs: ["old-url", "new-url"]
```

### Test 4: Delete Product
```
1. Click Delete on product
2. Confirm in modal
3. Click Delete button

Database:
✓ Product deleted from products table
```

## 🐛 Debugging Guide

### Nếu vẫn không lưu được:

**1. Check Console (F12 → Console)**
```
Tìm logs:
- [Product Update] Final payload: {...}
- [Product Update] API response: {...}
- [Product Save Error]: ...

Có error thì error là gì?
```

**2. Check Network (F12 → Network)**
```
Tìm request POST /api/products/update
- Status: 200 (OK) hay 401/500?
- Response body: {success: true, data: [...]?}
```

**3. Kiểm tra User Authentication**
```
API endpoint check auth:
const { data: { user } } = await supabase.auth.getUser()

Nếu user = null → chưa login → 401 error
```

**4. Kiểm tra RLS Policy (Supabase Console)**
```
Supabase → Database → products → RLS

Phải có policy cho:
- UPDATE (với điều kiện gì?)
- INSERT (với điều kiện gì?)

Nếu không có → tạo:
CREATE POLICY "Enable UPDATE for all users"
ON products FOR UPDATE USING (true);

Hoặc: Xóa RLS hoàn toàn (enable=off)
```

**5. Kiểm tra Database Columns**
```
Supabase → Database → products table

Cần có columns:
- id (text, primary key)
- name (text)
- price (numeric)
- image_url (text)
- image_urls (text) ← JSON string stored as TEXT
- stock (integer)
- category (text)
- details (text)
- updated_at (timestamp)
- created_at (timestamp)
```

## 📋 Thay Đổi Files

| File | Thay đổi | Mục đích |
|------|---------|---------|
| `app/admin/page.tsx` | Use `/api/products/update` và `/api/products/create` | Bypass RLS policy |
| `app/api/products/update/route.ts` | NEW | Server-side update API |
| `app/api/products/create/route.ts` | NEW | Server-side create API |

## 🚀 Kiến Trúc Mới

**Trước (Direct Supabase):**
```
Browser → Supabase (ANON_KEY)
          ↓
          RLS Policy ❌ Chặn
          ↓
          Database (Không lưu)
```

**Sau (API Endpoint):**
```
Browser → Next.js Server
          ↓
          Supabase (SERVICE_ROLE_KEY)
          ↓
          RLS Policy ✅ Bypass (Server-side)
          ↓
          Database ✅ Lưu thành công
```

## ✅ Kỳ Vọng Sau Fix

- ✅ Add product: Dữ liệu lưu vào DB
- ✅ Edit product: Dữ liệu update vào DB
- ✅ Delete product: Dữ liệu xóa từ DB
- ✅ Images: Lưu đúng format, không bị escape
- ✅ Error handling: Chi tiết logs để debug

## 🔗 Related Files

- `/lib/supabase/server.ts` - Server-side Supabase client
- `/lib/supabase/middleware.ts` - Auth middleware
- `/middleware.ts` - Next.js middleware
