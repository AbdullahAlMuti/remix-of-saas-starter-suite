import { forwardRef, useRef } from "react";
import { Check, Zap, Rocket, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

const planIcons = {
  free: Crown,
  starter: Zap,
  growth: Rocket,
  enterprise: Building2,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    }
  },
};

const PricingSection = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCheckout, planName: currentPlanName } = useSubscription();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  const handlePlanSelect = async (planKey: string) => {
    const plan = PLANS[planKey as keyof typeof PLANS];
    
    if (!user) {
      if (plan.stripePriceId) {
        navigate('/register', { state: { selectedPlan: planKey } });
      } else {
        navigate('/auth');
      }
      return;
    }

    if (plan.stripePriceId) {
      await createCheckout(planKey as keyof typeof PLANS);
    } else {
      navigate('/dashboard/subscription');
    }
  };

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10 px-4">
        {/* Section header */}
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Choose Your
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Automation Level
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free and upgrade as you grow. All plans include core automation features.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <motion.div 
          ref={containerRef}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {Object.entries(PLANS).map(([key, plan]) => {
            const Icon = planIcons[key as keyof typeof planIcons];
            const isCurrentPlan = currentPlanName === key && !!user;
            const isFeatured = key === 'growth';
            const isPaid = plan.priceMonthly > 0;

            return (
              <motion.div
                key={key}
                className={cn(
                  "relative rounded-3xl p-8 transition-all duration-300 bg-card border",
                  isFeatured 
                    ? "border-primary shadow-lg shadow-primary/10" 
                    : "border-border",
                  isCurrentPlan && "ring-2 ring-success"
                )}
                variants={cardVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                {/* Featured badge */}
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-success text-primary-foreground text-sm font-semibold">
                      Your Plan
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="text-center mb-8">
                  <motion.div 
                    className={cn(
                      "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4",
                      isFeatured ? "bg-primary/20" : "bg-primary/10"
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h3 className="font-display text-xl font-semibold mb-2 text-foreground">{plan.displayName}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="font-display text-4xl font-bold text-foreground">${plan.priceMonthly}</span>
                    {isPaid && <span className="text-muted-foreground">/month</span>}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center",
                        isFeatured ? "bg-primary/20" : "bg-success/20"
                      )}>
                        <Check className={cn(
                          "w-3 h-3",
                          isFeatured ? "text-primary" : "text-success"
                        )} />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    variant={isFeatured ? "default" : "outline"} 
                    className={cn(
                      "w-full h-12",
                      isFeatured && "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                    )}
                    disabled={isCurrentPlan}
                    onClick={() => handlePlanSelect(key)}
                  >
                    {isCurrentPlan 
                      ? 'Current Plan' 
                      : !isPaid 
                        ? 'Get Started Free' 
                        : 'Upgrade Now'}
                  </Button>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust badges */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-muted-foreground text-sm">
            All plans include 14-day money-back guarantee • Cancel anytime • Secure payment via Stripe
          </p>
        </motion.div>
      </div>
    </section>
  );
});

PricingSection.displayName = "PricingSection";

export default PricingSection;
