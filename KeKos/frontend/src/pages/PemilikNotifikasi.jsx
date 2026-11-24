import { useState } from "react";
import OwnerLayout from "../components/OwnerLayout.jsx";
import { LineIcon } from "../components/Icon.jsx";
import { PageBanner } from "../components/OwnerForm.jsx";
import { ConfirmDialog } from "../components/Modal.jsx";
import { api } from "../api/client.js";
import { getCurrentUser } from "../api/auth.js";
import { useApi } from "../hooks/useApi.js";
import { timeAgo, tanggalPanjang } from "../lib/format.js";

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

const tanggal = (d) => new Date(d).toLocaleDateString("id-ID", { dateStyle: "medium" });

const STATUS = {
  menunggu: { label: "Menunggu konfirmasi", className: "bg-amber-soft text-amber-ink" },
  diterima: { label: "Diterima", className: "bg-ok-soft text-ok" },
  ditolak: { label: "Ditolak", className: "bg-bad-soft text-bad" },
};

const TABS = [
  { id: "semua", label: "Semua" },
  { id: "booking", label: "Booking" },
  { id: "pengingat", label: "Pengingat" },
];

// Frame Figma "Pemilik – Notifikasi (redesign)": booking masuk yang perlu disetujui,
// peringatan kos terbengkalai dari admin, riwayat booking, dan panel detail booking di kanan
export default function PemilikNotifikasi() {
  const booking = useApi("/pemilik/booking");
  const notif = useApi("/notifikasi");
  const user = getCurrentUser();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("semua");
  const [detailId, setDetailId] = useState(null);

  const peringatan = (notif.data || []).filter((n) => n.kind === "peringatan" || n.kind === "listing_dihapus");
  const pending = (booking.data || []).filter((b) => b.status === "menunggu");
  const riwayat = (booking.data || []).filter((b) => b.status !== "menunggu");
  const detail = (booking.data || []).find((b) => b.id === detailId);
  const showBooking = tab !== "pengingat";
  const showPengingat = tab !== "booking";
  const counts = { semua: pending.length + peringatan.length, booking: pending.length, pengingat: peringatan.length };

  // Booking yang sedang dikonfirmasi untuk ditolak (pop-up)
  const [tolak, setTolak] = useState(null);
  const [tolakError, setTolakError] = useState("");

  const proses = async (b, aksi, alasan) => {
    setBusy(b.id);
    setError("");
    setTolakError("");
    try {
      await api(`/pemilik/booking/${b.id}`, { method: "PATCH", body: { aksi, alasan } });
      setTolak(null);
      booking.reload();
    } catch (err) {
      if (aksi === "tolak") setTolakError(err.message);
      else setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const actions = (b) => (
    <>
      <button
        type="button"
        disabled={busy === b.id}
        onClick={() => proses(b, "terima")}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-steel px-4 text-sm font-semibold text-white hover:bg-steel-strong disabled:opacity-60"
      >
        <LineIcon name="check" className="h-4 w-4" />
        Terima booking
      </button>
      <button
        type="button"
        disabled={busy === b.id}
        onClick={() => {
          setTolakError("");
          setTolak(b);
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-steel-line bg-white px-4 text-sm font-semibold text-bad hover:bg-bad-soft disabled:opacity-60"
      >
        <LineIcon name="x" className="h-4 w-4" />
        Tolak
      </button>
    </>
  );

  return (
    <OwnerLayout
      panel={
        detail && (
          <div className="flex min-h-full flex-col gap-[18px]">
            <div className="flex items-start gap-3 border-b border-[#edf1f5] pb-[18px]">
              <div className="min-w-0 flex-1">
                <h2 className="font-serif4 text-2xl font-bold text-steel-ink">Detail booking</h2>
                <p className="mt-1 text-[13px] text-steel-muted">Diajukan {tanggal(detail.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                aria-label="Tutup detail"
                className="grid h-11 w-11 place-items-center rounded-[10px] bg-steel-tint-2 text-steel-body hover:bg-steel-tint"
              >
                <LineIcon name="x" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-steel-tint text-sm font-semibold text-steel">
                {initials(detail.seekerName)}
              </span>
              <p className="font-semibold text-steel-ink">{detail.seekerName}</p>
            </div>
            <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS[detail.status]?.className}`}>
              {STATUS[detail.status]?.label}
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-steel-muted">Data booking</p>
            <dl className="divide-y divide-[#edf1f5] rounded-2xl border border-steel-line px-4 text-sm">
              {[
                ["Kos", detail.kosName],
                ["Tipe kamar", detail.roomType],
                ["Tanggal booking", tanggal(detail.createdAt)],
                ["Tanggal masuk", detail.moveInDate ? tanggalPanjang(detail.moveInDate) : "-"],
                ["Durasi sewa", detail.duration ? `${detail.duration} bulan` : "-"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-3">
                  <dt className="text-steel-muted">{k}</dt>
                  <dd className="text-right font-semibold text-steel-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-steel-muted">Pembayaran dilakukan langsung lewat WhatsApp pemilik, bukan di aplikasi.</p>
            {detail.status === "menunggu" && <div className="mt-auto flex flex-wrap justify-end gap-3 pt-2">{actions(detail)}</div>}
          </div>
        )
      }
    >
      <PageBanner
        name={user?.name || user?.nama}
        title="Notifikasi"
        description="Konfirmasi booking baru dan pantau pengingat untuk kos kamu."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter notifikasi" className="flex rounded-xl bg-[#e3e9f0] p-[3px]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-[9px] px-3.5 text-[13px] ${
                tab === t.id ? "bg-white font-semibold text-steel-strong shadow-[0_1px_3px_rgba(29,58,92,.15)]" : "font-medium text-steel-body"
              }`}
            >
              {t.label}
              <span className="rounded-full bg-steel-tint px-1.5 text-[11px] text-steel-body">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        {pending.length > 0 && (
          <p className="ml-auto flex items-center gap-2 text-xs text-steel-body">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber" />
            {pending.length} booking menunggu konfirmasi
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      {(booking.loading || notif.loading) && <p className="text-sm text-steel-muted">Memuat notifikasi...</p>}
      {booking.error && (
        <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          {booking.error}
        </p>
      )}

      {(showBooking ? pending.length : 0) + (showPengingat ? peringatan.length : 0) > 0 && (
        <section aria-labelledby="perlu-tindakan" className="flex flex-col gap-3">
          <h2 id="perlu-tindakan" className="flex items-center gap-2 text-[15px] font-semibold text-steel-ink">
            Perlu tindakan
            <span className="rounded-full bg-amber-soft px-2 text-xs text-amber-ink">
              {(showBooking ? pending.length : 0) + (showPengingat ? peringatan.length : 0)}
            </span>
          </h2>

          {showBooking &&
            pending.map((b) => (
              <article
                key={b.id}
                className={`rounded-2xl border bg-white p-4 shadow-steel sm:p-5 ${detailId === b.id ? "border-steel" : "border-steel-line"}`}
              >
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-steel-tint text-sm font-semibold text-steel">
                    {initials(b.seekerName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-steel-body">
                      <span className="font-semibold text-steel-ink">{b.seekerName}</span> mengajukan booking
                    </p>
                    <p className="text-xs text-steel-muted">Pencari kos</p>
                  </div>
                  <p className="shrink-0 text-xs text-steel-muted">{timeAgo(b.createdAt)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-steel-tint-2 px-2.5 py-1 text-xs text-steel-body">
                    <LineIcon name="building" className="h-3.5 w-3.5 text-steel" />
                    {b.kosName} • {b.roomType}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-steel-tint-2 px-2.5 py-1 text-xs text-steel-body">
                    Dibooking {tanggal(b.createdAt)}
                  </span>
                  {b.moveInDate && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-soft px-2.5 py-1 text-xs font-medium text-amber-ink">
                      Masuk {tanggalPanjang(b.moveInDate)}
                      {b.duration ? ` • ${b.duration} bulan` : ""}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {actions(b)}
                  <button
                    type="button"
                    onClick={() => setDetailId(b.id)}
                    className="ml-auto inline-flex min-h-11 items-center gap-1.5 px-1 text-[13px] font-medium text-steel hover:underline"
                  >
                    Lihat detail
                    <LineIcon name="arrow" className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}

          {showPengingat &&
            peringatan.map((n) => (
              <article key={n.id} className="flex items-start gap-3 rounded-2xl border border-[#efd9a8] bg-[#fdf8ec] p-4 sm:p-5">
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-soft font-semibold text-[#9a6b12]">
                  !
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-steel-ink">{n.title}</h3>
                  <p className="mt-0.5 text-[13px] text-steel-body">{n.message}</p>
                  <p className="mt-1 text-xs text-steel-muted">{timeAgo(n.createdAt)}</p>
                </div>
              </article>
            ))}
        </section>
      )}

      {booking.data && !pending.length && !peringatan.length && (
        <p className="rounded-2xl border border-dashed border-steel-line bg-white p-7 text-center text-sm text-steel-muted">
          Belum ada booking baru yang perlu disetujui.
        </p>
      )}

      {showBooking && riwayat.length > 0 && (
        <section aria-labelledby="sebelumnya" className="flex flex-col gap-3">
          <h2 id="sebelumnya" className="text-[15px] font-semibold text-steel-ink">
            Sebelumnya
          </h2>
          <ul className="divide-y divide-[#edf1f5] rounded-2xl border border-steel-line bg-white px-4 shadow-steel">
            {riwayat.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 place-items-center rounded-full ${b.status === "diterima" ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}
                >
                  <LineIcon name={b.status === "diterima" ? "check" : "x"} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-steel-ink">
                    Booking {b.seekerName} {STATUS[b.status]?.label.toLowerCase()}
                  </p>
                  <p className="text-xs text-steel-muted">
                    {b.kosName} • {b.roomType}
                  </p>
                </div>
                <span className="text-xs text-steel-muted">{tanggal(b.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tolak && (
        <ConfirmDialog
          title="Tolak booking ini?"
          message={`Booking ${tolak.seekerName} untuk ${tolak.kosName} (${tolak.roomType}) akan ditolak. Pengguna akan menerima alasan penolakan ini. Keputusan ini tidak bisa dibatalkan.`}
          confirmLabel="Ya, tolak booking"
          reasonLabel="Alasan penolakan"
          reasonPlaceholder="Mis. kamar sudah terisi atau data pencari belum lengkap"
          busy={busy === tolak.id}
          error={tolakError}
          onConfirm={(alasan) => proses(tolak, "tolak", alasan)}
          onClose={() => setTolak(null)}
        />
      )}
    </OwnerLayout>
  );
}
