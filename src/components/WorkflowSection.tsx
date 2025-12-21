import { Search, Zap, Package, CheckCircle } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: <Search className="w-8 h-8" />,
    title: "Discover & Extract",
    description: "Browse Amazon and let Snipinal's injector automatically scrape product data, images, and specifications.",
    platform: "amazon",
  },
  {
    step: "02",
    icon: <Zap className="w-8 h-8" />,
    title: "AI Processing",
    description: "Titles are optimized with Gemini AI, images are watermarked, and pricing is calculated with your markup rules.",
    platform: "snipinal",
  },
  {
    step: "03",
    icon: <Package className="w-8 h-8" />,
    title: "Auto-List on eBay",
    description: "One click to Opti-List — all fields are filled automatically including item specifics and HTML descriptions.",
    platform: "ebay",
  },
  {
    step: "04",
    icon: <CheckCircle className="w-8 h-8" />,
    title: "Fulfill Orders",
    description: "When orders come in, the auto-order engine handles checkout on Amazon with buyer address injection.",
    platform: "complete",
  },
];

const WorkflowSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            End-to-End Automation
            <span className="gradient-text block">In Four Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From product discovery to order fulfillment, every step is streamlined and automated.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-primary/50 to-primary/10 hidden md:block" />
              )}
              
              <div className="flex gap-6 mb-8 group animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                {/* Step number & icon */}
                <div className="flex-shrink-0">
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center relative
                    ${step.platform === 'amazon' ? 'badge-amazon' : ''}
                    ${step.platform === 'ebay' ? 'badge-ebay' : ''}
                    ${step.platform === 'snipinal' ? 'bg-gradient-to-br from-primary via-purple-500 to-pink-500' : ''}
                    ${step.platform === 'complete' ? 'bg-success/20 text-success border border-success/30' : ''}
                  `}>
                    <span className={step.platform === 'snipinal' ? 'text-primary-foreground' : ''}>
                      {step.icon}
                    </span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs font-bold text-muted-foreground">{step.step}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="glass-card flex-1 p-6 rounded-2xl group-hover:scale-[1.01] transition-transform duration-300">
                  <h3 className="font-display text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
