# KeKos Backend (Node.js + Express + MySQL) — Sprint 2

## Menjalankan
1. Siapkan database dulu (lihat `../database/README.md`).
2. Salin `.env.example` menjadi `.env`, lalu isi `DB_PASSWORD` dengan password root MySQL kamu dan `DB_NAME=kekos`.
3. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
   Server jalan di http://localhost:3000. Butuh Node.js versi 20.6 atau lebih baru.

## API
Semua URL di bawah `/api`. Yang bertanda 🔒 perlu header `Authorization: Bearer <token>` dari login.

| Method | URL | Peran | Keterangan |
|---|---|---|---|
| GET | `/health` | | cek server hidup |
| POST | `/auth/register` | | `{ nama, email, telepon, password }` (tanpa peran) |
| POST | `/auth/login` | | `{ email, password, peran? }` → `{ token, user }`. `peran` = `pencariKos` (default) / `pemilikKos`. Sprint 2: pemilik & admin ditolak (menyusul Sprint 3). Login berhasil memanggil `sp_catat_login` |
| GET | `/auth/me` | 🔒 semua | pengguna yang sedang login |
| GET | `/kos` | | kos terverifikasi; filter `?tipe=&min=&max=&fasilitas=AC,WiFi&q=` (nama fasilitas sama dengan tabel `fasilitas`) |
| GET | `/kos/:id` | | detail kos + tipe kamar + ulasan |
| POST | `/kos/:id/ulasan` | 🔒 pencariKos | `{ rating, isi }`; hanya penyewa dengan booking `diterima` di kos itu |
| DELETE | `/kos/:id/ulasan/:ulasanId` | 🔒 penulis ulasan | hapus ulasan sendiri |
| GET | `/booking?kos_id=` | 🔒 pencariKos | booking milik sendiri |
| POST | `/booking` | 🔒 pencariKos | `{ kamar_id }` (= `id_tipe_kamar`), lewat `sp_buat_booking` |
| GET | `/notifikasi` | 🔒 semua | notifikasi milik sendiri |
| PATCH | `/notifikasi/baca` | 🔒 semua | tandai semua sudah dibaca |

Error dikirim sebagai `{ message, code, error: { kode, pesan } }`, contoh `KAMAR_PENUH` (409) "Kamar tidak tersedia".

## Struktur
```
src/
  server.js           titik awal, daftar route
  db.js               koneksi MySQL
  middleware/auth.js  cek token login
  routes/auth.js      register, login, me
  routes/kos.js       data kos untuk pencari
  routes/booking.js   booking pencari
  routes/notifikasi.js notifikasi
  format.js           query kos/tipe kamar dan ubah baris database jadi JSON (jarak dihitung dari koordinat)
```
