import { timeAgo } from "../lib/format.js";
import checkCircle from "../assets/check-circle-hijau.svg";
import alertIcon from "../assets/alert-circle.svg";
import crossIcon from "../assets/cross-2.svg";

const ICON = { sukses: checkCircle, error: crossIcon };

const TONE = {
  sukses: "bg-[#eaf7f0]",
  info: "bg-[#f1f4fa]",
  peringatan: "bg-[#fff4e5]",
  error: "bg-[#fdecec]",
};

// Daftar notifikasi ringkas untuk dropdown di navbar pencari kos
export default function NotificationList({ items, loading, error }) {
  if (loading) return <p className="p-4 font-inter text-xs text-[#555]">Memuat notifikasi...</p>;
  if (error) return <p className="p-4 font-inter text-xs text-[#c00]">{error}</p>;
  if (!items?.length) return <p className="p-4 font-inter text-xs text-[#555]">Belum ada notifikasi.</p>;
  return (
    <ul className="flex max-h-[320px] flex-col gap-2 overflow-y-auto p-2">
      {items.map((n) => (
        <li key={n.id} className={`flex gap-3 rounded-lg p-3 ${TONE[n.type] || TONE.info}`}>
          {ICON[n.type] ? (
            <img src={ICON[n.type]} alt="" className="h-10 w-10 shrink-0 object-contain p-0.5" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
              <img src={alertIcon} alt="" className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-inter text-[13px] font-semibold text-black">{n.title}</p>
              <p className="shrink-0 font-inter text-[10px] text-[#777]">{timeAgo(n.createdAt)}</p>
            </div>
            <div className="mt-1 flex items-start gap-2">
              <p className="flex-1 font-inter text-[11px] leading-4 text-[#444]">{n.message}</p>
              {!n.read && <span aria-label="Belum dibaca" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#20b078]" />}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
