import { imageUrl } from "../lib/format.js";

// Kotak hitam berisi foto-foto kos (halaman detail & booking cepat)
export default function Gallery({ photos, max = 3, className = "" }) {
  const list = photos.length ? photos.slice(0, max) : [null];
  return (
    <div className={`flex gap-3 overflow-x-auto rounded-[20px] bg-black p-4 sm:gap-[26px] sm:p-[26px] ${className}`}>
      {list.map((p, i) => (
        <img
          key={`${p}-${i}`}
          src={imageUrl(p)}
          alt={`Foto kos ${i + 1}`}
          className="h-[180px] min-w-[240px] flex-1 rounded-[20px] object-cover sm:h-[267px]"
        />
      ))}
    </div>
  );
}
