// Ikon SVG satu warna yang ikut warna teks (pakai class text-*), supaya tidak hitam pekat.
// SVG dipakai sebagai mask, jadi warna aslinya di file diabaikan.
export default function Icon({ src, className = "h-5 w-5" }) {
  const mask = `url(${src}) center / contain no-repeat`;
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={{ WebkitMask: mask, mask }} />;
}
