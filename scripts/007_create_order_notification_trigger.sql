-- Create trigger function to notify admins when new order is created
CREATE OR REPLACE FUNCTION public.notify_admins_of_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for each admin
  -- Using INSERT with explicit column values to bypass RLS
  INSERT INTO public.notifications (admin_id, user_id, type, title, message, link, read)
  SELECT 
    admin_access.user_id,
    NULL,
    'new_order'::text,
    'New Order Received'::text,
    'A new order #' || NEW.order_number || ' has been received. Total: ' || NEW.total_amount || ' VND'::text,
    '/admin?tab=orders'::text,
    false
  FROM public.admin_access
  WHERE admin_access.is_admin = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_notify_admins_new_order ON public.orders;

-- Create trigger
CREATE TRIGGER trigger_notify_admins_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_of_new_order();
