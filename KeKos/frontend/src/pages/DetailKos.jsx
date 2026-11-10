import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { getCurrentUser } from "../api/auth.js";
import { useApi } from "../hooks/useApi.js";
import Gallery from "../components/Gallery.jsx";
import KosInfo from "../components/KosInfo.jsx";
import PageState from "../components/PageState.jsx";
import Navbar from "../components/Navbar.jsx";
import Button from "../components/ui/Button.jsx";
import { goBack } from "../lib/nav.js";
import { rupiah, timeAgo } from "../lib/format.js";

import backIcon from "../assets/arrow-back.svg";
import distanceIcon from "../assets/distance-rounded.svg";
import commentIcon from "../assets/comment-detail.svg";
import thumbsIcon from "../assets/thumbs-up.svg";
import chatIcon from "../assets/chat.svg";
import starIcon from "../assets/star.svg";
import starHalfIcon from "../assets/star-half.svg";

function Stars({ value }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) =>
        value >= i ? (
          <img key={i} src={starIcon} alt="" className="h-3.5 w-3.5" />
        ) : value >= i - 0.5 ? (
          <img key={i} src={starHalfIcon} alt="" className="h-3.5 w-3.5" />
        ) : (
          // Bintang kosong tetap digambar supaya rating 2 terbaca "2 dari 5"
          <img key={i} src={starIcon} alt="" className="h-3.5 w-3.5 opacity-30 grayscale" />
        )
      )}
    </span>
  );
}

function ReviewForm({ kosId, onDone }) {
  const [rating, setRating] = useState(5);
  const [isi, setIsi] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(`/kos/${kosId}/ulasan`, { method: "POST", body: { rating, isi } });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded-xl bg-surface p-3">
      {/* Tombol bintang 40px, bisa dipilih dengan tombol panah */}
      <div
        className="flex gap-1"
        role="radiogroup"
        aria-label="Rating (wajib)"
        onKeyDown={(e) => {
          const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
          if (!step) return;
          e.preventDefault();
          const next = Math.min(5, Math.max(1, rating + step));
          setRating(next);
          e.currentTarget.querySelectorAll("[role=radio]")[next - 1]?.focus();
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            aria-label={`${i} bintang`}
            tabIndex={rating === i ? 0 : -1}
            onClick={() => setRating(i)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-3xl leading-none ${
              i <= rating ? "text-[#f59e0b]" : "text-[#8b8b93]"
            }`}
          >
            {i <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <textarea
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        rows={3}
        placeholder="Ceritakan pengalamanmu tinggal di kos ini (opsional)"
        className="rounded-lg border border-line p-2 font-inter text-sm outline-none focus:border-focus"
      />
      {error && <p role="alert" className="font-inter text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={saving} className="self-end">
        {saving ? "Mengirim..." : "Kirim Ulasan"}
      </Button>
    </form>
  );
}

// Satu ulasan. onOpen (opsional) membuat tombol "Komentar" membuka popup semua ulasan.
function ReviewItem({ review, canDelete, onDelete, onOpen, className = "" }) {
  return (
    <article className={className}>
      <div className="flex items-center gap-4">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border-2 border-[#3d4fd1] bg-[#6d7cf0] font-poppins text-2xl text-white">
          {review.name[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-poppins text-lg font-semibold text-black">{review.name}</p>
          <p className="font-inter text-xs font-semibold text-muted">Penyewa</p>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 inline-flex h-11 items-center rounded-full border border-danger px-4 font-inter text-xs font-semibold text-danger hover:bg-danger hover:text-white"
          >
            Hapus
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Stars value={review.rating} />
        <span className="font-inter text-xs text-muted">{timeAgo(review.createdAt).replace(" yang", "")}</span>
      </div>
      <p className="mt-3 whitespace-pre-line break-words font-inter text-xs leading-[19px] text-ink">{review.text}</p>
      <div className="mt-3 flex gap-4 font-inter text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <img src={thumbsIcon} alt="" className="h-3.5 w-3.5" /> Membantu ({review.helpful})
        </span>
        {onOpen && (
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 hover:text-black hover:underline">
            <img src={chatIcon} alt="" className="h-3.5 w-3.5" /> Komentar
          </button>
        )}
      </div>
    </article>
  );
}

// Popup di tengah layar; tutup dengan tombol ×, klik di luar kotak, atau tombol Esc
// Fokus keyboard pindah ke dalam popup, terkunci di dalamnya (Tab), dan kembali ke tombol pembuka saat ditutup.
function ReviewModal({ title, onClose, children }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const box = boxRef.current;
    box?.querySelector("button, textarea, a")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !box) return;
      const items = [...box.querySelectorAll("button:not([disabled]):not([tabindex='-1']), textarea, a[href]")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#00000099] sm:items-center sm:p-4"
    >
      <div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-[560px] flex-col rounded-t-[20px] bg-white shadow-[0_10px_40px_#00000059] sm:rounded-[20px]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 className="font-poppins text-lg font-bold text-black">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-muted hover:bg-surface hover:text-black">
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 pt-3">{children}</div>
      </div>
    </div>
  );
}

export default function DetailKos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: kos, error, loading, reload } = useApi(`/kos/${id}`);
  const [modal, setModal] = useState(null); // null | "lihat" | "tulis"
  const [deleteError, setDeleteError] = useState("");
  const user = getCurrentUser();
  const isPencari = user?.role === "pencari";
  // FR-07: hanya penyewa (booking diterima di kos ini) yang boleh menulis ulasan, jadi beri tahu sejak awal
  const myBookings = useApi(isPencari ? `/booking?kos_id=${id}` : null);
  const canReview = Boolean(myBookings.data?.some((b) => b.status === "diterima"));

  const canDelete = (r) => Boolean(user) && r.userId === user.id;
  const removeReview = async (r) => {
    if (!window.confirm("Hapus ulasan ini? Ulasan yang dihapus tidak bisa dikembalikan.")) return;
    setDeleteError("");
    try {
      await api(`/kos/${kos.id}/ulasan/${r.id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  if (loading) return <PageState loading />;
  if (error) return <PageState message={error} />;

  const review = kos.reviewList[0];
  const maxCount = Math.max(1, ...kos.ratingDistribution.map((d) => d.count));

  return (
    <>
      <Navbar />
    <main className="mx-auto max-w-[1440px] bg-white px-4 pb-28 pt-6 sm:px-[47px] sm:pt-7 lg:pb-16">
      <header className="flex items-center gap-2 sm:-ml-[7px]">
        <button type="button" onClick={() => goBack(navigate)} aria-label="Kembali" className="-ml-2.5 flex h-11 w-11 items-center justify-center">
          <img src={backIcon} alt="" className="h-6 w-6" />
        </button>
        <h1 className="font-poppins text-2xl font-bold text-ink">Detail Kos</h1>
      </header>

      <Gallery photos={kos.photos} fit="natural" className="mt-3 rounded-b-none sm:px-[35px] sm:py-[42px]" />

      <div className="mt-8 grid gap-8 lg:grid-cols-2 xl:grid-cols-[minmax(0,413px)_minmax(0,446px)_minmax(0,1fr)] xl:gap-[41px]">
        {/* Informasi */}
        <section className="rounded-[20px] bg-surface-strong px-[35px] pb-10 pt-16 lg:min-h-[480px]">
          <h2 className="mb-5 font-poppins text-lg font-bold text-black">Informasi</h2>
          <KosInfo
            ownerName={kos.owner.name}
            totalRooms={kos.totalRooms}
            roomsLeft={kos.roomsLeft}
            roomType={kos.rooms.length ? `${kos.rooms.length} tipe` : "-"}
            facilities={kos.facilities}
          />
          <h3 className="mt-8 font-poppins text-base font-bold text-black">Tipe Kamar &amp; Harga</h3>
          {kos.rooms.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {kos.rooms.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-poppins text-sm font-semibold text-black">{r.type}</p>
                    <p className="font-inter text-xs text-body">{rupiah(r.price)} / bulan</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 font-inter text-xs font-medium ${
                      r.available > 0 ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                    }`}
                  >
                    {r.available > 0 ? `${r.available} tersedia` : "Penuh"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-inter text-xs text-muted">Belum ada tipe kamar.</p>
          )}
        </section>

        {/* Nama, alamat, harga, rating */}
        <section className="rounded-[20px] bg-black px-[34px] pb-10 pt-[67px] text-white lg:min-h-[480px]">
          <h2 className="font-poppins text-lg font-bold">{kos.name}</h2>
          <div className="mt-5 flex items-start gap-4">
            <img src={distanceIcon} alt="" className="h-10 w-10 shrink-0" />
            <p className="font-poppins text-lg leading-[24px]">{kos.address}</p>
          </div>
          <p className="mt-6 font-poppins text-2xl">
            <span className="block font-inter text-sm text-[#d4d4d4]">Mulai dari</span>
            <span className="font-bold">{kos.price ? rupiah(kos.price) : "-"}</span> / bulan
          </p>
          {/* FR-05: tombol Booking. Di ponsel menempel di bawah layar, di desktop ada di kartu ini.
              Kalau belum login, RequireRole mengarahkan ke login lalu kembali ke halaman booking. */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-3 shadow-[0_-4px_16px_#0000001a] lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <Button
              as={Link}
              to={`/kos/${kos.id}/booking`}
              size="lg"
              className="w-full lg:bg-white lg:text-ink lg:hover:bg-surface"
            >
              {kos.roomsLeft > 0 ? "Booking Kos Ini" : "Lihat Ketersediaan Kamar"}
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <ul className="flex w-[204px] flex-col gap-1.5">
              {kos.ratingDistribution.map((d) => (
                <li key={d.stars} className="flex items-center gap-2 font-inter text-xs">
                  <span className="w-2 text-right">{d.stars}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white">
                    <span className="block h-full rounded-full bg-[#fbbf24]" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-l border-white pl-4 text-center">
              <p className="font-poppins text-4xl font-semibold">{kos.rating.toFixed(1).replace(".", ",")}</p>
              <Stars value={kos.rating} />
              <p className="mt-1 font-inter text-xs">{kos.reviews} ulasan terverifikasi</p>
            </div>
          </div>
        </section>

        {/* Ulasan */}
        <section className="rounded-[20px] bg-surface-strong px-[22px] pb-8 pt-[42px] lg:min-h-[480px]">
          <div className="flex justify-center">
            {isPencari ? (
              <button
                type="button"
                onClick={() => setModal("tulis")}
                disabled={!canReview}
                aria-describedby={canReview ? undefined : "info-ulasan"}
                className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 font-poppins text-lg font-medium text-black shadow-sm hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <img src={commentIcon} alt="" className="h-6 w-6" />
                Tulis Ulasan
              </button>
            ) : (
              <Link
                to="/"
                state={{ from: location.pathname }}
                className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 font-poppins text-lg font-medium text-black shadow-sm"
              >
                <img src={commentIcon} alt="" className="h-6 w-6" />
                Login untuk menulis ulasan
              </Link>
            )}
          </div>
          {isPencari && !canReview && !myBookings.loading && (
            <p id="info-ulasan" className="mt-2 text-center font-inter text-xs text-muted">
              Hanya penyewa yang dapat memberi rating. Ulasan bisa ditulis setelah booking kamu diterima pemilik.
            </p>
          )}

          {review ? (
            <>
              <ReviewItem
                review={review}
                canDelete={canDelete(review)}
                onDelete={() => removeReview(review)}
                onOpen={() => setModal("lihat")}
                className="mt-6 px-3"
              />
              <button
                type="button"
                onClick={() => setModal("lihat")}
                className="mx-auto mt-5 block rounded-full border border-black px-5 py-1.5 font-poppins text-xs text-black hover:bg-black hover:text-white"
              >
                Lihat semua ulasan ({kos.reviewList.length})
              </button>
            </>
          ) : (
            <p className="mt-6 text-center font-inter text-xs text-muted">Belum ada ulasan.</p>
          )}
          {deleteError && !modal && <p className="mt-3 text-center font-inter text-xs text-danger">{deleteError}</p>}
        </section>

        {modal && (
          <ReviewModal onClose={() => setModal(null)} title={`Ulasan ${kos.name}`}>
            {canReview && (
              modal === "tulis" ? (
                <ReviewForm
                  kosId={kos.id}
                  onDone={() => {
                    setModal("lihat");
                    reload();
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setModal("tulis")}
                  className="mb-2 inline-flex items-center gap-2 rounded-full bg-black px-4 py-1.5 font-poppins text-xs text-white"
                >
                  <img src={commentIcon} alt="" className="h-4 w-4 invert" /> Tulis Ulasan
                </button>
              )
            )}
            {deleteError && <p className="mt-2 font-inter text-xs text-danger">{deleteError}</p>}
            {kos.reviewList.length === 0 && <p className="mt-4 font-inter text-xs text-muted">Belum ada ulasan.</p>}
            {kos.reviewList.map((r) => (
              <ReviewItem
                key={r.id}
                review={r}
                canDelete={canDelete(r)}
                onDelete={() => removeReview(r)}
                className="border-b border-line py-5 last:border-b-0"
              />
            ))}
          </ReviewModal>
        )}
      </div>
    </main>
    </>
  );
}
