import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe product IDs to plan names and credits
const productToPlan: Record<string, { name: string; credits: number }> = {
  'prod_TeCiCCFNeORn9S': { name: 'starter', credits: 50 },
  'prod_TeCiyupNyVBR05': { name: 'growth', credits: 200 },
  'prod_TeCivsSU28U4G1': { name: 'enterprise', credits: 9999 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_name: 'free',
        product_id: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let planName = 'free';
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      
      // Safely convert subscription end date
      const cpe = (subscription as any).current_period_end;
      if (Number.isFinite(cpe)) {
        try {
          subscriptionEnd = new Date(cpe * 1000).toISOString();
        } catch (e) {
          logStep("Failed to parse current_period_end", { current_period_end: cpe, type: typeof cpe });
          subscriptionEnd = null;
        }
      } else {
        logStep("Missing/invalid current_period_end", { current_period_end: cpe, type: typeof cpe });
      }
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });

      // Safely get product ID and plan details
      if (subscription.items?.data?.[0]?.price?.product) {
        productId = subscription.items.data[0].price.product as string;
        const planInfo = productToPlan[productId];
        planName = planInfo?.name || 'unknown';
      }
      logStep("Determined subscription tier", { productId, planName });

      // Update user_plans table
      const { data: planData } = await supabaseClient
        .from('plans')
        .select('id')
        .eq('name', planName)
        .single();

      if (planData) {
        // Check if user_plan exists
        const { data: existingPlan } = await supabaseClient
          .from('user_plans')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingPlan) {
          await supabaseClient
            .from('user_plans')
            .update({
              plan_id: planData.id,
              status: 'active',
              stripe_subscription_id: stripeSubscriptionId,
              current_period_end: subscriptionEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
        } else {
          await supabaseClient
            .from('user_plans')
            .insert({
              user_id: user.id,
              plan_id: planData.id,
              status: 'active',
              stripe_subscription_id: stripeSubscriptionId,
              current_period_end: subscriptionEnd,
            });
        }

        // Get plan credits from our mapping
        const planInfo = productToPlan[productId!];
        const planCredits = planInfo?.credits || 5;

        // Update profile with plan_id and reset credits for the billing period
        await supabaseClient
          .from('profiles')
          .update({ 
            plan_id: planData.id,
            credits: planCredits
          })
          .eq('id', user.id);

        logStep("Updated user plan in database", { planId: planData.id, credits: planCredits });
      }
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_name: planName,
      product_id: productId,
      subscription_end: subscriptionEnd,
      stripe_subscription_id: stripeSubscriptionId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
