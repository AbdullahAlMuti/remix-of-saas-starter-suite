import { Check, Zap, Rocket, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, PLANS } from "@/hooks/useSubscription";

const planIcons = {
  free: Crown,
  starter: Zap,
  growth: Rocket,
  enterprise: Building2,
};

const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCheckout, planName: currentPlanName } = useSubscription();

  const handlePlanSelect = async (planKey: string) => {
    if (!user) {
      // Redirect to auth with plan selection intent
      navigate('/auth', { state: { from: { pathname: '/dashboard/subscription' }, selectedPlan: planKey } });
      return;
    }

    const plan = PLANS[planKey as keyof typeof PLANS];
    if (plan.stripePriceId) {
      await createCheckout(planKey as keyof typeof PLANS);
    } else {
      navigate('/dashboard/subscription');
    }
  };

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Choose Your
            <span className="gradient-text block">Automation Level</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free and upgrade as you grow. All plans include core automation features.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {Object.entries(PLANS).map(([key, plan], index) => {
            const Icon = planIcons[key as keyof typeof planIcons];
            const isCurrentPlan = currentPlanName === key && !!user;
            const isFeatured = key === 'growth';
            const isPaid = plan.priceMonthly > 0;

            return (
              <div
                key={key}
                className={`
                  relative rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02]
                  ${isFeatured 
                    ? 'gradient-border bg-card glow-effect' 
                    : 'glass-card'
                  }
                  ${isCurrentPlan ? 'ring-2 ring-primary' : ''}
                `}
              >
                {/* Featured badge */}
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-primary-foreground text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-success text-success-foreground text-sm font-semibold">
                      Your Plan
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{plan.displayName}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="font-display text-4xl font-bold">${plan.priceMonthly}</span>
                    {isPaid && <span className="text-muted-foreground">/month</span>}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isFeatured ? 'bg-primary/20' : 'bg-success/20'}`}>
                        <Check className={`w-3 h-3 ${isFeatured ? 'text-primary' : 'text-success'}`} />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button 
                  variant={isFeatured ? "hero" : "outline"} 
                  className="w-full"
                  size="lg"
                  disabled={isCurrentPlan}
                  onClick={() => handlePlanSelect(key)}
                >
                  {isCurrentPlan 
                    ? 'Current Plan' 
                    : !isPaid 
                      ? 'Get Started Free' 
                      : 'Upgrade Now'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            All plans include 14-day money-back guarantee • Cancel anytime • Secure payment via Stripe
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
