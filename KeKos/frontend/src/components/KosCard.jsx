import Facility from "./Facility.jsx";
import GenderBadge from "./GenderBadge.jsx";
import { imageUrl, rupiah } from "../lib/format.js";
import locationIcon from "../assets/location.svg";

// Kartu kos bergaris hitam (dashboard pencari & daftar kos pemilik).
// headerAction: tombol kecil di samping nama (misalnya "Edit"), children: bagian bawah kartu.
export default function KosCard({ kos, headerAction, showBadge = true, showRating = true, hidePrice = false, children }) {
  const badge = kos.roomsLeft > 0 ? `Sisa ${kos.roomsLeft} Kamar!` : "full";
  return (
    <article className="relative flex w-[308px] shrink-0 flex-col rounded-[10px] border-[3px] border-black bg-white px-2 pb-3 pt-2 text-[#080808] shadow-[0_4px_10px_#00000040]">
      <div className="relative">
        <GenderBadge type={kos.type} />
        <img
          src={imageUrl(kos.image)}
          alt={kos.name}
          draggable={false}
          className="aspect-[292/164] w-full rounded-md object-cover"
        />
        {showBadge && (
          <span className="absolute bottom-2 right-2 rounded-lg bg-[#ffebe3] px-[7px] py-1 font-roboto text-[13px] font-medium text-[#a43016]">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-start justify-between gap-2 px-1">
        <h3 className="font-roboto text-base font-medium">{kos.name}</h3>
        {showRating && (
          <p className="whitespace-nowrap font-roboto text-[13px]">
            {kos.rating} <span className="text-[#ffb918]">★</span>{" "}
            <span className="text-[#777777]">({kos.reviews})</span>
          </p>
        )}
        {headerAction}
      </div>
      {(kos.area || kos.distance) && (
        <p className="mt-1 flex items-center gap-1 px-1 font-roboto text-[11px] text-[#333]">
          <img src={locationIcon} alt="" className="h-3.5 w-3.5" />
          {[kos.area, kos.distance].filter(Boolean).join(" • ")}
        </p>
      )}
      {!hidePrice && (
        <p className="mt-1 px-1 font-roboto text-base">{kos.price ? `${rupiah(kos.price, { short: true })}/bln` : "Harga belum diatur"}</p>
      )}
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 px-1">
        {kos.facilities.map((f) => (
          <li key={f}>
            <Facility name={f} />
          </li>
        ))}
      </ul>
      {children}
    </article>
  );
}
