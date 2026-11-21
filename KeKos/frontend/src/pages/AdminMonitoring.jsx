import { useState } from "react";
import { AdminLayout } from "../components/OwnerLayout.jsx";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";

const TINDAKAN = {
  perlu_peringatan: { label: "Perlu peringatan", className: "bg-[#fff4e5] text-[#8a5a00]" },
  rekomendasi_hapus: { label: "Rekomendasi hapus", className: "bg-danger-soft text-danger" },
};

// Monitoring inaktivitas pemilik: kos tidak diperbarui >= 2 bulan diberi peringatan, >= 3 bulan boleh dihapus
export default function AdminMonitoring() {
  const list = useApi("/admin/monitoring");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const jalankan = async (kos, aksi) => {
    if (aksi === "hapus" && !window.confirm(`Hapus listing ${kos.name}? Tipe kamar, booking, dan ulasannya ikut terhapus.`)) return;
    setBusy(kos.id);
    setNotice(null);
    try {
      if (aksi === "hapus") await api(`/admin/kos/${kos.id}`, { method: "DELETE" });
      else await api(`/admin/kos/${kos.id}/peringatan`, { method: "POST" });
      setNotice({ text: aksi === "hapus" ? `Listing ${kos.name} dihapus.` : `Peringatan dikirim ke ${kos.owner.name}.` });
      list.reload();
    } catch (err) {
      setNotice({ text: err.message, error: true });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout title="Monitoring Kos" className="bg-[#ededed]">
      <div className="mx-auto mt-6 flex max-w-[900px] flex-col gap-4">
        <p className="font-inter text-sm text-muted">Kos yang tidak diperbarui pemilik selama 2 bulan atau lebih.</p>
        {notice && (
          <p
            role={notice.error ? "alert" : "status"}
            className={`rounded-lg px-3 py-2 font-inter text-sm ${notice.error ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}
          >
            {notice.text}
          </p>
        )}
        {list.loading && <p className="font-inter text-sm text-muted">Memuat...</p>}
        {list.error && <p role="alert" className="font-inter text-sm text-danger">{list.error}</p>}
        {list.data && !list.data.length && (
          <p className="rounded-[20px] bg-white p-6 font-inter text-sm text-muted">Semua kos masih rutin diperbarui.</p>
        )}

        {list.data?.map((kos) => (
          <article key={kos.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] bg-white p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-inter text-base font-semibold text-[#101828]">{kos.name}</h2>
                <span className={`rounded-full px-2 py-0.5 font-inter text-xs font-semibold ${TINDAKAN[kos.action].className}`}>
                  {TINDAKAN[kos.action].label}
                </span>
              </div>
              <p className="font-inter text-sm text-muted">
                Pemilik: {kos.owner.name} · {kos.address}
              </p>
              <p className="font-inter text-xs text-muted">
                Terakhir diperbarui {new Date(kos.updatedAt).toLocaleDateString("id-ID", { dateStyle: "medium" })} ({kos.months} bulan)
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy === kos.id}
                onClick={() => jalankan(kos, "peringatan")}
                className="h-10 rounded-lg bg-black px-4 font-inter text-sm font-semibold text-white hover:bg-[#333] disabled:opacity-60"
              >
                Kirim Peringatan
              </button>
              {kos.action === "rekomendasi_hapus" && (
                <button
                  type="button"
                  disabled={busy === kos.id}
                  onClick={() => jalankan(kos, "hapus")}
                  className="h-10 rounded-lg border border-[#e5484d] bg-white px-4 font-inter text-sm font-semibold text-[#c62828] hover:bg-danger-soft disabled:opacity-60"
                >
                  Hapus Listing
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
