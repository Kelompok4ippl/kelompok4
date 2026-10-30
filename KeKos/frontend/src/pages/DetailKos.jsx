import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { getCurrentUser } from "../api/auth.js";
import { useApi } from "../hooks/useApi.js";
import Gallery from "../components/Gallery.jsx";
import KosInfo from "../components/KosInfo.jsx";
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
        ) : null
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
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded-xl bg-[#f4f4f4] p-3">
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            onClick={() => setRating(i)}
            className={`text-xl ${i <= rating ? "text-[#fbbf24]" : "text-[#ccc]"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        rows={3}
        placeholder="Ceritakan pengalamanmu tinggal di kos ini"
        className="rounded-lg border border-[#c9c9cf] p-2 font-inter text-xs outline-none focus:border-[#4a90e2]"
      />
      {error && <p className="font-inter text-xs text-[#c00]">{error}</p>}
      <button type="submit" disabled={saving || !isi.trim()} className="self-end rounded-full bg-black px-4 py-1.5 font-poppins text-xs text-white disabled:opacity-50">
        {saving ? "Mengirim..." : "Kirim Ulasan"}
      </button>
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
          <p className="font-inter text-xs font-semibold text-[#5b6b9a]">Penyewa</p>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-full border border-[#c00] px-3 py-1 font-inter text-[11px] font-semibold text-[#c00] hover:bg-[#c00] hover:text-white"
          >
            Hapus
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Stars value={review.rating} />
        <span className="font-inter text-xs text-[#64748b]">{timeAgo(review.createdAt).replace(" yang", "")}</span>
      </div>
      <p className="mt-3 whitespace-pre-line break-words font-inter text-xs leading-[19px] text-[#1e1e1e]">{review.text}</p>
      <div className="mt-3 flex gap-4 font-inter text-xs text-[#64748b]">
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
function ReviewModal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
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
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-[560px] flex-col rounded-t-[20px] bg-white shadow-[0_10px_40px_#00000059] sm:rounded-[20px]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#e5e5e5] px-6 py-4">
          <h2 className="font-poppins text-lg font-bold text-black">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-2xl leading-none text-[#555] hover:text-black">
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
  const { data: kos, error, loading, reload } = useApi(`/kos/${id}`);
  const [modal, setModal] = useState(null); // null | "lihat" | "tulis"
  const [deleteError, setDeleteError] = useState("");
  const user = getCurrentUser();

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

  if (loading) return <p className="p-10 font-poppins">Memuat...</p>;
  if (error) return <p className="p-10 font-poppins text-[#c00]">{error}</p>;

  const review = kos.reviewList[0];
  const maxCount = Math.max(1, ...kos.ratingDistribution.map((d) => d.count));

  return (
    <main className="mx-auto max-w-[1440px] bg-white px-4 pb-16 pt-6 sm:px-[47px] sm:pt-7">
      <header className="flex items-center gap-4 sm:-ml-[7px]">
        <button type="button" onClick={() => navigate(-1)} aria-label="Kembali">
          <img src={backIcon} alt="" className="h-6 w-6" />
        </button>
        <h1 className="font-poppins text-2xl font-bold text-[#080808]">Detail Kos</h1>
      </header>

      <Gallery photos={kos.photos} className="mt-3 rounded-b-none sm:px-[35px] sm:py-[42px]" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[413px_446px_1fr] lg:gap-[41px]">
        {/* Informasi */}
        <section className="rounded-[20px] bg-[#ebebeb] px-[35px] pb-10 pt-16 lg:min-h-[480px]">
          <h2 className="mb-5 font-poppins text-lg font-bold text-black">Informasi</h2>
          <KosInfo
            ownerName={kos.owner.name}
            totalRooms={kos.totalRooms}
            roomsLeft={kos.roomsLeft}
            roomType="Standar"
            facilities={kos.facilities}
          />
        </section>

        {/* Nama, alamat, harga, rating */}
        <section className="rounded-[20px] bg-black px-[34px] pb-10 pt-[67px] text-white lg:min-h-[480px]">
          <h2 className="font-poppins text-lg font-bold">{kos.name}</h2>
          <div className="mt-5 flex items-start gap-4">
            <img src={distanceIcon} alt="" className="h-10 w-10 shrink-0" />
            <p className="font-poppins text-lg leading-[24px]">{kos.address}</p>
          </div>
          <p className="mt-6 font-poppins text-2xl">
            <span className="font-bold">{kos.price ? rupiah(kos.price) : "-"}</span> / bulan
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <ul className="flex w-[204px] flex-col gap-1.5">
              {kos.ratingDistribution.map((d) => (
                <li key={d.stars} className="flex items-center gap-2 font-inter text-[10px]">
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
              <p className="mt-1 font-inter text-[10px]">{kos.reviews} ulasan terverifikasi</p>
            </div>
          </div>
        </section>

        {/* Ulasan */}
        <section className="rounded-[20px] bg-[#ebebeb] px-[22px] pb-8 pt-[42px] lg:min-h-[480px]">
          <div className="flex justify-center">
            {user?.role === "pencari" ? (
              <button
                type="button"
                onClick={() => setModal("tulis")}
                className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 font-poppins text-lg font-medium text-black shadow-sm hover:bg-[#f5f5f5]"
              >
                <img src={commentIcon} alt="" className="h-6 w-6" />
                Tulis Ulasan
              </button>
            ) : (
              <Link to="/" className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 font-poppins text-lg font-medium text-black shadow-sm">
                <img src={commentIcon} alt="" className="h-6 w-6" />
                Tulis Ulasan
              </Link>
            )}
          </div>

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
            <p className="mt-6 text-center font-inter text-xs text-[#555]">Belum ada ulasan.</p>
          )}
          {deleteError && !modal && <p className="mt-3 text-center font-inter text-xs text-[#c00]">{deleteError}</p>}
        </section>

        {modal && (
          <ReviewModal onClose={() => setModal(null)} title={`Ulasan ${kos.name}`}>
            {user?.role === "pencari" && (
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
            {deleteError && <p className="mt-2 font-inter text-xs text-[#c00]">{deleteError}</p>}
            {kos.reviewList.length === 0 && <p className="mt-4 font-inter text-xs text-[#555]">Belum ada ulasan.</p>}
            {kos.reviewList.map((r) => (
              <ReviewItem
                key={r.id}
                review={r}
                canDelete={canDelete(r)}
                onDelete={() => removeReview(r)}
                className="border-b border-[#e5e5e5] py-5 last:border-b-0"
              />
            ))}
          </ReviewModal>
        )}
      </div>
    </main>
  );
}
