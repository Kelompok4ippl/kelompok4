import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth.js";
import KosHero from "../components/KosHero.jsx";
import FormField, { PasswordToggle } from "../components/FormField.jsx";
import { LineIcon } from "../components/Icon.jsx";

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
  if (!form.konfirmasi) errors.konfirmasi = "Ketik ulang password Anda";
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
    <main className="flex min-h-screen flex-col-reverse bg-white font-poppins text-steel-ink lg:flex-row">
      {/* Kiri: foto kamar + kartu kos */}
      <KosHero />

      {/* Kanan: form buat akun */}
      <section aria-labelledby="register-title" className="flex flex-1 items-start justify-center px-5 py-10 sm:px-10 lg:max-w-[52%] lg:pb-12 lg:pt-[12vh]">
        <div className="w-full max-w-[420px]">
          <p className="mb-6 font-serif4 text-2xl font-bold text-steel-side lg:hidden">KeKos</p>
          <h1 id="register-title" className="font-serif4 text-[32px] font-bold leading-tight sm:text-[36px]">
            Buat akun baru
          </h1>
          <p className="mt-1.5 text-sm text-steel-muted">
            Satu akun untuk mencari kos atau mendaftarkan kos milikmu. Peran dipilih saat masuk.
          </p>

          <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <FormField
              id="daftar-nama"
              name="nama"
              label="Nama lengkap"
              icon="user"
              placeholder="Masukkan nama lengkap"
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
              icon="mail"
              placeholder="nama@email.com"
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
              label="Nomor telepon"
              icon="phone"
              placeholder="08xx xxxx xxxx"
              autoComplete="tel"
              value={form.telepon}
              onChange={onType}
              helper="Dipakai pemilik/pencari untuk menghubungi lewat WhatsApp."
              error={errors.telepon}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="daftar-password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                icon="lock"
                placeholder="6+ karakter"
                autoComplete="new-password"
                value={form.password}
                onChange={onType}
                error={errors.password}
                trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
              />
              <FormField
                id="daftar-konfirmasi"
                name="konfirmasi"
                type={showKonfirmasi ? "text" : "password"}
                label="Konfirmasi password"
                icon="lock"
                placeholder="Ketik ulang"
                autoComplete="new-password"
                value={form.konfirmasi}
                onChange={onType}
                error={errors.konfirmasi}
                trailing={<PasswordToggle shown={showKonfirmasi} onToggle={() => setShowKonfirmasi((v) => !v)} />}
              />
            </div>

            {formError && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#efc9c3] bg-bad-soft px-3.5 py-3 text-sm text-bad">
                <LineIcon name="alert" className="mt-px h-[18px] w-[18px]" />
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-steel text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(46,94,142,.8)] hover:bg-steel-strong disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Buat akun"}
              {!loading && <LineIcon name="arrow" className="h-4 w-4" />}
            </button>

            <p className="text-center text-sm text-steel-body">
              Sudah punya akun?{" "}
              <Link to="/" className="font-semibold text-steel underline-offset-2 hover:underline">
                Masuk sekarang
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
