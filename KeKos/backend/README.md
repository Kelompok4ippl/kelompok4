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
| POST | `/auth/login` | | `{ email, password, peran? }` → `{ token, user }`. `peran` = `pencariKos` (default) / `pemilikKos`. Admin masih ditolak. Login berhasil memanggil `sp_catat_login` |
| GET | `/auth/me` | 🔒 semua | pengguna yang sedang login |
| GET | `/kos` | | kos terverifikasi; filter `?tipe=&min=&max=&fasilitas=AC,WiFi&q=` (nama fasilitas sama dengan tabel `fasilitas`) |
| GET | `/kos/:id` | | detail kos + tipe kamar + ulasan |
| POST | `/kos/:id/ulasan` | 🔒 pencariKos | `{ rating, isi }`; hanya penyewa dengan booking `diterima` di kos itu |
| DELETE | `/kos/:id/ulasan/:ulasanId` | 🔒 penulis ulasan | hapus ulasan sendiri |
| GET | `/booking?kos_id=` | 🔒 pencariKos | booking milik sendiri |
| POST | `/booking` | 🔒 pencariKos | `{ kamar_id }` (= `id_tipe_kamar`), lewat `sp_buat_booking` |
| GET | `/notifikasi` | 🔒 semua | notifikasi milik sendiri |
| PATCH | `/notifikasi/baca` | 🔒 semua | tandai semua sudah dibaca |
| GET | `/pemilik/fasilitas` | 🔒 pemilikKos | nama fasilitas (master) |
| GET | `/pemilik/kos` | 🔒 pemilikKos | kos milik sendiri (semua status) + `rooms` |
| POST | `/pemilik/kos` | 🔒 pemilikKos | `{ nama, jenis, banyakKamar, alamat, deskripsi?, fasilitas[] }`, status awal `menunggu` |
| PUT | `/pemilik/kos/:id` | 🔒 pemilikKos | sama dengan POST |
| POST | `/pemilik/kos/:id/foto` | 🔒 pemilikKos | isi request = file gambar mentah (`Content-Type: image/...`), JPG/PNG/WebP maks 5 MB, maks 10 foto per kos. Disimpan di `backend/uploads/`, disajikan di `/api/uploads/...` |
| DELETE | `/pemilik/kos/:id/foto/:fotoId` | 🔒 pemilikKos | hapus foto (file upload ikut dihapus dari disk) |
| POST | `/pemilik/kos/:id/kamar` | 🔒 pemilikKos | `{ tipe, harga, jumlahKamar, deskripsi?, fasilitas[] }` |
| PUT | `/pemilik/kamar/:id` | 🔒 pemilikKos | sama; jumlah kamar tidak boleh di bawah kamar yang sudah terisi |
| PATCH | `/pemilik/kamar/:id/status` | 🔒 pemilikKos | `{ tersedia }` toggle `tersedia`/`penuh` |
| GET | `/pemilik/booking` | 🔒 pemilikKos | booking masuk ke kos sendiri |
| PATCH | `/pemilik/booking/:id` | 🔒 pemilikKos | `{ aksi: "terima" \| "tolak" }` lewat `sp_terima_booking` / `sp_tolak_booking` |

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
  routes/pemilik.js   kelola kos, tipe kamar, dan booking masuk (pemilik kos)
  format.js           query kos/tipe kamar dan ubah baris database jadi JSON (jarak dihitung dari koordinat)
```
