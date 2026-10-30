/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  corePlugins: { preflight: true },
  theme: {
    extend: {
      colors: {
        black: "var(--black)",
        boulder: "var(--boulder)",
        gallery: "var(--gallery)",
        white: "var(--white)",
      },
      fontFamily: {
        "roboto-bold": "var(--roboto-bold-font-family)",
        "roboto-regular": "var(--roboto-regular-font-family)",
        roboto: ["Roboto", "Helvetica", "Arial", "sans-serif"],
        inter: ["Inter", "Helvetica", "Arial", "sans-serif"],
        poppins: ["Poppins", "Helvetica", "Arial", "sans-serif"],
        serif4: ['"Source Serif 4"', "Georgia", "serif"],
        spacemono: ['"Space Mono"', "ui-monospace", "monospace"],
        ruwudu: ["Ruwudu", "Georgia", "serif"],
        rokkitt: ["Rokkitt", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
