import { timeAgo } from "../lib/format.js";
import { LineIcon } from "./Icon.jsx";

// Warna & ikon per jenis notifikasi (lihat JENIS_NOTIFIKASI di backend/src/format.js)
const TONE = {
  sukses: { icon: "check", className: "bg-ok-soft text-ok" },
  info: { icon: "bell", className: "bg-steel-tint text-steel" },
  peringatan: { icon: "bell", className: "bg-amber-soft text-[#9a6b12]" },
  error: { icon: "x", className: "bg-bad-soft text-bad" },
};

// Daftar notifikasi untuk pop-up lonceng di navbar pencari kos
export default function NotificationList({ items, loading, error }) {
  if (loading) return <p className="p-4 text-xs text-steel-muted">Memuat notifikasi...</p>;
  if (error) return <p className="p-4 text-xs text-bad">{error}</p>;
  if (!items?.length) return <p className="p-6 text-center text-sm text-steel-muted">Belum ada notifikasi.</p>;
  return (
    <ul className="flex max-h-[420px] flex-col overflow-y-auto">
      {items.map((n) => {
        const tone = TONE[n.type] || TONE.info;
        return (
          <li key={n.id} className={`flex gap-3 border-b border-[#edf1f5] px-4 py-3.5 last:border-0 ${n.read ? "" : "bg-steel-tint-2"}`}>
            <span aria-hidden="true" className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone.className}`}>
              <LineIcon name={tone.icon} className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-steel-ink">{n.title}</p>
                <p className="shrink-0 text-[11px] text-steel-muted">{timeAgo(n.createdAt)}</p>
              </div>
              <p className="mt-0.5 text-xs leading-[1.45] text-steel-body">{n.message}</p>
            </div>
            {!n.read && <span aria-label="Belum dibaca" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-steel" />}
          </li>
        );
      })}
    </ul>
  );
}
