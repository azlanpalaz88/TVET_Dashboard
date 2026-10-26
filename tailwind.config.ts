import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#102A43",
        teal: "#0D9488",
        neon: "#F20D9A",
        blush: "#FFF3FA",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(16,42,67,.08)",
        neon: "0 0 28px rgba(242,13,154,.2)",
      },
    },
  },
  plugins: [],
} satisfies Config;
