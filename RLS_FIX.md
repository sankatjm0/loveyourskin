# RLS Policy Debugging Steps

Since slides work but categories and profiles show 0 rows, this is **100% an RLS (Row Level Security) policy issue**.

## Quick Test:

1. **Check server sees the data:**
   ```
   http://localhost:3000/api/debug/rls-check
   ```
   - If this shows data with `categories_found: true` and `profiles_found: true`, then the data exists and the issue is RLS policies

2. **Open browser DevTools (F12) and check console** on `/admin` page:
   - Look for `[DEBUG] Category query result:` lines
   - It will show the exact error or empty data array
   - If you see `error: null` and `count: 0`, it's definitely RLS

## RLS Policy Fix:

In **Supabase Dashboard**:

1. Go to **SQL Editor** (left sidebar)

2. Run these commands to enable SELECT for authenticated users:

```sql
-- For category table
CREATE POLICY "Allow authenticated users to read categories"
ON public.category
FOR SELECT
TO authenticated
USING (true);

-- For profiles table  
CREATE POLICY "Allow users to read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
```

3. After running these, **refresh the admin page** - categories should now load

## Alternative: Disable RLS temporarily to test

If the SQL above doesn't work:

1. Go to **Supabase Dashboard > Authentication > Policies**
2. For each table (`category`, `profiles`):
   - Click the table name
   - Disable RLS temporarily (toggle off)
   - Test admin page
   - If it works, then re-enable and fix policies

## What to check in browser console:

```javascript
// Run this in DevTools console on /admin page
fetch('/api/debug/rls-check').then(r => r.json()).then(d => {
  console.log('=== RLS CHECK ===')
  console.log('Categories found:', d.data.categories.count)
  console.log('Profiles found:', d.data.profiles.count)
  console.log('Category error:', d.data.categories.error)
  console.log('Profile error:', d.data.profiles.error)
})
```
