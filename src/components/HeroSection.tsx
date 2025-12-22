import { useState, useEffect } from "react";
import { ArrowRight, Chrome, Star, Package, ShoppingCart, TrendingUp, Zap, Shield, BarChart3, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const featureTabs = [
  { id: 'listings', label: 'Smart Listings', icon: Package, description: 'AI-powered product listings that convert' },
  { id: 'orders', label: 'Auto Orders', icon: ShoppingCart, description: 'Automated order fulfillment from Amazon' },
  { id: 'analytics', label: 'Profit Tracker', icon: BarChart3, description: 'Real-time analytics and profit insights' },
];

const workflowSteps = [
  { label: "Find Product", sublabel: "Amazon" },
  { label: "AI Optimize", sublabel: "Snipinal" },
  { label: "List & Sell", sublabel: "eBay" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');
  const [activeStep, setActiveStep] = useState(0);

  // Animate through workflow steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleStartAutomating = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleGetExtension = () => {
    window.open('https://chrome.google.com/webstore', '_blank');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-5xl mx-auto">
          {/* Trust Badge */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">#1 eBay Dropshipping Extension</span>
              <div className="flex items-center gap-0.5 ml-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                ))}
              </div>
              <span className="text-muted-foreground text-sm ml-1">4.9/5</span>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground">
              Scale Your eBay Store
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                With One Click
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p 
            className="text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Snipinal is the all-in-one Chrome extension that automates product sourcing, 
            intelligent listings, and order fulfillment — so you can focus on growing.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button 
              onClick={handleStartAutomating}
              className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base rounded-xl shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Start Now for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              onClick={handleGetExtension}
              variant="outline"
              className="h-14 px-8 bg-background hover:bg-secondary border-border text-foreground font-semibold text-base rounded-xl"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Get Free Extension
            </Button>
          </motion.div>

          {/* Animated Workflow Demo */}
          <motion.div 
            className="relative max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
              {/* Workflow Steps */}
              <div className="flex items-center justify-between gap-4">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <motion.div 
                      className={cn(
                        "relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center transition-all duration-500",
                        activeStep === index 
                          ? "bg-primary shadow-lg shadow-primary/30 scale-110" 
                          : activeStep > index 
                            ? "bg-success/20 border-2 border-success"
                            : "bg-secondary border-2 border-border"
                      )}
                      animate={activeStep === index ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.5, repeat: activeStep === index ? Infinity : 0, repeatDelay: 1 }}
                    >
                      {activeStep > index ? (
                        <Check className="w-8 h-8 md:w-10 md:h-10 text-success" />
                      ) : index === 0 ? (
                        <span className={cn(
                          "text-2xl md:text-3xl font-bold",
                          activeStep === index ? "text-primary-foreground" : "text-foreground"
                        )}>A</span>
                      ) : index === 1 ? (
                        <Zap className={cn(
                          "w-8 h-8 md:w-10 md:h-10",
                          activeStep === index ? "text-primary-foreground" : "text-primary"
                        )} />
                      ) : (
                        <span className={cn(
                          "text-2xl md:text-3xl font-bold",
                          activeStep === index ? "text-primary-foreground" : "text-foreground"
                        )}>e</span>
                      )}
                      
                      {/* Pulse ring when active */}
                      {activeStep === index && (
                        <motion.div 
                          className="absolute inset-0 rounded-2xl border-2 border-primary"
                          animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    
                    <motion.div 
                      className="mt-3 text-center"
                      animate={{ opacity: activeStep >= index ? 1 : 0.5 }}
                    >
                      <p className={cn(
                        "font-semibold text-sm md:text-base",
                        activeStep === index ? "text-primary" : "text-foreground"
                      )}>{step.label}</p>
                      <p className="text-xs text-muted-foreground">{step.sublabel}</p>
                    </motion.div>
                  </div>
                ))}

                {/* Connecting arrows */}
                <div className="absolute top-10 md:top-12 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] flex items-center justify-between pointer-events-none">
                  {[0, 1].map((i) => (
                    <motion.div 
                      key={i}
                      className="flex items-center flex-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: activeStep > i ? 1 : 0.3 }}
                    >
                      <motion.div 
                        className={cn(
                          "flex-1 h-0.5 rounded-full",
                          activeStep > i ? "bg-success" : "bg-border"
                        )}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: activeStep > i ? 1 : 0.3 }}
                        transition={{ duration: 0.5, delay: activeStep > i ? 0.2 : 0 }}
                        style={{ transformOrigin: "left" }}
                      />
                      <motion.div 
                        className={cn(
                          "w-2 h-2 border-t-2 border-r-2 rotate-45 -ml-1",
                          activeStep > i ? "border-success" : "border-border"
                        )}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Status message */}
              <div className="mt-8 text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary"
                  >
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-success"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {activeStep === 0 && "Extracting product data from Amazon..."}
                      {activeStep === 1 && "AI optimizing title & calculating price..."}
                      {activeStep === 2 && "Publishing listing to eBay!"}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Feature Tabs */}
          <motion.div 
            className="max-w-xl mx-auto text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="inline-flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-secondary border border-border">
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
                        ? "bg-background text-primary shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.p 
                key={activeTab}
                className="mt-4 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {featureTabs.find(t => t.id === activeTab)?.description}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            className="mt-12 flex flex-wrap justify-center items-center gap-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-sm">10x Faster Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-success" />
              <span className="text-sm">AI-Powered</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
