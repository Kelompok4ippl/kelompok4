import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { homeFor, login } from "../api/auth.js";
import KosHero from "../components/KosHero.jsx";

import userIcon from "../assets/user-icon.svg";
import buildingIcon from "../assets/building-icon.svg";
import alertIcon from "../assets/alert-circle.svg";
import emailIcon from "../assets/email.svg";
import emailIconRed from "../assets/email-merah.svg";
import lockIcon from "../assets/lock.svg";
import lockIconRed from "../assets/lock-merah.svg";
import eyeOffIcon from "../assets/eye-off.svg";
import eyeOffIconRed from "../assets/eye-off-merah.svg";

const roles = {
  pencari: {
    label: "Pencari kos",
    title: "Pencari kos",
    icon: userIcon,
    desc: "Akses halaman pencarian kos, detail kos, pengajuan booking kos",
  },
  // Sprint 2: pilihan pemilik hanya tampilan, login pemilik kos dibuat di Sprint 3
  pemilik: {
    label: "Pemilik kos",
    title: "Pemilik Kos",
    icon: buildingIcon,
    desc: "Akses halaman untuk melisting kos dan juga listing kamar",
    soon: true,
  },
};

const SOON_MESSAGE = "Login pemilik kos belum tersedia ";

// Satu halaman login untuk kondisi di Figma: login pencari (/), salah password, dan notif "Akun Berhasil Dibuat".
// Sprint 2: hanya pencari kos yang bisa login; pilihan pemilik kos baru tampilan (menyusul Sprint 3).
export default function Login({ initialError = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Dikirim dari halaman register setelah akun berhasil dibuat
  const registered = location.state?.registered;
  const [role, setRole] = useState("pencari");
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Pesan error dari server, atau "" kalau tidak ada error
  const [error, setError] = useState(initialError ? "password salah" : "");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(Boolean(registered));
  const [showSoon, setShowSoon] = useState(false);
  // Naik setiap kali login pemilik "terpental", supaya animasi pentalnya diputar ulang
  const [bounce, setBounce] = useState(0);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Login pemilik kos belum ada di Sprint 2: pura-pura memproses sebentar, lalu terpental
    // kembali ke form login pencari kos (email & password dikosongkan) dengan animasi memantul.
    if (roles[role].soon) {
      setLoading(true);
      setShowSoon(false);
      setTimeout(() => {
        setLoading(false);
        setRole("pencari");
        setEmail("");
        setPassword("");
        setShowSoon(true);
        setBounce((n) => n + 1);
      }, 700);
      return;
    }
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(homeFor());
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
  };

  const inputColor = error
    ? "text-[#ff0000] placeholder:text-[#ff0000]"
    : "text-black placeholder:text-[#757575]";

  return (
    <main className="mx-auto flex min-h-screen max-w-[1354px] flex-col-reverse bg-[#f8f9ff] px-0 py-0 min-[1100px]:my-14 min-[1100px]:min-h-[911px] min-[1100px]:flex-row min-[1100px]:px-4">
      {/* Kiri: foto kamar + kartu kos */}
      <KosHero />

      {/* Kanan: form masuk */}
      <section
        aria-labelledby="login-title"
        className="relative border-[#919191] bg-white px-4 pb-10 pt-8 sm:px-[31px] sm:pt-14 min-[1100px]:w-[497px] min-[1100px]:shrink-0 min-[1100px]:border"
      >
        {showToast && (
          <div
            role="status"
            className="absolute left-1/2 top-[86px] z-10 w-[215px] -translate-x-1/2 rounded-lg border-2 border-[#5b5b78] bg-white px-3 py-3 font-spacemono text-xs leading-[14px] text-[#2b2b8f] shadow-[0_4px_10px_#00000026] sm:left-[148px] sm:translate-x-0"
          >
            Akun Berhasil Dibuat
            <br />
            Silahkan Login
          </div>
        )}

        <h1 id="login-title" className="font-['Ruwudu'] text-[26px] text-black sm:text-[32px]">
          Selamat Datang Kembali
        </h1>
        <p className="mt-3 font-['Ruwudu'] text-[17px] text-[#545454] sm:text-xl">
          Masukkan akun kamu untuk mengakses dashboard.
        </p>

        <form
          key={bounce}
          onSubmit={handleSubmit}
          noValidate
          className={`mx-auto mt-8 w-full max-w-[303px] ${bounce ? "kekos-bounce-back" : ""}`}
        >
          <fieldset className="rounded-lg bg-white p-[5px]">
            <legend className="float-left w-full pl-[5px] pt-[5px] font-['Roboto'] text-base text-[#101010]">
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
                    setShowSoon(false);
                  }}
                  className={`flex h-[63px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[9px] border bg-white font-['Roboto'] text-base sm:w-[133px] sm:flex-none ${
                    role === value
                      ? "border-[#1e1e1e] text-black shadow-[0px_4px_4px_#00000040]"
                      : "border-transparent text-[#101010]"
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
              <p className="font-['Saira_Stencil_One'] text-[15px] text-black">{roles[role].title}</p>
              <p className="mt-1.5 font-['Ruwudu'] text-[15px] text-[#545454]">{roles[role].desc}</p>
              {roles[role].soon && (
                <span className="mt-2 inline-block rounded-full bg-[#fff4d6] px-2.5 py-0.5 font-['Roboto'] text-xs text-[#8a6100]">
                
                </span>
              )}
            </div>
          </div>

          <div className="mx-auto mt-12 flex w-full max-w-[261px] flex-col gap-[23px] min-[1100px]:mt-[100px]">
            <label className="flex h-[37px] items-center gap-[18px] rounded-lg border border-[#c9c9cf] px-2.5 focus-within:border-[#4a90e2]">
              <img className="h-5 w-5 shrink-0" alt="" src={error ? emailIconRed : emailIcon} />
              <span className="sr-only">Email</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={onType(setEmail)}
                className={`h-full min-w-0 flex-1 bg-transparent font-['Roboto'] text-base outline-none ${inputColor}`}
              />
            </label>

            <label className="flex h-[37px] items-center gap-[18px] rounded-lg border border-[#c9c9cf] px-2.5 focus-within:border-[#4a90e2]">
              <img className="h-5 w-5 shrink-0" alt="" src={error ? lockIconRed : lockIcon} />
              <span className="sr-only">Password</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={onType(setPassword)}
                className={`h-full min-w-0 flex-1 bg-transparent font-['Roboto'] text-base outline-none ${inputColor}`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="flex shrink-0"
              >
                <img className="h-5 w-5" alt="" src={error ? eyeOffIconRed : eyeOffIcon} />
              </button>
            </label>
          </div>

          {showSoon && (
            <p role="status" className="mx-auto mt-4 max-w-[261px] rounded-lg border border-[#e0c06a] bg-[#fff8e5] px-3 py-2 font-['Roboto'] text-xs leading-4 text-[#6b4b00]">
              {SOON_MESSAGE}
            </p>
          )}

          {error && (
            <p role="alert" className="ml-[34px] mt-[3px] font-['Rokkitt'] text-[10px] text-[#ff0000]">
              {error}*
            </p>
          )}

          <p className={`font-['Rokkitt'] text-lg text-black sm:whitespace-nowrap sm:text-xl ${error ? "mt-1.5" : "mt-[19px]"}`}>
            Belum punya akun?{" "}
            <Link to="/register" className="text-[#7d7fff] hover:underline">
              Daftar sekarang
            </Link>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex h-[35px] w-full items-center justify-center gap-2.5 rounded-[9px] bg-[linear-gradient(163deg,#f6f6f6_0%,#1f1f1f_100%)] font-['Roboto'] text-sm text-white shadow-[0px_4px_4px_#00000040] hover:brightness-90 disabled:cursor-wait disabled:opacity-70 min-[1100px]:mt-[55px]"
          >
            {loading ? "MEMPROSES..." : "MASUK"}
            <span aria-hidden="true" className="text-[25px] leading-5">→</span>
          </button>
        </form>
      </section>
    </main>
  );
}
