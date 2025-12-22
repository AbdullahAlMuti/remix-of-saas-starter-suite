import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        amazon: "hsl(var(--amazon-orange))",
        ebay: "hsl(var(--ebay-blue))",
        success: "hsl(var(--success))",
        /* Named palette colors for direct use */
        "heaven": "hsl(0, 0%, 100%)",
        "cascading": "hsl(0, 9%, 97%)",
        "steam": "hsl(270, 2%, 87%)",
        "ice": "hsl(12, 6%, 74%)",
        "indigo-light": "hsl(227, 56%, 61%)",
        "sandpiper": "hsl(180, 1%, 45%)",
        /* Warm/Landing page tokens */
        "warm-glow": "hsl(var(--warm-glow))",
        "warm-accent": "hsl(var(--warm-accent))",
        "warm-text": "hsl(var(--warm-text))",
        "warm-text-muted": "hsl(var(--warm-text-muted))",
        "warm-border": "hsl(var(--warm-border))",
        "warm-cta": "hsl(var(--warm-cta))",
        "warm-cta-hover": "hsl(var(--warm-cta-hover))",
        "warm-cta-text": "hsl(var(--warm-cta-text))",
        "warm-star": "hsl(var(--warm-star))",
        "warm-trust": "hsl(var(--warm-trust))",
        "warm-chrome": "hsl(var(--warm-chrome))",
        "warm-tab-bg": "hsl(var(--warm-tab-bg))",
        "warm-card": "hsl(var(--warm-card))",
        "warm-flow": "hsl(var(--warm-flow))",
        "warm-badge": "hsl(var(--warm-badge))",
        /* Soft platform colors */
        "amazon-soft": "hsl(33, 60%, 95%)",
        "amazon-text": "hsl(33, 80%, 40%)",
        "ebay-soft": "hsl(211, 60%, 95%)",
        "ebay-text": "hsl(211, 80%, 45%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.15s ease-out",
        "accordion-up": "accordion-up 0.15s ease-out",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-warm": "linear-gradient(180deg, hsl(var(--warm-bg)) 0%, hsl(var(--background)) 100%)",
      },
      boxShadow: {
        "warm-cta": "0 4px 14px hsl(var(--warm-cta) / 0.25)",
        "warm-card": "0 4px 20px hsl(var(--warm-border) / 0.5)",
        "warm-brand": "0 8px 24px hsl(var(--warm-accent) / 0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
