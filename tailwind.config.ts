import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      // Legacy header breakpoints for pixel parity
      sm2: "576px",
      md2: "768px",
      lg2: "992px",
      xl2: "1200px",
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // legacy palette passthroughs
        bg: {
          100: "hsl(var(--bg-100, 0 0% 100%))",
          200: "hsl(var(--bg-200, 210 40% 96.1%))",
          300: "hsl(var(--bg-300, 214.3 31.8% 91.4%))",
          400: "hsl(var(--bg-400, 217.2 32.6% 17.5%))",
          500: "hsl(var(--bg-500, 222 47% 8%))",
          600: "hsl(var(--bg-600, 224 47% 6%))",
          700: "hsl(var(--bg-700, 222 47% 10%))",
          800: "hsl(var(--bg-800, 223 40% 18%))",
          900: "hsl(var(--bg-900, 222 47% 5%))",
        },
        blue: {
          300: "hsl(var(--blue-300, 213 94% 68%))",
          500: "hsl(var(--blue-500, 217 91% 60%))",
          700: "hsl(var(--blue-700, 221 83% 53%))",
        },
        green: {
          500: "hsl(var(--green-500, 142 71% 45%))",
        },
        yellow: {
          500: "hsl(var(--yellow-500, 45 93% 57%))",
        },
        red: {
          500: "hsl(var(--red-500, 0 84% 60%))",
        },
        text: {
          100: "hsl(var(--text-100, 210 40% 98%))",
          400: "hsl(var(--text-400, 215 20% 65%))",
          500: "hsl(var(--text-500, 215 20% 65%))",
          900: "hsl(var(--text-900, 222.2 84% 4.9%))",
        },
        shadow: {
          100: "hsl(var(--shadow-100, 223 40% 18%))",
          200: "hsl(var(--shadow-200, 223 40% 16%))",
          300: "hsl(var(--shadow-300, 223 40% 14%))",
          600: "hsl(var(--shadow-600, 223 40% 12%))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      keyframes: {
        spin: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [
    animate,
    function ({ addUtilities }: any) {
      addUtilities({
        ".image-pixelated": { imageRendering: "pixelated" },
      })
    },
  ],
} satisfies Config
