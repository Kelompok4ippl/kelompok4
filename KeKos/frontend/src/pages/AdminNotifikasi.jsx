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
    <AdminLayout title="Notifikasi & Log" className="bg-[#ededed]">
      <div className="mx-auto mt-6 max-w-[760px]">
        {notif.loading && <p className="font-inter text-sm text-muted">Memuat notifikasi...</p>}
        {notif.error && <p role="alert" className="font-inter text-sm text-danger">{notif.error}</p>}
        {notif.data && !notif.data.length && (
          <p className="rounded-[20px] bg-white p-6 font-inter text-sm text-muted">Belum ada notifikasi.</p>
        )}
        {notif.data?.length > 0 && (
          <ul className="flex flex-col divide-y divide-line rounded-[20px] bg-white px-5">
            {notif.data.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-inter text-sm font-semibold text-ink">
                    {!n.read && <span aria-label="Belum dibaca" className="h-2 w-2 shrink-0 rounded-full bg-[#0a84d6]" />}
                    {n.title}
                  </p>
                  <p className="font-inter text-sm text-muted">{n.message}</p>
                </div>
                <time dateTime={n.createdAt} className="shrink-0 font-inter text-xs text-muted">
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
