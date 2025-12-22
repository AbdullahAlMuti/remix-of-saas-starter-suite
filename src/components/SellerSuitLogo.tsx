import { motion } from "framer-motion";

interface SellerSuitLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const SellerSuitLogo = ({ size = "md", showText = true }: SellerSuitLogoProps) => {
  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-3xl" },
  };

  const { icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Background shield shape */}
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(262 83% 58%)" />
              <stop offset="100%" stopColor="hsl(280 70% 50%)" />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.3)" />
              <stop offset="100%" stopColor="hsl(280 70% 50% / 0.3)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Outer shield */}
          <path
            d="M32 4L8 14V30C8 44.36 18.12 57.52 32 60C45.88 57.52 56 44.36 56 30V14L32 4Z"
            fill="url(#shieldGradient)"
            filter="url(#glow)"
          />
          
          {/* Inner shield highlight */}
          <path
            d="M32 10L14 18V30C14 41.28 22.24 51.16 32 53.4C41.76 51.16 50 41.28 50 30V18L32 10Z"
            fill="url(#innerGradient)"
          />
          
          {/* S Letter - Stylized */}
          <path
            d="M38 22C38 22 36 20 32 20C28 20 24 22 24 26C24 30 28 31 32 32C36 33 40 34 40 38C40 42 36 44 32 44C28 44 26 42 26 42"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Upward arrow indicating growth */}
          <motion.path
            d="M32 16L36 20M32 16L28 20M32 16V24"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7], y: [0, -1, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
        
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-display ${text} font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent`}>
            SellerSuit
          </span>
        </div>
      )}
    </div>
  );
};

export default SellerSuitLogo;
