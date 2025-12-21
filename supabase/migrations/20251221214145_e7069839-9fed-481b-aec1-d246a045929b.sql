-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_plans;

-- Set REPLICA IDENTITY FULL for complete row data
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.notices REPLICA IDENTITY FULL;
ALTER TABLE public.plans REPLICA IDENTITY FULL;
ALTER TABLE public.user_plans REPLICA IDENTITY FULL;