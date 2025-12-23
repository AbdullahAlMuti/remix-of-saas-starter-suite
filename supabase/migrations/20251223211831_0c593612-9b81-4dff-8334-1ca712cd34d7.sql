-- Create must_sell_items table for trending eBay products
CREATE TABLE public.must_sell_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    profit NUMERIC NOT NULL DEFAULT 0,
    sales_count INTEGER NOT NULL DEFAULT 0,
    total_sold INTEGER NOT NULL DEFAULT 0,
    country TEXT NOT NULL DEFAULT 'US',
    ebay_url TEXT,
    category TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.must_sell_items ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all must_sell_items
CREATE POLICY "Admins can manage must sell items"
ON public.must_sell_items
FOR ALL
USING (is_admin(auth.uid()));

-- Policy: Authenticated users can view active items
CREATE POLICY "Authenticated users can view active must sell items"
ON public.must_sell_items
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Create indexes for common queries
CREATE INDEX idx_must_sell_items_is_active ON public.must_sell_items(is_active);
CREATE INDEX idx_must_sell_items_country ON public.must_sell_items(country);
CREATE INDEX idx_must_sell_items_sales_count ON public.must_sell_items(sales_count DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_must_sell_items_updated_at
BEFORE UPDATE ON public.must_sell_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo data
INSERT INTO public.must_sell_items (title, image_url, price, profit, sales_count, total_sold, country, category, ebay_url, is_active)
VALUES 
  ('4 Pcs 2 Jaw Gear Puller Set Steel Removal Tool Adjustable for Pulleys Flywheel', 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=200&h=150&fit=crop', 52.56, 20.31, 3, 4, 'US', 'Tools', 'https://ebay.com', true),
  ('Tip-Toe Tub Trim Set Two-Hole Overflow Faceplate Replace Bath Drain Kit Bronze', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=150&fit=crop', 44.22, 14.74, 3, 4, 'US', 'Home', 'https://ebay.com', true),
  ('XPEL Black Universal Door Sill Guard (60 x 2.75) Paint Protection Film Kit', 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=200&h=150&fit=crop', 35.93, 10.63, 3, 11, 'US', 'Automotive', 'https://ebay.com', true),
  ('Compound Bow Hunting, Carrying, Sling, Realtree AP', 'https://images.unsplash.com/photo-1510925758641-869d353cecc7?w=200&h=150&fit=crop', 57.09, 10.09, 3, 25, 'US', 'Sports', 'https://ebay.com', true),
  ('Professional Cordless Drill Set 20V Max Lithium Ion', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=150&fit=crop', 89.99, 25.50, 5, 42, 'US', 'Tools', 'https://ebay.com', true),
  ('Vintage Cast Iron Skillet 12 Inch Pre-Seasoned Cooking Pan', 'https://images.unsplash.com/photo-1545696563-af7e30ad8893?w=200&h=150&fit=crop', 34.99, 12.00, 4, 18, 'US', 'Home', 'https://ebay.com', true),
  ('Bluetooth Wireless Earbuds with Charging Case', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=150&fit=crop', 29.99, 8.50, 6, 55, 'UK', 'Electronics', 'https://ebay.com', true),
  ('Mountain Bike Helmet Adult Safety Cycling Helmet', 'https://images.unsplash.com/photo-1557803175-2f8c6e7a3c0f?w=200&h=150&fit=crop', 42.00, 15.00, 4, 22, 'UK', 'Sports', 'https://ebay.com', true),
  ('LED Desk Lamp with USB Charging Port Dimmable', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&h=150&fit=crop', 28.50, 9.75, 5, 31, 'DE', 'Home', 'https://ebay.com', true),
  ('Stainless Steel Kitchen Knife Set 8 Piece with Block', 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=200&h=150&fit=crop', 65.00, 22.00, 3, 15, 'DE', 'Home', 'https://ebay.com', true);