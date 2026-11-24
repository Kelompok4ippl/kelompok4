import { useId, useState } from "react";
import { LineIcon } from "./Icon.jsx";
import { facilityIcon, facilityLabel } from "../lib/format.js";

// Bagian-bagian tampilan halaman pemilik kos (redesign biru baja redup):
// panel form putih di kanan (Tambah Kos / Kelola Kamar), banner judul, kartu statistik, dan chip fasilitas.

// Panel form: judul, keterangan, label bagian, isi kolom, pesan, lalu tombol Batal & Simpan
export function FormPanel({
  title,
  description,
  subtitle,
  onSubmit,
  saving,
  error,
  success,
  submitLabel = "Simpan Perubahan",
  onCancel,
  children,
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col gap-[18px]">
      <div className="flex items-start gap-3 border-b border-[#edf1f5] pb-[18px]">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif4 text-2xl font-bold leading-tight text-steel-ink">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-steel-muted">{description}</p>}
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup form"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-steel-tint-2 text-steel-body hover:bg-steel-tint"
          >
            <LineIcon name="x" />
          </button>
        )}
      </div>
      {subtitle && <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-steel-muted">{subtitle}</p>}
      <div className="flex flex-col gap-4">{children}</div>
      {error && (
        <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">
          {success}
        </p>
      )}
      <div className={`mt-auto grid gap-3 pt-2 ${onCancel ? "grid-cols-[1fr_1.4fr]" : "grid-cols-1"}`}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[46px] rounded-xl border border-steel-line bg-white px-3 text-sm font-semibold text-steel-body hover:bg-steel-tint-2"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="min-h-[46px] rounded-xl bg-steel px-3 text-sm font-semibold text-white hover:bg-steel-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

// Bingkai isian: latar biru sangat muda, jadi putih bergaris biru saat fokus
const boxClass =
  "flex items-center gap-2 rounded-xl border border-steel-line bg-steel-tint-2 px-3.5 text-steel-muted transition-colors focus-within:border-steel focus-within:bg-white focus-within:shadow-[0_0_0_3px_#dce8f4]";
const inputClass = "min-w-0 flex-1 border-0 bg-transparent py-[11px] text-[15px] text-steel-ink outline-none placeholder:text-steel-muted focus:placeholder:text-transparent";

// Satu kolom isian berlabel. as="select" / "textarea" untuk jenis lain.
// prefix/suffix: teks di kiri/kanan (mis. "Rp", "/bulan"), icon: nama ikon garis di kiri (mis. "pin")
export function Field({ label, as: Tag = "input", prefix, suffix, icon, children, ...props }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-steel-ink">
        {label}
      </label>
      <div className={`${boxClass} ${Tag === "textarea" ? "items-start" : "min-h-[46px]"}`}>
        {icon && <LineIcon name={icon} className="h-[18px] w-[18px]" />}
        {prefix && <span className="text-[13px]">{prefix}</span>}
        <Tag id={id} className={`${inputClass} ${Tag === "textarea" ? "min-h-[72px] resize-y" : ""} ${Tag === "select" ? "cursor-pointer" : ""}`} {...props}>
          {children}
        </Tag>
        {suffix && <span className="pointer-events-none text-[13px]">{suffix}</span>}
      </div>
    </div>
  );
}

// Angka dengan tombol − / + (Jumlah kamar di form Kelola Kamar)
export function Stepper({ label, value, onChange, min = 1, max }) {
  const id = useId();
  const n = Number(value) || 0;
  const set = (v) => onChange(String(Math.min(max ?? Infinity, Math.max(min, v))));
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-steel-ink">
        {label}
      </label>
      <div className="flex h-[46px] overflow-hidden rounded-xl border border-steel-line focus-within:border-steel">
        <button type="button" onClick={() => set(n - 1)} aria-label={`Kurangi ${label}`} className="w-11 bg-steel-tint-2 text-lg text-steel-ink hover:bg-steel-tint">
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 flex-1 border-x border-steel-line text-center font-semibold text-steel-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" onClick={() => set(n + 1)} aria-label={`Tambah ${label}`} className="w-11 bg-steel-tint-2 text-lg text-steel-ink hover:bg-steel-tint">
          +
        </button>
      </div>
    </div>
  );
}

// Chip fasilitas berikon (kartu kos/kamar dan form)
export function FacilityChip({ name }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#e4eaf1] bg-steel-tint-2 px-2.5 py-1 text-xs font-medium text-steel-body">
      <LineIcon name={facilityIcon(name)} className="h-3.5 w-3.5 text-steel" />
      {facilityLabel(name)}
    </span>
  );
}

// Pilih fasilitas: yang terpilih tampil sebagai chip biru, sisanya chip putus-putus "+ nama".
// Pemilik juga bisa mengetik fasilitas sendiri (mis. "Dapur bersama"); fasilitas baru disimpan backend saat Simpan.
export function FacilityPicker({ label, options, value, onChange }) {
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const has = (list, name) => list.some((f) => f.toLowerCase() === name.toLowerCase());
  // Pilihan dari database + fasilitas buatan sendiri yang sudah dipilih
  const all = [...(options || []), ...value.filter((v) => !has(options || [], v))];
  const toggle = (name) => onChange(has(value, name) ? value.filter((f) => f.toLowerCase() !== name.toLowerCase()) : [...value, name]);

  const add = () => {
    const name = draft.replace(/\s+/g, " ").trim().slice(0, 50);
    if (!name) return;
    if (!has(value, name)) onChange([...value, all.find((f) => f.toLowerCase() === name.toLowerCase()) || name]);
    setDraft("");
  };

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-[13px] font-medium text-steel-ink">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {all.map((name) => {
          const on = has(value, name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(name)}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors ${
                on
                  ? "border-[#c9d8e8] bg-steel-tint text-steel-strong"
                  : "border-dashed border-steel-dash text-steel hover:bg-steel-tint-2"
              }`}
            >
              <LineIcon name={on ? facilityIcon(name) : "plus"} className="h-3.5 w-3.5" />
              {facilityLabel(name)}
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2">
        <label htmlFor={inputId} className="sr-only">
          Tambah fasilitas lain
        </label>
        <div className={`${boxClass} min-h-11 min-w-0 flex-1`}>
          <input
            id={inputId}
            value={draft}
            maxLength={50}
            onChange={(e) => setDraft(e.target.value)}
            // Enter menambah fasilitas, bukan mengirim form
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Fasilitas lain, mis. Dapur bersama"
            className={`${inputClass} py-2.5 text-sm`}
          />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-steel-line bg-white px-3 text-[13px] font-semibold text-steel hover:bg-steel-tint-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LineIcon name="plus" className="h-4 w-4" />
          Tambah
        </button>
      </div>
    </fieldset>
  );
}

// Saklar ketersediaan (biru saat aktif)
export function Toggle({ checked, onChange, label, disabled, text }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      // Area sentuh 44px, saklar yang terlihat 42x24px
      className="flex min-h-11 shrink-0 items-center gap-2 text-xs text-steel-body disabled:cursor-not-allowed disabled:opacity-50"
    >
      {text}
      <span className={`relative h-6 w-[42px] rounded-full transition-colors ${checked ? "bg-steel" : "bg-[#c6d0db]"}`}>
        <span
          className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-[left] ${checked ? "left-[21px]" : "left-[3px]"}`}
        />
      </span>
    </button>
  );
}

// Kotak foto: thumbnail dengan tombol hapus, lalu tombol "Unggah".
// photos: [{ key, src }], onAdd(FileList), onRemove(key)
export function PhotoPicker({ label, photos, onAdd, onRemove, max }) {
  const full = photos.length >= max;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 flex w-full text-[13px] font-medium text-steel-ink">
        {label}
        <span className="ml-auto text-xs font-normal text-steel-muted">
          {photos.length} / {max} foto
        </span>
      </legend>
      <ul className="grid grid-cols-3 gap-2.5">
        {photos.map((p, i) => (
          <li key={p.key} className="relative aspect-[5/4] overflow-hidden rounded-xl bg-steel-tint">
            <img src={p.src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(p.key)}
              aria-label={`Hapus foto ${i + 1}`}
              className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center"
            >
              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-steel-ink/70 text-white">
                <LineIcon name="x" className="h-3.5 w-3.5" />
              </span>
            </button>
          </li>
        ))}
        {!full && (
          <li>
            <label className="flex aspect-[5/4] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-steel-dash bg-steel-tint-2 text-xs font-medium text-steel focus-within:ring-2 focus-within:ring-steel hover:bg-steel-tint">
              <LineIcon name="image" />
              Unggah
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onAdd(e.target.files);
                  e.target.value = ""; // supaya file yang sama bisa dipilih lagi
                }}
              />
            </label>
          </li>
        )}
      </ul>
      <p className="text-xs text-steel-muted">JPG, PNG, atau WebP, maks 5 MB per foto.</p>
    </fieldset>
  );
}

// Salam sesuai jam di perangkat pengguna
function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

// Banner judul halaman: gradasi biru redup dengan garis zigzag samar dan tombol aksi putih
export function PageBanner({ name, title, description, actionLabel, onAction }) {
  return (
    <section className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-[22px] bg-[linear-gradient(115deg,#29527c_0%,#3a6894_55%,#5582ad_100%)] px-6 py-6 text-white shadow-[0_14px_30px_-18px_rgba(29,58,92,.7)] sm:px-8 sm:py-[30px]">
      <svg
        aria-hidden="true"
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -right-2.5 bottom-0 h-[70%] w-[44%] opacity-[.16]"
      >
        <polyline points="0,130 55,60 110,115 180,25 240,95 310,40 400,120" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="relative min-w-0 flex-[1_1_320px]">
        <p className="mb-1.5 text-[13px] text-white/80">
          {greeting()}
          {name ? `, ${name.split(" ")[0]}` : ""}
        </p>
        <h1 className="font-serif4 text-[clamp(28px,3.2vw,38px)] font-bold leading-[1.1]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[46ch] text-sm text-white/90">{description}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="relative inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-[18px] text-sm font-semibold text-steel-strong shadow-[0_6px_16px_-8px_rgba(0,0,0,.4)] hover:bg-steel-tint-2"
        >
          <LineIcon name="plus" />
          {actionLabel}
        </button>
      )}
    </section>
  );
}

// Kartu angka ringkas di bawah banner. tone="amber" untuk hal yang perlu perhatian
export function StatCard({ icon, label, value, note, tone }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-steel-line bg-white px-[18px] py-4 shadow-steel">
      <span
        aria-hidden="true"
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone === "amber" ? "bg-amber-soft text-[#9a6b12]" : "bg-steel-tint text-steel"}`}
      >
        <LineIcon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-steel-muted">{label}</p>
        <p>
          <span className="text-[22px] font-semibold text-steel-ink">{value}</span>
          {note && <span className="ml-1.5 text-xs text-steel-muted">{note}</span>}
        </p>
      </div>
    </div>
  );
}

// Label status bulat di atas foto: titik hijau (masih ada kamar) / merah (penuh)
export function AvailabilityTag({ ok, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold ${ok ? "text-ok" : "text-bad"}`}>
      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-current" />
      {children}
    </span>
  );
}
