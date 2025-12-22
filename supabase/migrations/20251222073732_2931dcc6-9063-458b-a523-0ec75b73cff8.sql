-- Create amazon_settings table for storing API credentials and sync preferences
CREATE TABLE public.amazon_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT NOT NULL DEFAULT 'YOUR_CLIENT_ID',
    client_secret TEXT NOT NULL DEFAULT 'YOUR_CLIENT_SECRET',
    refresh_token TEXT NOT NULL DEFAULT 'YOUR_REFRESH_TOKEN',
    marketplace TEXT NOT NULL DEFAULT 'NA',
    update_frequency_hours INTEGER NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.amazon_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify amazon settings
CREATE POLICY "Admins can view amazon settings"
ON public.amazon_settings
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert amazon settings"
ON public.amazon_settings
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update amazon settings"
ON public.amazon_settings
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Add inventory tracking columns to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS amazon_stock_quantity INTEGER,
ADD COLUMN IF NOT EXISTS amazon_stock_status TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS price_last_updated TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS inventory_last_updated TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- Create inventory_sync_logs table for tracking sync operations
CREATE TABLE public.inventory_sync_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL,
    old_price NUMERIC(10,2),
    new_price NUMERIC(10,2),
    old_stock INTEGER,
    new_stock INTEGER,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sync logs
ALTER TABLE public.inventory_sync_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own sync logs
CREATE POLICY "Users can view their own sync logs"
ON public.inventory_sync_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
);

-- Admins can view all sync logs
CREATE POLICY "Admins can view all sync logs"
ON public.inventory_sync_logs
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Create trigger for amazon_settings updated_at
CREATE TRIGGER update_amazon_settings_updated_at
BEFORE UPDATE ON public.amazon_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.amazon_settings (client_id, client_secret, refresh_token, marketplace, update_frequency_hours, is_active)
VALUES ('YOUR_CLIENT_ID', 'YOUR_CLIENT_SECRET', 'YOUR_REFRESH_TOKEN', 'NA', 2, false);