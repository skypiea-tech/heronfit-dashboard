import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        text: "#050316",
        background: "#fbfbfe",
        primary: "#2f27ce",
        secondary: "#dddbff",
        accent: "#443dff",
      },
      fontFamily: {
        header: ["Clash Display", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
