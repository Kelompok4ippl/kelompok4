// Kolom form dengan label yang selalu terlihat, teks bantuan, dan pesan error tepat di bawah kolomnya.
// Pesan error dihubungkan ke input lewat aria-describedby + aria-invalid supaya terbaca pembaca layar.
// describedBy: id pesan lain di luar kolom ini (misalnya satu pesan "Email atau password salah" untuk dua kolom).
export default function FormField({ id, label, icon, error, helper, invalid = false, describedBy, trailing, ...inputProps }) {
  const hasError = Boolean(error) || invalid;
  const ids = [helper && `${id}-bantuan`, error && `${id}-error`, describedBy].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-inter text-sm font-medium text-ink">
        {label}
      </label>
      <div
        className={`flex h-11 items-center gap-3 rounded-lg border bg-white px-3 focus-within:border-focus ${
          hasError ? "border-danger" : "border-line-strong"
        }`}
      >
        {icon && <img className="h-5 w-5 shrink-0" alt="" src={icon} />}
        <input
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={ids || undefined}
          className="h-full min-w-0 flex-1 bg-transparent font-inter text-base text-ink outline-none placeholder:text-subtle"
          {...inputProps}
        />
        {trailing}
      </div>
      {helper && (
        <p id={`${id}-bantuan`} className="font-inter text-xs text-muted">
          {helper}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="font-inter text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// Tombol mata di ujung kolom password. Mata terbuka = password sedang terlihat.
export function PasswordToggle({ shown, onToggle, eyeIcon, eyeOffIcon }) {
  return (
    <button
      type="button"
      aria-label={shown ? "Sembunyikan password" : "Tampilkan password"}
      aria-pressed={shown}
      onClick={onToggle}
      className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <img className="h-5 w-5" alt="" src={shown ? eyeIcon : eyeOffIcon} />
    </button>
  );
}
