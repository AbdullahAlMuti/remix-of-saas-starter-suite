-- Create coupons table
CREATE TABLE public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC,
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_one_time_per_user BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    applicable_plans TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create coupon usage tracking table
CREATE TABLE public.coupon_usages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    stripe_session_id TEXT,
    discount_applied NUMERIC NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupons
CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Active coupons are readable by authenticated users"
ON public.coupons
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS policies for coupon_usages
CREATE POLICY "Admins can view all coupon usages"
ON public.coupon_usages
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own coupon usages"
ON public.coupon_usages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert coupon usages"
ON public.coupon_usages
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active, valid_from, valid_until);
CREATE INDEX idx_coupon_usages_user ON public.coupon_usages(user_id, coupon_id);

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();