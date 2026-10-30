# KeKos — Sprint 2: Fitur Pencari Kos

Versi ini hanya berisi fitur yang masuk **Sprint 2**:

- **Login & daftar akun** (akun baru otomatis menjadi pencari kos)
- **Dashboard pencari kos**: pencarian & filter (tipe, harga, fasilitas), peta persebaran kos, kartu kos yang bisa digeser
- **Detail kos**: foto, informasi, tipe kamar, ulasan & rating (bisa tulis/hapus ulasan sendiri)
- **Booking kos** oleh pencari (status "menunggu" sampai diproses pemilik)
- **Notifikasi** pencari kos

Fitur pemilik kos dan admin tidak ada di versi ini (menyusul Sprint 3).

```
KeKos/
├── frontend/   React + Vite (JavaScript) + Tailwind
├── backend/    Node.js + Express (API)
└── database/   MySQL: schema.sql (= kekos_database1.sql, acuan SKPL) + seed.sql (data demo)
```

## Yang perlu terpasang
- **Node.js 20.6 atau lebih baru** (cek di CMD: `node -v`)
- **MySQL Server** + **MySQL Workbench** (MySQL Server harus menyala, biasanya otomatis sebagai service Windows)

## Cara menjalankan di Windows

### 1. Database (MySQL Workbench)
1. Buka MySQL Workbench, klik koneksi **Local instance MySQL** (biasanya user `root`), masukkan password root.
2. Menu **File → Open SQL Script...**, pilih `database\schema.sql`.
3. Klik ikon **petir ⚡ (Execute)** untuk menjalankan semuanya.
   File ini membuat ulang database `kekos` (database `kekos` lama ikut terhapus). Butuh MySQL 8.0.16 atau lebih baru.
4. Ulangi untuk `database\seed.sql` (File → Open SQL Script → pilih → ⚡).
5. Cek: di panel **Schemas** klik kanan → **Refresh All**, database `kekos` muncul berisi tabel
   `pengguna`, `kos`, `tipe_kamar`, `booking`, `rating`, `notifikasi`, dan lainnya.

### 2. Backend (CMD / terminal pertama)
```bat
cd KeKos\backend
copy .env.example .env
notepad .env
```
Di `.env`, isi `DB_PASSWORD=` dengan password root MySQL kamu (yang dipakai di Workbench) dan pastikan `DB_NAME=kekos`, lalu simpan.
```bat
npm install
npm run dev
```
Kalau muncul `KeKos backend jalan di http://localhost:3000`, backend sudah siap. Biarkan jendela ini terbuka.

### 3. Frontend (CMD / terminal kedua)
```bat
cd KeKos\frontend
npm install
npm run dev
```
Buka **http://localhost:5173** di browser.

## Akun contoh
Password semua akun: `password123`

| Email | Keterangan |
|---|---|
| `pencari@kekos.test` | Booking di *Kos Putra* sudah diterima (bisa menulis ulasan, nomor WA pemilik terbuka) |
| `siti@contoh.local` | Pencari kos |
| `dyandra@gmail.com` | Booking di *Cozy kos* masih menunggu |
| `budi@contoh.local` | Pemilik beberapa kos contoh (login pemilik menyusul di Sprint 3) |

Bisa juga membuat akun baru lewat **Daftar sekarang** di halaman login.

## Alur demo yang disarankan
1. Login pakai `pencari@kekos.test` → masuk dashboard.
2. Klik **notifikasi** di kiri atas untuk melihat notifikasi.
3. Klik **Cari Kos!**, coba filter tipe/harga/fasilitas, lihat titik kos di peta.
4. Buka *Kos Putra* → lihat detail & ulasan, tulis ulasan (hanya penyewa yang booking-nya diterima yang bisa memberi ulasan).
5. Lanjut ke booking → pilih tipe kamar → **Booking Sekarang** → status berubah menjadi menunggu.
6. Logout (ikon panah kanan atas), lalu coba daftar akun baru.

## Kalau ada masalah
- **`Terjadi kesalahan di server` / `Access denied for user 'root'`**: password di `backend\.env` belum sama dengan password MySQL.
- **`Unknown database 'kekos'`**: `schema.sql` belum dijalankan di Workbench.
- **Login gagal padahal password benar**: jalankan ulang `schema.sql` lalu `seed.sql`.
- **Error `CHECK` / `DEFAULT (CURRENT_DATE)` saat import**: versi MySQL terlalu lama, pakai MySQL 8.0.16 atau lebih baru.
- **`'npm' is not recognized`**: Node.js belum terpasang, atau CMD perlu dibuka ulang setelah memasang Node.js.
- **Port 3000 dipakai aplikasi lain**: ubah `PORT=` di `backend\.env`, dan sesuaikan alamat di `frontend\vite.config.js`.
- **Peta kosong**: peta memakai OpenStreetMap, jadi butuh koneksi internet.
