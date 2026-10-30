-- Data contoh untuk demo Sprint 2 (jalankan SETELAH schema.sql).
-- Password semua akun contoh: password123
-- Booking dibuat lewat sp_buat_booking / sp_terima_booking, sesuai aturan SKPL.
USE kekos;

SET @hash = '$2a$10$fdSqE3zvyILsvaxuV9WQyOxaAQ/l/orY3/ZYJ7HSE1VfMJ94atyCG';

-- Akun dari schema.sql (admin, Budi, Siti) diberi password asli
UPDATE pengguna SET password = @hash WHERE id_pengguna IN (1, 2, 3);

INSERT INTO pengguna (id_pengguna, nama, email, password, no_hp, `role`, terakhir_aktif) VALUES
  (4, 'Contoh Pencari',          'pencari@kekos.test', @hash, '081234567890', 'pengguna', NOW()),
  (5, 'Dyandra Alifyan Nugroho', 'dyandra@gmail.com',  @hash, '081200000003', 'pengguna', NOW()),
  (6, 'Agus Prasetyo',           'agus@gmail.com',     @hash, '6281943332804', 'pengguna', NOW()),
  (7, 'Dewi S.',                 'dewi@gmail.com',     @hash, '081200000005', 'pengguna', NOW());

-- Foto kos 1 dan 2 diganti dengan gambar yang ada di frontend/src/assets
DELETE FROM foto_kos WHERE id_kos IN (1, 2);
INSERT INTO foto_kos (id_kos, file_foto) VALUES
  (1, 'images-3.jpg'), (1, 'image-3.png'), (1, 'images-4.jpg'),
  (2, '7-inspirasi-desain-kos-kosan-sederhana-tapi-nyaman-bikin-betah-1.jpg');

-- Kos tambahan
INSERT INTO kos (id_kos, id_pemilik, id_kategori, nama_kos, banyak_kamar, alamat, latitude, longitude,
                 deskripsi, jenis_kos, status_verifikasi, terakhir_diperbarui) VALUES
  (3, 2, 3, 'Kos Campur Premium', 13, 'Jl. Ketintang Baru No.10, Surabaya', -7.3141, 112.7262,
   'Kos nyaman dekat kampus.', 'campur', 'terverifikasi', NOW()),
  (4, 6, 1, 'Kos Putra', 10, 'Ketintang, Surabaya', -7.3162, 112.7318,
   'Kos putra murah dekat kampus.', 'putra', 'terverifikasi', NOW()),
  (5, 6, 2, 'Kos Mawar Melati', 6, 'Jl. Gayungan, Surabaya', -7.3049, 112.7337,
   'Kos putri tenang dan bersih.', 'putri', 'terverifikasi', NOW() - INTERVAL 2 MONTH),
  (6, 7, 2, 'Kos Bahari Jaya', 6, 'Jl. Ketintang Madya, Surabaya', -7.3085, 112.7256,
   'Kos campur dekat jalan utama.', 'campur', 'terverifikasi', NOW() - INTERVAL 3 MONTH),
  -- Belum diverifikasi admin: tidak tampil di halaman pencari kos
  (7, 7, 1, 'Kos Melati Baru', 8, 'Surabaya', -7.3070, 112.7290,
   'Pengajuan listing baru.', 'putri', 'menunggu', NOW());

INSERT INTO foto_kos (id_kos, file_foto) VALUES
  (3, 'BUJANG-23-1.png'),
  (4, 'whatsapp-image-2026-10-17-at-15-30-14-1.png'),
  (5, 'whatsapp-image-2026-10-17-at-15-30-14-2.jpg'),
  (6, 'hi-check-out-this-great-stay-i-found-on-trivago-for-our-trip-to-la-fortuna-1.jpg'),
  (7, '7-inspirasi-desain-kos-kosan-sederhana-tapi-nyaman-bikin-betah-2.jpg');

INSERT INTO kos_fasilitas (id_kos, id_fasilitas)
  SELECT k.id, f.id_fasilitas FROM fasilitas f JOIN (
    SELECT 3 AS id, 'WiFi' AS nama UNION ALL SELECT 3, 'AC' UNION ALL SELECT 3, 'Kamar Mandi Dalam'
    UNION ALL SELECT 4, 'WiFi' UNION ALL SELECT 4, 'Kamar Mandi Dalam' UNION ALL SELECT 4, 'Parkir Mobil'
    UNION ALL SELECT 5, 'WiFi' UNION ALL SELECT 5, 'Water Heater'
    UNION ALL SELECT 6, 'WiFi' UNION ALL SELECT 6, 'Dapur Bersama'
    UNION ALL SELECT 7, 'WiFi'
  ) k ON k.nama = f.nama_fasilitas;
-- Kos 1 juga punya kamar mandi dalam
INSERT IGNORE INTO kos_fasilitas (id_kos, id_fasilitas)
  SELECT 1, id_fasilitas FROM fasilitas WHERE nama_fasilitas = 'Kamar Mandi Dalam';

-- Tipe kamar tambahan (tipe 1-3 sudah ada di schema.sql)
INSERT INTO tipe_kamar (id_tipe_kamar, id_kos, nama_tipe, harga, jumlah_kamar, jumlah_tersedia, deskripsi, status_ketersediaan) VALUES
  (4,  1, 'Tipe B',  1000000, 2, 0, 'Kamar lebih luas dengan jendela besar.', 'penuh'),
  (5,  2, 'Tipe C',  2000000, 2, 0, 'Pemandangan indah kota langsung dari jendela kamar Anda.', 'penuh'),
  (6,  3, 'Tipe A',  1800000, 3, 2, 'Pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (7,  3, 'Tipe B',  1200000, 3, 2, 'Pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (8,  4, 'Tipe A',   900000, 3, 3, 'Kamar rapi dekat kampus.', 'tersedia'),
  (9,  4, 'Tipe B',   500000, 3, 3, 'Kamar hemat untuk mahasiswa.', 'tersedia'),
  (10, 5, 'Tipe A',   750000, 3, 3, 'Kamar rapi dengan jendela besar.', 'tersedia'),
  (11, 6, 'Tipe A',   850000, 2, 2, 'Kamar nyaman dekat jalan utama.', 'tersedia'),
  (12, 7, 'Tipe A',   700000, 2, 2, 'Pengajuan listing baru.', 'tersedia');

INSERT INTO tipe_kamar_fasilitas (id_tipe_kamar, id_fasilitas)
  SELECT t.id_tipe_kamar, f.id_fasilitas FROM tipe_kamar t JOIN fasilitas f
   WHERE t.id_tipe_kamar >= 4
     AND (f.nama_fasilitas = 'WiFi'
          OR (f.nama_fasilitas = 'Kamar Mandi Dalam' AND t.harga >= 800000)
          OR (f.nama_fasilitas = 'AC' AND t.harga >= 1000000));

INSERT INTO foto_kamar (id_tipe_kamar, file_foto) VALUES
  (1, '5-1.jpg'), (2, 'u-co-live-centro-1.jpg'),
  (3, 'projeto-de-marcenaria-para-detalhamento-dos-moveis-da-cozinha-sala-de-jantar-02-quartos-masculinos-e-01-quarto-de-casal-1.jpg'),
  (4, '7-1.jpg'), (5, 'at-siot-1.jpg'), (6, 'compact-and-functional-kitnet-1.jpg'), (7, '6-1.jpg'),
  (8, '5-1.jpg'), (9, 'donner-moi-une-idee-de-decoration-pour-ma-chambre-1.jpg'),
  (10, 'images-4.jpg'), (11, 'images-3.jpg'), (12, '1.jpg');

-- Ulasan contoh (trigger otomatis memperbarui kos.rata_rating)
INSERT INTO rating (id_kos, id_pencari_kos, nilai_rating, ulasan, tanggal_rating) VALUES
  (1, 5, 4, 'Kamarnya bersih dan dekat kampus.', CURRENT_DATE - INTERVAL 30 DAY),
  (2, 3, 5, 'Kos favorit!', CURRENT_DATE - INTERVAL 7 DAY),
  (3, 3, 5, 'Nyaman dan bersih.', CURRENT_DATE - INTERVAL 5 DAY),
  (4, 5, 2, 'Agak bising.', CURRENT_DATE - INTERVAL 9 DAY);

-- Booking contoh lewat prosedur:
--   pencari@kekos.test sudah diterima di Kos Putra (bisa memberi ulasan & melihat nomor WA pemilik)
--   Dyandra masih menunggu konfirmasi di Cozy kos
CALL sp_buat_booking(4, 8, @b1);
CALL sp_terima_booking(@b1);
CALL sp_buat_booking(5, 2, @b2);
