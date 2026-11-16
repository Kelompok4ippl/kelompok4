// Satu komponen tombol untuk seluruh KeKos supaya tinggi, radius, dan keadaan disabled seragam.
// variant: "primary" (hitam), "secondary" (putih bergaris), "ghost" (tanpa latar)
// size: "md" (44px, minimum area sentuh) atau "lg" (48px, tombol utama halaman)
// `as` bisa diisi Link dari react-router atau "a"; props lain diteruskan (to, href, onClick, ...).
const VARIANTS = {
  primary: "bg-ink text-white hover:bg-black disabled:bg-surface-strong disabled:text-muted",
  secondary: "border border-ink bg-white text-ink hover:bg-surface disabled:border-line disabled:text-muted",
  ghost: "text-primary-strong hover:bg-primary-soft disabled:text-muted",
};

const SIZES = {
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({ as: Tag = "button", variant = "primary", size = "md", className = "", ...props }) {
  const typeProp = Tag === "button" && !props.type ? { type: "button" } : {};
  return (
    <Tag
      {...typeProp}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-poppins font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}
