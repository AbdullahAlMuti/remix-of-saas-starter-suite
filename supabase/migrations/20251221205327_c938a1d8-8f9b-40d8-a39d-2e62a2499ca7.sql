-- Update user role to super_admin
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = '3ac48b4e-107f-416d-afdf-b402f34e7fe1';