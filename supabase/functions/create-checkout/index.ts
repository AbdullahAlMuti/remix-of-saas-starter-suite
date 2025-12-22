import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { priceId, planId, couponCode } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Request parsed", { priceId, planId, couponCode: couponCode ? "provided" : "none" });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Handle coupon if provided
    let stripeCouponId = null;
    let couponData = null;

    if (couponCode) {
      // Validate coupon from our database
      const { data: coupon, error: couponError } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (couponError || !coupon) {
        logStep("Coupon not found or inactive", { couponCode });
        throw new Error("Invalid coupon code");
      }

      // Validate coupon dates
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

      if (now < validFrom) {
        throw new Error("This coupon is not yet active");
      }
      if (validUntil && now > validUntil) {
        throw new Error("This coupon has expired");
      }

      // Validate usage limits
      if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
        throw new Error("This coupon has reached its usage limit");
      }

      // Check one-time per user
      if (coupon.is_one_time_per_user) {
        const { data: existingUsage } = await supabaseClient
          .from("coupon_usages")
          .select("id")
          .eq("coupon_id", coupon.id)
          .eq("user_id", user.id)
          .limit(1);

        if (existingUsage && existingUsage.length > 0) {
          throw new Error("You have already used this coupon");
        }
      }

      // Check applicable plans
      if (coupon.applicable_plans && coupon.applicable_plans.length > 0) {
        if (!coupon.applicable_plans.includes(planId)) {
          throw new Error("This coupon is not valid for the selected plan");
        }
      }

      logStep("Coupon validated", { couponId: coupon.id, discountType: coupon.discount_type });
      couponData = coupon;

      // Create a Stripe coupon for this checkout
      try {
        const stripeCouponParams: Stripe.CouponCreateParams = {
          duration: 'once',
          metadata: {
            internal_coupon_id: coupon.id,
            internal_coupon_code: coupon.code
          }
        };

        if (coupon.discount_type === 'percentage') {
          stripeCouponParams.percent_off = coupon.discount_value;
        } else {
          stripeCouponParams.amount_off = Math.round(coupon.discount_value * 100); // Convert to cents
          stripeCouponParams.currency = 'usd';
        }

        const stripeCoupon = await stripe.coupons.create(stripeCouponParams);
        stripeCouponId = stripeCoupon.id;
        logStep("Stripe coupon created", { stripeCouponId });
      } catch (stripeError) {
        logStep("Error creating Stripe coupon", { error: stripeError });
        throw new Error("Failed to apply coupon");
      }
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/checkout/success?plan=${planId}`,
      cancel_url: `${req.headers.get("origin")}/#pricing`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        coupon_id: couponData?.id || null,
        coupon_code: couponData?.code || null,
      },
    };

    // Apply coupon discount if we have one
    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url, hasCoupon: !!stripeCouponId });

    // If we have a coupon, record the usage attempt (will be confirmed by webhook later)
    if (couponData) {
      // Update used_count optimistically
      await supabaseClient
        .from("coupons")
        .update({ used_count: couponData.used_count + 1 })
        .eq("id", couponData.id);

      // Record usage
      await supabaseClient
        .from("coupon_usages")
        .insert({
          coupon_id: couponData.id,
          user_id: user.id,
          stripe_session_id: session.id,
          discount_applied: couponData.discount_type === 'percentage' 
            ? 0 // Will be calculated after payment
            : couponData.discount_value
        });

      logStep("Coupon usage recorded", { couponId: couponData.id });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
