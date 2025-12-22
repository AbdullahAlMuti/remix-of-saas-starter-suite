-- Create notification_settings table for user email preferences
CREATE TABLE public.notification_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    notify_out_of_stock BOOLEAN NOT NULL DEFAULT true,
    notify_low_stock BOOLEAN NOT NULL DEFAULT true,
    notify_price_increase BOOLEAN NOT NULL DEFAULT true,
    notify_price_decrease BOOLEAN NOT NULL DEFAULT true,
    price_change_threshold NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    notification_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notification settings
CREATE POLICY "Users can view own notification settings"
ON public.notification_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
ON public.notification_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create notification_logs table for tracking sent notifications
CREATE TABLE public.notification_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    email_sent_to TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert notification logs
CREATE POLICY "Service role can insert notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();