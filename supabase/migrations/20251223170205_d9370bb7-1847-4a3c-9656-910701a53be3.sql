-- Enable realtime for listings table (critical for dashboard sync)
ALTER TABLE public.listings REPLICA IDENTITY FULL;

-- Add listings to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;