-- Create best selling items table
CREATE TABLE public.best_selling_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  country TEXT NOT NULL DEFAULT 'US',
  ebay_url TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.best_selling_items ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active items
CREATE POLICY "Authenticated users can view active best selling items"
ON public.best_selling_items
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admins can manage all items
CREATE POLICY "Admins can manage best selling items"
ON public.best_selling_items
FOR ALL
USING (is_admin(auth.uid()));

-- Create index for performance
CREATE INDEX idx_best_selling_items_active ON public.best_selling_items(is_active);
CREATE INDEX idx_best_selling_items_country ON public.best_selling_items(country);
CREATE INDEX idx_best_selling_items_sales ON public.best_selling_items(sales_count DESC);

-- Add updated_at trigger
CREATE TRIGGER update_best_selling_items_updated_at
BEFORE UPDATE ON public.best_selling_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();