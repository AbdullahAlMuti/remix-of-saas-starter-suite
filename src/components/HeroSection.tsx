import { useState } from "react";
import { ArrowRight, Chrome, Star, Package, ShoppingCart, TrendingUp, Zap, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const featureTabs = [
  { id: 'listings', label: 'Smart Listings', icon: Package, description: 'AI-powered product listings that convert' },
  { id: 'orders', label: 'Auto Orders', icon: ShoppingCart, description: 'Automated order fulfillment from Amazon' },
  { id: 'analytics', label: 'Profit Tracker', icon: BarChart3, description: 'Real-time analytics and profit insights' },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');

  const handleStartAutomating = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleGetExtension = () => {
    // Chrome Web Store link (placeholder)
    window.open('https://chrome.google.com/webstore', '_blank');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-warm">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-warm-glow/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warm-accent/30 to-transparent" />
      </div>

      {/* Decorative rays (like in reference) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl overflow-hidden pointer-events-none">
        <svg className="w-full h-40 opacity-20" viewBox="0 0 800 160" fill="none">
          {[...Array(12)].map((_, i) => (
            <line 
              key={i}
              x1="400" 
              y1="0" 
              x2={100 + i * 55} 
              y2="160" 
              stroke="hsl(var(--warm-accent))" 
              strokeWidth="1"
              className="opacity-60"
            />
          ))}
        </svg>
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warm-badge border border-warm-accent/20">
            <span className="text-warm-accent text-sm font-medium">#1 eBay Dropshipping Extension</span>
            <div className="flex items-center gap-0.5 ml-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-warm-star text-warm-star" />
              ))}
            </div>
            <span className="text-warm-text-muted text-sm ml-1">4.9/5</span>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 text-warm-text">
            Scale Your eBay Store
            <br />
            <span className="text-warm-accent">With One Click</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-warm-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Snipinal is the all-in-one Chrome extension that automates product sourcing, 
            intelligent listings, and order fulfillment — so you can focus on growing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              onClick={handleStartAutomating}
              className="h-12 px-8 bg-warm-cta hover:bg-warm-cta-hover text-warm-cta-text font-semibold text-base rounded-xl shadow-warm-cta"
            >
              Start Now for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              onClick={handleGetExtension}
              variant="outline"
              className="h-12 px-8 bg-background hover:bg-muted border-warm-border text-warm-text font-semibold text-base rounded-xl"
            >
              <Chrome className="w-5 h-5 mr-2 text-warm-chrome" />
              Get Free Extension
            </Button>
          </div>

          {/* Feature Tabs */}
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-warm-tab-bg border border-warm-border">
              {featureTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive 
                        ? "bg-background text-warm-accent shadow-sm border-b-2 border-warm-accent" 
                        : "text-warm-text-muted hover:text-warm-text"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            
            {/* Tab content description */}
            <p className="mt-4 text-sm text-warm-text-muted">
              {featureTabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-warm-text-muted">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-warm-trust" />
              <span className="text-sm">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warm-trust" />
              <span className="text-sm">10x Faster Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warm-trust" />
              <span className="text-sm">AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Platform Flow Visual */}
        <div className="mt-16 relative max-w-2xl mx-auto">
          <div className="bg-warm-card border border-warm-border rounded-2xl p-6 shadow-warm-card">
            <div className="flex items-center justify-center gap-4 md:gap-8">
              {/* Amazon */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-amazon-soft flex items-center justify-center text-xl md:text-2xl font-bold text-amazon-text">
                  A
                </div>
                <span className="text-xs font-medium text-warm-text-muted">Amazon</span>
              </div>

              {/* Flow arrow */}
              <div className="flex items-center">
                <div className="w-8 md:w-12 h-0.5 bg-warm-flow rounded-full" />
                <div className="w-2 h-2 border-t-2 border-r-2 border-warm-accent rotate-45 -ml-1" />
              </div>

              {/* Snipinal */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-warm-accent flex items-center justify-center shadow-warm-brand">
                  <Zap className="w-8 h-8 md:w-10 md:h-10 text-warm-cta-text" />
                </div>
                <span className="text-xs font-bold text-warm-accent">Snipinal</span>
              </div>

              {/* Flow arrow */}
              <div className="flex items-center">
                <div className="w-8 md:w-12 h-0.5 bg-warm-flow rounded-full" />
                <div className="w-2 h-2 border-t-2 border-r-2 border-warm-accent rotate-45 -ml-1" />
              </div>

              {/* eBay */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-ebay-soft flex items-center justify-center text-xl md:text-2xl font-bold text-ebay-text">
                  e
                </div>
                <span className="text-xs font-medium text-warm-text-muted">eBay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
