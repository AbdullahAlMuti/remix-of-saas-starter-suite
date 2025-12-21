-- Update plans with Stripe price IDs
UPDATE public.plans SET stripe_price_id_monthly = 'price_1SguJ5QwaGJD4waN2IZoN1fG' WHERE name = 'starter';
UPDATE public.plans SET stripe_price_id_monthly = 'price_1SguJPQwaGJD4waNEGhgKxIi' WHERE name = 'growth';
UPDATE public.plans SET stripe_price_id_monthly = 'price_1SguJYQwaGJD4waNYI2GvWuG' WHERE name = 'enterprise';