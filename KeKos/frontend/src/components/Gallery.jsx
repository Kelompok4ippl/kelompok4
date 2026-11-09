import { imageUrl } from "../lib/format.js";

// Kotak hitam berisi foto-foto kos (halaman detail & booking cepat)
// fit="natural": foto selebar kolomnya dengan tinggi mengikuti rasio aslinya, jadi utuh tanpa terpotong
export default function Gallery({ photos, max = 3, fit = "cover", className = "" }) {
  const list = photos.length ? photos.slice(0, max) : [null];
  return (
    <div
      className={`flex gap-3 overflow-x-auto rounded-[20px] bg-black p-4 sm:gap-[26px] sm:p-[26px] ${
        fit === "natural" ? "items-center" : ""
      } ${className}`}
    >
      {list.map((p, i) =>
        fit === "natural" ? (
          <img
            key={`${p}-${i}`}
            src={imageUrl(p)}
            alt={`Foto kos ${i + 1}`}
            className="h-auto min-w-[240px] flex-1 basis-0 rounded-[20px]"
          />
        ) : (
          <img
            key={`${p}-${i}`}
            src={imageUrl(p)}
            alt={`Foto kos ${i + 1}`}
            className="h-[180px] min-w-[240px] flex-1 rounded-[20px] object-cover sm:h-[267px]"
          />
        )
      )}
    </div>
  );
}
