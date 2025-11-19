-- Add history table to track product stock changes, new products, and completed orders
CREATE TABLE IF NOT EXISTS public.history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('product_stock_change', 'product_created', 'order_completed')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read history (for displaying in admin)
CREATE POLICY "Allow reading history"
  ON public.history FOR SELECT
  USING (true);

-- Only admin can insert history records (via API)
CREATE POLICY "Allow admin to insert history"
  ON public.history FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_access WHERE is_admin = true));
