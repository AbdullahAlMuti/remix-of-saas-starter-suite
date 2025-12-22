-- Update Free plan to $1 for 14-day trial
UPDATE public.plans 
SET price_monthly = 1.00
WHERE name = 'free';