-- Fix the Free plan's stripe_price_id_monthly to be null (not a literal "1")
UPDATE public.plans 
SET stripe_price_id_monthly = NULL, 
    price_monthly = 0
WHERE name = 'free';