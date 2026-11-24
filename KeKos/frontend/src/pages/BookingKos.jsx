import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import PageState from "../components/PageState.jsx";
import Navbar from "../components/Navbar.jsx";
import Modal from "../components/Modal.jsx";
import { LineIcon } from "../components/Icon.jsx";
import { FacilityChip } from "../components/OwnerForm.jsx";
import { goBack } from "../lib/nav.js";
import { imageUrl, rupiah, KOS_TYPE_LABEL, isoDate, tanggalPanjang, tanggalSelesai } from "../lib/format.js";

const DURASI = [1, 2, 3, 6, 12];

const STEPS = ["Pilih kamar", "Konfirmasi", "Selesai"];

// Booking cepat (redesign): pilih tipe kamar di kiri, ringkasan kos & status di kanan,
// lalu pop-up "Ajukan booking" sebelum permintaan dikirim ke pemilik.
// Status: Booking sekarang → Menunggu konfirmasi pemilik → Telah terbooking.
export default function BookingKos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const kos = useApi(`/kos/${id}`);
  const bookings = useApi(`/booking?kos_id=${id}`);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // Rencana tanggal masuk (hari ini s/d 6 bulan ke depan) dan lama sewa dalam bulan
  const [tanggalMasuk, setTanggalMasuk] = useState("");
  const [durasi, setDurasi] = useState(1);
  const [sent, setSent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  if (kos.loading || bookings.loading) return <PageState loading />;
  if (kos.error) return <PageState message={kos.error} />;

  const data = kos.data;
  // Booking aktif terakhir (menunggu / diterima); booking yang ditolak boleh diulang
  const active = bookings.data?.find((b) => b.status !== "ditolak");
  const rejected = !active && bookings.data?.some((b) => b.status === "ditolak");
  const firstAvailable = data.rooms.find((r) => r.available > 0);
  const selected =
    data.rooms.find((r) => r.id === (active?.roomId ?? selectedId)) || firstAvailable || data.rooms[0];

  const book = async () => {
    if (!selected || selected.available <= 0) return;
    setSaving(true);
    setError("");
    try {
      await api("/booking", { method: "POST", body: { kamar_id: selected.id, tanggal_masuk: tanggalMasuk, durasi_bulan: durasi } });
      setSent(true);
      setConfirmOpen(false);
      bookings.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const status = active?.status;
  const buttonText =
    status === "diterima" ? "Telah terbooking" : status === "menunggu" ? "Menunggu konfirmasi pemilik" : "Booking sekarang";
  // Status booking gagal dimuat: jangan tawarkan booking dulu, supaya tidak berujung error "sudah booking"
  const cannotBook = Boolean(status) || Boolean(bookings.error) || saving || !selected || selected.available <= 0;
  const minTanggal = isoDate();
  const maxTanggal = isoDate(new Date(), 6);
  const tanggalOk = tanggalMasuk >= minTanggal && tanggalMasuk <= maxTanggal;
  // Booking aktif memakai data yang tersimpan; sebelum booking memakai isian form
  const rencanaMasuk = active ? active.moveInDate : tanggalOk ? tanggalMasuk : null;
  const rencanaDurasi = active ? active.duration : durasi;
  const selesai = tanggalSelesai(rencanaMasuk, rencanaDurasi);
  const waNumber = active?.ownerPhone?.replace(/\D/g, "").replace(/^0/, "62");

  const step = status === "diterima" ? 3 : status === "menunggu" ? 2 : 1;
  // Foto mengikuti tipe kamar yang dipilih; kalau tipe itu belum punya foto, pakai foto kos
  const roomPhotos = selected?.photos?.length ? selected.photos : selected?.image ? [selected.image] : [];
  const photos = roomPhotos.length ? roomPhotos : data.photos?.length ? data.photos : [data.image];
  const tersedia = selected?.available > 0;

  return (
    <div className="min-h-screen bg-steel-bg font-poppins text-steel-ink">
      <Navbar />
      <main className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6">
        <nav aria-label="Jejak halaman" className="flex flex-wrap items-center gap-2 text-xs text-steel-muted">
          <button type="button" onClick={() => goBack(navigate, `/kos/${id}`)} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-steel hover:underline">
            <LineIcon name="arrow" className="h-4 w-4 rotate-180" />
            Kembali
          </button>
          <span aria-hidden="true">/</span>
          <Link to={`/kos/${id}`} className="hover:underline">
            {data.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-steel-ink">Booking cepat</span>
        </nav>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif4 text-[32px] font-bold leading-tight">Booking cepat</h1>
            <p className="mt-1 text-sm text-steel-muted">Pilih tipe kamar, cek ringkasan, lalu kirim permintaan booking ke pemilik.</p>
          </div>
          <ol aria-label="Langkah booking" className="flex items-center gap-2 text-xs font-semibold">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = n < step || step === 3;
              const now = n === step && step !== 3;
              return (
                <li key={label} className="flex items-center gap-2" aria-current={now ? "step" : undefined}>
                  {i > 0 && <span aria-hidden="true" className={`h-px w-8 ${n <= step ? "bg-steel" : "bg-steel-line"}`} />}
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                      done ? "bg-steel text-white" : now ? "border-2 border-steel text-steel" : "border border-steel-line text-steel-muted"
                    }`}
                  >
                    {done ? <LineIcon name="check" className="h-3.5 w-3.5" /> : n}
                  </span>
                  <span className={n <= step ? "text-steel-ink" : "text-steel-muted"}>{label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[380px_1fr]">
          {/* Kiri: daftar tipe kamar */}
          <section aria-labelledby="judul-tipe" className="rounded-2xl border border-steel-line bg-white p-4 shadow-steel sm:p-5 lg:sticky lg:top-24">
            <h2 id="judul-tipe" className="font-semibold">Pilih tipe kamar</h2>
            <p className="text-xs text-steel-muted">{data.rooms.length} tipe kamar • harga per bulan</p>
            <ul className="mt-4 flex flex-col gap-3">
              {data.rooms.map((room) => {
                const on = room.id === selected?.id;
                const ada = room.available > 0;
                const locked = Boolean(active);
                return (
                  <li key={room.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      disabled={locked && !on}
                      onClick={locked ? undefined : () => setSelectedId(room.id)}
                      className={`flex w-full gap-3 rounded-xl border p-2.5 text-left transition-colors disabled:opacity-60 ${
                        on ? "border-steel bg-steel-tint-2 ring-1 ring-steel" : "border-steel-line bg-white hover:border-steel"
                      }`}
                    >
                      <img src={imageUrl(room.image)} alt="" className="h-[76px] w-[76px] shrink-0 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span className="flex-1 text-sm font-semibold">{room.type}</span>
                          <span
                            aria-hidden="true"
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-steel bg-steel text-white" : "border-steel-line"}`}
                          >
                            {on && <LineIcon name="check" className="h-3 w-3" />}
                          </span>
                        </span>
                        {room.description && <span className="mt-0.5 line-clamp-2 block text-[11px] text-steel-muted">{room.description}</span>}
                        <span className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
                          <span>
                            <span className="text-sm font-semibold">{rupiah(room.price, { short: true })}</span>
                            <span className="text-[11px] text-steel-muted"> /bln</span>
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ada ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
                            {ada ? `${room.available} tersedia` : "Penuh"}
                          </span>
                        </span>
                        {active?.roomId === room.id && status === "menunggu" && (
                          <span className="mt-1 block text-[11px] font-semibold text-amber-ink">Menunggu konfirmasi pemilik</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!data.rooms.length && <p className="mt-3 text-sm text-steel-muted">Belum ada tipe kamar.</p>}
          </section>

          <div className="flex flex-col gap-5">
            {/* Ringkasan kos */}
            <section className="rounded-2xl border border-steel-line bg-white p-4 shadow-steel sm:p-5">
              <div className={`relative grid gap-2 ${photos.length > 1 ? "sm:h-[340px] sm:grid-cols-[2fr_1fr]" : ""}`}>
                <img
                  src={imageUrl(photos[0])}
                  alt={roomPhotos.length ? `Foto kamar ${selected.type}` : `Foto ${data.name}`}
                  className={`w-full rounded-xl object-cover ${photos.length > 1 ? "aspect-[16/9] sm:aspect-auto sm:h-full" : "aspect-[16/9] sm:aspect-[21/9]"}`}
                />
                {photos.length > 1 && (
                  <div className="grid grid-cols-2 gap-2 sm:min-h-0 sm:grid-cols-1 sm:grid-rows-2">
                    {photos.slice(1, 3).map((p, i) => (
                      <img key={p + i} src={imageUrl(p)} alt="" className="aspect-[16/9] w-full rounded-xl object-cover sm:aspect-auto sm:h-full sm:min-h-0" />
                    ))}
                  </div>
                )}
                {photos.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="absolute bottom-3 right-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[rgba(255,255,255,.95)] px-3 text-xs font-semibold text-steel-ink shadow-steel hover:bg-white"
                  >
                    <LineIcon name="image" className="h-3.5 w-3.5" />
                    Lihat semua foto ({photos.length})
                  </button>
                )}
                {roomPhotos.length > 0 && (
                  <span className="absolute left-3 top-3 rounded-lg bg-[rgba(255,255,255,.95)] px-2.5 py-1 text-[11px] font-semibold text-steel-ink shadow-steel">
                    Foto kamar {selected.type}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold">{data.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-steel-muted">
                    <LineIcon name="pin" className="h-3.5 w-3.5" />
                    {[data.address, data.distance].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <span className="rounded-lg bg-[#ece8f5] px-2.5 py-1 text-[11px] font-semibold text-[#5f4c95]">
                  {(KOS_TYPE_LABEL[data.type] || data.type || "").toUpperCase()}
                </span>
              </div>
              <dl className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  ["Pemilik", data.owner.name],
                  ["Kamar tersedia", `${selected?.available ?? data.roomsLeft} kamar`],
                  ["Tipe dipilih", selected?.type || "-"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-steel-tint-2 px-3.5 py-2.5">
                    <dt className="text-[11px] text-steel-muted">{k}</dt>
                    <dd className="text-sm font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              {(selected?.facilities ?? data.facilities).length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {(selected?.facilities ?? data.facilities).map((f) => (
                    <li key={f}>
                      <FacilityChip name={f} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Status & tombol booking */}
            <section aria-live="polite" className="rounded-2xl border border-steel-line bg-white p-4 shadow-steel sm:p-5">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    status === "menunggu" ? "bg-amber-soft text-[#9a6b12]" : tersedia || status ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"
                  }`}
                >
                  <LineIcon name={status === "menunggu" ? "bell" : tersedia || status ? "check" : "x"} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">
                    {status === "diterima"
                      ? "Booking diterima, hubungi pemilik"
                      : status === "menunggu"
                        ? "Booking terkirim, menunggu konfirmasi"
                        : tersedia
                          ? "Kamar tersedia, siap dibooking"
                          : "Kamar penuh, pilih tipe lain"}
                  </h2>
                  <p className="text-sm text-steel-muted">
                    {status === "menunggu"
                      ? "Pemilik akan mengonfirmasi lewat notifikasi."
                      : status === "diterima"
                        ? "Booking kamu sudah diterima pemilik. Lanjutkan pembayaran lewat WhatsApp."
                        : tersedia
                          ? `Kamar ${selected.type} masih tersedia. Kirim permintaan sekarang, pemilik akan mengonfirmasi lewat notifikasi.`
                          : "Tipe kamar ini sedang penuh."}
                  </p>
                </div>
              </div>

              {!status && tersedia && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold">
                    Tanggal masuk
                    <input
                      type="date"
                      required
                      min={minTanggal}
                      max={maxTanggal}
                      value={tanggalMasuk}
                      onChange={(e) => setTanggalMasuk(e.target.value)}
                      aria-describedby="info-tanggal"
                      className="h-12 rounded-xl border border-steel-line bg-white px-3.5 text-sm font-normal text-steel-ink outline-none focus:border-steel focus:ring-2 focus:ring-steel-tint"
                    />
                    <span id="info-tanggal" className="text-[11px] font-normal text-steel-muted">
                      Paling lambat {tanggalPanjang(maxTanggal)}.
                    </span>
                  </label>
                  <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold">
                    Durasi sewa
                    <select
                      value={durasi}
                      onChange={(e) => setDurasi(Number(e.target.value))}
                      className="h-12 rounded-xl border border-steel-line bg-white px-3.5 text-sm font-normal text-steel-ink outline-none focus:border-steel focus:ring-2 focus:ring-steel-tint"
                    >
                      {DURASI.map((n) => (
                        <option key={n} value={n}>
                          {n} bulan
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <dl className="mt-4 divide-y divide-[#e4eaf1] rounded-xl bg-steel-tint-2 px-4 text-sm">
                {[
                  ["Tipe kamar", selected?.type || "-"],
                  ["Harga sewa", `${rupiah(selected?.price ?? data.price, { short: true })}/bulan`],
                  ["Tanggal masuk", rencanaMasuk ? tanggalPanjang(rencanaMasuk) : "-"],
                  ["Durasi sewa", rencanaDurasi ? `${rencanaDurasi} bulan${selesai ? ` (s/d ${tanggalPanjang(selesai)})` : ""}` : "-"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2.5">
                    <dt className="text-steel-muted">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-steel-muted">Biaya booking</dt>
                  <dd className="font-semibold text-ok">Gratis</dd>
                </div>
              </dl>

              {status === "diterima" ? (
                waNumber ? (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ok text-sm font-semibold text-white hover:bg-[#256a49]"
                  >
                    Hubungi pemilik di WhatsApp (+{waNumber})
                  </a>
                ) : (
                  <p className="mt-4 rounded-xl bg-steel-tint-2 px-3 py-2 text-sm text-steel-muted">Nomor pemilik belum diisi.</p>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setConfirmOpen(true);
                  }}
                  disabled={cannotBook || !tanggalOk}
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-steel text-sm font-semibold text-white hover:bg-steel-strong disabled:cursor-not-allowed disabled:bg-[#c6d0db]"
                >
                  {status !== "menunggu" && <LineIcon name="arrow" className="h-4 w-4" />}
                  {buttonText}
                </button>
              )}
              {!status && tersedia && !tanggalOk && (
                <p className="mt-2 text-xs font-medium text-amber-ink">Pilih tanggal masuk dulu untuk melanjutkan booking.</p>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-steel-muted">
                <LineIcon name="check" className="h-3.5 w-3.5" />
                Booking gratis, tanpa pembayaran di muka. Bayar langsung ke pemilik setelah dikonfirmasi.
              </p>

              {sent && status === "menunggu" && (
                <p role="status" className="mt-3 rounded-xl bg-ok-soft px-3 py-2 text-sm font-medium text-ok">
                  Booking berhasil dikirim. Tunggu konfirmasi pemilik di notifikasi.
                </p>
              )}
              {bookings.error && (
                <p role="alert" className="mt-3 text-sm text-bad">
                  Status booking kamu gagal dimuat ({bookings.error}).{" "}
                  <button type="button" onClick={bookings.reload} className="font-semibold underline">
                    Coba lagi
                  </button>
                </p>
              )}
              {error && !confirmOpen && (
                <p role="alert" className="mt-3 text-sm text-bad">
                  {error}
                </p>
              )}
              {rejected && <p className="mt-3 text-sm text-amber-ink">Booking sebelumnya ditolak pemilik. Kamu bisa memilih kamar lain.</p>}
            </section>
          </div>
        </div>
      </main>

      {/* Semua foto tipe kamar terpilih (atau foto kos kalau tipe itu belum punya foto) */}
      {galleryOpen && (
        <Modal
          label={roomPhotos.length ? `Foto kamar ${selected.type}` : `Foto ${data.name}`}
          onClose={() => setGalleryOpen(false)}
          className="items-center justify-center bg-[rgba(16,28,42,.85)] p-4"
        >
          <div className="max-h-[90vh] w-full max-w-[960px] overflow-y-auto rounded-[20px] bg-white p-4 font-poppins text-steel-ink">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-serif4 text-xl font-bold">
                {roomPhotos.length ? `Foto kamar ${selected.type}` : `Foto ${data.name}`}
                <span className="ml-2 font-poppins text-sm font-normal text-steel-muted">{photos.length} foto</span>
              </h2>
              <button
                type="button"
                onClick={() => setGalleryOpen(false)}
                aria-label="Tutup"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-steel-tint-2 text-steel-body hover:bg-steel-tint"
              >
                <LineIcon name="x" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {photos.map((p, i) => (
                <img key={`${p}-${i}`} src={imageUrl(p)} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Pop-up konfirmasi sebelum permintaan booking dikirim */}
      {confirmOpen && selected && (
        <Modal label="Ajukan booking" onClose={() => !saving && setConfirmOpen(false)} className="items-center justify-center bg-[rgba(26,43,63,.45)] p-4">
          <div className="w-full max-w-[460px] rounded-[20px] bg-white p-6 font-poppins text-steel-ink shadow-[0_24px_60px_-20px_rgba(29,58,92,.5)]">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-serif4 text-2xl font-bold">Ajukan booking</h2>
                <p className="mt-1 text-sm text-steel-muted">Cek ringkasan sebelum permintaanmu dikirim ke pemilik kos.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
                aria-label="Tutup"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-steel-tint-2 text-steel-body hover:bg-steel-tint"
              >
                <LineIcon name="x" />
              </button>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-steel-tint-2 p-3">
              <img src={imageUrl(selected.image || data.image)} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{data.name}</p>
                <p className="text-xs text-steel-muted">Kamar {selected.type}</p>
              </div>
              <p className="text-right">
                <span className="block font-semibold">{rupiah(selected.price, { short: true })}</span>
                <span className="text-[11px] text-steel-muted">/bulan</span>
              </p>
            </div>
            <dl className="mt-4 divide-y divide-[#edf1f5] rounded-xl border border-steel-line px-4 text-sm">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-steel-muted">Harga sewa per bulan</dt>
                <dd className="font-semibold">{rupiah(selected.price, { short: true })}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-steel-muted">Tanggal masuk</dt>
                <dd className="text-right font-semibold">{tanggalPanjang(tanggalMasuk)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-steel-muted">Durasi sewa</dt>
                <dd className="text-right font-semibold">
                  {durasi} bulan
                  {selesai && <span className="block text-[11px] font-normal text-steel-muted">s/d {tanggalPanjang(selesai)}</span>}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-steel-muted">Perkiraan total sewa</dt>
                <dd className="font-semibold">{rupiah(selected.price * durasi, { short: true })}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-steel-muted">Biaya booking</dt>
                <dd className="font-semibold text-ok">Gratis</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-steel-muted">Pembayaran dilakukan langsung ke pemilik lewat WhatsApp setelah booking dikonfirmasi.</p>
            {error && (
              <p role="alert" className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
                {error}
              </p>
            )}
            <div className="mt-5 grid grid-cols-[1fr_2fr] gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
                className="min-h-11 rounded-xl border border-steel-line text-sm font-semibold text-steel-body hover:bg-steel-tint-2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={book}
                disabled={saving}
                autoFocus
                className="min-h-11 rounded-xl bg-steel text-sm font-semibold text-white hover:bg-steel-strong disabled:opacity-60"
              >
                {saving ? "Mengirim..." : "Kirim permintaan booking"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
