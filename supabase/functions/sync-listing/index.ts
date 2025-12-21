import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListingPayload {
  title: string;
  sku?: string;
  ebay_price: number;
  amazon_price: number;
  amazon_asin?: string;
  amazon_url?: string;
  ebay_item_id?: string;
  status?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to get user ID
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-listing] User authenticated: ${user.id}`);

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Handle single listing or batch
      const listings: ListingPayload[] = Array.isArray(body) ? body : [body];
      
      console.log(`[sync-listing] Processing ${listings.length} listings`);

      const results = [];
      
      for (const listing of listings) {
        // Validate required fields
        if (!listing.title) {
          results.push({ error: 'Title is required', listing });
          continue;
        }

        // Check if listing already exists by SKU or ASIN
        let existingListing = null;
        
        if (listing.sku) {
          const { data } = await supabase
            .from('listings')
            .select('id')
            .eq('user_id', user.id)
            .eq('sku', listing.sku)
            .single();
          existingListing = data;
        }
        
        if (!existingListing && listing.amazon_asin) {
          const { data } = await supabase
            .from('listings')
            .select('id')
            .eq('user_id', user.id)
            .eq('amazon_asin', listing.amazon_asin)
            .single();
          existingListing = data;
        }

        if (existingListing) {
          // Update existing listing
          const { data, error } = await supabase
            .from('listings')
            .update({
              title: listing.title,
              sku: listing.sku || null,
              ebay_price: listing.ebay_price || null,
              amazon_price: listing.amazon_price || null,
              amazon_asin: listing.amazon_asin || null,
              amazon_url: listing.amazon_url || null,
              ebay_item_id: listing.ebay_item_id || null,
              status: listing.status || 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingListing.id)
            .select()
            .single();

          if (error) {
            console.error('[sync-listing] Update error:', error);
            results.push({ error: error.message, listing });
          } else {
            console.log(`[sync-listing] Updated listing: ${data.id}`);
            results.push({ success: true, action: 'updated', data });
          }
        } else {
          // Create new listing
          const { data, error } = await supabase
            .from('listings')
            .insert({
              user_id: user.id,
              title: listing.title,
              sku: listing.sku || null,
              ebay_price: listing.ebay_price || null,
              amazon_price: listing.amazon_price || null,
              amazon_asin: listing.amazon_asin || null,
              amazon_url: listing.amazon_url || null,
              ebay_item_id: listing.ebay_item_id || null,
              status: listing.status || 'active',
            })
            .select()
            .single();

          if (error) {
            console.error('[sync-listing] Insert error:', error);
            results.push({ error: error.message, listing });
          } else {
            console.log(`[sync-listing] Created listing: ${data.id}`);
            results.push({ success: true, action: 'created', data });
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          summary: {
            total: listings.length,
            created: results.filter(r => r.action === 'created').length,
            updated: results.filter(r => r.action === 'updated').length,
            errors: results.filter(r => r.error).length,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-listing] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
