import { FacilityChip } from "./OwnerForm.jsx";
import { LineIcon } from "./Icon.jsx";
import { imageUrl, rupiah, KOS_TYPE_LABEL } from "../lib/format.js";

// Warna label tipe kos di pojok foto (sama dengan kartu di panel pemilik)
const TYPE_TAG = {
  putra: "bg-[#e3ecf6] text-steel",
  putri: "bg-[#f6e6ee] text-[#9a4069]",
  campur: "bg-[#ece8f5] text-[#5f4c95]",
};

// Kartu kos pencari (redesign): foto + tipe + sisa kamar, nama, rating, lokasi, fasilitas, harga.
// headerAction: tombol kecil di samping nama, children: bagian bawah kartu (mis. tombol Detail & Booking cepat).
export default function KosCard({ kos, headerAction, showBadge = true, showRating = true, hidePrice = false, children }) {
  const penuh = kos.roomsLeft <= 0;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-steel-line bg-white font-poppins text-steel-ink shadow-steel transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-steel-lg motion-reduce:transition-none">
      <div className="relative aspect-[16/10] bg-steel-tint">
        <img src={imageUrl(kos.image)} alt={kos.name} draggable={false} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[rgba(15,30,50,.28)] to-transparent to-40%" />
        <div className="absolute inset-x-3 top-3 flex justify-between gap-2">
          <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-[.02em] ${TYPE_TAG[kos.type] || TYPE_TAG.campur}`}>
            {(KOS_TYPE_LABEL[kos.type] || kos.type || "").toUpperCase()}
          </span>
          {showBadge && (
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold ${penuh ? "text-bad" : "text-ok"}`}>
              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-current" />
              {penuh ? "Penuh" : `Sisa ${kos.roomsLeft} kamar`}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug">{kos.name}</h3>
          {headerAction}
        </div>
        {showRating && (
          <p className="flex items-center gap-1 text-xs text-steel-muted">
            {kos.reviews > 0 ? (
              <>
                <span aria-hidden="true" className="text-amber">★</span>
                <span className="font-semibold text-steel-ink">{kos.rating.toFixed(1)}</span> ({kos.reviews} ulasan)
              </>
            ) : (
              "Belum ada ulasan"
            )}
          </p>
        )}
        {(kos.area || kos.distance || kos.address) && (
          <p className="flex items-start gap-1.5 text-xs text-steel-muted">
            <LineIcon name="pin" className="mt-px h-3.5 w-3.5" />
            {[kos.area || kos.address, kos.distance].filter(Boolean).join(" • ")}
          </p>
        )}
        {kos.facilities.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {kos.facilities.map((f) => (
              <li key={f}>
                <FacilityChip name={f} />
              </li>
            ))}
          </ul>
        )}
        {!hidePrice && (
          <p className="mt-auto pt-1">
            {kos.price ? (
              <>
                <span className="text-lg font-semibold tabular-nums">{rupiah(kos.price, { short: true })}</span>
                <span className="text-xs text-steel-muted"> /bln</span>
              </>
            ) : (
              <span className="text-xs text-steel-muted">Harga belum diatur</span>
            )}
          </p>
        )}
        {children}
      </div>
    </article>
  );
}
