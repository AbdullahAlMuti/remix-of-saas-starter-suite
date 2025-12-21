-- ═══════════════════════════════════════════════════════════
-- EBAY LISTER SAAS - COMPLETE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════

-- 1. Plans Table (Pricing Tiers)
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- free, starter, growth, enterprise
    display_name TEXT NOT NULL,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    credits_per_month INTEGER DEFAULT 5,
    max_listings INTEGER DEFAULT 10,
    max_auto_orders INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. App Roles Enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'super_admin');

-- 3. User Roles Table (Security)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 4. Profiles Table (User Business Data)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan_id UUID REFERENCES public.plans(id),
    credits INTEGER DEFAULT 5,
    stripe_customer_id TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 5. User Plans (Subscription Tracking)
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT DEFAULT 'active', -- active, cancelled, expired, trial
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Usage Logs (Audit & Analytics)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- generate_title, remove_bg, list_item, scrape, auto_order
    credits_used INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Prompts Storage
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prompt_type TEXT NOT NULL, -- title, description, pricing
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Extension Sessions (Device Tracking)
CREATE TABLE IF NOT EXISTS public.extension_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    extension_id TEXT NOT NULL,
    device_name TEXT,
    browser TEXT,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Listings Table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    sku TEXT,
    ebay_item_id TEXT,
    ebay_price DECIMAL(10,2),
    amazon_asin TEXT,
    amazon_price DECIMAL(10,2),
    amazon_url TEXT,
    status TEXT DEFAULT 'active', -- active, sold, ended, error
    inventory_status TEXT DEFAULT 'in_stock',
    auto_order_enabled BOOLEAN DEFAULT false,
    last_checked TIMESTAMP WITH TIME ZONE,
    pricing_rule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Auto Orders
CREATE TABLE IF NOT EXISTS public.auto_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id),
    ebay_order_id TEXT,
    ebay_sku TEXT,
    amazon_asin TEXT,
    amazon_url TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
    risk_score INTEGER DEFAULT 0,
    amazon_order_id TEXT,
    buyer_name TEXT,
    buyer_address JSONB,
    item_price DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    profit DECIMAL(10,2),
    details JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Auth Codes (Extension Login Flow)
CREATE TABLE IF NOT EXISTS public.auth_codes (
    code TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. Inventory Alerts
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- OUT_OF_STOCK, PRICE_HIKE, PRICE_DROP, LOW_MARGIN
    message TEXT,
    old_value TEXT,
    new_value TEXT,
    status TEXT DEFAULT 'UNREAD', -- UNREAD, READ, DISMISSED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_sessions_user_id ON public.extension_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_amazon_asin ON public.listings(amazon_asin);
CREATE INDEX IF NOT EXISTS idx_auto_orders_user_id ON public.auto_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_orders_status ON public.auto_orders(status);
CREATE INDEX IF NOT EXISTS idx_auth_codes_user_id ON public.auth_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_user_id ON public.inventory_alerts(user_id);

-- ═══════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extension_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- SECURITY DEFINER FUNCTION (Prevents RLS Recursion)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  )
$$;

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

-- Plans: Everyone can read, only admins can modify
CREATE POLICY "Plans are viewable by everyone" ON public.plans
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL USING (public.is_admin(auth.uid()));

-- User Roles: Users see own, admins see all
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL USING (public.is_admin(auth.uid()));

-- Profiles: Users manage own, admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- User Plans: Users see own, admins see all
CREATE POLICY "Users can view own plans" ON public.user_plans
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage user plans" ON public.user_plans
    FOR ALL USING (public.is_admin(auth.uid()));

-- Usage Logs: Users see own (no content), admins see stats only
CREATE POLICY "Users can view own usage" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage stats" ON public.usage_logs
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Prompts: Users manage own
CREATE POLICY "Users can manage own prompts" ON public.prompts
    FOR ALL USING (auth.uid() = user_id);

-- Extension Sessions: Users manage own
CREATE POLICY "Users can manage own sessions" ON public.extension_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Listings: Users manage own
CREATE POLICY "Users can manage own listings" ON public.listings
    FOR ALL USING (auth.uid() = user_id);

-- Auto Orders: Users manage own
CREATE POLICY "Users can manage own auto orders" ON public.auto_orders
    FOR ALL USING (auth.uid() = user_id);

-- Auth Codes: Users manage own
CREATE POLICY "Users can manage own auth codes" ON public.auth_codes
    FOR ALL USING (auth.uid() = user_id);

-- Inventory Alerts: Users manage own
CREATE POLICY "Users can manage own alerts" ON public.inventory_alerts
    FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile on user signup
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get free plan ID
    SELECT id INTO free_plan_id FROM public.plans WHERE name = 'free' LIMIT 1;
    
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name, plan_id, credits)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        free_plan_id,
        5
    );
    
    -- Assign default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Update timestamps
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_plans_updated_at
    BEFORE UPDATE ON public.user_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_orders_updated_at
    BEFORE UPDATE ON public.auto_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════════
-- SEED: Default Plans
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.plans (name, display_name, price_monthly, price_yearly, credits_per_month, max_listings, max_auto_orders, features) VALUES
('free', 'Free', 0, 0, 5, 10, 0, '["Basic scraping", "Manual listing", "5 AI credits/month"]'::jsonb),
('starter', 'Starter', 19.99, 199.99, 50, 100, 10, '["50 AI credits/month", "100 listings", "10 auto-orders/day", "Email support"]'::jsonb),
('growth', 'Growth', 49.99, 499.99, 200, 500, 50, '["200 AI credits/month", "500 listings", "50 auto-orders/day", "Priority support", "Inventory alerts"]'::jsonb),
('enterprise', 'Enterprise', 149.99, 1499.99, 1000, -1, -1, '["Unlimited AI credits", "Unlimited listings", "Unlimited auto-orders", "Dedicated support", "Custom integrations", "API access"]'::jsonb)
ON CONFLICT (name) DO NOTHING;