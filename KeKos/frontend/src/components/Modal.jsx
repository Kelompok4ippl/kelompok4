import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { api } from "../api/client.js";
import { imageUrl } from "../lib/format.js";

// Modal berbasis <dialog> + showModal(): halaman di belakang jadi inert (Tab tidak keluar),
// Esc dan klik di luar panel memanggil onClose, fokus kembali ke tombol pembuka saat ditutup.
// <dialog> dibuat selebar layar (latar gelap ada di dialog itu sendiri), panel ada di children.
// Props motion (initial/animate/exit/transition) diteruskan supaya bisa dipakai di AnimatePresence.
export default function Modal({ label, onClose, className = "", children, ...motionProps }) {
  const ref = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    ref.current.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  return (
    <motion.dialog
      ref={ref}
      aria-label={label}
      // Esc: tahan penutupan bawaan supaya state React (dan animasi keluar) yang menutup
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Cadangan kalau browser tetap menutup dialog tanpa event cancel
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 p-0 backdrop:bg-transparent open:flex ${className}`}
      {...motionProps}
    >
      {children}
    </motion.dialog>
  );
}

// Pop-up konfirmasi untuk aksi admin yang berdampak besar (tolak listing, hapus listing, nonaktifkan akun).
// tone="danger" → tombol merah. reasonLabel diisi → ada kolom alasan wajib, dikirim ke onConfirm(alasan).
// error: pesan gagal dari server ditampilkan di dalam pop-up; busy: tombol dikunci selama proses.
export function ConfirmDialog({ title, message, confirmLabel, tone = "danger", reasonLabel, reasonPlaceholder, busy, error, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const needReason = Boolean(reasonLabel);
  const ready = !needReason || reason.trim();
  return (
    <Modal label={title} onClose={busy ? () => {} : onClose} className="items-center justify-center bg-[rgba(26,43,63,.45)] p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && !busy) onConfirm(reason.trim());
        }}
        className="w-full max-w-[440px] rounded-[20px] bg-white p-6 font-poppins text-steel-ink shadow-[0_24px_60px_-20px_rgba(29,58,92,.5)]"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg font-bold ${tone === "danger" ? "bg-bad-soft text-bad" : "bg-amber-soft text-amber-ink"}`}
          >
            !
          </span>
          <div className="min-w-0">
            <h2 className="font-serif4 text-xl font-bold leading-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-steel-body">{message}</p>
          </div>
        </div>
        {needReason && (
          <label className="mt-5 flex flex-col gap-1.5 text-[13px] font-medium">
            {reasonLabel}
            <textarea
              autoFocus
              required
              maxLength={255}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              className="min-h-[88px] resize-y rounded-xl border border-steel-line bg-steel-tint-2 px-3.5 py-2.5 text-sm font-normal text-steel-ink outline-none placeholder:text-steel-muted focus:border-steel focus:bg-white focus:placeholder:text-transparent"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            autoFocus={!needReason}
            className="min-h-11 rounded-xl border border-steel-line bg-white px-3 text-sm font-semibold text-steel-body hover:bg-steel-tint-2 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!ready || busy}
            className={`min-h-11 rounded-xl px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              tone === "danger" ? "bg-bad hover:bg-[#8f3a30]" : "bg-steel hover:bg-steel-strong"
            }`}
          >
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const RATING_TEXT = ["", "Sangat kurang", "Kurang", "Cukup", "Bagus", "Sangat bagus"];

// Pop-up "Beri rating" (FR-07): bintang wajib, ulasan opsional, dikirim ke POST /kos/:id/ulasan.
// Server tetap memeriksa bahwa pengirim adalah penyewa (booking diterima) di kos itu.
// kos: { id, name, image?, subtitle? }. onDone dipanggil setelah rating tersimpan.
export function RatingDialog({ kos, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [isi, setIsi] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating || saving) return;
    setSaving(true);
    setError("");
    try {
      await api(`/kos/${kos.id}/ulasan`, { method: "POST", body: { rating, isi } });
      onDone?.();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal label="Beri rating" onClose={saving ? () => {} : onClose} className="items-center justify-center bg-[rgba(26,43,63,.45)] p-4">
      <form onSubmit={submit} className="w-full max-w-[460px] rounded-[20px] bg-white p-6 font-poppins text-steel-ink shadow-[0_24px_60px_-20px_rgba(29,58,92,.5)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif4 text-2xl font-bold">Beri rating</h2>
            <p className="mt-1 text-sm text-steel-muted">Bagikan pengalamanmu tinggal di kos ini untuk membantu pencari kos lain.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-steel-tint-2 text-xl leading-none text-steel-body hover:bg-steel-tint"
          >
            ×
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl bg-steel-tint-2 p-3">
          {kos.image !== undefined && <img src={imageUrl(kos.image)} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
          <div className="min-w-0">
            <p className="truncate font-semibold">{kos.name}</p>
            {kos.subtitle && <p className="truncate text-xs text-steel-muted">{kos.subtitle}</p>}
          </div>
        </div>

        <fieldset className="mt-5 text-center">
          <legend className="mx-auto text-sm font-semibold">Seberapa puas kamu?</legend>
          <div
            role="radiogroup"
            aria-label="Rating (wajib)"
            className="mt-2 flex justify-center gap-1"
            onKeyDown={(e) => {
              const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
              if (!step) return;
              e.preventDefault();
              const next = Math.min(5, Math.max(1, (rating || 0) + step));
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
                tabIndex={rating === i || (!rating && i === 1) ? 0 : -1}
                onClick={() => setRating(i)}
                className={`grid h-12 w-12 place-items-center rounded-xl text-[34px] leading-none transition-colors ${
                  i <= rating ? "text-amber" : "text-[#cfd8e2] hover:text-[#e8c879]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className="mt-1 h-5 text-sm font-medium text-amber-ink">{RATING_TEXT[rating]}</p>
        </fieldset>

        <label className="mt-3 flex flex-col gap-1.5 text-sm font-semibold">
          Ulasan <span className="-mt-1 text-xs font-normal text-steel-muted">Opsional</span>
          <textarea
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Ceritakan pengalamanmu, mis. kebersihan, keamanan, pemilik"
            className="rounded-xl border border-steel-line bg-white px-3.5 py-2.5 text-sm font-normal outline-none placeholder:text-[#8a9aab] focus:border-steel focus:ring-2 focus:ring-steel-tint focus:placeholder:text-transparent"
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}
        <div className="mt-5 grid grid-cols-[1fr_2fr] gap-3">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-xl border border-steel-line text-sm font-semibold text-steel-body hover:bg-steel-tint-2">
            Batal
          </button>
          <button type="submit" disabled={!rating || saving} className="min-h-11 rounded-xl bg-steel text-sm font-semibold text-white hover:bg-steel-strong disabled:cursor-not-allowed disabled:bg-[#c6d0db]">
            {saving ? "Mengirim..." : "Kirim rating"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
