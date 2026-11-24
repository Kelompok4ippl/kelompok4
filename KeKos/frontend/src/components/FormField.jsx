import { LineIcon } from "./Icon.jsx";

// Kolom form dengan label yang selalu terlihat, teks bantuan, dan pesan error tepat di bawah kolomnya.
// Pesan error dihubungkan ke input lewat aria-describedby + aria-invalid supaya terbaca pembaca layar.
// describedBy: id pesan lain di luar kolom ini (misalnya satu pesan "Email atau password salah" untuk dua kolom).
// icon: nama ikon garis (lihat LineIcon di Icon.jsx), mis. "mail", "lock", "user", "phone".
export default function FormField({ id, label, icon, error, helper, invalid = false, describedBy, trailing, ...inputProps }) {
  const hasError = Boolean(error) || invalid;
  const ids = [helper && `${id}-bantuan`, error && `${id}-error`, describedBy].filter(Boolean).join(" ");
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="font-poppins text-[13px] font-semibold text-steel-ink">
        {label}
      </label>
      <div
        className={`flex h-12 items-center gap-2.5 rounded-xl border px-3.5 transition-colors focus-within:ring-2 ${
          hasError
            ? "border-bad bg-bad-soft focus-within:ring-[#f1cfca]"
            : "border-steel-line bg-white focus-within:border-steel focus-within:ring-steel-tint"
        }`}
      >
        {icon && <LineIcon name={icon} className={`h-[18px] w-[18px] ${hasError ? "text-bad" : "text-steel-muted"}`} />}
        <input
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={ids || undefined}
          className="h-full min-w-0 flex-1 bg-transparent font-poppins text-sm text-steel-ink outline-none placeholder:text-[#8a9aab] focus:placeholder:text-transparent"
          {...inputProps}
        />
        {trailing}
      </div>
      {helper && !error && (
        <p id={`${id}-bantuan`} className="font-poppins text-xs text-steel-muted">
          {helper}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="font-poppins text-xs font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

// Tombol mata di ujung kolom password. Mata terbuka = password sedang terlihat.
export function PasswordToggle({ shown, onToggle }) {
  return (
    <button
      type="button"
      aria-label={shown ? "Sembunyikan password" : "Tampilkan password"}
      aria-pressed={shown}
      onClick={onToggle}
      className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-steel-muted hover:text-steel"
    >
      <LineIcon name={shown ? "eye" : "eyeOff"} className="h-[18px] w-[18px]" />
    </button>
  );
}
