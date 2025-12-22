-- Create calculator_settings table for storing user's default calculator values
CREATE TABLE public.calculator_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_percent DECIMAL(5,2) NOT NULL DEFAULT 9.00,
  tracking_fee DECIMAL(10,2) NOT NULL DEFAULT 0.20,
  ebay_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  promotional_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  desired_profit_percent DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.calculator_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calculator settings" 
ON public.calculator_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculator settings" 
ON public.calculator_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calculator settings" 
ON public.calculator_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calculator_settings_updated_at
BEFORE UPDATE ON public.calculator_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();