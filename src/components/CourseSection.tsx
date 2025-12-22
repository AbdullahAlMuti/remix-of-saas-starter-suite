import { ArrowRight, Play, Video, Target, ShieldCheck, MessageCircle, Package, Users, DollarSign, Laptop, CheckCircle, TrendingUp, Zap, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const courseFeatures = [
  {
    icon: Video,
    title: "75+ Video Lessons",
    description: "Step-by-step training from setup to scaling."
  },
  {
    icon: Target,
    title: "Million-Dollar Strategies",
    description: "The exact methods used to succeed on eBay."
  },
  {
    icon: ShieldCheck,
    title: "Risk-Free Guarantee",
    description: "Try it for 14 days or get your money back."
  },
  {
    icon: MessageCircle,
    title: "Direct Access",
    description: "Get direct support from your course instructor."
  }
];

const whyItWorks = [
  {
    icon: Package,
    title: "No Inventory Needed",
    description: "You only buy products after you make a sale—so there's zero upfront investment in stock."
  },
  {
    icon: Users,
    title: "eBay Brings the Traffic",
    description: "No need to run ads. eBay already has millions of ready-to-buy shoppers every day."
  },
  {
    icon: DollarSign,
    title: "Simple Profit Model",
    description: "List items at a markup → When it sells, you buy it cheaper elsewhere → You keep the profit."
  },
  {
    icon: Laptop,
    title: "Sell from Anywhere",
    description: "All you need is a laptop and Wi-Fi. Run your business from home—or while traveling the world."
  }
];

const profitSteps = [
  { label: "List Product", profit: 0, icon: Package },
  { label: "Customer Pays", profit: 89.99, icon: DollarSign },
  { label: "Buy from Supplier", profit: -54.99, icon: TrendingUp },
  { label: "Your Profit!", profit: 35, icon: Zap, highlight: true }
];

const successStats = [
  { value: "2,500+", label: "Students Enrolled", icon: Users },
  { value: "$2.3M+", label: "Student Revenue", icon: DollarSign },
  { value: "4.9/5", label: "Course Rating", icon: Star },
  { value: "97%", label: "Success Rate", icon: BadgeCheck }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Animated counter component
const AnimatedCounter = ({ end, prefix = "", suffix = "", duration = 2000 }: { end: number; prefix?: string; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const timer = setTimeout(() => {
      setHasAnimated(true);
      let start = 0;
      const increment = end / (duration / 16);
      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(counter);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(counter);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [end, duration, hasAnimated]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const CourseSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Hero Section with Soft Gradient */}
      <div className="relative py-16 overflow-hidden">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 pointer-events-none" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          
          {/* Floating dollar signs */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-primary/20 text-4xl font-bold"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3
              }}
            >
              $
            </motion.div>
          ))}
          
          {/* Upward trending arrows */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`arrow-${i}`}
              className="absolute"
              style={{
                right: `${10 + i * 12}%`,
                bottom: `${10 + i * 8}%`,
              }}
              animate={{
                y: [0, -30],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: i * 0.5
              }}
            >
              <TrendingUp className="w-8 h-8 text-success/40" />
            </motion.div>
          ))}
        </div>

        <div className="container relative z-10 px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Trust badge */}
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 border border-success/30 mb-6"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-foreground">
                  🔥 347 people enrolled this week
                </span>
              </motion.div>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Turn <span className="text-success">$0</span> Into a{" "}
                <span className="relative">
                  <span className="relative z-10">Profitable</span>
                  <motion.span 
                    className="absolute bottom-2 left-0 right-0 h-3 bg-success/30 -z-0"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  />
                </span>{" "}
                eBay Business
              </h1>
              
              <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-lg">
                Join <span className="text-success font-semibold">2,500+ students</span> who are already making money with our proven dropshipping system. No inventory. No experience needed.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    size="lg"
                    className="h-16 px-10 bg-success hover:bg-success/90 text-success-foreground font-bold text-lg rounded-2xl shadow-lg shadow-success/30"
                  >
                    START MAKING MONEY NOW
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                </motion.div>
                <Button 
                  variant="outline"
                  size="lg"
                  className="h-16 px-8 border-2 border-primary/30 hover:bg-primary/10 text-foreground font-semibold rounded-2xl"
                >
                  <Play className="w-5 h-5 mr-2 fill-primary" />
                  Watch Free Preview
                </Button>
              </div>

              {/* Pricing with urgency */}
              <div className="space-y-4">
                <div className="flex items-baseline gap-4">
                  <motion.span 
                    className="text-6xl font-bold text-foreground"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    $199
                  </motion.span>
                  <span className="text-3xl text-muted-foreground line-through">$399</span>
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground text-sm font-bold rounded-lg animate-pulse">
                    50% OFF
                  </span>
                </div>
                <motion.div 
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-destructive/20 border border-destructive/30"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-2xl">⏰</span>
                  <span className="text-foreground font-medium">
                    Sale ends in <span className="font-bold text-destructive">2 days 14 hours</span>
                  </span>
                </motion.div>
              </div>
            </motion.div>

            {/* Right - Profit Visualization */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Profit Flow Card */}
              <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-success" />
                  How You Make Money
                </h3>

                {/* Profit Steps */}
                <div className="space-y-4 mb-8">
                  {profitSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === profitSteps.length - 1;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + index * 0.15 }}
                        className="relative"
                      >
                        <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          step.highlight 
                            ? 'bg-success/10 border-success shadow-lg shadow-success/20' 
                            : 'bg-muted/50 border-border'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              step.highlight ? 'bg-success text-success-foreground' : 'bg-primary/10 text-primary'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className={`font-medium ${step.highlight ? 'text-success font-bold' : 'text-foreground'}`}>
                              {step.label}
                            </span>
                          </div>
                          <motion.span 
                            className={`text-lg font-bold ${
                              step.profit > 0 
                                ? step.highlight ? 'text-success text-2xl' : 'text-success' 
                                : step.profit < 0 
                                  ? 'text-destructive' 
                                  : 'text-muted-foreground'
                            }`}
                            animate={step.highlight ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            {step.profit > 0 ? '+' : ''}{step.profit === 0 ? '—' : `$${Math.abs(step.profit).toFixed(2)}`}
                          </motion.span>
                        </div>
                        
                        {/* Connecting arrow */}
                        {!isLast && (
                          <motion.div 
                            className="absolute left-7 -bottom-2 text-muted-foreground/50"
                            animate={{ y: [0, 3, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            ↓
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Monthly projection */}
                <motion.div 
                  className="bg-gradient-to-r from-success/20 to-primary/20 rounded-2xl p-6 border border-success/30"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-sm text-muted-foreground mb-2">
                    If you make just 5 sales per day...
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-success">
                      $<AnimatedCounter end={5250} />
                    </span>
                    <span className="text-muted-foreground">/month potential profit</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-success">
                    <TrendingUp className="w-4 h-4" />
                    <span>Top students earn $10,000+/month</span>
                  </div>
                </motion.div>

                {/* Floating testimonial */}
                <motion.div 
                  className="absolute -right-4 -top-4 bg-card rounded-xl p-4 shadow-xl border border-border max-w-[200px]"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    "Made my first $500 in week 2!"
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-1">— Sarah K.</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Success Stats Bar */}
      <div className="bg-gradient-to-r from-success/10 via-primary/10 to-success/10 border-y border-border py-8">
        <div className="container px-4">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {successStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={index} 
                  className="text-center"
                  variants={itemVariants}
                >
                  <Icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Course Features Bar */}
      <div className="bg-card border-b border-border py-12">
        <div className="container px-4">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {courseFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={index} 
                  className="text-center md:text-left group"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto md:mx-0 mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Why It Works Section */}
      <div className="bg-gradient-to-b from-background to-secondary/30 py-24">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-2 bg-success/10 text-success font-semibold rounded-full text-sm mb-4">
              PROVEN BUSINESS MODEL
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why eBay Dropshipping <span className="text-success">Works!</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              No inventory. No warehouse. No big startup costs. eBay dropshipping is the ultimate business model for beginners who want real profits without the risk.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {whyItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-card rounded-3xl p-8 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all group"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-success/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 5 }}
                  >
                    <Icon className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h4 className="font-bold text-lg text-foreground mb-3">{item.title}</h4>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Visual Profit Flow */}
          <motion.div
            className="relative max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h3 className="font-display text-3xl font-bold text-foreground mb-2">
                Your Path to Profits
              </h3>
              <p className="text-muted-foreground">A simple 4-step process anyone can follow</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: 1, title: "List Products", desc: "Find winning products and list them on eBay", icon: Package, color: "primary" },
                { step: 2, title: "Make Sales", desc: "eBay buyers purchase your listings", icon: DollarSign, color: "success" },
                { step: 3, title: "Order & Ship", desc: "Buy from supplier, ship to customer", icon: TrendingUp, color: "accent" },
                { step: 4, title: "Keep Profits", desc: "The difference is pure profit!", icon: Zap, color: "success" }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    className="relative"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                  >
                    {/* Connector line */}
                    {index < 3 && (
                      <motion.div 
                        className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 z-0"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.15, duration: 0.5 }}
                        style={{ transformOrigin: 'left' }}
                      />
                    )}
                    
                    <motion.div 
                      className="relative bg-card rounded-2xl p-6 border-2 border-border hover:border-primary/50 transition-all z-10 h-full"
                      whileHover={{ scale: 1.02, y: -3 }}
                    >
                      <motion.div 
                        className={`w-14 h-14 rounded-full bg-${item.color}/10 flex items-center justify-center mb-4 mx-auto`}
                        animate={index === 3 ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-2xl font-bold text-primary">{item.step}</span>
                      </motion.div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                        <Icon className={`w-6 h-6 ${index === 3 ? 'text-success' : 'text-primary'}`} />
                      </div>
                      <h4 className="font-bold text-foreground text-center mb-2">{item.title}</h4>
                      <p className="text-sm text-muted-foreground text-center">{item.desc}</p>
                      
                      {index === 3 && (
                        <motion.div 
                          className="absolute -top-2 -right-2"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <span className="text-2xl">💰</span>
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div 
            className="text-center mt-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Start Your eBay Empire?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join 2,500+ successful students. Get lifetime access to 75+ lessons, proven strategies, and direct mentor support.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="lg"
                className="h-16 px-12 bg-gradient-to-r from-success to-primary hover:opacity-90 text-primary-foreground font-bold text-lg rounded-2xl shadow-xl shadow-primary/30"
              >
                ENROLL NOW — ONLY $199
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success" />
              14-Day Money-Back Guarantee • Instant Access
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CourseSection;
