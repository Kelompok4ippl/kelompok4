# Database KeKos (MySQL)

- `schema.sql` = isi **kekos_database1.sql** (acuan SKPL) apa adanya, ditambah satu baris
  `DROP DATABASE IF EXISTS kekos;` di atas supaya bisa diimpor ulang. Isinya:
  - tabel: `pengguna`, `kategori_kos`, `fasilitas`, `kos`, `foto_kos`, `kos_fasilitas`, `tipe_kamar`,
    `foto_kamar`, `tipe_kamar_fasilitas`, `booking`, `verifikasi`, `rating`, `notifikasi`
  - view: `v_kos_kartu`, `v_sebaran_rating`, `v_ulasan_kos`, `v_kos_tidak_diperbarui`, `v_akun_tidak_login`
  - prosedur & trigger: `sp_catat_login`, `sp_buat_booking`, `sp_terima_booking`, `sp_tolak_booking`,
    `sp_update_rata_rating` (+ trigger rating), `sp_perbarui_terakhir_diperbarui`, `sp_kirim_peringatan`, `sp_hapus_listing`
- `seed.sql` mengisi data demo Sprint 2: password asli untuk akun contoh, 6 kos terverifikasi
  (+1 kos menunggu verifikasi), tipe kamar, foto, fasilitas, ulasan, dan booking yang dibuat lewat `sp_buat_booking`.
- `arsip/` berisi skema versi class diagram (`kekos_db`, 16 tabel) yang sebelumnya dipakai. Tidak dipakai lagi.

Butuh **MySQL 8.0.16 atau lebih baru** (CHECK constraint dan `DEFAULT (CURRENT_DATE)`).

## Import lewat MySQL Workbench
1. Buka koneksi **Local instance MySQL**.
2. **File → Open SQL Script...** → pilih `schema.sql` → klik ⚡ **Execute**.
3. **File → Open SQL Script...** → pilih `seed.sql` → klik ⚡ **Execute**.
4. Panel **Schemas** → klik kanan → **Refresh All**.

Perhatian: `schema.sql` menghapus database `kekos` yang lama sebelum membuat ulang.

## Import lewat terminal
```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql
```

## Akun contoh (password: `password123`)
- `pencari@kekos.test`, `siti@contoh.local`, `dyandra@gmail.com` (pencari kos)
- `budi@contoh.local`, `agus@gmail.com`, `dewi@gmail.com` (pemilik kos contoh; login pemilik menyusul di Sprint 3)
- `admin@kekos.local` (admin; halaman admin menyusul di Sprint 3)
