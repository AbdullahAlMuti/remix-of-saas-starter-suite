import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  features: string[];
  stripe_price_id_monthly: string | null;
}

interface CouponData {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  maxDiscountAmount: number | null;
}

export default function SelectPlan() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  const { user, isLoading: authLoading } = useAuth();
  const { createCheckout, subscribed, planName, isLoading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  // If user is logged in and has an active paid subscription, redirect to dashboard
  useEffect(() => {
    if (!authLoading && !subscriptionLoading && user && subscribed && planName && planName !== 'free') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, subscribed, planName, authLoading, subscriptionLoading, navigate]);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        toast.error('Failed to load plans');
        return;
      }

      const formattedPlans: Plan[] = data.map(plan => ({
        id: plan.id,
        name: plan.name,
        display_name: plan.display_name,
        price_monthly: plan.price_monthly || 0,
        features: Array.isArray(plan.features) 
          ? (plan.features as unknown as string[]) 
          : [],
        stripe_price_id_monthly: plan.stripe_price_id_monthly,
      }));

      setPlans(formattedPlans);
      setIsLoading(false);
    };

    fetchPlans();
  }, []);

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const response = await supabase.functions.invoke('validate-coupon', {
        body: {
          code: couponCode.trim(),
          planId: selectedPlan,
          orderAmount: plan.price_monthly
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.valid) {
        setAppliedCoupon(result.coupon);
        toast.success('Coupon applied successfully!');
      } else {
        setCouponError(result.error || 'Invalid coupon code');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getDisplayPrice = (plan: Plan) => {
    if (appliedCoupon && selectedPlan === plan.id) {
      return plan.price_monthly - appliedCoupon.discountAmount;
    }
    return plan.price_monthly;
  };

  const handleSelectPlan = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    // If user is not logged in, save plan selection and redirect to signup
    if (!user) {
      localStorage.setItem('selectedPlanId', selectedPlan);
      localStorage.setItem('selectedPlanName', plan.name);
      if (appliedCoupon) {
        localStorage.setItem('appliedCouponCode', appliedCoupon.code);
      }
      navigate('/auth', { state: { mode: 'signup', selectedPlan: plan } });
      return;
    }

    // User is logged in - proceed to checkout if plan has a Stripe price
    if (!plan.stripe_price_id_monthly) {
      // No Stripe price - shouldn't happen but handle gracefully
      toast.error('This plan is not available for checkout');
      return;
    }

    setIsCheckingOut(true);

    try {
      const { url, error } = await createCheckout(
        plan.stripe_price_id_monthly,
        false,
        appliedCoupon?.code
      );

      if (error) {
        toast.error(error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-2xl font-display font-bold text-foreground">SellerSuit</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground">
            {user 
              ? 'Select a plan to complete your subscription'
              : 'Select a plan to get started with your 14-day trial'
            }
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.slice(0, 3).map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isFree = plan.name === 'free';
            
            return (
              <motion.div
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setAppliedCoupon(null);
                  setCouponCode('');
                  setCouponError(null);
                }}
                className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}

                {/* Popular badge */}
                {plan.name === 'starter' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      <Sparkles className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground">{plan.display_name}</h3>
                  {isFree && (
                    <p className="text-sm text-muted-foreground">14-day trial</p>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      ${isSelected && appliedCoupon 
                        ? getDisplayPrice(plan).toFixed(2) 
                        : plan.price_monthly.toFixed(2)}
                    </span>
                    {isFree ? (
                      <span className="text-muted-foreground">/once</span>
                    ) : (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  {isSelected && appliedCoupon && (
                    <p className="text-sm text-green-500 mt-1">
                      Coupon applied: {appliedCoupon.code}
                    </p>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Coupon Input - only show for logged in users */}
        {selectedPlan && user && (
          <div className="max-w-md mx-auto mb-8">
            <div className="space-y-3">
              <span className="text-sm font-medium">Have a coupon code?</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground uppercase"
                  disabled={isValidatingCoupon || !!appliedCoupon}
                />
                {appliedCoupon ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button 
                    onClick={validateCoupon} 
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    variant="outline"
                  >
                    {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                )}
              </div>
              {couponError && (
                <p className="text-sm text-destructive">{couponError}</p>
              )}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <Button
            variant="hero"
            size="lg"
            onClick={handleSelectPlan}
            disabled={!selectedPlan || isCheckingOut}
            className="min-w-[200px]"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : user ? (
              'Continue to Payment'
            ) : (
              'Continue to Sign Up'
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            All plans include a 14-day trial period. Cancel anytime.
          </p>
          
          {/* Login link for existing users */}
          {!user && (
            <p className="text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/auth')}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
