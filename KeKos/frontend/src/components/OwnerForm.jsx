import { useId } from "react";

// Bagian-bagian form di panel hitam halaman pemilik kos (Tambah Kos / Kelola Kamar).

// Panel form: judul besar, sub judul, isi kolom, pesan, dan tombol simpan
export function FormPanel({ title, subtitle, onSubmit, saving, error, success, submitLabel = "Simpan Perubahan", onCancel, children }) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col">
      <h2 className="font-serif4 text-2xl font-bold">{title}</h2>
      {subtitle && <h3 className="mt-8 font-serif4 text-2xl font-bold">{subtitle}</h3>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-danger-soft px-3 py-2 font-inter text-sm text-danger">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-5 rounded-lg bg-success-soft px-3 py-2 font-inter text-sm text-success">
          {success}
        </p>
      )}
      <div className="mt-8 flex items-center justify-center gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-11 rounded-[10px] px-5 font-serif4 text-sm font-bold text-white hover:bg-white/10">
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-[10px] bg-[#d9d9d9] px-5 font-serif4 text-sm font-bold text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-[#8f8f99] bg-white px-3 font-serif4 text-sm text-black outline-none placeholder:text-[#6b6b6b] focus:border-[#4a90e2]";

// Satu kolom isian berlabel. as="select" / "textarea" untuk jenis lain; suffix: teks di ujung kanan (mis. "/bulan")
export function Field({ label, as: Tag = "input", suffix, children, ...props }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-serif4 text-xs font-bold">
        {label}
      </label>
      <div className="relative">
        <Tag id={id} className={`${inputClass} ${Tag === "textarea" ? "h-20 resize-y py-2" : ""} ${suffix ? "pr-16" : ""}`} {...props}>
          {children}
        </Tag>
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-serif4 text-sm text-[#6b6b6b]">{suffix}</span>
        )}
      </div>
    </div>
  );
}

// Pilih fasilitas: tombol on/off untuk setiap nama fasilitas dari database
export function FacilityPicker({ label, options, value, onChange }) {
  const toggle = (name) => onChange(value.includes(name) ? value.filter((f) => f !== name) : [...value, name]);
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 font-serif4 text-xs font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {(options || []).map((name) => {
          const on = value.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(name)}
              className={`h-9 rounded-full border px-3.5 font-inter text-xs transition-colors ${
                on ? "border-white bg-white font-semibold text-black" : "border-[#8f8f99] text-white hover:border-white"
              }`}
            >
              {on ? "✓ " : "+ "}
              {name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// Saklar biru seperti di desain (ketersediaan tipe kamar)
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      // Area sentuh 44px, saklar yang terlihat 43x25px
      className="flex h-11 shrink-0 items-center px-0.5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`relative h-[25px] w-[43px] rounded-full transition-colors ${checked ? "bg-[#0a84d6]" : "bg-[#b5b5bd]"}`}>
        <span
          className={`absolute top-[3px] h-[19px] w-[19px] rounded-full bg-white shadow transition-[left] ${checked ? "left-[21px]" : "left-[3px]"}`}
        />
      </span>
    </button>
  );
}

// Kotak foto (frame Figma "Foto 1 / Foto 2 / + Tambah"): thumbnail dengan tombol hapus, lalu tombol tambah.
// photos: [{ key, src }], onAdd(FileList), onRemove(key)
export function PhotoPicker({ label, photos, onAdd, onRemove, max }) {
  const full = photos.length >= max;
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 font-serif4 text-sm font-bold">
        {label} ({photos.length} Foto)
      </legend>
      <ul className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <li key={p.key} className="relative h-[63px] w-[112px] overflow-hidden rounded-[10px] bg-white">
            <img src={p.src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(p.key)}
              aria-label={`Hapus foto ${i + 1}`}
              className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center"
            >
              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-black/75 text-sm text-white">
                ✕
              </span>
            </button>
          </li>
        ))}
        {!full && (
          <li>
            <label className="flex h-[63px] w-[112px] cursor-pointer items-center justify-center rounded-[10px] bg-white font-serif4 text-xs font-bold text-black focus-within:ring-2 focus-within:ring-[#4a90e2] hover:bg-[#ededed]">
              + Tambah
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
      <p className="font-inter text-xs text-[#b5b5bd]">JPG, PNG, atau WebP, maks 5 MB per foto, maks {max} foto.</p>
    </fieldset>
  );
}
