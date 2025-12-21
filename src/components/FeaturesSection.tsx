import { 
  Sparkles, 
  Image, 
  FileText, 
  ShoppingCart, 
  BarChart3, 
  Cpu 
} from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Enhanced Titles",
    description: "Gemini-powered title generation that optimizes for eBay search algorithms and buyer psychology.",
    gradient: "from-primary to-purple-500",
  },
  {
    icon: <Image className="w-6 h-6" />,
    title: "Smart Image Processing",
    description: "Auto watermarking, background removal, and high-resolution extraction from any Amazon listing.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "One-Click Listing",
    description: "Opti-List fills every field automatically — SKU, pricing, item specifics, and HTML descriptions.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: <ShoppingCart className="w-6 h-6" />,
    title: "Auto-Order Engine",
    description: "State-machine checkout flow that handles address injection and stops safely at payment review.",
    gradient: "from-accent to-primary",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Real-Time Dashboard",
    description: "Profit Pulse and Growth Velocity charts give you instant business health insights.",
    gradient: "from-primary to-accent",
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "Chrome Extension",
    description: "Manifest V3 powered extension with content scripts that inject directly into Amazon & eBay.",
    gradient: "from-accent to-emerald-500",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Powerful Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="gradient-text block">Scale Your Business</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete automation toolkit designed for serious dropshippers who want to 
            eliminate manual work and maximize efficiency.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {features.map((feature, index) => (
            <div
              key={index}
              className="animate-slide-up group relative glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300"
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}>
                <span className="text-primary-foreground">{feature.icon}</span>
              </div>
              
              {/* Content */}
              <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover gradient border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 via-purple-500/0 to-pink-500/0 group-hover:from-primary/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
