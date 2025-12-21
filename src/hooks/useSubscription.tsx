import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface SubscriptionState {
  subscribed: boolean;
  planName: string;
  productId: string | null;
  subscriptionEnd: string | null;
  stripeSubscriptionId: string | null;
  isLoading: boolean;
}

// Plan configuration with Stripe IDs
export const PLANS = {
  free: {
    name: 'free',
    displayName: 'Free',
    priceMonthly: 0,
    stripePriceId: null,
    features: ['5 credits/month', '10 max listings', 'Basic support'],
  },
  starter: {
    name: 'starter',
    displayName: 'Starter',
    priceMonthly: 19.99,
    stripePriceId: 'price_1SguJ5QwaGJD4waN2IZoN1fG',
    productId: 'prod_TeCiCCFNeORn9S',
    features: ['50 credits/month', '100 max listings', 'Priority support', 'Auto-ordering'],
  },
  growth: {
    name: 'growth',
    displayName: 'Growth',
    priceMonthly: 49.99,
    stripePriceId: 'price_1SguJPQwaGJD4waNEGhgKxIi',
    productId: 'prod_TeCiyupNyVBR05',
    features: ['200 credits/month', '500 max listings', '24/7 support', 'Advanced analytics'],
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    priceMonthly: 149.99,
    stripePriceId: 'price_1SguJYQwaGJD4waNYI2GvWuG',
    productId: 'prod_TeCivsSU28U4G1',
    features: ['Unlimited credits', 'Unlimited listings', 'Dedicated support', 'Custom integrations'],
  },
} as const;

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    subscribed: false,
    planName: 'free',
    productId: null,
    subscriptionEnd: null,
    stripeSubscriptionId: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscription(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setSubscription({
        subscribed: data.subscribed,
        planName: data.plan_name || 'free',
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
        stripeSubscriptionId: data.stripe_subscription_id,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(prev => ({ ...prev, isLoading: false }));
    }
  }, [session?.access_token]);

  const createCheckout = async (planName: keyof typeof PLANS) => {
    if (!session?.access_token) {
      toast.error('Please log in to subscribe');
      return;
    }

    const plan = PLANS[planName];
    if (!plan.stripePriceId) {
      toast.error('This plan does not support checkout');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: plan.stripePriceId,
          planId: planName,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session');
    }
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      toast.error('Please log in to manage your subscription');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal');
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setSubscription({
        subscribed: false,
        planName: 'free',
        productId: null,
        subscriptionEnd: null,
        stripeSubscriptionId: null,
        isLoading: false,
      });
    }
  }, [user, checkSubscription]);

  // Refresh subscription status periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    ...subscription,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    currentPlan: PLANS[subscription.planName as keyof typeof PLANS] || PLANS.free,
  };
}
