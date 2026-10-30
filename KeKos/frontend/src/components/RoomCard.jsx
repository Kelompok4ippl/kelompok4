import Facility from "./Facility.jsx";
import { imageUrl, rupiah } from "../lib/format.js";
import roomIcon from "../assets/room.svg";

// Kartu tipe kamar (booking cepat & daftar kamar pemilik).
// headerAction: tombol di kanan nama tipe, note: teks status di bawah, footerAction: tombol di kanan bawah.
export default function RoomCard({ room, selected, onSelect, headerAction, note, footerAction, framed = false }) {
  const Wrapper = onSelect ? "button" : "div";
  return (
    <Wrapper
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      aria-pressed={onSelect ? selected : undefined}
      className={`relative flex w-full flex-col overflow-hidden rounded-[10px] bg-white text-left text-[#080808] ${
        framed ? "border-[5px] border-black" : ""
      } ${selected ? "ring-4 ring-[#7d7fff]" : ""}`}
    >
      <img src={imageUrl(room.image)} alt={room.type} className="aspect-[355/180] w-full object-cover" />
      <div className="px-3.5 pb-4 pt-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-poppins text-xl">
            <img src={roomIcon} alt="" className="h-[22px] w-[22px]" />
            {room.type}
          </p>
          {headerAction}
        </div>
        <p className="mt-0.5 max-w-[210px] font-serif4 text-[11px] leading-[15px] text-[#777]">{room.description}</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {room.facilities.map((f) => (
            <Facility key={f} name={f} boxed />
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-2 pl-3">
          <p className="font-poppins text-sm leading-[21px]">
            Mulai Dari
            <br />
            <span className="font-semibold">{rupiah(room.price)}</span>/bln
          </p>
          {footerAction || (
            <span className="rounded-full border border-[#555] px-4 py-0.5 font-poppins text-[10px]">
              {room.available > 0 ? `${room.available} Tersedia` : "Penuh"}
            </span>
          )}
        </div>
        {note && <p className="mt-2 text-right font-poppins text-[11px] font-semibold text-[#a43016]">{note}</p>}
      </div>
    </Wrapper>
  );
}
