/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a22",
        muted: "#5d5d72",
        pink: "#ff78b6",
        pinkSoft: "#ffd6ea",
        noteA: "#fff3a8",
        noteB: "#c6ffbf",
        noteC: "#bfe6ff",
        noteD: "#ffc7e7",
        envBg1: "#141424",
        envBg2: "#0f0f18",
        sunGold: "#ffc86b",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
        sig: ["ui-rounded", "Segoe Script", "Bradley Hand", "cursive"],
      },
      keyframes: {
        revealPop: {
          from: { transform: "rotate(var(--rot)) scale(.985)" },
          to: { transform: "rotate(var(--rot)) scale(1)" },
        },
        spark: {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(.55)" },
          "15%": { opacity: ".95" },
          "100%": {
            opacity: "0",
            transform: "translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(.95)",
          },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        popIn: {
          "0%": { transform: "scale(.85) translateY(10px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        subtleBounce: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        shake: {
          "0%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
          "100%": { transform: "translateX(0)" },
        },
        focusPop: {
          to: { transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        revealPop: "revealPop 260ms ease-out",
        spark: "spark 520ms ease-out forwards",
        fadeIn: "fadeIn .25s ease",
        popIn: "popIn .28s cubic-bezier(.2,.9,.3,1.2)",
        bounce2: "popIn .28s cubic-bezier(.2,.9,.3,1.2), subtleBounce .6s ease .25s",
        shake: "shake .4s ease",
        focusPop: "focusPop .22s ease-out forwards",
      },
    },
  },
  plugins: [],
};
