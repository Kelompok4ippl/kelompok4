import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { getCurrentUser } from "../api/auth.js";
import { useApi } from "../hooks/useApi.js";
import PageState from "../components/PageState.jsx";
import Navbar from "../components/Navbar.jsx";
import KosMap from "../components/KosMap.jsx";
import Modal, { ConfirmDialog, RatingDialog } from "../components/Modal.jsx";
import { LineIcon } from "../components/Icon.jsx";
import { FacilityChip } from "../components/OwnerForm.jsx";
import { goBack } from "../lib/nav.js";
import { imageUrl, rupiah, timeAgo, KOS_TYPE_LABEL } from "../lib/format.js";

const TYPE_TONE = {
  putra: "bg-steel-tint text-steel-strong",
  putri: "bg-[#f6e6ee] text-[#8e3b62]",
  campur: "bg-[#ece8f5] text-[#5f4c95]",
};

function Stars({ value, className = "text-sm" }) {
  return (
    <span className={`inline-flex gap-0.5 leading-none ${className}`} aria-label={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden="true" className={value >= i - 0.25 ? "text-amber" : "text-[#d5dde6]"}>
          ★
        </span>
      ))}
    </span>
  );
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function ReviewItem({ review, canDelete, onDelete }) {
  return (
    <article className="flex gap-3 py-4">
      <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-steel-tint text-sm font-semibold text-steel-strong">
        {initials(review.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="font-semibold">{review.name}</p>
          <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[10px] font-semibold text-ok">Penyewa</span>
          <span className="text-xs text-steel-muted">{timeAgo(review.createdAt).replace(" yang", "")}</span>
          {canDelete && (
            <button type="button" onClick={onDelete} className="ml-auto min-h-9 rounded-lg px-2.5 text-xs font-semibold text-bad hover:bg-bad-soft">
              Hapus
            </button>
          )}
        </div>
        <Stars value={review.rating} className="mt-1 text-sm" />
        {review.text && <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-steel-body">{review.text}</p>}
      </div>
    </article>
  );
}

// Detail kos (redesign): foto, info kos, tipe kamar, fasilitas, ulasan, lalu kartu harga
// yang menempel di kanan berisi tombol Booking cepat, kartu pemilik, dan lokasi di peta.
export default function DetailKos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: kos, error, loading, reload } = useApi(`/kos/${id}`);
  const [modal, setModal] = useState(null); // null | "semua" | "rating" | "foto"
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [copied, setCopied] = useState(false);
  const user = getCurrentUser();
  const isPencari = user?.role === "pencari";
  // FR-07: hanya penyewa (booking diterima di kos ini) yang boleh memberi rating
  const myBookings = useApi(isPencari ? `/booking?kos_id=${id}` : null);
  const canReview = Boolean(myBookings.data?.some((b) => b.status === "diterima"));
  // Tombol "Simpan": kos favorit pencari (daftar lengkapnya ada di halaman Riwayat kos)
  const favorit = useApi(isPencari ? "/kos/favorit" : null);
  const [savedLocal, setSavedLocal] = useState(null);
  const [savingFav, setSavingFav] = useState(false);

  const canDelete = (r) => Boolean(user) && r.userId === user.id;
  const removeReview = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api(`/kos/${kos.id}/ulasan/${toDelete.id}`, { method: "DELETE" });
      setToDelete(null);
      reload();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: kos.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* dibatalkan pengguna */
    }
  };

  const saved = savedLocal ?? Boolean(favorit.data?.some((k) => String(k.id) === String(id)));
  const toggleSave = async () => {
    const next = !saved;
    setSavedLocal(next);
    setSavingFav(true);
    try {
      await api(`/kos/${id}/favorit`, { method: next ? "POST" : "DELETE" });
    } catch {
      setSavedLocal(!next);
    } finally {
      setSavingFav(false);
    }
  };

  if (loading) return <PageState loading />;
  if (error) return <PageState message={error} />;

  const photos = kos.photos?.length ? kos.photos : [kos.image];
  const maxCount = Math.max(1, ...kos.ratingDistribution.map((d) => d.count));
  const reviews = kos.reviewList;
  const ada = kos.roomsLeft > 0;
  const hasMap = kos.lat != null && kos.lng != null;

  const tiles = [
    ["building", "Total kamar", `${kos.totalRooms ?? "-"} kamar`],
    ["door", "Kamar tersedia", ada ? `${kos.roomsLeft} kamar` : "Penuh"],
    ["tag", "Tipe kamar", kos.rooms.length ? `${kos.rooms.length} tipe` : "-"],
    ["pin", "Jarak", kos.distance || "-"],
  ];

  const reviewButton = isPencari ? (
    <button
      type="button"
      onClick={() => setModal("rating")}
      disabled={!canReview}
      aria-describedby={canReview ? undefined : "info-ulasan"}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-steel-line bg-white px-3.5 text-sm font-semibold text-steel hover:bg-steel-tint-2 disabled:cursor-not-allowed disabled:opacity-55"
    >
      <LineIcon name="pencil" className="h-4 w-4" />
      Beri rating
    </button>
  ) : !user ? (
    <Link
      to="/"
      state={{ from: location.pathname }}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-steel-line bg-white px-3.5 text-sm font-semibold text-steel hover:bg-steel-tint-2"
    >
      Masuk untuk memberi rating
    </Link>
  ) : null;

  return (
    <div className="min-h-screen bg-steel-bg font-poppins text-steel-ink">
      <Navbar />
      <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 lg:pb-16">
        <nav aria-label="Jejak halaman" className="flex flex-wrap items-center gap-2 text-xs text-steel-muted">
          <button type="button" onClick={() => goBack(navigate)} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-steel hover:underline">
            <LineIcon name="arrow" className="h-4 w-4 rotate-180" />
            Kembali
          </button>
          <span aria-hidden="true">/</span>
          <Link to="/dashboard" className="hover:underline">
            Beranda
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-steel-ink">{kos.name}</span>
        </nav>

        {/* Judul */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${TYPE_TONE[kos.type] || TYPE_TONE.campur}`}>
                {(KOS_TYPE_LABEL[kos.type] || kos.type || "").toUpperCase()}
              </span>
              <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${ada ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
                {ada ? `Sisa ${kos.roomsLeft} kamar` : "Penuh"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-steel ring-1 ring-steel-line">
                <LineIcon name="check" className="h-3 w-3" /> Terverifikasi
              </span>
            </div>
            <h1 className="mt-2 font-serif4 text-[32px] font-bold leading-tight sm:text-[38px]">{kos.name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-steel-muted">
              <span className="inline-flex items-center gap-1 font-semibold text-steel-ink">
                <span className="text-amber">★</span> {kos.rating.toFixed(1).replace(".", ",")}
                <span className="font-normal text-steel-muted">({kos.reviews} ulasan)</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <LineIcon name="pin" className="h-4 w-4" /> {kos.address}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
          {isPencari && (
            <button
              type="button"
              onClick={toggleSave}
              disabled={savingFav || favorit.loading}
              aria-pressed={saved}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold disabled:opacity-60 ${
                saved ? "border-[#f0c4cf] bg-[#fbeef1] text-[#b4415e]" : "border-steel-line bg-white text-steel-body hover:bg-steel-tint-2"
              }`}
            >
              <LineIcon name="heart" className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Tersimpan" : "Simpan"}
            </button>
          )}
          <button
            type="button"
            onClick={share}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-steel-line bg-white px-3.5 text-sm font-semibold text-steel-body hover:bg-steel-tint-2"
          >
            <LineIcon name="arrow" className="h-4 w-4 -rotate-45" />
            {copied ? "Tautan disalin" : "Bagikan"}
          </button>
          </div>
        </div>

        {/* Foto */}
        <div className="mt-5 grid gap-2 sm:h-[400px] sm:grid-cols-4 sm:grid-rows-2">
          <button type="button" onClick={() => setModal("foto")} className="overflow-hidden rounded-2xl sm:col-span-2 sm:row-span-2" aria-label="Lihat semua foto">
            <img src={imageUrl(photos[0])} alt={`Foto ${kos.name}`} className="aspect-[16/10] h-full w-full object-cover transition-transform hover:scale-[1.02] sm:aspect-auto" />
          </button>
          {photos.slice(1, 5).map((p, i) => (
            <button
              type="button"
              key={`${p}-${i}`}
              onClick={() => setModal("foto")}
              className={`relative hidden overflow-hidden rounded-2xl sm:block ${photos.length === 2 ? "sm:col-span-2 sm:row-span-2" : photos.length === 3 ? "sm:col-span-2" : ""}`}
              aria-label="Lihat semua foto"
            >
              <img src={imageUrl(p)} alt="" className="h-full w-full object-cover transition-transform hover:scale-[1.03]" />
              {i === Math.min(photos.length - 2, 3) && (
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-[rgba(255,255,255,.95)] px-2.5 py-1.5 text-xs font-semibold text-steel-ink shadow-steel">
                  <LineIcon name="image" className="h-3.5 w-3.5" /> {photos.length} foto
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1fr_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            {/* Tentang kos */}
            <section aria-labelledby="judul-tentang" className="rounded-2xl border border-steel-line bg-white p-5 shadow-steel">
              <h2 id="judul-tentang" className="text-lg font-semibold">
                Tentang kos
              </h2>
              {kos.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-steel-body">{kos.description}</p>}
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {tiles.map(([icon, k, v]) => (
                  <div key={k} className="flex items-center gap-2.5 rounded-xl bg-steel-tint-2 px-3 py-2.5">
                    <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-steel">
                      <LineIcon name={icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[11px] text-steel-muted">{k}</dt>
                      <dd title={v} className="truncate text-sm font-semibold">{v}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            {/* Tipe kamar */}
            <section aria-labelledby="judul-kamar" className="rounded-2xl border border-steel-line bg-white p-5 shadow-steel">
              <h2 id="judul-kamar" className="text-lg font-semibold">
                Tipe kamar &amp; harga
              </h2>
              {kos.rooms.length ? (
                <ul className="mt-3 flex flex-col gap-3">
                  {kos.rooms.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-steel-line p-2.5 sm:flex-nowrap">
                      <img src={imageUrl(r.image || kos.image)} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{r.type}</p>
                        {r.facilities?.length > 0 && (
                          <ul className="mt-1 flex flex-wrap gap-1">
                            {r.facilities.slice(0, 4).map((f) => (
                              <li key={f}>
                                <FacilityChip name={f} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="ml-auto text-right">
                        <p>
                          <span className="font-semibold">{rupiah(r.price, { short: true })}</span>
                          <span className="text-xs text-steel-muted"> /bln</span>
                        </p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.available > 0 ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
                          {r.available > 0 ? `${r.available} tersedia` : "Penuh"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-steel-muted">Belum ada tipe kamar.</p>
              )}
            </section>

            {/* Fasilitas */}
            {kos.facilities.length > 0 && (
              <section aria-labelledby="judul-fasilitas" className="rounded-2xl border border-steel-line bg-white p-5 shadow-steel">
                <h2 id="judul-fasilitas" className="text-lg font-semibold">
                  Fasilitas
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {kos.facilities.map((f) => (
                    <li key={f}>
                      <FacilityChip name={f} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Ulasan */}
            <section aria-labelledby="judul-ulasan" className="rounded-2xl border border-steel-line bg-white p-5 shadow-steel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="judul-ulasan" className="text-lg font-semibold">
                  Ulasan penghuni
                </h2>
                {reviewButton}
              </div>
              {isPencari && !canReview && !myBookings.loading && (
                <p id="info-ulasan" className="mt-2 text-xs text-steel-muted">
                  Hanya penyewa yang dapat memberi rating. Rating bisa diberikan setelah booking kamu diterima pemilik.
                </p>
              )}

              <div className="mt-4 grid items-center gap-5 rounded-xl bg-steel-tint-2 p-4 sm:grid-cols-[140px_1fr]">
                <div className="text-center sm:border-r sm:border-steel-line sm:pr-4">
                  <p className="font-serif4 text-[44px] font-bold leading-none">{kos.rating.toFixed(1).replace(".", ",")}</p>
                  <Stars value={kos.rating} className="mt-1.5 text-base" />
                  <p className="mt-1 text-xs text-steel-muted">{kos.reviews} ulasan</p>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {kos.ratingDistribution.map((d) => (
                    <li key={d.stars} className="flex items-center gap-2 text-xs text-steel-muted">
                      <span className="w-6 text-right">{d.stars} ★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                        <span className="block h-full rounded-full bg-amber" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                      </span>
                      <span className="w-5">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {reviews.length ? (
                <div className="mt-2 divide-y divide-[#e8edf2]">
                  {reviews.slice(0, 3).map((r) => (
                    <ReviewItem key={r.id} review={r} canDelete={canDelete(r)} onDelete={() => setToDelete(r)} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-steel-muted">Belum ada ulasan untuk kos ini.</p>
              )}
              {reviews.length > 3 && (
                <button
                  type="button"
                  onClick={() => setModal("semua")}
                  className="mt-2 min-h-10 w-full rounded-xl border border-steel-line text-sm font-semibold text-steel hover:bg-steel-tint-2"
                >
                  Lihat semua ulasan ({reviews.length})
                </button>
              )}
            </section>
          </div>

          {/* Kanan: harga, pemilik, lokasi */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-steel-line bg-white p-5 shadow-steel">
              <p className="text-xs text-steel-muted">Mulai dari</p>
              <p className="mt-0.5">
                <span className="font-serif4 text-[30px] font-bold">{kos.price ? rupiah(kos.price) : "-"}</span>
                <span className="text-sm text-steel-muted"> /bulan</span>
              </p>
              <dl className="mt-4 divide-y divide-[#e4eaf1] rounded-xl bg-steel-tint-2 px-4 text-sm">
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-steel-muted">Kamar tersedia</dt>
                  <dd className={`font-semibold ${ada ? "" : "text-bad"}`}>{ada ? `${kos.roomsLeft} kamar` : "Penuh"}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-steel-muted">Biaya booking</dt>
                  <dd className="font-semibold text-ok">Gratis</dd>
                </div>
              </dl>
              {/* FR-05: di ponsel tombol menempel di bawah layar. Kalau belum login, RequireRole mengarahkan ke login dulu. */}
              <div className="fixed inset-x-0 bottom-0 z-30 border-t border-steel-line bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(29,58,92,.12)] lg:static lg:mt-4 lg:border-0 lg:p-0 lg:shadow-none">
                <Link
                  to={`/kos/${kos.id}/booking`}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-steel text-sm font-semibold text-white hover:bg-steel-strong"
                >
                  {ada ? "Booking cepat" : "Lihat ketersediaan kamar"}
                  <LineIcon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-steel-muted">
                <LineIcon name="check" className="h-3.5 w-3.5" />
                Bayar langsung ke pemilik setelah dikonfirmasi.
              </p>
            </section>

            <section className="flex items-center gap-3 rounded-2xl border border-steel-line bg-white p-4 shadow-steel">
              <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-steel-side font-semibold text-white">
                {initials(kos.owner.name)}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-steel-muted">Pemilik kos</p>
                <p className="truncate font-semibold">{kos.owner.name}</p>
                <p className="text-[11px] text-steel-muted">Nomor WhatsApp dibuka setelah booking diterima.</p>
              </div>
            </section>

            {hasMap && (
              <section aria-labelledby="judul-lokasi" className="overflow-hidden rounded-2xl border border-steel-line bg-white shadow-steel">
                <h2 id="judul-lokasi" className="px-4 pt-4 font-semibold">
                  Lokasi
                </h2>
                <p className="flex items-start gap-1.5 px-4 pb-3 pt-1 text-xs text-steel-muted">
                  <LineIcon name="pin" className="mt-px h-3.5 w-3.5 shrink-0" /> {kos.address}
                </p>
                <KosMap kos={[kos]} className="h-[220px]" />
              </section>
            )}
          </aside>
        </div>
      </main>

      {modal === "rating" && canReview && (
        <RatingDialog
          kos={{ id: kos.id, name: kos.name, image: kos.image, subtitle: kos.address }}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            reload();
          }}
        />
      )}

      {modal === "semua" && (
        <Modal label={`Ulasan ${kos.name}`} onClose={() => setModal(null)} className="items-end justify-center bg-[rgba(26,43,63,.45)] sm:items-center sm:p-4">
          <div className="flex max-h-[88vh] w-full max-w-[560px] flex-col rounded-t-[20px] bg-white font-poppins text-steel-ink sm:rounded-[20px]">
            <div className="flex items-center justify-between gap-4 border-b border-steel-line px-5 py-4">
              <h2 className="font-serif4 text-xl font-bold">Ulasan penghuni ({reviews.length})</h2>
              <button type="button" onClick={() => setModal(null)} aria-label="Tutup" className="grid h-11 w-11 place-items-center rounded-[10px] bg-steel-tint-2 text-xl text-steel-body hover:bg-steel-tint">
                ×
              </button>
            </div>
            <div className="divide-y divide-[#e8edf2] overflow-y-auto px-5 pb-4">
              {reviews.map((r) => (
                <ReviewItem key={r.id} review={r} canDelete={canDelete(r)} onDelete={() => setToDelete(r)} />
              ))}
            </div>
          </div>
        </Modal>
      )}

      {modal === "foto" && (
        <Modal label={`Foto ${kos.name}`} onClose={() => setModal(null)} className="items-center justify-center bg-[rgba(16,28,42,.85)] p-4">
          <div className="relative max-h-[90vh] w-full max-w-[960px] overflow-y-auto rounded-[20px] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif4 text-xl font-bold text-steel-ink">Foto {kos.name}</h2>
              <button type="button" onClick={() => setModal(null)} aria-label="Tutup" className="grid h-11 w-11 place-items-center rounded-[10px] bg-steel-tint-2 text-xl text-steel-body hover:bg-steel-tint">
                ×
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {photos.map((p, i) => (
                <img key={`${p}-${i}`} src={imageUrl(p)} alt={`Foto kos ${i + 1}`} className="aspect-[4/3] w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Hapus ulasan?"
          message="Ulasan yang dihapus tidak bisa dikembalikan."
          confirmLabel="Hapus ulasan"
          busy={deleting}
          error={deleteError}
          onConfirm={removeReview}
          onClose={() => {
            setToDelete(null);
            setDeleteError("");
          }}
        />
      )}
    </div>
  );
}
