import { useState } from "react";
import OwnerLayout from "../components/OwnerLayout.jsx";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const STATUS = {
  diterima: { label: "Diterima", className: "bg-success-soft text-success" },
  ditolak: { label: "Ditolak", className: "bg-danger-soft text-danger" },
};

// Frame Figma "KeKos - Daftar Kamar" (versi Notifikasi): booking masuk yang perlu disetujui
// dan peringatan kos terbengkalai dari admin
export default function PemilikNotifikasi() {
  const booking = useApi("/pemilik/booking");
  const notif = useApi("/notifikasi");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const peringatan = (notif.data || []).filter((n) => n.kind === "peringatan" || n.kind === "listing_dihapus");
  const pending = (booking.data || []).filter((b) => b.status === "menunggu");
  const riwayat = (booking.data || []).filter((b) => b.status !== "menunggu");

  const proses = async (b, aksi) => {
    if (aksi === "tolak" && !window.confirm(`Tolak booking ${b.seekerName} untuk ${b.kosName}?`)) return;
    setBusy(b.id);
    setError("");
    try {
      await api(`/pemilik/booking/${b.id}`, { method: "PATCH", body: { aksi } });
      booking.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <OwnerLayout className="bg-[#ededed]">
      <h1 className="sr-only">Notifikasi Booking Masuk</h1>
      <div className="mx-auto flex max-w-[680px] flex-col gap-8 py-6 lg:ml-12 lg:mr-0 lg:py-10">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 font-inter text-sm text-danger">
            {error}
          </p>
        )}
        {(booking.loading || notif.loading) && <p className="font-inter text-sm text-muted">Memuat notifikasi...</p>}
        {booking.error && <p role="alert" className="font-inter text-sm text-danger">{booking.error}</p>}

        {pending.map((b) => (
          <section key={b.id} className="rounded-[20px] bg-white p-6">
            <h2 className="font-inter text-base font-semibold text-[#101828]">Booking Baru Memerlukan Persetujuan</h2>
            <div className="mt-4 rounded-xl bg-[#f8f9fb] p-5">
              <p className="flex items-center gap-4 font-inter text-base font-semibold text-[#101828]">
                <span aria-hidden="true" className="text-sm font-bold text-[#0a84d6]">
                  {initials(b.seekerName)}
                </span>
                {b.seekerName}
              </p>
              <p className="mt-1 pl-9 font-inter text-sm text-muted">
                {b.kosName} · {b.roomType} · {new Date(b.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy === b.id}
                  onClick={() => proses(b, "terima")}
                  className="h-11 rounded-lg bg-black px-5 font-inter text-sm font-semibold text-white hover:bg-[#333] disabled:opacity-60"
                >
                  ✓ Menerima Booking
                </button>
                <button
                  type="button"
                  disabled={busy === b.id}
                  onClick={() => proses(b, "tolak")}
                  className="h-11 rounded-lg border border-[#e5484d] bg-white px-5 font-inter text-sm font-semibold text-[#c62828] hover:bg-danger-soft disabled:opacity-60"
                >
                  ✕ Menolak Booking
                </button>
              </div>
            </div>
          </section>
        ))}

        {peringatan.map((n) => (
          <section key={n.id} className="rounded-[20px] bg-white p-6">
            <h2 className="font-inter text-base font-semibold text-[#101828]">{n.title}</h2>
            <p className="mt-4 rounded-xl border border-[#8b0000] bg-[#f8f9fb] p-5 font-inter text-base font-medium text-[#8b0000]">
              {n.message}
            </p>
          </section>
        ))}

        {booking.data && !pending.length && !peringatan.length && (
          <p className="rounded-[20px] bg-white p-6 font-inter text-sm text-muted">Belum ada booking baru yang perlu disetujui.</p>
        )}

        {riwayat.length > 0 && (
          <section className="rounded-[20px] bg-white p-6">
            <h2 className="font-inter text-base font-semibold text-[#101828]">Riwayat Booking</h2>
            <ul className="mt-4 flex flex-col divide-y divide-line">
              {riwayat.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-inter text-sm font-semibold text-ink">{b.seekerName}</p>
                    <p className="font-inter text-xs text-muted">
                      {b.kosName} · {b.roomType}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-0.5 font-inter text-xs font-semibold ${STATUS[b.status].className}`}>
                    {STATUS[b.status].label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </OwnerLayout>
  );
}
