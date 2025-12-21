import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for beginners testing the dropshipping waters.",
    features: [
      "50 listings per month",
      "Basic image processing",
      "Manual order management",
      "Email support",
      "Chrome extension access",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Professional",
    price: "$79",
    period: "/month",
    description: "For serious sellers scaling their operations.",
    features: [
      "Unlimited listings",
      "AI title optimization",
      "Auto watermarking",
      "Auto-order engine",
      "Priority support",
      "Advanced analytics",
      "Google Sheets sync",
    ],
    cta: "Get Started",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For high-volume operations with custom needs.",
    features: [
      "Everything in Professional",
      "Multiple eBay accounts",
      "Custom AI prompts",
      "Dedicated account manager",
      "API access",
      "White-label options",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const PricingSection = () => {
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
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`
                relative rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02]
                ${plan.featured 
                  ? 'gradient-border bg-card glow-effect' 
                  : 'glass-card'
                }
              `}
            >
              {/* Featured badge */}
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-primary-foreground text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-8">
                <h3 className="font-display text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="font-display text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.featured ? 'bg-primary/20' : 'bg-success/20'}`}>
                      <Check className={`w-3 h-3 ${plan.featured ? 'text-primary' : 'text-success'}`} />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button 
                variant={plan.featured ? "hero" : "outline"} 
                className="w-full"
                size="lg"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
