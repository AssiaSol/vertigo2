/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        eco: {
          green: "#3F5D3A",
          beige: "#F4E3B2",
          coral: "#F26C63",
          softYellow: "#F7D86A",
        },
      },
      fontFamily: {
        heading: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 25px rgba(0,0,0,0.14)",
        "glow-warm":
          "0 0 18px rgba(247, 216, 106, 0.45), 0 0 32px rgba(242, 108, 99, 0.28)",
      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(140%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "basket-slide-in": {
          "0%": { transform: "translateX(2.75rem)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "spin-earth": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pin-drop": {
          "0%": { transform: "translateY(-28px) scale(0.9)", opacity: "0" },
          "65%": { transform: "translateY(0) scale(1.05)", opacity: "1" },
          "85%": { transform: "translateY(-6px) scale(0.98)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "glow-warm-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 14px rgba(247, 216, 106, 0.35), 0 0 26px rgba(242, 108, 99, 0.22)",
          },
          "50%": {
            boxShadow:
              "0 0 22px rgba(247, 216, 106, 0.55), 0 0 38px rgba(242, 108, 99, 0.38)",
          },
        },
      },
      animation: {
        "slide-in-right":
          "slide-in-right 2800ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
        "basket-slide-in":
          "basket-slide-in 900ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
        "spin-earth": "spin-earth 50s linear infinite",
        "pin-drop": "pin-drop 650ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
        "glow-warm-pulse": "glow-warm-pulse 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
