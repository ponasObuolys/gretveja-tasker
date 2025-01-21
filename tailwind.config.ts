import type { Config } from "tailwindcss";
import { colors } from "./src/theme/colors";
import { keyframes, animation } from "./src/theme/animations";
import { borderRadius } from "./src/theme/radius";
import { container } from "./src/theme/container";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container,
    extend: {
      colors,
      borderRadius,
      keyframes,
      animation
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;