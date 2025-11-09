-- This script sets up the first admin user
-- Replace 'admin-user-id-here' with the actual UUID of the admin user from auth.users table

-- First, find your user ID in Supabase Auth dashboard:
-- 1. Go to Supabase dashboard
-- 2. Navigate to Authentication → Users
-- 3. Find your user and copy the UUID from the ID column

-- Then replace 'admin-user-id-here' in the query below and run it:

INSERT INTO public.admin_access (user_id, is_admin)
VALUES ('admin-user-id-here', true)
ON CONFLICT (user_id) DO UPDATE
SET is_admin = true;

-- Optional: Insert sample products with images
INSERT INTO public.products (name, description, price, category, image_url, stock) VALUES
('Premium Office Chair', 'Ergonomic luxury office chair with leather finish', 299.00, 'Furniture', '/placeholder.svg?height=300&width=300', 15),
('Minimalist Desk Lamp', 'Modern desk lamp with adjustable brightness', 149.00, 'Lighting', '/placeholder.svg?height=300&width=300', 20),
('Handmade Ceramic Vase', 'Beautiful handcrafted ceramic vase for flowers', 89.00, 'Decor', '/placeholder.svg?height=300&width=300', 25),
('Marble Luxury Tray', 'Premium marble serving tray for entertaining', 129.00, 'Accessories', '/placeholder.svg?height=300&width=300', 10)
ON CONFLICT DO NOTHING;
