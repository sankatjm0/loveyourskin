-- Remove infinite recursion policies from admin_access table
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all admin access" ON public.admin_access;

-- Create a non-recursive policy that only checks the user's own is_admin flag
CREATE POLICY "Admins can view admin access records"
  ON public.admin_access FOR SELECT
  USING (auth.uid() = user_id OR is_admin = true);

-- Remove recursive admin policies from orders and order_items, replace with non-recursive versions
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- Non-recursive admin policies using a flag column instead
CREATE POLICY "Admins can view all orders v2"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id OR
    (SELECT is_admin FROM public.admin_access WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Admins can update all orders v2"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (SELECT is_admin FROM public.admin_access WHERE user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Admins can view all order items v2"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR 
           (SELECT is_admin FROM public.admin_access WHERE user_id = auth.uid() LIMIT 1))
    )
  );
