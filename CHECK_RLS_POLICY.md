# Check RLS Policy Status

## Bước 1: Vào Supabase Console
https://app.supabase.com

## Bước 2: Chọn Project
→ loveyourskin (hoặc tên project của bạn)

## Bước 3: Kiểm tra RLS

### Cách 1: Supabase UI
1. Database → Tables
2. Chọn table "products"
3. Tab "RLS Policies" (phía trên)

**Nhìn thấy:**
- [ ] Row Level Security: ON (bật) hay OFF (tắt)?
- [ ] Danh sách policies:
  - [ ] Enable INSERT for ... ?
  - [ ] Enable UPDATE for ... ?
  - [ ] Enable DELETE for ... ?
  - [ ] Enable SELECT for ... ?

### Cách 2: SQL Editor
```sql
-- Check RLS status
SELECT * FROM pg_tables 
WHERE tablename = 'products';

-- Check policies on products table
SELECT * FROM pg_policies
WHERE tablename = 'products';

-- Or simpler:
SELECT * FROM information_schema.role_table_grants
WHERE table_name = 'products';
```

## 🔧 Nếu RLS chặn UPDATE/INSERT

### Option 1: Tạo Policy cho Admin
```sql
-- Cho admin user UPDATE products
CREATE POLICY "admin_update_products" 
ON products FOR UPDATE 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin%'))
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin%'));

-- Cho admin user INSERT products
CREATE POLICY "admin_insert_products" 
ON products FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin%'));

-- Cho admin user DELETE products
CREATE POLICY "admin_delete_products" 
ON products FOR DELETE 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin%'));
```

### Option 2: Cho phép Authenticated Users
```sql
-- Allow all authenticated users
CREATE POLICY "auth_update_products" 
ON products FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_insert_products" 
ON products FOR INSERT 
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_delete_products" 
ON products FOR DELETE 
USING (auth.role() = 'authenticated');
```

### Option 3: Tắt RLS hoàn toàn (Không recommended)
```sql
-- Disable RLS on products table
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

## ✅ Kiểm Tra Xem Update Có Hoạt Động

### Từ Supabase Console → SQL Editor
```sql
-- Test UPDATE
UPDATE products 
SET name = 'Test Update From Console'
WHERE id = 'your-product-id';

-- Nếu success → RLS cho phép UPDATE
-- Nếu error → RLS chặn
```

## 📝 Note

Với API endpoints mới (`/api/products/update`), việc sử dụng SERVICE_ROLE_KEY sẽ bypass RLS hoàn toàn, nên:
- ✅ RLS bật hay tắt đều không quan trọng
- ✅ Dữ liệu sẽ lưu vào DB
- ✅ Không cần lo RLS policy
