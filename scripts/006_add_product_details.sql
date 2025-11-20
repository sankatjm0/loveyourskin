-- Add details column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS details TEXT;

-- Update existing products with default details (can be customized later)
UPDATE public.products SET details = 'Premium quality materials
Modern minimalist design
Eco-friendly production
Free shipping on orders over 112000 VND' 
WHERE details IS NULL;
