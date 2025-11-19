# Notification System Setup Guide

## Overview

The notification system is fully implemented and uses localStorage for storing notifications. This is simple, reliable, and can be easily upgraded to use Supabase Realtime in the future.

## How It Works

### Current Implementation (localStorage)
1. **User Notifications** - Stored in `localStorage.user_notifications`
2. **Admin Notifications** - Stored in `localStorage.admin_notifications`
3. **Auto-refresh** - Checks for new notifications every 5 seconds
4. **Bell Icon** - Shows unread count in navbar

### Creating Notifications

Notifications are JSON objects with this structure:
```typescript
{
  id: string                // Unique ID (e.g., "notif-${Date.now()}")
  type: string              // "order_status" | "new_promotion" | "new_order"
  message: string           // Display text
  link: string              // Navigation URL (optional)
  read: boolean             // Read status
  created_at: string        // ISO timestamp
}
```

### Where Notifications Are Created

1. **Order Status Updates** - `components/admin-status-update.tsx`
   ```typescript
   const notification = {
     id: `notif-${Date.now()}`,
     type: "order_status",
     message: `Your order ${orderNumber} status: ${newStatus}`,
     link: `/orders/${orderId}`,
     read: false,
     created_at: new Date().toISOString(),
   }
   ```

2. **New Promotions** - Create manually when promo is created
   ```typescript
   const notification = {
     id: `notif-${Date.now()}`,
     type: "new_promotion",
     message: `Có khuyến mãi mới: ${promoName}. Kiểm tra ngay bạn nhé!`,
     link: `/products?category=Sale`,
     read: false,
     created_at: new Date().toISOString(),
   }
   ```

3. **New Orders** (Admin) - Create when order is placed
   ```typescript
   const notification = {
     id: `notif-${Date.now()}`,
     type: "new_order",
     message: `New order ${orderNumber} from ${userEmail}`,
     link: `/admin/order/${orderId}`,
     read: false,
     created_at: new Date().toISOString(),
   }
   ```

## Adding Notifications Programmatically

```typescript
// In any component where you want to create a notification:

const notification = {
  id: `notif-${Date.now()}`,
  type: "order_status",
  message: "Your message here",
  link: "/path/to/page",
  read: false,
  created_at: new Date().toISOString(),
}

// For user notifications
const existing = JSON.parse(localStorage.getItem("user_notifications") || "[]")
localStorage.setItem("user_notifications", JSON.stringify([notification, ...existing]))

// For admin notifications
const existing = JSON.parse(localStorage.getItem("admin_notifications") || "[]")
localStorage.setItem("admin_notifications", JSON.stringify([notification, ...existing]))
```

## Notification Types

### User Notifications
- **order_status**: Order status updates (pending → confirmed → shipping → delivered)
- **new_promotion**: New promotions available
- **order_delivered**: Order has been delivered

### Admin Notifications
- **new_order**: New order placed by user
- **order_issue**: Order issue (payment failed, etc.)
- **product_low_stock**: Product stock below threshold

## Customization

### Change Notification Colors
Edit `components/notifications.tsx`, line with `bg-primary/5`:
```typescript
className={`p-3 hover:bg-muted transition cursor-pointer ${!notification.read ? "bg-blue-100 dark:bg-blue-950" : ""}`}
```

### Change Auto-refresh Interval
Edit `components/notifications.tsx`, line with `5000`:
```typescript
const interval = setInterval(loadNotifications, 10000) // 10 seconds
```

### Change Max Notifications Displayed
Edit `components/notifications.tsx`, line with `max-h-96`:
```typescript
className="...max-h-96 overflow-y-auto..." // Adjust height
```

## Upgrading to Supabase Realtime (Future)

To upgrade from localStorage to Supabase Realtime:

1. Create a `notifications` table in Supabase:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,
  message TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
```

2. Update `components/notifications.tsx` to subscribe to Realtime:
```typescript
useEffect(() => {
  const supabase = createClient()
  
  const subscription = supabase
    .from(`notifications:user_id=eq.${user?.id}`)
    .on('*', payload => {
      // Update notifications
    })
    .subscribe()
  
  return () => subscription.unsubscribe()
}, [user?.id])
```

## Troubleshooting

### Notifications not appearing
1. Check browser's localStorage (DevTools > Application > Local Storage)
2. Verify notification JSON structure
3. Check that `user_notifications` or `admin_notifications` keys exist

### Notifications disappearing on refresh
- This is expected with localStorage. Switch to database for persistence.

### Unread badge not updating
- Clear localStorage and refresh
- Check notification `read` field is being updated correctly

## Related Files

- `components/notifications.tsx` - Main notification component
- `components/admin-status-update.tsx` - Creates notifications on status change
- `app/page.tsx` - Adds Notifications to user navbar
- `app/admin/page.tsx` - Adds Notifications to admin navbar

---

**Status**: ✅ Production Ready
**Next Step**: Integrate promotion creation to auto-generate notifications
