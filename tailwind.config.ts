import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        jumpin: {
          primary: "#f97316",
          secondary: "#fb923c",
          accent: "#fdba74",
        },
      },
      keyframes: {
        "pulse-orange": {
          "0%": {
            boxShadow:
              "0 10px 30px -5px rgba(249, 115, 22, 0.5), 0 0 0 0px rgba(249, 115, 22, 0.1)",
          },
          "70%": {
            boxShadow:
              "0 10px 30px -5px rgba(249, 115, 22, 0.5), 0 0 0 15px rgba(249, 115, 22, 0)",
          },
          "100%": {
            boxShadow:
              "0 10px 30px -5px rgba(249, 115, 22, 0.5), 0 0 0 0px rgba(249, 115, 22, 0)",
          },
        },
      },
      animation: {
        "pulse-orange": "pulse-orange 3s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
