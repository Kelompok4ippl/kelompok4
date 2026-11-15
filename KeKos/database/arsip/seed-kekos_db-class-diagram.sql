-- Data contoh untuk database kekos_db. Password semua akun: password123
USE kekos_db;

INSERT INTO pengguna (id_pengguna, nama, email, password, no_hp) VALUES
  (1, 'Contoh Pencari', 'pencari@kekos.test', '$2a$10$fdSqE3zvyILsvaxuV9WQyOxaAQ/l/orY3/ZYJ7HSE1VfMJ94atyCG', '081234567890'),
  (2, 'Budi Santoso', 'pemilik@kekos.test', '$2a$10$fdSqE3zvyILsvaxuV9WQyOxaAQ/l/orY3/ZYJ7HSE1VfMJ94atyCG', '6281943332804'),
  (3, 'Admin KeKos', 'admin@kekos.test', '$2a$10$fdSqE3zvyILsvaxuV9WQyOxaAQ/l/orY3/ZYJ7HSE1VfMJ94atyCG', '081200000000'),
  (4, 'Siti Rahma', 'siti@gmail.com', '$2a$10$fdSqE3zvyILsvaxuV9WQyOxaAQ/l/orY3/ZYJ7HSE1VfMJ94atyCG', '081200000001'),
  (5, 'Agus Prasetyo', 'agus@gmail.com', '$2a$10$fdSqE3zvyILsvaxuV9WQyOxaAQ/l/orY3/ZYJ7HSE1VfMJ94atyCG', '081200000002'),
  (6, 'Dyandra Alifyan Nugroho', 'dyandra@gmail.com', '$2a$10$fdSqE3zvyILsvaxuV9WQyOxaAQ/l/orY3/ZYJ7HSE1VfMJ94atyCG', '081200000003'),
  (8, 'Dewi S.', 'dewi@gmail.com', '$2a$10$fdSqE3zvyILsvaxuV9WQyOxaAQ/l/orY3/ZYJ7HSE1VfMJ94atyCG', '081200000005');

INSERT INTO admin (id_pengguna) VALUES (3);
INSERT INTO pencari_kos (id_pengguna) VALUES (1), (4), (6);
INSERT INTO pemilik_kos (id_pengguna, status_verifikasi) VALUES
  (2, 'terverifikasi'), (5, 'terverifikasi'), (8, 'terverifikasi');

INSERT INTO kategori_kos (id_kategori, nama_kategori) VALUES
  (1, 'Dekat Kampus'), (2, 'Ekonomis'), (3, 'Premium'), (4, 'Umum');

INSERT INTO fasilitas (id_fasilitas, nama_fasilitas) VALUES
  (1, 'Wifi'), (2, 'AC'), (3, 'K. Mandi Dalam');

INSERT INTO kos (id_kos, id_pemilik, id_admin, id_kategori, nama_kos, banyak_kamar, alamat, latitude, longitude, deskripsi, jenis_kos, status_verifikasi, rata_rating, terakhir_diperbarui) VALUES
  (1, 2, 3, 3, 'Kos Campur Premium', 13, 'Jl. Ketintang Baru No.10, Surabaya', -7.3141, 112.7262, 'Kos nyaman dekat kampus. 1 km dari Telkom University.', 'campur', 'terverifikasi', 5.0, NOW()),
  (2, 2, 3, 1, 'Cozy kos', 16, 'Surabaya ketintang', -7.3098, 112.7301, 'Sangat strategis untuk mencari makan dan juga dekat dengan kampus. 500 meter dari Telkom University.', 'putri', 'terverifikasi', 5.0, NOW()),
  (3, 2, 3, 2, 'Kos Putra', 10, 'Ketintang, Surabaya', -7.3162, 112.7318, 'Kos putra murah dekat kampus. 900 meter dari Telkom University.', 'putra', 'terverifikasi', 2.0, NOW()),
  (4, 2, 3, 2, 'Kos Campur Ekonomis', 13, 'Ketintang Tim. PTT IV No.27, Ketintang, Kec. Gayungan, Surabaya, Jawa Timur 60231', -7.3127, 112.7238, 'Kos ekonomis dengan fasilitas lengkap. 700 meter dari Telkom University.', 'campur', 'terverifikasi', 4.5, NOW()),
  (7, 5, 3, 4, 'Kos Mawar Melati', 6, 'Depok', -6.3680, 106.8315, NULL, 'putri', 'terverifikasi', 0.0, NOW() - INTERVAL 2 MONTH),
  (8, 8, 3, 4, 'Kos Bahari Jaya', 6, 'Surabaya', -7.3049, 112.7337, NULL, 'campur', 'terverifikasi', 0.0, NOW() - INTERVAL 3 MONTH);

INSERT INTO foto_kos (id_kos, file_foto) VALUES
  (1, 'BUJANG-23-1.png'),
  (2, '7-inspirasi-desain-kos-kosan-sederhana-tapi-nyaman-bikin-betah-1.jpg'),
  (3, 'whatsapp-image-2026-10-17-at-15-30-14-1.png'),
  (4, 'images-3.jpg'), (4, 'image-3.png'), (4, 'images-4.jpg'),
  (7, 'whatsapp-image-2026-10-17-at-15-30-14-2.jpg'),
  (8, 'hi-check-out-this-great-stay-i-found-on-trivago-for-our-trip-to-la-fortuna-1.jpg');

INSERT INTO kos_fasilitas (id_kos, id_fasilitas) VALUES
  (1, 1), (1, 2), (1, 3),
  (2, 1), (2, 2), (2, 3),
  (3, 1), (3, 3),
  (4, 1), (4, 2), (4, 3),
  (7, 1),
  (8, 1);

INSERT INTO tipe_kamar (id_tipe_kamar, id_kos, nama_tipe, harga, jumlah_kamar, jumlah_tersedia, deskripsi, status_ketersediaan) VALUES
  (1, 2, 'Tipe A', 1000000, 4, 2, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (2, 2, 'Tipe B', 1400000, 6, 4, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (3, 2, 'Tipe C', 2000000, 6, 0, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'penuh'),
  (4, 1, 'Tipe A', 1800000, 4, 2, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (5, 1, 'Tipe B', 1400000, 4, 2, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (6, 1, 'Tipe C', 1000000, 5, 0, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'penuh'),
  (7, 3, 'Tipe A', 900000, 3, 2, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (8, 3, 'Tipe B', 800000, 3, 0, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'penuh'),
  (9, 3, 'Tipe C', 500000, 4, 3, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (10, 4, 'Tipe A', 1800000, 4, 2, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (11, 4, 'Tipe B', 1400000, 4, 1, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'tersedia'),
  (12, 4, 'Tipe C', 1000000, 5, 0, 'pemandangan indah kota langsung dari jendela kamar Anda.', 'penuh'),
  (13, 7, 'Tipe A', 750000, 6, 3, 'Kamar rapi dengan jendela besar.', 'tersedia'),
  (14, 8, 'Tipe A', 850000, 6, 2, 'Kamar nyaman dekat jalan utama.', 'tersedia');

INSERT INTO foto_kamar (id_tipe_kamar, file_foto) VALUES
  (1, 'u-co-live-centro-1.jpg'),
  (2, 'projeto-de-marcenaria-para-detalhamento-dos-moveis-da-cozinha-sala-de-jantar-02-quartos-masculinos-e-01-quarto-de-casal-1.jpg'),
  (3, 'at-siot-1.jpg'),
  (4, 'compact-and-functional-kitnet-1.jpg'),
  (5, '7-1.jpg'),
  (6, '6-1.jpg'),
  (7, '5-1.jpg'),
  (8, '352f832b-c8c6-410d-be3f-8646f8278e9c-2.png'),
  (9, 'donner-moi-une-idee-de-decoration-pour-ma-chambre-1.jpg'),
  (10, 'compact-and-functional-kitnet-1.jpg'),
  (11, '7-1.jpg'),
  (12, '6-1.jpg'),
  (13, 'images-4.jpg'),
  (14, 'images-3.jpg');

INSERT INTO tipe_kamar_fasilitas (id_tipe_kamar, id_fasilitas) VALUES
  (1, 1), (1, 2), (1, 3),
  (2, 1), (2, 2), (2, 3),
  (3, 1), (3, 2), (3, 3),
  (4, 1), (4, 2), (4, 3),
  (5, 1), (5, 2), (5, 3),
  (6, 1), (6, 3),
  (7, 1), (7, 3),
  (8, 1), (8, 3),
  (9, 1),
  (10, 1), (10, 2), (10, 3),
  (11, 1), (11, 2), (11, 3),
  (12, 1), (12, 3),
  (13, 1),
  (14, 1);

INSERT INTO rating (id_kos, id_pencari, nilai_rating, ulasan, tanggal_rating) VALUES
  (4, 1, 5, 'Udah tinggal di sini selama 1 tahun pas awal semester 5. Kosannya super tenang buat ngerjain tugas kuliah dan skripsi. WiFi Indihome 100 Mbps stabil banget, gak pernah lemot pas ujian online. Bu Kos dan Pak Kos juga ramah bgt, sering kirim takjil kalau puasa. Air lancar jaya dan parkiran motor ada CCTV 24 jam aman. Recommended buat anak teknik atau mipa UGM!', CURDATE() - INTERVAL 14 DAY),
  (4, 4, 4, 'Kamarnya bersih dan dekat kampus.', CURDATE() - INTERVAL 30 DAY),
  (1, 1, 5, 'Nyaman dan bersih.', CURDATE() - INTERVAL 5 DAY),
  (2, 4, 5, 'Kos favorit!', CURDATE() - INTERVAL 7 DAY),
  (3, 6, 2, 'Agak bising.', CURDATE() - INTERVAL 9 DAY);

INSERT INTO booking (id_booking, id_pencari, id_tipe_kamar, tanggal_booking, status_booking) VALUES
  (1, 6, 1, CURDATE(), 'menunggu'),
  (2, 6, 4, CURDATE(), 'menunggu');

INSERT INTO verifikasi (id_admin, id_pemilik, id_kos, jenis_verifikasi, status_verifikasi, catatan, tanggal_verifikasi) VALUES
  (3, 2, NULL, 'pemilik', 'disetujui', 'Identitas pemilik lengkap.', CURDATE() - INTERVAL 60 DAY),
  (3, NULL, 4, 'listing', 'disetujui', 'Foto dan alamat sesuai.', CURDATE() - INTERVAL 30 DAY);

INSERT INTO notifikasi (id_penerima, id_booking, jenis_notifikasi, pesan, waktu_kirim) VALUES
  (1, NULL, 'info', 'Selamat datang di KeKos! Cari kos impianmu di sekitar kampus lewat peta dan filter.', NOW() - INTERVAL 1 DAY),
  (6, 1, 'booking', 'Booking "Cozy kos" Tipe A sedang menunggu konfirmasi pemilik.', NOW() - INTERVAL 2 MINUTE),
  (2, 1, 'booking', 'Ada permintaan booking baru untuk "Cozy kos" Tipe A.', NOW() - INTERVAL 2 MINUTE);
