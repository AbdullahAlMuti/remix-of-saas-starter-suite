import { ArrowRight, Play, Video, Target, ShieldCheck, MessageCircle, Package, Users, DollarSign, Laptop, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

const workflowSteps = [
  {
    title: "Product Listed",
    description: "List products on eBay at your desired markup price",
    position: "top-left"
  },
  {
    title: "Buyer Purchases",
    description: "Customer buys your product and pays you directly",
    position: "top-right"
  },
  {
    title: "You Fulfill from Supplier",
    description: "Purchase the item from your supplier at a lower cost",
    position: "bottom-left"
  },
  {
    title: "You Keep the Profit",
    description: "The difference between what you charged and what you paid is pure profit",
    position: "bottom-right"
  }
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

const CourseSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Hero Section with Gradient */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-accent py-20">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
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
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground leading-tight mb-6">
                The #1 eBay Dropshipping Course to{" "}
                <span className="text-accent-foreground/90">Build a Profitable Online Business</span>
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg">
                Get 75+ step-by-step lessons, lifetime updates, proven strategies, and direct access to your mentor, backed by a 14-day risk-free guarantee.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-10">
                <Button 
                  size="lg"
                  className="h-14 px-8 bg-background hover:bg-background/90 text-foreground font-semibold rounded-xl shadow-lg"
                >
                  ENROLL NOW!
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 bg-transparent border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground font-semibold rounded-xl"
                >
                  <Play className="w-5 h-5 mr-2 fill-primary-foreground" />
                  Watch Overview
                </Button>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-primary-foreground">$199</span>
                  <span className="text-2xl text-primary-foreground/50 line-through">$399</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background/10 border border-primary-foreground/20">
                  <span className="text-xl">🎉</span>
                  <span className="text-primary-foreground font-medium">
                    You Save $200 <span className="text-success font-bold">(50% OFF)</span>
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right - Visual Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative bg-gradient-to-br from-background/20 to-background/5 backdrop-blur-sm rounded-3xl p-8 border border-primary-foreground/10">
                <div className="aspect-video bg-background/10 rounded-2xl flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-background/20 flex items-center justify-center cursor-pointer hover:bg-background/30 transition-all hover:scale-105">
                    <Play className="w-10 h-10 text-primary-foreground fill-primary-foreground/20" />
                  </div>
                </div>
                {/* Floating card */}
                <motion.div 
                  className="absolute -right-4 -bottom-4 bg-card rounded-xl p-4 shadow-xl border border-border"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <p className="text-xs text-muted-foreground mb-1">My eCommerce Journey</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-sm font-semibold text-foreground">Profitable</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Course Features Bar */}
      <div className="bg-card border-y border-border py-8">
        <div className="container px-4">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
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
                  className="text-center md:text-left"
                  variants={itemVariants}
                >
                  <Icon className="w-8 h-8 text-primary mx-auto md:mx-0 mb-3" />
                  <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Why It Works Section */}
      <div className="bg-secondary/30 py-20">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why eBay Dropshipping Works!
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No inventory. No warehouse. No big startup costs. eBay dropshipping is the ultimate business model for beginners who want real profits without the risk.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
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
                  className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
                  variants={itemVariants}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Workflow Diagram */}
          <motion.div
            className="relative max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-2 gap-8 md:gap-12">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className={`relative bg-card rounded-2xl p-6 border-2 border-primary/30 shadow-sm ${
                    index % 2 === 1 ? 'mt-12' : ''
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                >
                  {/* Step indicator */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary-foreground" />
                  </div>
                  
                  <h4 className="font-semibold text-primary text-lg mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Connecting arrows - SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ zIndex: -1 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" className="fill-primary/50" />
                </marker>
              </defs>
              {/* Arrow paths would go here - simplified for now */}
            </svg>
          </motion.div>

          {/* Module count */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              There are 10 modules in this Course
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get a clear roadmap from beginner to advanced dropshipper with our 10-module course, packed with actionable strategies and proven systems.
            </p>
            <Button 
              className="mt-6 h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25"
            >
              View All Modules
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CourseSection;
