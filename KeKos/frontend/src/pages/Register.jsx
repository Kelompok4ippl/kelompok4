import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth.js";
import KosHero from "../components/KosHero.jsx";

import userAddIcon from "../assets/group.svg";
import emailIcon from "../assets/email.svg";
import phoneIcon from "../assets/telephone.svg";
import lockIcon from "../assets/lock.svg";
import eyeOffIcon from "../assets/eye-off.svg";

// Sprint 2: akun baru selalu terdaftar sebagai pencari kos
const fieldClass =
  "flex h-[37px] items-center gap-[18px] rounded-lg border border-[#c9c9cf] px-2.5 focus-within:border-[#4a90e2]";
const inputClass =
  "h-full min-w-0 flex-1 bg-transparent font-['Roboto'] text-base text-black outline-none placeholder:text-[#999999]";

const PasswordToggle = ({ shown, onToggle }) => (
  <button
    type="button"
    aria-label={shown ? "Sembunyikan password" : "Tampilkan password"}
    onClick={onToggle}
    className="flex shrink-0"
  >
    <img className="h-5 w-5" alt="" src={eyeOffIcon} />
  </button>
);

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ nama: "", email: "", telepon: "", password: "", konfirmasi: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pesan error hilang begitu user mulai mengetik lagi
  const onType = (event) => {
    setForm((f) => ({ ...f, [event.target.name]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nama = form.nama.trim();
    const email = form.email.trim();
    const telepon = form.telepon.trim();

    if (!nama || !email || !telepon || !form.password || !form.konfirmasi) {
      setError("Semua kolom wajib diisi");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Format email tidak valid");
      return;
    }
    if (!/^\+?[0-9]{9,15}$/.test(telepon.replace(/[\s-]/g, ""))) {
      setError("Nomor telepon tidak valid");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (form.password !== form.konfirmasi) {
      setError("Konfirmasi password tidak sama");
      return;
    }

    setLoading(true);
    try {
      await register({ nama, email, telepon, password: form.password });
      // Ke halaman login dengan notif "Akun Berhasil Dibuat"
      navigate("/", { state: { registered: true, email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[1354px] flex-col-reverse bg-[#f8f9ff] px-0 py-0 min-[1100px]:my-14 min-[1100px]:min-h-[911px] min-[1100px]:flex-row min-[1100px]:px-4">
      {/* Kiri: foto kamar + kartu kos */}
      <KosHero showTagline={false} />

      {/* Kanan: form buat akun */}
      <section
        aria-labelledby="register-title"
        className="border-[#919191] bg-white px-4 pb-10 pt-8 sm:px-[33px] sm:pt-[62px] min-[1100px]:w-[497px] min-[1100px]:shrink-0 min-[1100px]:border"
      >
        <h1 id="register-title" className="font-['Ruwudu'] text-[26px] text-black sm:text-[32px]">
          Buat Akun Baru
        </h1>
        <p className="mt-4 max-w-[437px] font-['Ruwudu'] text-[17px] text-[#555454] sm:text-xl">
          Buat akun kamu untuk bisa mencari dan membooking kos yang kamu inginkan
        </p>

        <form onSubmit={handleSubmit} noValidate className="mx-auto mt-10 w-full max-w-[303px] min-[1100px]:mt-[114px]">
          <div className="mx-auto flex w-full max-w-[261px] flex-col gap-[23px]">
            <label className={fieldClass}>
              <img className="h-[19px] w-[18.5px] shrink-0" alt="" src={userAddIcon} />
              <span className="sr-only">Nama Lengkap</span>
              <input
                type="text"
                name="nama"
                placeholder="Nama Lengkap"
                autoComplete="name"
                value={form.nama}
                onChange={onType}
                className={inputClass}
              />
            </label>

            <label className={fieldClass}>
              <img className="h-5 w-5 shrink-0" alt="" src={emailIcon} />
              <span className="sr-only">Email</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                value={form.email}
                onChange={onType}
                className={inputClass}
              />
            </label>

            <label className={fieldClass}>
              <img className="h-4 w-4 shrink-0" alt="" src={phoneIcon} />
              <span className="sr-only">Nomor Telepon</span>
              <input
                type="tel"
                name="telepon"
                placeholder="Nomor Telepon"
                autoComplete="tel"
                inputMode="tel"
                value={form.telepon}
                onChange={onType}
                className={inputClass}
              />
            </label>

            <label className={fieldClass}>
              <img className="h-5 w-5 shrink-0" alt="" src={lockIcon} />
              <span className="sr-only">Password</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                autoComplete="new-password"
                value={form.password}
                onChange={onType}
                className={inputClass}
              />
              <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            </label>

            <label className={fieldClass}>
              <img className="h-5 w-5 shrink-0" alt="" src={lockIcon} />
              <span className="sr-only">Konfirmasi Password</span>
              <input
                type={showKonfirmasi ? "text" : "password"}
                name="konfirmasi"
                placeholder="Konfirmasi Password"
                autoComplete="new-password"
                value={form.konfirmasi}
                onChange={onType}
                className={inputClass}
              />
              <PasswordToggle shown={showKonfirmasi} onToggle={() => setShowKonfirmasi((v) => !v)} />
            </label>
          </div>

          {error && (
            <p role="alert" className="mx-auto mt-[3px] max-w-[261px] font-['Rokkitt'] text-xs text-[#ff0000]">
              {error}*
            </p>
          )}

          <p className={`text-center font-['Rokkitt'] text-lg text-black sm:whitespace-nowrap sm:text-xl ${error ? "mt-1.5" : "mt-[19px]"}`}>
            Sudah punya akun?{" "}
            <Link to="/" className="text-[#7d7fff] hover:underline">
              Login sekarang
            </Link>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-[42px] flex h-[35px] w-full items-center justify-center rounded-[9px] bg-[linear-gradient(109deg,#f6f6f6_0%,#1f1f1f_100%)] font-['Roboto'] text-sm font-bold text-white shadow-[0px_4px_2px_#00000040] hover:brightness-90 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? "Memproses..." : "Buat"}
          </button>
        </form>
      </section>
    </main>
  );
}
