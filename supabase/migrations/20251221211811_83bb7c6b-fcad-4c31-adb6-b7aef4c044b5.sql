-- Assign admin role to admin@admin.com user
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '31478c93-3495-4077-abdf-486cc839ba48';