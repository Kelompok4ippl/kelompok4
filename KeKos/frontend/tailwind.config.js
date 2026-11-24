/** @type {import('tailwindcss').Config} */
// Token warna & font KeKos. Nilainya ada di :root (src/index.css); komponen memakai nama token,
// bukan kode hex langsung (contoh: text-muted, bg-primary-soft, border-line, text-danger).
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  corePlugins: { preflight: true },
  theme: {
    extend: {
      colors: {
        black: "var(--black)",
        white: "var(--white)",
        ink: "var(--color-ink)",
        body: "var(--color-body)",
        muted: "var(--color-muted)",
        subtle: "var(--color-subtle)",
        line: { DEFAULT: "var(--color-line)", strong: "var(--color-line-strong)" },
        focus: "var(--color-focus)",
        surface: { DEFAULT: "var(--color-surface)", strong: "var(--color-surface-strong)" },
        primary: {
          DEFAULT: "var(--color-primary)",
          strong: "var(--color-primary-strong)",
          soft: "var(--color-primary-soft)",
        },
        danger: { DEFAULT: "var(--color-danger)", soft: "var(--color-danger-soft)" },
        success: { DEFAULT: "var(--color-success)", soft: "var(--color-success-soft)" },
        badge: { DEFAULT: "var(--color-badge)", soft: "var(--color-badge-soft)" },
        star: "var(--color-star)",
        // Palet redesign 2026 (biru baja redup) untuk panel pemilik kos & admin
        steel: {
          side: "var(--steel-side)",
          "side-2": "var(--steel-side-2)",
          DEFAULT: "var(--steel)",
          strong: "var(--steel-strong)",
          tint: "var(--steel-tint)",
          "tint-2": "var(--steel-tint-2)",
          bg: "var(--steel-bg)",
          line: "var(--steel-line)",
          ink: "var(--steel-ink)",
          body: "var(--steel-body)",
          muted: "var(--steel-muted)",
          dash: "var(--steel-dash)",
        },
        amber: { DEFAULT: "var(--amber)", soft: "var(--amber-soft)", ink: "var(--amber-ink)" },
        ok: { DEFAULT: "var(--ok)", soft: "var(--ok-soft)" },
        bad: { DEFAULT: "var(--bad)", soft: "var(--bad-soft)" },
      },
      boxShadow: {
        steel: "0 1px 2px rgba(29,58,92,.06), 0 8px 24px -12px rgba(29,58,92,.18)",
        "steel-lg": "0 2px 4px rgba(29,58,92,.06), 0 16px 30px -14px rgba(29,58,92,.3)",
      },
      // Dua font saja: Poppins untuk judul, Inter untuk isi
      fontFamily: {
        poppins: ["Poppins", "Helvetica", "Arial", "sans-serif"],
        inter: ["Inter", "Helvetica", "Arial", "sans-serif"],
        // Khusus tampilan Beranda (desain Figma)
        roboto: ["Roboto", "Helvetica", "Arial", "sans-serif"],
        serif4: ['"Source Serif 4"', "Georgia", "serif"],
        spacemono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
