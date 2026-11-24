import { useEffect } from "react";
import { AdminLayout } from "../components/OwnerLayout.jsx";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { timeAgo } from "../lib/format.js";

// Notifikasi admin: booking baru dari semua kos (sp_buat_booking) dan log tindakan admin sendiri
export default function AdminNotifikasi() {
  const notif = useApi("/notifikasi");

  // Buka halaman = semua notifikasi dianggap sudah dibaca
  useEffect(() => {
    api("/notifikasi/baca", { method: "PATCH" }).catch(() => {});
  }, []);

  return (
    <AdminLayout title="Notifikasi & Log">
      <div className="w-full max-w-[760px]">
        {notif.loading && <p className="font-poppins text-sm text-steel-muted">Memuat notifikasi...</p>}
        {notif.error && <p role="alert" className="font-poppins text-sm text-bad">{notif.error}</p>}
        {notif.data && !notif.data.length && (
          <p className="rounded-2xl border border-steel-line bg-white shadow-steel p-6 font-poppins text-sm text-steel-muted">Belum ada notifikasi.</p>
        )}
        {notif.data?.length > 0 && (
          <ul className="flex flex-col divide-y divide-[#edf1f5] rounded-2xl border border-steel-line bg-white shadow-steel px-5">
            {notif.data.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-poppins text-sm font-semibold text-steel-ink">
                    {!n.read && <span aria-label="Belum dibaca" className="h-2 w-2 shrink-0 rounded-full bg-steel" />}
                    {n.title}
                  </p>
                  <p className="font-poppins text-sm text-steel-muted">{n.message}</p>
                </div>
                <time dateTime={n.createdAt} className="shrink-0 font-poppins text-xs text-steel-muted">
                  {timeAgo(n.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
