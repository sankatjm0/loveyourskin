// Quick troubleshooting commands to run in browser console

// 1. Test if categories are in state (run in Admin page)
console.log("Categories loaded:", (() => {
  // This will only work if you open dev tools on /admin page
  return "Check the React DevTools or look at the dropdown"
})())

// 2. Test PromoSlider API directly
fetch('/api/promotions/slides')
  .then(r => r.json())
  .then(data => {
    console.log('=== PROMOTION SLIDES API ===')
    console.log('Count:', data.length)
    console.log('Data:', data)
    if (data.length === 0) {
      console.warn('⚠️ No slides in database!')
    } else {
      data.forEach((slide, i) => {
        console.log(`Slide ${i}: ${slide.image_url}`)
      })
    }
  })
  .catch(e => console.error('API Error:', e))

// 3. Test debug endpoint
fetch('/api/debug/tables')
  .then(r => r.json())
  .then(data => {
    console.log('=== DATABASE TABLES DEBUG ===')
    console.log('Categories:', data.categories)
    console.log('Profiles:', data.profiles)
    console.log('Promotion Slides:', data.promotion_slides)
  })
  .catch(e => console.error('Debug Error:', e))

// 4. Test individual slide image loading
async function testSlideImage(imageUrl) {
  console.log('Testing image:', imageUrl)
  const img = new Image()
  img.onload = () => console.log('✓ Image loads successfully')
  img.onerror = () => console.error('✗ Image failed to load')
  img.src = imageUrl
}
// Usage: testSlideImage('https://your-bucket.supabase.co/...')

// 5. Check localStorage for user session
console.log('=== SUPABASE SESSION ===')
const session = localStorage.getItem('sb-session')
if (session) {
  console.log('Session exists:', JSON.parse(session))
} else {
  console.warn('⚠️ No session - user not logged in')
}
