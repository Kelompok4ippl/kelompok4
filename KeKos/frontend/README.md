# KeKos Frontend — Sprint 2 (Fitur Pencari Kos)

React + Vite + Tailwind, ditulis dengan JavaScript (.jsx).

```bash
npm install
npm run dev      # mode development
npm run build    # build produksi ke folder dist/
npm run lint     # cek kode dengan ESLint
```

## Peta (Google Maps)
Peta persebaran kos di dashboard memakai **Google Maps** kalau API key diisi, dan otomatis memakai
**OpenStreetMap** (gratis, tanpa key) kalau key kosong atau ditolak Google.

1. Buka [Google Cloud Console](https://console.cloud.google.com/), buat project, lalu aktifkan **billing**
   (wajib untuk Google Maps, tapi ada kuota gratis bulanan).
2. Menu **APIs & Services → Library**, aktifkan **Maps JavaScript API**.
3. Menu **APIs & Services → Credentials → Create credentials → API key**.
   Sebaiknya batasi key ke *Websites* `http://localhost:5173/*` (dan domain hosting nanti).
4. Salin `.env.example` menjadi `.env` di folder `frontend`, isi `VITE_GOOGLE_MAPS_API_KEY=...`,
   lalu jalankan ulang `npm run dev`.

Titik kos diambil dari kolom `lat`/`lng` tabel `kos` (sudah terisi di `seed.sql`).

## Route
| URL | File | Login sebagai | Frame Figma |
|---|---|---|---|
| `/` | `pages/Login.jsx` | - | login pencari kos, notif buat akun |
| `/salah-pw` | `pages/Login.jsx` (pesan "password salah*" aktif) | - | salah pw |
| `/register` | `pages/Register.jsx` (akun baru = pencari kos) | - | Register |
| `/dashboard` | `pages/Dashboard.jsx` | pencari | Desktop - 1 + Frame 31 |
| `/notifikasi` | `pages/Dashboard.jsx` (dropdown notifikasi terbuka) | pencari | notifikasi untuk pencari kos |
| `/kos/:id` | `pages/DetailKos.jsx` | siapa saja | Detail |
| `/kos/:id/booking` | `pages/BookingKos.jsx` | pencari | KeKos - verifikasi booking (3 kondisi) |

Setelah login, pencari kos diarahkan ke `/dashboard`. Halaman pemilik kos dan admin menyusul di Sprint 3.
Setelah daftar akun, user kembali ke halaman login dengan notif "Akun Berhasil Dibuat".

## Struktur `src/`
- `pages/` satu file per halaman
- `components/` UI yang dipakai ulang: `KosHero` (bagian kiri login/daftar), `KosCard`, `RoomCard`,
  `Navbar`, `KosInfo`, `Gallery`, `Facility`, `KosMap`, `NotificationList`,
  `RequireRole` (penjaga halaman yang perlu login)
- `api/client.js` fungsi `api()` untuk semua request ke backend (token otomatis ikut)
- `api/auth.js` login, register, logout, user yang sedang login
- `hooks/useApi.js` ambil data dari backend di dalam komponen
- `hooks/useAutoSlide.js` kartu kos yang bergeser sendiri di halaman login
- `lib/format.js` format rupiah, "x menit yang lalu", dan alamat gambar
- `data/kos.js` data contoh kartu kos dekorasi di halaman login/daftar
- `index.css` Tailwind + warna, font, dan reset global
- `assets/` semua gambar & ikon. Gambar kos di database cukup disimpan nama filenya
  (misalnya `BUJANG-23-1.png`)

## Backend
Saat `npm run dev`, request ke `/api` diteruskan ke `http://localhost:3000`
(lihat `vite.config.js`), jadi backend harus jalan juga.
