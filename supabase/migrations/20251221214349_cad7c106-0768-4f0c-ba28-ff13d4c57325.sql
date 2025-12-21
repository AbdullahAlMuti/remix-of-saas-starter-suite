-- Enable realtime for user_roles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;