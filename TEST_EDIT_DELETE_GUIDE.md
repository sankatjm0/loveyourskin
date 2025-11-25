# HƯỚNG DẪN TEST & DEBUG - Edit/Delete Product

## Các Lỗi Đã Sửa

### ✅ Fix 1: Edit Product không load form
**Vấn đề**: `imagesModified` flag không được reset khi bấm Edit
**Giải pháp**: Thêm `setImagesModified(false)` vào Edit button handler (Line ~1231)

### ✅ Fix 2: Edit Product Save Logic quá phức tạp  
**Vấn đề**: Kiểm tra `imageFiles.length === 0` nhưng imageFiles luôn có ảnh hiện tại
**Giải pháp**: Đơn giản hóa logic - `allImageUrls` đã tự động = existingImages khi user không thêm ảnh

## Test Checklist

### 1️⃣ **Test Edit: Chỉ đổi Tên/Giá (KHÔNG đổi ảnh)**
```
Bước:
1. Admin Dashboard → Products tab
2. Click Edit trên sản phẩm "Test Product"
3. Đổi tên: "Test Product" → "Test Product v2"
4. KHÔNG thêm hay xóa ảnh
5. Click Save

Kỳ vọng:
✓ Alert: "Product saved successfully!"
✓ Danh sách products refresh
✓ Tên được cập nhật thành "Test Product v2"
✓ Ảnh KHÔNG thay đổi (giữ nguyên)

Console logs:
[Admin EDIT] imagesModified: false allImageUrls count: X newImageUrls count: 0
[Product Update] Final payload: { name: "Test Product v2", image_urls: "[...]", ... }
```

### 2️⃣ **Test Edit: Thêm Ảnh Mới**
```
Bước:
1. Admin Dashboard → Products tab
2. Click Edit trên sản phẩm
3. Giữ nguyên tên/giá
4. Kéo thả file ảnh mới vào "Product Images"
5. Thấy thumbnail mới xuất hiện
6. Click Save

Kỳ vọng:
✓ Alert: "Product saved successfully!"
✓ Ảnh mới được upload lên Storage
✓ Sản phẩm hiển thị cả ảnh cũ + ảnh mới
✓ Ảnh đầu tiên (first) = cover image

Console logs:
[Admin] Uploading file: myimage.jpg -> products/xyz123.jpg
[Admin] Uploaded image URL: https://...
[Admin EDIT] imagesModified: true allImageUrls count: X newImageUrls count: 1
```

### 3️⃣ **Test Edit: Xóa Ảnh**
```
Bước:
1. Admin Dashboard → Products tab
2. Click Edit trên sản phẩm có 3 ảnh
3. Click nút "×" để xóa ảnh thứ 2
4. Giữ nguyên tên/giá
5. Click Save

Kỳ vọng:
✓ Alert: "Product saved successfully!"
✓ Sản phẩm chỉ còn 2 ảnh (ảnh đã xóa biến mất)
✓ Ảnh còn lại giữ đúng thứ tự

Console logs:
[Admin] setImagesModified(true) khi click ×
[Admin EDIT] imagesModified: true
```

### 4️⃣ **Test Delete Product**
```
Bước:
1. Admin Dashboard → Products tab
2. Click nút Trash icon trên sản phẩm
3. Modal xuất hiện: "Are you sure you want to delete this product?"
4. Click "Delete" button (đỏ)

Kỳ vọng:
✓ Modal đóng lại
✓ Alert: "Product deleted successfully!"
✓ Sản phẩm bị xóa khỏi danh sách
✓ Danh sách products refresh

Console logs:
[Product Delete] Processing deletion...
```

### 5️⃣ **Test Cancel Edit**
```
Bước:
1. Admin Dashboard → Products tab
2. Click Edit trên sản phẩm
3. Thay đổi tên: "Old" → "New"
4. Click "Cancel" button

Kỳ vọng:
✓ Form đóng lại
✓ Danh sách products vẫn hiển thị tên cũ "Old"
✓ Thay đổi KHÔNG được lưu

Console logs:
imagesModified: false (được reset)
```

### 6️⃣ **Test Complex: Đổi Tên + Thêm Ảnh + Xóa Ảnh**
```
Bước:
1. Edit sản phẩm có 3 ảnh, tên "Original"
2. Đổi tên → "Updated"
3. Xóa ảnh thứ 1 (click ×)
4. Thêm 2 ảnh mới
5. Click Save

Kỳ vọng:
✓ Tên cập nhật: "Updated"
✓ Ảnh: [ảnh2 cũ, ảnh3 cũ, ảnh_new1, ảnh_new2]
✓ Tổng 4 ảnh (3-1+2=4)

Console logs:
[Admin EDIT] imagesModified: true
[Admin] Uploading file: newimg1.jpg
[Admin] Uploading file: newimg2.jpg
[Admin EDIT] allImageUrls count: 4 newImageUrls count: 2
```

## Debugging Guide

### Nếu Edit không lưu được:

**1. Kiểm tra Console (F12 → Console)**
```
- Có logs [Admin EDIT] không?
- Có logs [Product Update] không?
- Có error thì error là gì?
```

**2. Kiểm tra Network Tab (F12 → Network)**
```
- API call nào gọi update sản phẩm?
- Response status: 200 hay error?
- Response body có chứa dữ liệu update không?
```

**3. Kiểm tra Database**
```
Vào Supabase Console → products table
- Dữ liệu có update không?
- image_urls column có đúng format không?
  Phải là: ["url1", "url2"]
  KHÔNG được là: "[\"url1\", \"url2\"]" (double escaped)
```

### Nếu Delete không hoạt động:

**1. Kiểm tra Modal xuất hiện**
```
- Click Delete button có hiển thị modal không?
- Modal có nút "Delete" (red) không?
```

**2. Kiểm tra Console**
```
- Có error khi delete?
- Confirmation callback được gọi không?
```

**3. Kiểm tra Database**
```
- Sản phẩm có bị xóa từ DB không?
- Có ảnh còn sót lại trong storage không?
```

## Code Flow Diagram

```
User Click Edit
    ↓
setEditingProduct(product)
setImagesModified(false) ← IMPORTANT
setProductForm({...})
setImageFiles([{preview: url, isExisting: true}, ...])
setShowProductForm(true)
    ↓
Form Render
    ↓
User Edit Fields + Add/Remove Images
    ↓
imageFiles change → setImagesModified(true) when add/remove
    ↓
User Click Save
    ↓
handleSaveProduct()
    ├─ Separate: newFiles vs existingImages
    ├─ Upload newFiles only
    ├─ Merge: [...existingImages, ...newImageUrls]
    ├─ Generate JSON string
    └─ UPDATE products table
    ↓
loadAllData() → Refresh danh sách
```

## Các State Quan Trọng

| State | Kiểu | Mục đích | Khi nào Set |
|-------|------|---------|-----------|
| `editingProduct` | Product\|null | Product đang edit | Click Edit |
| `imagesModified` | boolean | User đã thay ảnh? | Add/Remove image |
| `imageFiles` | Array | Ảnh hiện tại + mới | Form render |
| `showProductForm` | boolean | Form có mở? | Click Add/Edit |
| `productForm` | Object | Dữ liệu form | User type |

## Reset Flags

**Phải reset khi:**
- ✅ Save thành công
- ✅ Click Cancel
- ✅ Click Add Product button

**KHÔNG được reset khi:**
- ❌ Add/Remove image (phải set = true)
- ❌ Edit field (type text, change price)
