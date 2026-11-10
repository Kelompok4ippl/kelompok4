import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { homeFor, login } from "../api/auth.js";
import KosHero from "../components/KosHero.jsx";
import FormField, { PasswordToggle } from "../components/FormField.jsx";
import Button from "../components/ui/Button.jsx";

import userIcon from "../assets/user-icon.svg";
import buildingIcon from "../assets/building-icon.svg";
import alertIcon from "../assets/alert-circle.svg";
import emailIcon from "../assets/email.svg";
import lockIcon from "../assets/lock.svg";
import eyeOffIcon from "../assets/eye-off.svg";
import eyeIcon from "../assets/eye.svg";

const roles = {
  pencari: {
    label: "Pencari kos",
    title: "Pencari kos",
    icon: userIcon,
    desc: "Akses halaman pencarian kos, detail kos, pengajuan booking kos",
  },
  pemilik: {
    label: "Pemilik kos",
    title: "Pemilik Kos",
    icon: buildingIcon,
    desc: "Akses halaman untuk melisting kos dan juga listing kamar",
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
      await login({ email: email.trim(), password });
      // Kembali ke halaman yang tadi diminta (misalnya Booking Cepat), kalau ada
      navigate(location.state?.from || homeFor(), { replace: true });
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
    <main className="mx-auto flex min-h-screen max-w-[1354px] flex-col-reverse bg-[#f8f9ff] px-0 py-0 min-[1100px]:my-14 min-[1100px]:min-h-[911px] min-[1100px]:flex-row min-[1100px]:px-4">
      {/* Kiri: foto kamar + kartu kos */}
      <KosHero />

      {/* Kanan: form masuk */}
      <section
        aria-labelledby="login-title"
        className="relative border-line-strong bg-white px-4 pb-10 pt-8 sm:px-[31px] sm:pt-14 min-[1100px]:w-[497px] min-[1100px]:shrink-0 min-[1100px]:border"
      >
        {showToast && (
          <div
            role="status"
            className="absolute left-1/2 top-[86px] z-10 w-[215px] -translate-x-1/2 rounded-lg border-2 border-[#5b5b78] bg-white px-3 py-3 font-poppins text-xs leading-[14px] text-[#2b2b8f] shadow-[0_4px_10px_#00000026] sm:left-[148px] sm:translate-x-0"
          >
            Akun Berhasil Dibuat
            <br />
            Silakan Login
          </div>
        )}

        <h1 id="login-title" className="font-poppins text-[26px] font-semibold text-ink sm:text-[32px]">
          Selamat Datang Kembali
        </h1>
        <p className="mt-3 font-inter text-base text-muted sm:text-lg">
          Masukkan akun kamu untuk mengakses dashboard.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mx-auto mt-8 w-full max-w-[340px]">
          <fieldset className="rounded-lg bg-white p-[5px]">
            <legend className="float-left w-full pl-[5px] pt-[5px] font-inter text-base text-ink">
              Masuk Sebagai:
            </legend>
            <div className="clear-both mt-[11px] flex gap-[11px] sm:ml-[15px]">
              {Object.entries(roles).map(([value, r]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={role === value}
                  onClick={() => {
                    setRole(value);
                    setError("");
                  }}
                  className={`relative flex h-[63px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[9px] border bg-white font-inter text-base disabled:cursor-not-allowed disabled:opacity-60 sm:w-[133px] sm:flex-none ${
                    role === value
                      ? "border-[#1e1e1e] text-black shadow-[0px_4px_4px_#00000040]"
                      : "border-transparent text-ink"
                  }`}
                >
                  <img className="h-[27px] w-[27px]" alt="" src={r.icon} />
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="ml-1 mt-8 flex items-start gap-2.5 min-[1100px]:mt-[57px]">
            <img className="mt-0.5 h-5 w-5 shrink-0" alt="" src={alertIcon} />
            <div>
              <p className="font-poppins font-semibold text-[15px] text-black">{roles[role].title}</p>
              <p className="mt-1.5 font-inter text-[15px] text-muted">{roles[role].desc}</p>
            </div>
          </div>

          <div className="mx-auto mt-10 flex w-full max-w-[340px] flex-col gap-4 min-[1100px]:mt-14">
            <FormField
              id="login-email"
              name="email"
              type="email"
              label="Email"
              icon={emailIcon}
              placeholder="nama@gmail.com"
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
              icon={lockIcon}
              autoComplete="current-password"
              value={password}
              onChange={onType(setPassword)}
              error={fieldErrors.password}
              invalid={Boolean(error)}
              describedBy={error ? "login-error" : undefined}
              trailing={
                <PasswordToggle
                  shown={showPassword}
                  onToggle={() => setShowPassword((visible) => !visible)}
                  eyeIcon={eyeIcon}
                  eyeOffIcon={eyeOffIcon}
                />
              }
            />

            {/* Satu pesan untuk email & password: sengaja tidak menyebut kolom mana yang salah */}
            {error && (
              <p id="login-error" role="alert" className="rounded-lg bg-danger-soft px-3 py-2 font-inter text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
              {loading ? "Memproses..." : "Masuk"}
              <span aria-hidden="true" className="text-xl leading-none">→</span>
            </Button>

            <p className="text-center font-inter text-base text-ink">
              Belum punya akun?{" "}
              <Link to="/register" className="font-medium text-primary-strong underline-offset-2 hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
