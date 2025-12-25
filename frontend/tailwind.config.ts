import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // The design code uses `navy-900` / `navy-950`
        navy: {
          900: "#0B1B3A",
          950: "#07122A",
        },
        // Optional token-ish helpers
        brand: {
          navy: "#0B1B3A",
          navyDark: "#07122A",
          orange: "#FF6A2B",
          orangeDark: "#E85A1F",
          bg: "#F6F8FC",
        },
      },
    },
  },
  plugins: [],
};

export default config;
