import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartAutomating = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      // Scroll to pricing section
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-gradient noise-overlay">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center stagger-children">
          {/* Badge */}
          <div className="animate-slide-up mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium text-foreground/80">
              <Zap className="w-4 h-4 text-primary" />
              Professional Dropshipping Automation
            </span>
          </div>

          {/* Main headline */}
          <h1 className="animate-slide-up font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">From Amazon to eBay</span>
            <br />
            <span className="gradient-text">Fully Automated</span>
          </h1>

          {/* Subheadline */}
          <p className="animate-slide-up text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Snipinal is the all-in-one automation suite that handles product discovery, 
            intelligent listing, and order fulfillment — so you can scale without limits.
          </p>

          {/* CTA Buttons */}
          <div className="animate-slide-up flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button variant="hero" size="xl" onClick={handleStartAutomating}>
              Start Automating Now
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="lg">
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="animate-slide-up flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm">Secure & Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm">10x Faster Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-sm">AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Hero illustration - Platform flow */}
        <div className="mt-20 animate-slide-up relative max-w-3xl mx-auto">
          <div className="glass-card p-8 rounded-3xl glow-effect">
            <div className="flex items-center justify-center gap-4 md:gap-8">
              {/* Amazon */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl badge-amazon flex items-center justify-center text-2xl md:text-3xl font-bold">
                  A
                </div>
                <span className="text-sm font-medium text-muted-foreground">Amazon</span>
              </div>

              {/* Flow arrow */}
              <div className="flex items-center">
                <div className="w-8 md:w-16 h-1 bg-gradient-to-r from-amazon to-primary rounded-full" />
                <div className="w-3 h-3 border-t-2 border-r-2 border-primary rotate-45 -ml-1.5" />
              </div>

              {/* Snipinal */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center animate-pulse-glow">
                  <Zap className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
                </div>
                <span className="text-sm font-bold gradient-text">Snipinal</span>
              </div>

              {/* Flow arrow */}
              <div className="flex items-center">
                <div className="w-8 md:w-16 h-1 bg-gradient-to-r from-primary to-ebay rounded-full" />
                <div className="w-3 h-3 border-t-2 border-r-2 border-ebay rotate-45 -ml-1.5" />
              </div>

              {/* eBay */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl badge-ebay flex items-center justify-center text-2xl md:text-3xl font-bold">
                  e
                </div>
                <span className="text-sm font-medium text-muted-foreground">eBay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
