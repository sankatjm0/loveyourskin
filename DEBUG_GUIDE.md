# Debug Guide: Categories, Profiles & PromoSlider Issues

## 🔍 Issues Fixed & Improvements Made

### 1. **Categories & Profiles Not Loading**
**Problem:** These were being fetched before authentication was complete
**Solution:** Moved fetch calls to `checkAuth()` function - they now run AFTER user authentication succeeds

**Verification Steps:**
1. Open browser DevTools (F12) → Console tab
2. Go to http://localhost:3000/admin
3. You should see logs:
   - `"Categories loaded successfully: X"` (where X is count)
   - `"Users loaded successfully: Y"` (where Y is count)

If you see **error messages** instead, check:
```
GET /api/debug/tables - Shows what's in your database tables
```

### 2. **PromoSlider Image URL Issues**
**Problem:** Promotion slides were not loading images from Supabase bucket
**Solution:** 
- Enhanced error logging in component
- Added fallback image handling
- Improved API route with better error messages
- Filter out empty/invalid URLs

**Testing PromoSlider:**
1. Open http://localhost:3000 (homepage)
2. Check browser console for logs:
   ```
   "Slides fetched from API: [...]"
   "Valid slides: [...]"
   ```

3. If images don't show, check for:
   - `Failed to load image: [URL]` - indicates invalid URL
   - API returning empty array - no data in database

### 3. **Debug Endpoints**

#### Check All Tables
```
GET /api/debug/tables
```
Response shows:
- How many categories exist
- How many profiles exist  
- How many promotion_slides exist
- Any error messages from database

#### Check Promotion Slides Specifically
```
GET /api/promotions/slides
```
Response shows the actual slides that will be displayed

---

## ⚙️ What Was Changed

### Admin Page (`app/admin/page.tsx`)
- ✅ Removed early useEffect for categories/profiles
- ✅ Moved fetch logic into `checkAuth()` function
- ✅ Added `debugInfo` state to track load status
- ✅ Better error logging with try-catch blocks

### PromoSlider (`components/PromoSlider.tsx`)
- ✅ Added detailed console logging
- ✅ Added error state tracking
- ✅ Filter out invalid image URLs
- ✅ Image onError fallback handler
- ✅ Better loading state UI

### API Route (`app/api/promotions/slides/route.ts`)
- ✅ Added comprehensive error logging
- ✅ Validate image URLs before returning
- ✅ Better HTTP status codes
- ✅ Filter empty entries

### New Debug Endpoint (`app/api/debug/tables/route.ts`)
- Shows table counts and sample data
- Helps verify database connectivity
- Useful for troubleshooting

---

## 🚀 Testing Checklist

### Frontend Tests
- [ ] Homepage loads without errors
- [ ] PromoSlider shows fallback image if no slides
- [ ] PromoSlider auto-rotates every 5 seconds (if slides exist)
- [ ] Browser console shows successful fetch logs
- [ ] Admin page loads categories dropdown
- [ ] Admin page loads users list

### Database Tests
- [ ] Visit `/api/debug/tables` to see table status
- [ ] Check if `category` table has rows
- [ ] Check if `profiles` table has rows
- [ ] Check if `promotion_slides` table has rows with valid image_url

### RLS Policy Tests
If tables exist but data doesn't load:
1. Check Supabase RLS policies for each table
2. Ensure authenticated users can SELECT from tables
3. For public read (PromoSlider), ensure policy allows it

---

## 📝 Common Issues & Fixes

### Categories/Profiles show empty
**Cause:** RLS policy denying access
**Fix:** Check Supabase dashboard → Authentication → Row Level Security
```sql
-- Example policy that should work:
CREATE POLICY "Authenticated users can read categories"
ON category
FOR SELECT
USING (auth.role() = 'authenticated');
```

### PromoSlider shows only fallback image
**Cause 1:** No data in `promotion_slides` table
**Fix:** Create test slides via Admin panel

**Cause 2:** Image URLs are truncated/invalid
**Fix:** Check /api/debug/tables endpoint response

**Cause 3:** CORS/Storage permission issue
**Fix:** Verify Supabase storage bucket `promotion_images` is public

---

## 🔬 Debugging Steps

### Step 1: Check Browser Console
```javascript
// You should see these logs:
"Slides fetched from API: [...]"
"Categories loaded successfully: X"
"Users loaded successfully: Y"
```

### Step 2: Verify API Responses
```bash
# In terminal or Postman:
curl http://localhost:3000/api/promotions/slides
curl http://localhost:3000/api/debug/tables
```

### Step 3: Check Database Directly
Go to Supabase Dashboard:
1. Table Editor → category → check row count
2. Table Editor → profiles → check row count
3. Table Editor → promotion_slides → check image_url values

### Step 4: Test Authentication
Ensure you're logged in to admin panel:
- If redirected to /auth/login, authentication failed
- If loaded but no data, RLS policy issue

---

## 📞 Still Having Issues?

Check:
1. **Console logs** - Most specific error messages
2. **/api/debug/tables** - Database connectivity
3. **Supabase Dashboard RLS policies** - Row level security rules
4. **Environment variables** - .env.local has correct Supabase keys
5. **Storage bucket** - `promotion_images` bucket exists and is public

