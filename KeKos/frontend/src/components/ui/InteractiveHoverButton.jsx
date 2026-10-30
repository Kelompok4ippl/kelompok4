// Adaptasi "Interactive Hover Button" (Magic UI / dillionverma, 21st.dev) tanpa lucide-react:
// saat di-hover, titik kecil membesar memenuhi tombol, teks bergeser keluar dan teks + panah masuk.
// `as` bisa diisi "a" atau Link dari react-router, props lain diteruskan (href, to, onClick, ...).
export default function InteractiveHoverButton({ as: Tag = "button", children, className = "", ...props }) {
  return (
    <Tag
      {...props}
      className={`group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full border border-black bg-white px-6 py-2 text-center font-semibold text-black ${className}`}
    >
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-black transition-all duration-300 group-hover:scale-[100.8]" />
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 z-10 flex translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100"
      >
        {children}
        <span className="text-lg leading-none">→</span>
      </span>
    </Tag>
  );
}
