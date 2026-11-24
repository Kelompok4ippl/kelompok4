import { useState } from "react";
import { AdminLayout } from "../components/OwnerLayout.jsx";
import { ConfirmDialog } from "../components/Modal.jsx";
import AdminMonitoring from "./AdminMonitoring.jsx";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { imageUrl, KOS_TYPE_LABEL } from "../lib/format.js";

const FILTER = [
  { value: "menunggu", label: "Menunggu" },
  { value: "terverifikasi", label: "Terverifikasi" },
  { value: "ditolak", label: "Ditolak" },
  { value: "", label: "Semua" },
];

const STATUS = {
  menunggu: { label: "Menunggu verifikasi", className: "bg-amber-soft text-amber-ink" },
  terverifikasi: { label: "Terverifikasi", className: "bg-ok-soft text-ok" },
  ditolak: { label: "Ditolak", className: "bg-bad-soft text-bad" },
};

// Verifikasi listing kos baru dari pemilik; kos baru tampil di halaman pencari setelah terverifikasi
export default function AdminVerifikasi() {
  const [filter, setFilter] = useState("menunggu");
  const ringkasan = useApi("/admin/ringkasan");
  const list = useApi(`/admin/kos${filter ? `?status=${filter}` : ""}`);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  // Kos yang sedang dikonfirmasi untuk ditolak (pop-up berisi kolom alasan)
  const [tolak, setTolak] = useState(null);
  const [tolakError, setTolakError] = useState("");

  const proses = async (kos, status, catatan = "") => {
    setBusy(kos.id);
    setError("");
    setTolakError("");
    try {
      await api(`/admin/kos/${kos.id}/verifikasi`, { method: "PATCH", body: { status, catatan } });
      setTolak(null);
      list.reload();
      ringkasan.reload();
    } catch (err) {
      if (status === "ditolak") setTolakError(err.message);
      else setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const reloadAll = () => {
    list.reload();
    ringkasan.reload();
  };

  const r = ringkasan.data;
  const kartu = r && [
    ["Kos menunggu verifikasi", r.kosMenunggu],
    ["Kos terverifikasi", r.kosTerverifikasi],
    ["Kos tidak diperbarui", r.kosTidakDiperbarui],
    ["Akun pengguna", r.jumlahPengguna],
    ["Booking menunggu", r.bookingMenunggu],
  ];

  return (
    <AdminLayout title="Verifikasi & Monitoring Kos">
      <div className="w-full flex max-w-[900px] flex-col gap-6">
        {kartu && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {kartu.map(([label, n]) => (
              <div key={label} className="rounded-2xl border border-steel-line bg-white p-4 shadow-steel">
                <dt className="font-poppins text-xs text-steel-muted">{label}</dt>
                <dd className="mt-1 font-poppins text-2xl font-semibold text-steel-ink">{n}</dd>
              </div>
            ))}
          </dl>
        )}

        <h2 className="-mb-2 text-[17px] font-semibold text-steel-ink">Verifikasi listing</h2>
        <div role="group" aria-label="Filter status" className="flex flex-wrap gap-2">
          {FILTER.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`h-10 rounded-full px-4 font-poppins text-sm font-semibold ${
                filter === f.value ? "bg-steel text-white" : "border border-steel-line bg-white text-steel-body hover:border-steel"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 font-poppins text-sm text-bad">
            {error}
          </p>
        )}
        {list.loading && <p className="font-poppins text-sm text-steel-muted">Memuat daftar kos...</p>}
        {list.error && <p role="alert" className="font-poppins text-sm text-bad">{list.error}</p>}
        {list.data && !list.data.length && (
          <p className="rounded-2xl border border-steel-line bg-white shadow-steel p-6 font-poppins text-sm text-steel-muted">Tidak ada kos di daftar ini.</p>
        )}

        {list.data?.map((kos) => (
          <article key={kos.id} className="flex flex-col gap-4 rounded-2xl border border-steel-line bg-white shadow-steel p-5 sm:flex-row">
            <img src={imageUrl(kos.image)} alt="" className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-32 sm:w-44" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-poppins text-base font-semibold text-steel-ink">{kos.name}</h2>
                <span className={`rounded-full px-2 py-0.5 font-poppins text-xs font-semibold ${STATUS[kos.status]?.className}`}>
                  {STATUS[kos.status]?.label}
                </span>
              </div>
              <p className="font-poppins text-sm text-steel-muted">
                Pemilik: {kos.owner.name} · Kos {KOS_TYPE_LABEL[kos.type]} · {kos.totalRooms} kamar
              </p>
              <p className="font-poppins text-sm text-steel-muted">{kos.address}</p>
              {kos.facilities.length > 0 && (
                <p className="font-poppins text-xs text-steel-muted">Fasilitas: {kos.facilities.join(", ")}</p>
              )}
              {kos.description && <p className="mt-1 line-clamp-2 font-poppins text-sm text-steel-ink">{kos.description}</p>}
              <div className="mt-3 flex flex-wrap gap-3">
                  {kos.status !== "terverifikasi" && (
                    <button
                      type="button"
                      disabled={busy === kos.id}
                      onClick={() => proses(kos, "terverifikasi")}
                      className="h-10 rounded-lg bg-steel px-4 font-poppins text-sm font-semibold text-white hover:bg-steel-strong disabled:opacity-60"
                    >
                      ✓ Verifikasi
                    </button>
                  )}
                  {kos.status !== "ditolak" && (
                    <button
                      type="button"
                      disabled={busy === kos.id}
                      onClick={() => {
                        setTolakError("");
                        setTolak(kos);
                      }}
                      className="h-10 rounded-lg border border-steel-line bg-white px-4 font-poppins text-sm font-semibold text-bad hover:bg-bad-soft disabled:opacity-60"
                    >
                      ✕ Tolak
                    </button>
                  )}
              </div>
            </div>
          </article>
        ))}

        <AdminMonitoring onChanged={reloadAll} />
      </div>

      {tolak && (
        <ConfirmDialog
          title="Tolak listing kos?"
          message={`Listing ${tolak.name} milik ${tolak.owner.name} tidak akan tampil untuk pencari. Pemilik akan menerima alasan penolakan ini.`}
          confirmLabel="Tolak listing"
          reasonLabel="Alasan penolakan"
          reasonPlaceholder="Mis. foto kos tidak jelas atau alamat tidak lengkap"
          busy={busy === tolak.id}
          error={tolakError}
          onConfirm={(alasan) => proses(tolak, "ditolak", alasan)}
          onClose={() => setTolak(null)}
        />
      )}
    </AdminLayout>
  );
}
