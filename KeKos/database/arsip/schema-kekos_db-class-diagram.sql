DROP DATABASE IF EXISTS kekos_db;
CREATE DATABASE IF NOT EXISTS kekos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kekos_db;

-- ===== Pengguna dan subclass-nya =====

CREATE TABLE pengguna (
  id_pengguna INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,       -- simpan hash (bcrypt), bukan password asli
  no_hp VARCHAR(20) NULL,
  status_akun ENUM('aktif', 'nonaktif', 'diblokir') NOT NULL DEFAULT 'aktif',
  terakhir_aktif DATETIME NULL
);

-- Admin: tidak punya atribut tambahan, cukup penanda bahwa pengguna ini admin
CREATE TABLE admin (
  id_pengguna INT PRIMARY KEY,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id_pengguna) ON DELETE CASCADE
);

CREATE TABLE pemilik_kos (
  id_pengguna INT PRIMARY KEY,
  status_verifikasi ENUM('menunggu', 'terverifikasi', 'ditolak') NOT NULL DEFAULT 'menunggu',
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id_pengguna) ON DELETE CASCADE
);

-- PencariKos: tidak punya atribut tambahan
CREATE TABLE pencari_kos (
  id_pengguna INT PRIMARY KEY,
  FOREIGN KEY (id_pengguna) REFERENCES pengguna(id_pengguna) ON DELETE CASCADE
);

-- ===== Kos =====

-- KategoriKos 1 -- 0..* Kos (mengelompokkan)
CREATE TABLE kategori_kos (
  id_kategori INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(100) NOT NULL UNIQUE
);

-- PemilikKos 1 -- 0..* Kos (memiliki)
-- Admin 1 -- 0..* Kos (mengelola listing)
-- KategoriKos 1 -- 0..* Kos (mengelompokkan)
CREATE TABLE kos (
  id_kos INT AUTO_INCREMENT PRIMARY KEY,
  id_pemilik INT NOT NULL,
  id_admin INT NOT NULL,
  id_kategori INT NOT NULL,
  nama_kos VARCHAR(150) NOT NULL,
  banyak_kamar INT NOT NULL DEFAULT 0,
  alamat VARCHAR(255) NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  deskripsi TEXT NULL,
  jenis_kos ENUM('putra', 'putri', 'campur') NOT NULL DEFAULT 'campur',
  status_verifikasi ENUM('menunggu', 'terverifikasi', 'ditolak') NOT NULL DEFAULT 'menunggu',
  rata_rating DECIMAL(2, 1) NOT NULL DEFAULT 0.0,
  terakhir_diperbarui DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pemilik) REFERENCES pemilik_kos(id_pengguna) ON DELETE CASCADE,
  FOREIGN KEY (id_admin) REFERENCES admin(id_pengguna),
  FOREIGN KEY (id_kategori) REFERENCES kategori_kos(id_kategori)
);

-- Kos 1 -- 0..* FotoKos (komposisi)
CREATE TABLE foto_kos (
  id_foto INT AUTO_INCREMENT PRIMARY KEY,
  id_kos INT NOT NULL,
  file_foto VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_kos) REFERENCES kos(id_kos) ON DELETE CASCADE
);

CREATE TABLE fasilitas (
  id_fasilitas INT AUTO_INCREMENT PRIMARY KEY,
  nama_fasilitas VARCHAR(100) NOT NULL UNIQUE
);

-- Kos 0..* -- 0..* Fasilitas (menyediakan)
CREATE TABLE kos_fasilitas (
  id_kos INT NOT NULL,
  id_fasilitas INT NOT NULL,
  PRIMARY KEY (id_kos, id_fasilitas),
  FOREIGN KEY (id_kos) REFERENCES kos(id_kos) ON DELETE CASCADE,
  FOREIGN KEY (id_fasilitas) REFERENCES fasilitas(id_fasilitas) ON DELETE CASCADE
);

-- ===== Kamar =====

-- Kos 1 -- 1..* TipeKamar (komposisi)
CREATE TABLE tipe_kamar (
  id_tipe_kamar INT AUTO_INCREMENT PRIMARY KEY,
  id_kos INT NOT NULL,
  nama_tipe VARCHAR(50) NOT NULL,
  harga DECIMAL(12, 2) NOT NULL,
  jumlah_kamar INT NOT NULL DEFAULT 0,
  jumlah_tersedia INT NOT NULL DEFAULT 0,
  deskripsi VARCHAR(255) NULL,
  status_ketersediaan ENUM('tersedia', 'penuh') NOT NULL DEFAULT 'tersedia',
  FOREIGN KEY (id_kos) REFERENCES kos(id_kos) ON DELETE CASCADE,
  CHECK (jumlah_tersedia BETWEEN 0 AND jumlah_kamar)
);

-- TipeKamar 1 -- 0..* FotoKamar (komposisi)
CREATE TABLE foto_kamar (
  id_foto_kamar INT AUTO_INCREMENT PRIMARY KEY,
  id_tipe_kamar INT NOT NULL,
  file_foto VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_tipe_kamar) REFERENCES tipe_kamar(id_tipe_kamar) ON DELETE CASCADE
);

-- TipeKamar 0..* -- 0..* Fasilitas (menyediakan)
CREATE TABLE tipe_kamar_fasilitas (
  id_tipe_kamar INT NOT NULL,
  id_fasilitas INT NOT NULL,
  PRIMARY KEY (id_tipe_kamar, id_fasilitas),
  FOREIGN KEY (id_tipe_kamar) REFERENCES tipe_kamar(id_tipe_kamar) ON DELETE CASCADE,
  FOREIGN KEY (id_fasilitas) REFERENCES fasilitas(id_fasilitas) ON DELETE CASCADE
);

-- ===== Transaksi =====

-- PencariKos 1 -- 0..* Booking (membuat)
-- Booking 0..* -- 1 TipeKamar (memesan)
CREATE TABLE booking (
  id_booking INT AUTO_INCREMENT PRIMARY KEY,
  id_pencari INT NOT NULL,
  id_tipe_kamar INT NOT NULL,
  tanggal_booking DATE NOT NULL,
  status_booking ENUM('menunggu', 'diterima', 'ditolak', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
  FOREIGN KEY (id_pencari) REFERENCES pencari_kos(id_pengguna) ON DELETE CASCADE,
  FOREIGN KEY (id_tipe_kamar) REFERENCES tipe_kamar(id_tipe_kamar) ON DELETE CASCADE
);

-- PencariKos 1 -- 0..* Rating (memberi)
-- Rating 0..* -- 1 Kos (menilai)
CREATE TABLE rating (
  id_rating INT AUTO_INCREMENT PRIMARY KEY,
  id_kos INT NOT NULL,
  id_pencari INT NOT NULL,
  nilai_rating TINYINT NOT NULL,
  ulasan TEXT NULL,
  tanggal_rating DATE NOT NULL,
  FOREIGN KEY (id_kos) REFERENCES kos(id_kos) ON DELETE CASCADE,
  FOREIGN KEY (id_pencari) REFERENCES pencari_kos(id_pengguna) ON DELETE CASCADE,
  CHECK (nilai_rating BETWEEN 1 AND 5)
);

-- Admin 1 -- 0..* Verifikasi (melakukan)
-- Verifikasi 0..* -- 0..1 PemilikKos (atas pemilik)
-- Verifikasi 0..* -- 0..1 Kos (atas listing)
CREATE TABLE verifikasi (
  id_verifikasi INT AUTO_INCREMENT PRIMARY KEY,
  id_admin INT NOT NULL,
  id_pemilik INT NULL,                  -- diisi untuk jenis 'pemilik'
  id_kos INT NULL,                      -- diisi untuk jenis 'listing'
  jenis_verifikasi ENUM('pemilik', 'listing') NOT NULL,
  status_verifikasi ENUM('menunggu', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu',
  catatan TEXT NULL,
  tanggal_verifikasi DATE NULL,
  FOREIGN KEY (id_admin) REFERENCES admin(id_pengguna) ON DELETE CASCADE,
  FOREIGN KEY (id_pemilik) REFERENCES pemilik_kos(id_pengguna) ON DELETE CASCADE,
  FOREIGN KEY (id_kos) REFERENCES kos(id_kos) ON DELETE CASCADE
);

-- Pengguna 1 -- 0..* Notifikasi (menerima)
-- Booking 1 -- 0..* Notifikasi (memicu)
CREATE TABLE notifikasi (
  id_notifikasi INT AUTO_INCREMENT PRIMARY KEY,
  id_penerima INT NOT NULL,
  id_booking INT NULL,                  -- kosong untuk notifikasi yang bukan dari booking (misal peringatan admin)
  jenis_notifikasi VARCHAR(50) NOT NULL,
  pesan VARCHAR(255) NOT NULL,
  sudah_dibaca BOOLEAN NOT NULL DEFAULT FALSE,
  waktu_kirim DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_penerima) REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
  FOREIGN KEY (id_booking) REFERENCES booking(id_booking) ON DELETE CASCADE
);
