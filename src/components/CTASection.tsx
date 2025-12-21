import { forwardRef } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="py-24 relative">
      <div className="container px-4">
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
          
          {/* Content card */}
          <div className="relative glass-card p-12 md:p-16 rounded-3xl gradient-border">
            <div className="inline-flex p-4 rounded-2xl bg-primary/20 mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Ready to Automate Your
              <span className="gradient-text block">Dropshipping Empire?</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              Join thousands of sellers who have eliminated manual work and scaled 
              their businesses with Snipinal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="glass" size="lg">
                Schedule Demo
              </Button>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

CTASection.displayName = "CTASection";

export default CTASection;
