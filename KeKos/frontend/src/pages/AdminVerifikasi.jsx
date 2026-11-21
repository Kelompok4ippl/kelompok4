import { useState } from "react";
import { AdminLayout } from "../components/OwnerLayout.jsx";
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
  menunggu: { label: "Menunggu verifikasi", className: "bg-[#fff4e5] text-[#8a5a00]" },
  terverifikasi: { label: "Terverifikasi", className: "bg-success-soft text-success" },
  ditolak: { label: "Ditolak", className: "bg-danger-soft text-danger" },
};

// Verifikasi listing kos baru dari pemilik; kos baru tampil di halaman pencari setelah terverifikasi
export default function AdminVerifikasi() {
  const [filter, setFilter] = useState("menunggu");
  const ringkasan = useApi("/admin/ringkasan");
  const list = useApi(`/admin/kos${filter ? `?status=${filter}` : ""}`);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const proses = async (kos, status) => {
    let catatan = "";
    if (status === "ditolak") {
      catatan = window.prompt(`Alasan menolak listing ${kos.name}:`)?.trim();
      if (!catatan) return;
    }
    setBusy(kos.id);
    setError("");
    try {
      await api(`/admin/kos/${kos.id}/verifikasi`, { method: "PATCH", body: { status, catatan } });
      list.reload();
      ringkasan.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
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
    <AdminLayout title="Verifikasi Kos" className="bg-[#ededed]">
      <div className="mx-auto mt-6 flex max-w-[900px] flex-col gap-6">
        {kartu && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {kartu.map(([label, n]) => (
              <div key={label} className="rounded-2xl bg-white p-4">
                <dt className="font-inter text-xs text-muted">{label}</dt>
                <dd className="mt-1 font-inter text-2xl font-bold text-ink">{n}</dd>
              </div>
            ))}
          </dl>
        )}

        <div role="group" aria-label="Filter status" className="flex flex-wrap gap-2">
          {FILTER.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`h-10 rounded-full px-4 font-inter text-sm font-semibold ${
                filter === f.value ? "bg-black text-white" : "bg-white text-black hover:bg-[#f5f5f5]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 font-inter text-sm text-danger">
            {error}
          </p>
        )}
        {list.loading && <p className="font-inter text-sm text-muted">Memuat daftar kos...</p>}
        {list.error && <p role="alert" className="font-inter text-sm text-danger">{list.error}</p>}
        {list.data && !list.data.length && (
          <p className="rounded-[20px] bg-white p-6 font-inter text-sm text-muted">Tidak ada kos di daftar ini.</p>
        )}

        {list.data?.map((kos) => (
          <article key={kos.id} className="flex flex-col gap-4 rounded-[20px] bg-white p-5 sm:flex-row">
            <img src={imageUrl(kos.image)} alt="" className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-32 sm:w-44" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-inter text-base font-semibold text-[#101828]">{kos.name}</h2>
                <span className={`rounded-full px-2 py-0.5 font-inter text-xs font-semibold ${STATUS[kos.status]?.className}`}>
                  {STATUS[kos.status]?.label}
                </span>
              </div>
              <p className="font-inter text-sm text-muted">
                Pemilik: {kos.owner.name} · Kos {KOS_TYPE_LABEL[kos.type]} · {kos.totalRooms} kamar
              </p>
              <p className="font-inter text-sm text-muted">{kos.address}</p>
              {kos.facilities.length > 0 && (
                <p className="font-inter text-xs text-muted">Fasilitas: {kos.facilities.join(", ")}</p>
              )}
              {kos.description && <p className="mt-1 line-clamp-2 font-inter text-sm text-ink">{kos.description}</p>}
              <div className="mt-3 flex flex-wrap gap-3">
                  {kos.status !== "terverifikasi" && (
                    <button
                      type="button"
                      disabled={busy === kos.id}
                      onClick={() => proses(kos, "terverifikasi")}
                      className="h-10 rounded-lg bg-black px-4 font-inter text-sm font-semibold text-white hover:bg-[#333] disabled:opacity-60"
                    >
                      ✓ Verifikasi
                    </button>
                  )}
                  {kos.status !== "ditolak" && (
                    <button
                      type="button"
                      disabled={busy === kos.id}
                      onClick={() => proses(kos, "ditolak")}
                      className="h-10 rounded-lg border border-[#e5484d] bg-white px-4 font-inter text-sm font-semibold text-[#c62828] hover:bg-danger-soft disabled:opacity-60"
                    >
                      ✕ Tolak
                    </button>
                  )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </AdminLayout>
  );
}
