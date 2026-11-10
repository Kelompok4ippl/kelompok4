import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth.js";
import KosHero from "../components/KosHero.jsx";
import FormField, { PasswordToggle } from "../components/FormField.jsx";
import Button from "../components/ui/Button.jsx";

import userAddIcon from "../assets/group.svg";
import emailIcon from "../assets/email.svg";
import phoneIcon from "../assets/telephone.svg";
import lockIcon from "../assets/lock.svg";
import eyeOffIcon from "../assets/eye-off.svg";
import eyeIcon from "../assets/eye.svg";

const FIELDS = ["nama", "email", "telepon", "password", "konfirmasi"];

// Kode error dari backend → kolom yang salah (selain ini, pesan tampil di atas tombol)
const FIELD_OF_CODE = {
  EMAIL_TERDAFTAR: "email",
  EMAIL_TIDAK_VALID: "email",
  EMAIL_HURUF_BESAR: "email",
  NO_HP_TIDAK_VALID: "telepon",
  PASSWORD_PENDEK: "password",
};

// Cek semua kolom sekaligus (FR-01), hasilnya { namaKolom: pesan }
function validate(form) {
  const errors = {};
  const email = form.email.trim();
  if (!form.nama.trim()) errors.nama = "Nama lengkap wajib diisi";
  if (!email) errors.email = "Email wajib diisi";
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Format email tidak valid, contoh: nama@gmail.com";
  else if (email !== email.toLowerCase()) errors.email = "Email harus memakai huruf kecil semua";
  if (!form.telepon.trim()) errors.telepon = "Nomor telepon wajib diisi";
  else if (!/^\+?[0-9]{9,15}$/.test(form.telepon.replace(/[\s-]/g, ""))) {
    errors.telepon = "Nomor telepon tidak valid, isi 9-15 angka";
  }
  if (!form.password) errors.password = "Password wajib diisi";
  else if (form.password.length < 6) errors.password = "Password minimal 6 karakter";
  if (!form.konfirmasi) errors.konfirmasi = "Ketik ulang password kamu";
  else if (form.password !== form.konfirmasi) errors.konfirmasi = "Konfirmasi password tidak sama";
  return errors;
}

// Sprint 2: akun baru tidak memilih peran (peran dipilih saat login)
export default function Register() {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [form, setForm] = useState({ nama: "", email: "", telepon: "", password: "", konfirmasi: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pesan error kolom hilang begitu kolom itu diketik lagi
  const onType = (event) => {
    const { name, value } = event.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
    setFormError("");
  };

  // Setelah gagal kirim, fokus pindah ke kolom pertama yang salah
  const focusField = (name) => formRef.current?.querySelector(`[name="${name}"]`)?.focus();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    const firstInvalid = FIELDS.find((f) => found[f]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    const email = form.email.trim();
    setLoading(true);
    try {
      await register({ nama: form.nama.trim(), email, telepon: form.telepon.trim(), password: form.password });
      // Ke halaman login dengan notif "Akun Berhasil Dibuat"
      navigate("/", { state: { registered: true, email } });
    } catch (err) {
      const field = FIELD_OF_CODE[err.code];
      if (field) {
        setErrors({ [field]: err.message });
        focusField(field);
      } else {
        setFormError(err.message);
      }
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
        className="border-line-strong bg-white px-4 pb-10 pt-8 sm:px-[33px] sm:pt-[62px] min-[1100px]:w-[497px] min-[1100px]:shrink-0 min-[1100px]:border"
      >
        <h1 id="register-title" className="font-poppins text-[26px] font-semibold text-ink sm:text-[32px]">
          Buat Akun Baru
        </h1>
        <p className="mt-3 max-w-[437px] font-inter text-base text-muted sm:text-lg">
          Buat akun kamu untuk bisa mencari dan membooking kos yang kamu inginkan
        </p>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="mx-auto mt-10 flex w-full max-w-[340px] flex-col gap-4">
          <p className="font-inter text-xs text-muted">Semua kolom wajib diisi.</p>
          <FormField
            id="daftar-nama"
            name="nama"
            label="Nama Lengkap"
            icon={userAddIcon}
            autoComplete="name"
            value={form.nama}
            onChange={onType}
            error={errors.nama}
          />
          <FormField
            id="daftar-email"
            name="email"
            type="email"
            label="Email"
            icon={emailIcon}
            placeholder="nama@gmail.com"
            autoComplete="email"
            value={form.email}
            onChange={onType}
            helper="Gunakan huruf kecil semua."
            error={errors.email}
          />
          <FormField
            id="daftar-telepon"
            name="telepon"
            type="tel"
            inputMode="tel"
            label="Nomor Telepon"
            icon={phoneIcon}
            placeholder="081234567890"
            autoComplete="tel"
            value={form.telepon}
            onChange={onType}
            error={errors.telepon}
          />
          <FormField
            id="daftar-password"
            name="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            icon={lockIcon}
            autoComplete="new-password"
            value={form.password}
            onChange={onType}
            helper="Minimal 6 karakter."
            error={errors.password}
            trailing={
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                eyeIcon={eyeIcon}
                eyeOffIcon={eyeOffIcon}
              />
            }
          />
          <FormField
            id="daftar-konfirmasi"
            name="konfirmasi"
            type={showKonfirmasi ? "text" : "password"}
            label="Konfirmasi Password"
            icon={lockIcon}
            autoComplete="new-password"
            value={form.konfirmasi}
            onChange={onType}
            error={errors.konfirmasi}
            trailing={
              <PasswordToggle
                shown={showKonfirmasi}
                onToggle={() => setShowKonfirmasi((v) => !v)}
                eyeIcon={eyeIcon}
                eyeOffIcon={eyeOffIcon}
              />
            }
          />

          {formError && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 font-inter text-sm text-danger">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
            {loading ? "Memproses..." : "Buat Akun"}
          </Button>

          <p className="text-center font-inter text-base text-ink">
            Sudah punya akun?{" "}
            <Link to="/" className="font-medium text-primary-strong underline-offset-2 hover:underline">
              Login sekarang
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
