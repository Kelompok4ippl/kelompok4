import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { homeFor, login } from "../api/auth.js";
import KosHero from "../components/KosHero.jsx";
import FormField, { PasswordToggle } from "../components/FormField.jsx";
import { LineIcon } from "../components/Icon.jsx";

const roles = {
  pencari: {
    label: "Pencari kos",
    title: "Pencari kos",
    icon: "user",
    desc: "Cari kos, lihat detail, dan booking kamar.",
  },
  pemilik: {
    label: "Pemilik kos",
    title: "Pemilik Kos",
    icon: "home",
    desc: "Kelola kos, kamar, dan permintaan booking.",
  },
};

// Halaman login: login pencari/pemilik kos dan notif "Akun Berhasil Dibuat" setelah daftar.
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // Dikirim dari halaman register setelah akun berhasil dibuat
  const registered = location.state?.registered;
  const [role, setRole] = useState("pencari");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // error: pesan dari server (berlaku untuk kedua kolom); fieldErrors: kolom yang masih kosong
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(Boolean(registered));

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const missing = {};
    if (!email.trim()) missing.email = "Email wajib diisi";
    if (!password) missing.password = "Password wajib diisi";
    setFieldErrors(missing);
    if (missing.email || missing.password) {
      document.getElementById(missing.email ? "login-email" : "login-password")?.focus();
      return;
    }

    setLoading(true);
    try {
      const user = await login({ email: email.trim(), password, peran: role === "pemilik" ? "pemilikKos" : "pencariKos" });
      // Kembali ke halaman yang tadi diminta (misalnya Booking Cepat), kalau ada.
      // Kalau halaman itu milik peran lain, RequireRole mengarahkan ke beranda peran ini.
      navigate(location.state?.from || homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pesan error hilang begitu user mulai mengetik lagi
  const onType = (setter) => (event) => {
    setter(event.target.value);
    setError("");
    setFieldErrors((f) => ({ ...f, [event.target.name]: undefined }));
  };

  return (
    <main className="flex min-h-screen flex-col-reverse bg-white font-poppins text-steel-ink lg:flex-row">
      {/* Kiri: foto kamar + kartu kos */}
      <KosHero />

      {/* Kanan: form masuk */}
      <section aria-labelledby="login-title" className="relative flex flex-1 items-start justify-center px-5 py-10 sm:px-10 lg:max-w-[52%] lg:pb-12 lg:pt-[18vh]">
        {showToast && (
          <div
            role="status"
            className="absolute right-5 top-5 z-10 flex max-w-[300px] items-start gap-2.5 rounded-xl border border-steel-line bg-white px-3.5 py-3 text-xs shadow-steel-lg sm:right-8 sm:top-8"
          >
            <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ok-soft text-ok">
              <LineIcon name="check" className="h-4 w-4" />
            </span>
            <span>
              <strong className="block text-[13px] font-semibold">Akun berhasil dibuat</strong>
              <span className="text-steel-muted">Silakan masuk dengan akun barumu.</span>
            </span>
          </div>
        )}

        <div className="w-full max-w-[400px]">
          <p className="mb-6 font-serif4 text-2xl font-bold text-steel-side lg:hidden">KeKos</p>
          <h1 id="login-title" className="font-serif4 text-[32px] font-bold leading-tight sm:text-[36px]">
            Selamat datang kembali
          </h1>
          <p className="mt-1.5 text-sm text-steel-muted">Masuk ke akunmu untuk melanjutkan.</p>

          {/* Satu pesan untuk email & password: sengaja tidak menyebut kolom mana yang salah */}
          {error && (
            <p id="login-error" role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-[#efc9c3] bg-bad-soft px-3.5 py-3 text-sm text-bad">
              <LineIcon name="alert" className="mt-px h-[18px] w-[18px]" />
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <fieldset>
              <legend className="text-[13px] font-semibold">Masuk sebagai</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {Object.entries(roles).map(([value, r]) => {
                  const on = role === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setRole(value);
                        setError("");
                      }}
                      className={`relative flex flex-col items-start rounded-2xl border p-3.5 text-left transition-colors ${
                        on ? "border-steel bg-steel-tint-2 ring-1 ring-steel" : "border-steel-line bg-white hover:border-steel"
                      }`}
                    >
                      <span aria-hidden="true" className={`grid h-9 w-9 place-items-center rounded-lg ${on ? "bg-steel text-white" : "bg-steel-tint text-steel"}`}>
                        <LineIcon name={r.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <span
                        aria-hidden="true"
                        className={`absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border ${on ? "border-steel bg-steel text-white" : "border-steel-dash bg-white"}`}
                      >
                        {on && <LineIcon name="check" className="h-3 w-3" />}
                      </span>
                      <span className="mt-2.5 text-sm font-semibold">{r.label}</span>
                      <span className="mt-1 text-[11px] leading-snug text-steel-muted">{r.desc}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <FormField
              id="login-email"
              name="email"
              type="email"
              label="Email"
              icon="mail"
              placeholder="nama@email.com"
              autoComplete="email"
              value={email}
              onChange={onType(setEmail)}
              error={fieldErrors.email}
              invalid={Boolean(error)}
              describedBy={error ? "login-error" : undefined}
            />
            <FormField
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              label="Password"
              icon="lock"
              placeholder="Masukkan password"
              autoComplete="current-password"
              value={password}
              onChange={onType(setPassword)}
              error={fieldErrors.password}
              invalid={Boolean(error)}
              describedBy={error ? "login-error" : undefined}
              trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />}
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-steel text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(46,94,142,.8)] hover:bg-steel-strong disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
              {!loading && <LineIcon name="arrow" className="h-4 w-4" />}
            </button>

            <div aria-hidden="true" className="flex items-center gap-3 text-xs text-steel-muted">
              <span className="h-px flex-1 bg-steel-line" />
              atau
              <span className="h-px flex-1 bg-steel-line" />
            </div>

            <p className="text-center text-sm text-steel-body">
              Belum punya akun?{" "}
              <Link to="/register" className="font-semibold text-steel underline-offset-2 hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
