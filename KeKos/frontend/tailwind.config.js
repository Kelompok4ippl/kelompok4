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
        // Token warna: pakai ini, jangan hex lepas di komponen
        primary: { DEFAULT: "#000000", hover: "#222222" },
        muted: "#555555", // teks sekunder; kontras 7,4:1 di latar putih
        danger: "#b91c1c", // error & aksi hapus; kontras 6,5:1 di latar putih
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
