import { useState } from "react";
import { ConfirmDialog } from "../components/Modal.jsx";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";

const TINDAKAN = {
  perlu_peringatan: { label: "Perlu peringatan", className: "bg-amber-soft text-amber-ink" },
  rekomendasi_hapus: { label: "Disarankan dihapus", className: "bg-bad-soft text-bad" },
};

// Bagian "Monitoring inaktivitas" di halaman Verifikasi Kos (AdminVerifikasi.jsx).
// Kos tidak diperbarui >= 2 bulan diberi peringatan, >= 3 bulan boleh dihapus (dengan pop-up konfirmasi).
// onChanged: dipanggil setelah listing dihapus supaya ringkasan & daftar verifikasi ikut diperbarui.
export default function AdminMonitoring({ onChanged }) {
  const list = useApi("/admin/monitoring");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  // Kos yang sedang dikonfirmasi untuk dihapus
  const [hapus, setHapus] = useState(null);
  const [hapusError, setHapusError] = useState("");

  const peringatan = async (kos) => {
    setBusy(kos.id);
    setNotice(null);
    try {
      await api(`/admin/kos/${kos.id}/peringatan`, { method: "POST" });
      setNotice({ text: `Peringatan dikirim ke ${kos.owner.name}.` });
    } catch (err) {
      setNotice({ text: err.message, error: true });
    } finally {
      setBusy(null);
    }
  };

  const konfirmasiHapus = async () => {
    const kos = hapus;
    setBusy(kos.id);
    setHapusError("");
    try {
      await api(`/admin/kos/${kos.id}`, { method: "DELETE" });
      setHapus(null);
      setNotice({ text: `Listing ${kos.name} dihapus.` });
      list.reload();
      onChanged?.();
    } catch (err) {
      setHapusError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="judul-monitoring" className="flex flex-col gap-4 rounded-2xl border border-steel-line bg-white p-4 shadow-steel sm:p-5">
      <div>
        <h2 id="judul-monitoring" className="flex items-center gap-2 text-[17px] font-semibold text-steel-ink">
          Monitoring inaktivitas
          {list.data?.length > 0 && <span className="rounded-full bg-amber-soft px-2 text-xs text-amber-ink">{list.data.length} kos</span>}
        </h2>
        <p className="text-xs text-steel-muted">Kos yang tidak diperbarui pemilik selama 2 bulan atau lebih.</p>
      </div>
      {notice && (
        <p role={notice.error ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm ${notice.error ? "bg-bad-soft text-bad" : "bg-ok-soft text-ok"}`}>
          {notice.text}
        </p>
      )}
      {list.loading && <p className="text-sm text-steel-muted">Memuat...</p>}
      {list.error && <p role="alert" className="text-sm text-bad">{list.error}</p>}
      {list.data && !list.data.length && (
        <p className="rounded-xl border border-dashed border-steel-line p-5 text-center text-sm text-steel-muted">Semua kos masih rutin diperbarui.</p>
      )}

      {list.data?.map((kos) => (
        <article key={kos.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-steel-line p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold text-steel-ink">{kos.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TINDAKAN[kos.action]?.className}`}>{TINDAKAN[kos.action]?.label}</span>
            </div>
            <p className="text-sm text-steel-muted">
              Pemilik: {kos.owner.name} · {kos.address}
            </p>
            <p className="text-xs text-steel-muted">
              Terakhir diperbarui {new Date(kos.updatedAt).toLocaleDateString("id-ID", { dateStyle: "medium" })} ({kos.months} bulan)
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={busy === kos.id}
              onClick={() => peringatan(kos)}
              className="min-h-11 rounded-xl border border-steel-line bg-steel-tint-2 px-4 text-sm font-semibold text-steel hover:bg-steel-tint disabled:opacity-60"
            >
              Kirim peringatan
            </button>
            {kos.action === "rekomendasi_hapus" && (
              <button
                type="button"
                disabled={busy === kos.id}
                onClick={() => {
                  setHapusError("");
                  setHapus(kos);
                }}
                className="min-h-11 rounded-xl bg-bad px-4 text-sm font-semibold text-white hover:bg-[#8f3a30] disabled:opacity-60"
              >
                Hapus listing
              </button>
            )}
          </div>
        </article>
      ))}

      {hapus && (
        <ConfirmDialog
          title="Hapus listing kos?"
          message={`Listing ${hapus.name} milik ${hapus.owner.name} akan dihapus permanen, termasuk tipe kamar, booking, ulasan, dan fotonya. Pemilik akan mendapat notifikasi.`}
          confirmLabel="Ya, hapus listing"
          busy={busy === hapus.id}
          error={hapusError}
          onConfirm={konfirmasiHapus}
          onClose={() => setHapus(null)}
        />
      )}
    </section>
  );
}
