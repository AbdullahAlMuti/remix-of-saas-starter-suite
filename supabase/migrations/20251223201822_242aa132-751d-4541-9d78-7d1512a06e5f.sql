-- Create blog_posts table to store generated affiliate blog posts
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  affiliate_link TEXT,
  amazon_asin TEXT,
  product_title TEXT,
  product_price DECIMAL(10,2),
  seo_keywords TEXT[],
  meta_description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'failed')),
  published_at TIMESTAMP WITH TIME ZONE,
  published_to TEXT, -- wordpress, blogger, shopify, webhook
  published_url TEXT,
  generation_mode TEXT DEFAULT 'manual' CHECK (generation_mode IN ('manual', 'bulk', 'auto')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create publishing_destinations table for WordPress, Blogger, Shopify, Webhook configs
CREATE TABLE public.publishing_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('wordpress', 'blogger', 'shopify', 'webhook')),
  name TEXT NOT NULL,
  site_url TEXT,
  api_key TEXT,
  api_secret TEXT,
  username TEXT,
  access_token TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_generation_settings table for user preferences
CREATE TABLE public.blog_generation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  auto_generate_enabled BOOLEAN DEFAULT false,
  auto_publish_enabled BOOLEAN DEFAULT false,
  default_destination_id UUID REFERENCES public.publishing_destinations(id) ON DELETE SET NULL,
  content_style TEXT DEFAULT 'detailed_review' CHECK (content_style IN ('detailed_review', 'comparison', 'buying_guide', 'quick_summary')),
  include_pros_cons BOOLEAN DEFAULT true,
  include_specifications BOOLEAN DEFAULT true,
  include_price_history BOOLEAN DEFAULT false,
  affiliate_tag TEXT,
  custom_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_generation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "Users can view their own blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own blog posts" 
ON public.blog_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog posts" 
ON public.blog_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blog posts" 
ON public.blog_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for publishing_destinations
CREATE POLICY "Users can view their own publishing destinations" 
ON public.publishing_destinations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own publishing destinations" 
ON public.publishing_destinations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own publishing destinations" 
ON public.publishing_destinations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own publishing destinations" 
ON public.publishing_destinations 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for blog_generation_settings
CREATE POLICY "Users can view their own blog settings" 
ON public.blog_generation_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own blog settings" 
ON public.blog_generation_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog settings" 
ON public.blog_generation_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_blog_posts_user_id ON public.blog_posts(user_id);
CREATE INDEX idx_blog_posts_listing_id ON public.blog_posts(listing_id);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_publishing_destinations_user_id ON public.publishing_destinations(user_id);

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_publishing_destinations_updated_at
BEFORE UPDATE ON public.publishing_destinations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_generation_settings_updated_at
BEFORE UPDATE ON public.blog_generation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();