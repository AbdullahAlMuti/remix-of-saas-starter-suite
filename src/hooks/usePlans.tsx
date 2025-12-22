import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  max_listings: number;
  max_auto_orders: number;
  credits_per_month: number;
  is_active: boolean;
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        const formattedPlans: Plan[] = (data || []).map(plan => ({
          id: plan.id,
          name: plan.name,
          display_name: plan.display_name,
          price_monthly: plan.price_monthly || 0,
          price_yearly: plan.price_yearly || 0,
          features: Array.isArray(plan.features) 
            ? (plan.features as unknown as string[]) 
            : [],
          stripe_price_id_monthly: plan.stripe_price_id_monthly,
          stripe_price_id_yearly: plan.stripe_price_id_yearly,
          max_listings: plan.max_listings || 0,
          max_auto_orders: plan.max_auto_orders || 0,
          credits_per_month: plan.credits_per_month || 0,
          is_active: plan.is_active ?? true,
        }));

        setPlans(formattedPlans);
      } catch (err: any) {
        setError(err.message || 'Failed to load plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getPlanByName = (name: string) => plans.find(p => p.name === name);
  const getPlanById = (id: string) => plans.find(p => p.id === id);

  return {
    plans,
    isLoading,
    error,
    getPlanByName,
    getPlanById,
  };
}
