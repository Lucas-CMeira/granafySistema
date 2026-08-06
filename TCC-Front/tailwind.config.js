/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Sora: títulos e valores monetários. Geométrica, com números largos e legíveis.
        display: ['"Sora Variable"', "Sora", "system-ui", "sans-serif"],
        // Plus Jakarta Sans: textos, labels e formulários. Humanista e confortável em pt-BR.
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        // Neutro esverdeado da marca — substitui o slate padrão para dar temperatura ao tema.
        ink: {
          50: "#F4F8F7",
          100: "#E5EFEC",
          200: "#C8DCD7",
          300: "#9DBFB8",
          400: "#6C9990",
          500: "#4B7770",
          600: "#385E58",
          700: "#2C4B46",
          800: "#1D3430",
          900: "#0F211E",
          950: "#071412",
        },
        // Azul do logotipo — domínio de "planejamento" (metas, projeções).
        ocean: {
          50: "#EEF5FF",
          100: "#D9E9FF",
          200: "#BCD8FF",
          300: "#8EBEFF",
          400: "#589BFF",
          500: "#2F79F5",
          600: "#1D5CE0",
          700: "#1949B5",
          800: "#1A3F8F",
          900: "#1B3771",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 33, 30, 0.04), 0 8px 24px -12px rgba(15, 33, 30, 0.14)",
        "card-lg": "0 2px 4px rgba(15, 33, 30, 0.05), 0 24px 48px -24px rgba(15, 33, 30, 0.24)",
        pop: "0 24px 64px -20px rgba(15, 33, 30, 0.35)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "draw-marker": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.22,1,.36,1) both",
        "fade-in": "fade-in .4s ease-out both",
        "pop-in": "pop-in .28s cubic-bezier(.22,1,.36,1) both",
        "slide-in-right": "slide-in-right .35s cubic-bezier(.22,1,.36,1) both",
        "draw-marker": "draw-marker .7s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
}
