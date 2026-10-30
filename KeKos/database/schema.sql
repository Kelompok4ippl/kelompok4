DROP DATABASE IF EXISTS kekos;
CREATE DATABASE IF NOT EXISTS kekos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kekos;

-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Master kategori kos (tidak dikelola admin; isi lewat data awal)
CREATE TABLE IF NOT EXISTS kategori_kos (
  id_kategori   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama_kategori VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id_kategori),
  UNIQUE KEY uq_kategori_nama (nama_kategori)
) ENGINE=InnoDB;

-- Master fasilitas (dipakai fasilitas kos dan fasilitas kamar)
CREATE TABLE IF NOT EXISTS fasilitas (
  id_fasilitas   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama_fasilitas VARCHAR(50)  NOT NULL,
  PRIMARY KEY (id_fasilitas),
  UNIQUE KEY uq_fasilitas_nama (nama_fasilitas)
) ENGINE=InnoDB;

-- Satu akun bisa menjadi pencari kos sekaligus pemilik kos.
-- Kolom role hanya membedakan admin dan pengguna biasa.
CREATE TABLE IF NOT EXISTS pengguna (
  id_pengguna    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama           VARCHAR(100) NOT NULL,
  email          VARCHAR(100) NOT NULL,
  password       VARCHAR(255) NOT NULL,           -- simpan hash (mis. bcrypt), bukan teks asli
  no_hp          VARCHAR(20)  NULL,
  `role`         VARCHAR(30)  NOT NULL DEFAULT 'pengguna',
  status_akun    VARCHAR(20)  NOT NULL DEFAULT 'aktif',
  terakhir_aktif DATETIME     NULL,               -- diisi setiap login berhasil
  PRIMARY KEY (id_pengguna),
  UNIQUE KEY uq_pengguna_email (email),
  CONSTRAINT chk_pengguna_role   CHECK (`role` IN ('pengguna','admin')),
  CONSTRAINT chk_pengguna_status CHECK (status_akun IN ('aktif','nonaktif'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kos (
  id_kos              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_pemilik          INT UNSIGNED NOT NULL,
  id_kategori         INT UNSIGNED NULL,
  nama_kos            VARCHAR(100) NOT NULL,
  banyak_kamar        INT UNSIGNED NOT NULL DEFAULT 0,
  alamat              VARCHAR(255) NOT NULL,
  latitude            DOUBLE       NULL,           -- hasil geocoding alamat (Google Maps API)
  longitude           DOUBLE       NULL,
  deskripsi           TEXT         NULL,
  jenis_kos           VARCHAR(30)  NOT NULL,       -- putra / putri / campur
  status_verifikasi   VARCHAR(30)  NOT NULL DEFAULT 'menunggu',
  rata_rating         DOUBLE       NOT NULL DEFAULT 0,
  terakhir_diperbarui DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_kos),
  KEY idx_kos_pemilik (id_pemilik),
  KEY idx_kos_jenis (jenis_kos),
  KEY idx_kos_lokasi (latitude, longitude),
  KEY idx_kos_diperbarui (terakhir_diperbarui),
  CONSTRAINT fk_kos_pemilik  FOREIGN KEY (id_pemilik)  REFERENCES pengguna (id_pengguna)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_kos_kategori FOREIGN KEY (id_kategori) REFERENCES kategori_kos (id_kategori)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_kos_jenis      CHECK (jenis_kos IN ('putra','putri','campur')),
  CONSTRAINT chk_kos_verifikasi CHECK (status_verifikasi IN ('menunggu','terverifikasi','ditolak')),
  CONSTRAINT chk_kos_rating     CHECK (rata_rating BETWEEN 0 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS foto_kos (
  id_foto   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_kos    INT UNSIGNED NOT NULL,
  file_foto VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_foto),
  KEY idx_foto_kos (id_kos),
  CONSTRAINT fk_foto_kos FOREIGN KEY (id_kos) REFERENCES kos (id_kos)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kos_fasilitas (
  id_kos       INT UNSIGNED NOT NULL,
  id_fasilitas INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_kos, id_fasilitas),
  CONSTRAINT fk_kosfas_kos      FOREIGN KEY (id_kos)       REFERENCES kos (id_kos)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_kosfas_fasilitas FOREIGN KEY (id_fasilitas) REFERENCES fasilitas (id_fasilitas)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Harga dan ketersediaan diatur per tipe kamar (Tipe A, Tipe B, ...)
CREATE TABLE IF NOT EXISTS tipe_kamar (
  id_tipe_kamar       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  id_kos              INT UNSIGNED  NOT NULL,
  nama_tipe           VARCHAR(50)   NOT NULL,
  harga               DECIMAL(12,2) NOT NULL,      -- per bulan
  jumlah_kamar        INT UNSIGNED  NOT NULL DEFAULT 1,
  jumlah_tersedia     INT UNSIGNED  NOT NULL DEFAULT 0,
  deskripsi           TEXT          NULL,
  status_ketersediaan VARCHAR(30)   NOT NULL DEFAULT 'tersedia',   -- toggle pemilik
  PRIMARY KEY (id_tipe_kamar),
  UNIQUE KEY uq_tipe_per_kos (id_kos, nama_tipe),
  CONSTRAINT fk_tipe_kos FOREIGN KEY (id_kos) REFERENCES kos (id_kos)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_tipe_harga   CHECK (harga >= 0),
  CONSTRAINT chk_tipe_sisa    CHECK (jumlah_tersedia <= jumlah_kamar),
  CONSTRAINT chk_tipe_status  CHECK (status_ketersediaan IN ('tersedia','penuh'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS foto_kamar (
  id_foto_kamar INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tipe_kamar INT UNSIGNED NOT NULL,
  file_foto     VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_foto_kamar),
  KEY idx_fotokamar_tipe (id_tipe_kamar),
  CONSTRAINT fk_fotokamar_tipe FOREIGN KEY (id_tipe_kamar) REFERENCES tipe_kamar (id_tipe_kamar)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipe_kamar_fasilitas (
  id_tipe_kamar INT UNSIGNED NOT NULL,
  id_fasilitas  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_tipe_kamar, id_fasilitas),
  CONSTRAINT fk_tkf_tipe      FOREIGN KEY (id_tipe_kamar) REFERENCES tipe_kamar (id_tipe_kamar)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_tkf_fasilitas FOREIGN KEY (id_fasilitas)  REFERENCES fasilitas (id_fasilitas)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking (
  id_booking      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_pencari_kos  INT UNSIGNED NOT NULL,
  id_tipe_kamar   INT UNSIGNED NOT NULL,
  tanggal_booking DATE         NOT NULL DEFAULT (CURRENT_DATE),
  status_booking  VARCHAR(30)  NOT NULL DEFAULT 'menunggu',
  PRIMARY KEY (id_booking),
  KEY idx_booking_pencari (id_pencari_kos),
  KEY idx_booking_tipe (id_tipe_kamar),
  KEY idx_booking_status (status_booking),
  CONSTRAINT fk_booking_pencari FOREIGN KEY (id_pencari_kos) REFERENCES pengguna (id_pengguna)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_booking_tipe    FOREIGN KEY (id_tipe_kamar)  REFERENCES tipe_kamar (id_tipe_kamar)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_booking_status CHECK (status_booking IN ('menunggu','diterima','ditolak'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verifikasi (
  id_verifikasi      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_admin           INT UNSIGNED NOT NULL,
  id_pemilik         INT UNSIGNED NULL,
  id_kos             INT UNSIGNED NULL,
  jenis_verifikasi   VARCHAR(30)  NOT NULL,          -- pemilik / listing
  status_verifikasi  VARCHAR(30)  NOT NULL DEFAULT 'menunggu',
  catatan            TEXT         NULL,
  tanggal_verifikasi DATE         NOT NULL DEFAULT (CURRENT_DATE),
  PRIMARY KEY (id_verifikasi),
  KEY idx_verif_kos (id_kos),
  CONSTRAINT fk_verif_admin   FOREIGN KEY (id_admin)   REFERENCES pengguna (id_pengguna)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_verif_pemilik FOREIGN KEY (id_pemilik) REFERENCES pengguna (id_pengguna)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_verif_kos     FOREIGN KEY (id_kos)     REFERENCES kos (id_kos)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_verif_jenis  CHECK (jenis_verifikasi IN ('pemilik','listing')),
  CONSTRAINT chk_verif_status CHECK (status_verifikasi IN ('menunggu','terverifikasi','ditolak'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rating (
  id_rating      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_kos         INT UNSIGNED NOT NULL,
  id_pencari_kos INT UNSIGNED NOT NULL,
  nilai_rating   INT          NOT NULL,
  ulasan         TEXT         NULL,
  tanggal_rating DATE         NOT NULL DEFAULT (CURRENT_DATE),
  PRIMARY KEY (id_rating),
  KEY idx_rating_kos (id_kos),
  KEY idx_rating_pencari (id_pencari_kos),
  CONSTRAINT fk_rating_kos     FOREIGN KEY (id_kos)         REFERENCES kos (id_kos)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_rating_pencari FOREIGN KEY (id_pencari_kos) REFERENCES pengguna (id_pengguna)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_rating_nilai CHECK (nilai_rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- Notifikasi juga dipakai sebagai log aktivitas admin (jenis 'log')
CREATE TABLE IF NOT EXISTS notifikasi (
  id_notifikasi    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_penerima      INT UNSIGNED NOT NULL,
  id_booking       INT UNSIGNED NULL,               -- kosong untuk peringatan dan log
  jenis_notifikasi VARCHAR(30)  NOT NULL,
  pesan            TEXT         NOT NULL,
  sudah_dibaca     BOOLEAN      NOT NULL DEFAULT FALSE,
  waktu_kirim      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_notifikasi),
  KEY idx_notif_penerima (id_penerima, sudah_dibaca),
  CONSTRAINT fk_notif_penerima FOREIGN KEY (id_penerima) REFERENCES pengguna (id_pengguna)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notif_booking  FOREIGN KEY (id_booking)  REFERENCES booking (id_booking)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_notif_jenis CHECK (jenis_notifikasi IN
    ('booking_baru','booking_dikirim','booking_diterima','booking_ditolak','peringatan','listing_dihapus','log'))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. DATA AWAL (master)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO kategori_kos (nama_kategori) VALUES ('Ekonomis'), ('Standar'), ('Premium');

INSERT IGNORE INTO fasilitas (nama_fasilitas) VALUES
  ('WiFi'), ('AC'), ('Kamar Mandi Dalam'), ('Dapur Bersama'), ('Parkir Mobil'), ('Water Heater');

-- Akun admin awal. GANTI hash ini dengan hash password dari aplikasi Anda.
INSERT IGNORE INTO pengguna (id_pengguna, nama, email, password, no_hp, `role`)
VALUES (1, 'Admin KeKos', 'admin@kekos.local', '$2b$10$GANTI_DENGAN_HASH_BCRYPT_DARI_APLIKASI', NULL, 'admin');

-- ---------------------------------------------------------------------
-- 3. VIEW (untuk halaman pencarian, detail kos, dan dashboard admin)
-- ---------------------------------------------------------------------

-- Kartu kos di halaman pencarian dan preview halaman login
CREATE OR REPLACE VIEW v_kos_kartu AS
SELECT k.id_kos, k.nama_kos, k.alamat, k.latitude, k.longitude, k.jenis_kos, k.rata_rating,
       (SELECT COUNT(*) FROM rating r WHERE r.id_kos = k.id_kos)            AS jumlah_ulasan,
       MIN(t.harga)                                                         AS harga_mulai_dari,
       COALESCE(SUM(t.jumlah_tersedia), 0)                                  AS sisa_kamar,
       (SELECT f.file_foto FROM foto_kos f WHERE f.id_kos = k.id_kos
         ORDER BY f.id_foto LIMIT 1)                                        AS foto_utama,
       (SELECT GROUP_CONCAT(fs.nama_fasilitas ORDER BY fs.nama_fasilitas SEPARATOR ', ')
          FROM kos_fasilitas kf JOIN fasilitas fs ON fs.id_fasilitas = kf.id_fasilitas
         WHERE kf.id_kos = k.id_kos)                                        AS fasilitas_kos
FROM kos k
LEFT JOIN tipe_kamar t ON t.id_kos = k.id_kos
WHERE k.status_verifikasi = 'terverifikasi'
GROUP BY k.id_kos;

-- Sebaran bintang untuk halaman detail kos
CREATE OR REPLACE VIEW v_sebaran_rating AS
SELECT id_kos, nilai_rating AS bintang, COUNT(*) AS jumlah
FROM rating GROUP BY id_kos, nilai_rating;

-- Daftar ulasan beserta nama pengulas
CREATE OR REPLACE VIEW v_ulasan_kos AS
SELECT r.id_rating, r.id_kos, p.nama AS nama_pengulas, r.nilai_rating, r.ulasan, r.tanggal_rating
FROM rating r JOIN pengguna p ON p.id_pengguna = r.id_pencari_kos;

-- Monitoring inaktivitas pemilik: kos yang tidak diperbarui >= 2 bulan
--   2 bulan -> perlu_peringatan, >= 3 bulan -> rekomendasi_hapus
CREATE OR REPLACE VIEW v_kos_tidak_diperbarui AS
SELECT k.id_kos, k.nama_kos, k.id_pemilik, p.nama AS nama_pemilik, k.alamat, k.terakhir_diperbarui,
       TIMESTAMPDIFF(MONTH, k.terakhir_diperbarui, NOW()) AS bulan_tidak_diperbarui,
       CASE WHEN TIMESTAMPDIFF(MONTH, k.terakhir_diperbarui, NOW()) >= 3
            THEN 'rekomendasi_hapus' ELSE 'perlu_peringatan' END AS status_tindakan
FROM kos k JOIN pengguna p ON p.id_pengguna = k.id_pemilik
WHERE TIMESTAMPDIFF(MONTH, k.terakhir_diperbarui, NOW()) >= 2;

-- Inaktivitas akun pencari kos: lama tidak login (NULL = belum pernah login)
CREATE OR REPLACE VIEW v_akun_tidak_login AS
SELECT id_pengguna, nama, email, status_akun, terakhir_aktif,
       TIMESTAMPDIFF(MONTH, terakhir_aktif, NOW()) AS bulan_tidak_login
FROM pengguna
WHERE `role` = 'pengguna' AND status_akun = 'aktif';

-- ---------------------------------------------------------------------
-- 4. PROSEDUR DAN TRIGGER (mengikuti alur sequence diagram)
-- ---------------------------------------------------------------------
DELIMITER $$

-- SD-2 Login: catat login berhasil
DROP PROCEDURE IF EXISTS sp_catat_login$$
CREATE PROCEDURE sp_catat_login(IN p_id_pengguna INT UNSIGNED)
BEGIN
  UPDATE pengguna SET terakhir_aktif = NOW() WHERE id_pengguna = p_id_pengguna;
END$$

-- SD-9 dan SD-10: dipanggil aplikasi saat pemilik mengubah info kos,
-- menambah tipe kamar, mengubah harga, atau mengubah ketersediaan
DROP PROCEDURE IF EXISTS sp_perbarui_terakhir_diperbarui$$
CREATE PROCEDURE sp_perbarui_terakhir_diperbarui(IN p_id_kos INT UNSIGNED)
BEGIN
  UPDATE kos SET terakhir_diperbarui = NOW() WHERE id_kos = p_id_kos;
END$$

-- SD-7 Rating: hitung ulang rata-rata rating kos
DROP PROCEDURE IF EXISTS sp_update_rata_rating$$
CREATE PROCEDURE sp_update_rata_rating(IN p_id_kos INT UNSIGNED)
BEGIN
  UPDATE kos
     SET rata_rating = COALESCE((SELECT ROUND(AVG(nilai_rating), 1) FROM rating WHERE id_kos = p_id_kos), 0)
   WHERE id_kos = p_id_kos;
END$$

DROP TRIGGER IF EXISTS trg_rating_ai$$
CREATE TRIGGER trg_rating_ai AFTER INSERT ON rating
FOR EACH ROW CALL sp_update_rata_rating(NEW.id_kos)$$

DROP TRIGGER IF EXISTS trg_rating_au$$
CREATE TRIGGER trg_rating_au AFTER UPDATE ON rating
FOR EACH ROW CALL sp_update_rata_rating(NEW.id_kos)$$

DROP TRIGGER IF EXISTS trg_rating_ad$$
CREATE TRIGGER trg_rating_ad AFTER DELETE ON rating
FOR EACH ROW CALL sp_update_rata_rating(OLD.id_kos)$$

-- SD-6 Verifikasi Booking (Proses Booking) + SD-12 Notifikasi
DROP PROCEDURE IF EXISTS sp_buat_booking$$
CREATE PROCEDURE sp_buat_booking(IN p_id_pencari INT UNSIGNED, IN p_id_tipe INT UNSIGNED,
                                 OUT p_id_booking INT UNSIGNED)
BEGIN
  DECLARE v_id_kos   INT UNSIGNED;
  DECLARE v_tersedia INT UNSIGNED;
  DECLARE v_status   VARCHAR(30);
  DECLARE v_nama_kos VARCHAR(100);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT t.id_kos, t.jumlah_tersedia, t.status_ketersediaan
    INTO v_id_kos, v_tersedia, v_status
    FROM tipe_kamar t WHERE t.id_tipe_kamar = p_id_tipe FOR UPDATE;

  IF v_id_kos IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tipe kamar tidak ditemukan';
  END IF;
  IF v_tersedia = 0 OR v_status <> 'tersedia' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kamar tidak tersedia';
  END IF;
  IF EXISTS (SELECT 1 FROM booking b JOIN tipe_kamar tk ON tk.id_tipe_kamar = b.id_tipe_kamar
              WHERE b.id_pencari_kos = p_id_pencari AND tk.id_kos = v_id_kos
                AND b.status_booking IN ('menunggu','diterima')) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kos ini sudah dibooking (Telah Terbooking)';
  END IF;

  INSERT INTO booking (id_pencari_kos, id_tipe_kamar) VALUES (p_id_pencari, p_id_tipe);
  SET p_id_booking = LAST_INSERT_ID();
  SELECT nama_kos INTO v_nama_kos FROM kos WHERE id_kos = v_id_kos;

  -- notifikasi ke pemilik, semua admin aktif, dan pencari kos
  INSERT INTO notifikasi (id_penerima, id_booking, jenis_notifikasi, pesan)
    SELECT id_pemilik, p_id_booking, 'booking_baru', CONCAT('Booking baru masuk untuk ', v_nama_kos)
      FROM kos WHERE id_kos = v_id_kos;
  INSERT INTO notifikasi (id_penerima, id_booking, jenis_notifikasi, pesan)
    SELECT id_pengguna, p_id_booking, 'booking_baru', CONCAT('Booking baru masuk untuk ', v_nama_kos)
      FROM pengguna WHERE `role` = 'admin' AND status_akun = 'aktif';
  INSERT INTO notifikasi (id_penerima, id_booking, jenis_notifikasi, pesan)
    VALUES (p_id_pencari, p_id_booking, 'booking_dikirim', 'Booking berhasil dikirim');
  COMMIT;
END$$

-- SD-11 Menerima Booking: status diterima + kurangi ketersediaan tipe kamar
DROP PROCEDURE IF EXISTS sp_terima_booking$$
CREATE PROCEDURE sp_terima_booking(IN p_id_booking INT UNSIGNED)
BEGIN
  DECLARE v_status  VARCHAR(30);
  DECLARE v_tipe    INT UNSIGNED;
  DECLARE v_pencari INT UNSIGNED;
  DECLARE v_sisa    INT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT status_booking, id_tipe_kamar, id_pencari_kos INTO v_status, v_tipe, v_pencari
    FROM booking WHERE id_booking = p_id_booking FOR UPDATE;
  IF v_tipe IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking tidak ditemukan';
  END IF;
  IF v_status <> 'menunggu' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking sudah diproses';
  END IF;
  SELECT jumlah_tersedia INTO v_sisa FROM tipe_kamar WHERE id_tipe_kamar = v_tipe FOR UPDATE;
  IF v_sisa = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Kamar tidak tersedia';
  END IF;

  UPDATE booking SET status_booking = 'diterima' WHERE id_booking = p_id_booking;
  -- MySQL mengevaluasi SET dari kiri ke kanan, jadi IF() melihat nilai yang sudah dikurangi
  UPDATE tipe_kamar
     SET jumlah_tersedia = jumlah_tersedia - 1,
         status_ketersediaan = IF(jumlah_tersedia = 0, 'penuh', status_ketersediaan)
   WHERE id_tipe_kamar = v_tipe;
  INSERT INTO notifikasi (id_penerima, id_booking, jenis_notifikasi, pesan)
    VALUES (v_pencari, p_id_booking, 'booking_diterima', 'Booking diterima oleh pemilik kos');
  COMMIT;
END$$

-- SD-11 Menolak Booking
DROP PROCEDURE IF EXISTS sp_tolak_booking$$
CREATE PROCEDURE sp_tolak_booking(IN p_id_booking INT UNSIGNED)
BEGIN
  DECLARE v_status  VARCHAR(30);
  DECLARE v_pencari INT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT status_booking, id_pencari_kos INTO v_status, v_pencari
    FROM booking WHERE id_booking = p_id_booking FOR UPDATE;
  IF v_pencari IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking tidak ditemukan';
  END IF;
  IF v_status <> 'menunggu' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking sudah diproses';
  END IF;
  UPDATE booking SET status_booking = 'ditolak' WHERE id_booking = p_id_booking;
  INSERT INTO notifikasi (id_penerima, id_booking, jenis_notifikasi, pesan)
    VALUES (v_pencari, p_id_booking, 'booking_ditolak', 'Booking ditolak oleh pemilik kos');
  COMMIT;
END$$

-- SD-15 Peringatan kos tidak diperbarui (bulan ke-2)
DROP PROCEDURE IF EXISTS sp_kirim_peringatan$$
CREATE PROCEDURE sp_kirim_peringatan(IN p_id_kos INT UNSIGNED, IN p_id_admin INT UNSIGNED)
BEGIN
  DECLARE v_pemilik INT UNSIGNED;
  DECLARE v_nama    VARCHAR(100);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT id_pemilik, nama_kos INTO v_pemilik, v_nama FROM kos WHERE id_kos = p_id_kos;
  IF v_pemilik IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Listing tidak ditemukan';
  END IF;
  INSERT INTO notifikasi (id_penerima, jenis_notifikasi, pesan)
    VALUES (v_pemilik, 'peringatan',
            CONCAT('PERINGATAN KOS TERBENGKALAI! Segera perbarui ', v_nama, ' sebelum listing dihapus.'));
  INSERT INTO notifikasi (id_penerima, jenis_notifikasi, pesan)
    VALUES (p_id_admin, 'log', CONCAT('Peringatan terkirim untuk ', v_nama));
  COMMIT;
END$$

-- SD-15 Hapus listing (bulan ke-3). Tipe kamar, foto, fasilitas, rating,
-- dan booking milik listing ikut terhapus (ON DELETE CASCADE).
DROP PROCEDURE IF EXISTS sp_hapus_listing$$
CREATE PROCEDURE sp_hapus_listing(IN p_id_kos INT UNSIGNED, IN p_id_admin INT UNSIGNED)
BEGIN
  DECLARE v_pemilik INT UNSIGNED;
  DECLARE v_nama    VARCHAR(100);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
  SELECT id_pemilik, nama_kos INTO v_pemilik, v_nama FROM kos WHERE id_kos = p_id_kos;
  IF v_pemilik IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Listing tidak ditemukan';
  END IF;
  INSERT INTO notifikasi (id_penerima, jenis_notifikasi, pesan)
    VALUES (v_pemilik, 'listing_dihapus', CONCAT('Listing ', v_nama, ' telah dihapus karena tidak diperbarui'));
  INSERT INTO notifikasi (id_penerima, jenis_notifikasi, pesan)
    VALUES (p_id_admin, 'log', CONCAT('Listing ', v_nama, ' dihapus. Notifikasi sudah dikirim ke pemilik'));
  DELETE FROM kos WHERE id_kos = p_id_kos;
  COMMIT;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- 5. DATA CONTOH (untuk uji coba, hapus bagian ini sebelum dipakai sungguhan)
--    Koordinat adalah perkiraan, nomor HP dan password hanya contoh.
-- ---------------------------------------------------------------------
INSERT INTO pengguna (id_pengguna, nama, email, password, no_hp, `role`, terakhir_aktif) VALUES
  (2, 'Budi Santoso', 'budi@contoh.local',  '$2b$10$GANTI_DENGAN_HASH_BCRYPT_DARI_APLIKASI', '081200000001', 'pengguna', NOW()),
  (3, 'Siti Rahma',   'siti@contoh.local',  '$2b$10$GANTI_DENGAN_HASH_BCRYPT_DARI_APLIKASI', '081200000002', 'pengguna', NOW());

INSERT INTO kos (id_kos, id_pemilik, id_kategori, nama_kos, banyak_kamar, alamat, latitude, longitude,
                 deskripsi, jenis_kos, status_verifikasi) VALUES
  (1, 2, 1, 'Kos Campur Ekonomis', 13, 'Ketintang Tim. PTT IV No.27, Ketintang, Kec. Gayungan, Surabaya, Jawa Timur 60231',
   -7.3126, 112.7257, 'Dekat kampus, nyaman dan sesuai budget.', 'campur', 'terverifikasi'),
  (2, 2, 3, 'Cozy kos', 16, 'Ketintang, Surabaya',
   -7.3140, 112.7270, 'Sangat strategis untuk mencari makan dan dekat kampus.', 'putri', 'terverifikasi');

INSERT INTO foto_kos (id_kos, file_foto) VALUES (1, 'kos1_foto1.jpg'), (1, 'kos1_foto2.jpg'), (2, 'kos2_foto1.jpg');
INSERT INTO kos_fasilitas (id_kos, id_fasilitas)
  SELECT 1, id_fasilitas FROM fasilitas WHERE nama_fasilitas IN ('WiFi','AC');
INSERT INTO kos_fasilitas (id_kos, id_fasilitas)
  SELECT 2, id_fasilitas FROM fasilitas WHERE nama_fasilitas IN ('WiFi','AC','Dapur Bersama');

INSERT INTO tipe_kamar (id_tipe_kamar, id_kos, nama_tipe, harga, jumlah_kamar, jumlah_tersedia, deskripsi) VALUES
  (1, 1, 'Standar', 500000,  3, 3, 'Kamar standar untuk mahasiswa.'),
  (2, 2, 'Tipe A',  1800000, 2, 2, 'Pemandangan indah kota langsung dari jendela kamar Anda.'),
  (3, 2, 'Tipe B',  1400000, 2, 1, 'Pemandangan indah kota langsung dari jendela kamar Anda.');
INSERT INTO tipe_kamar_fasilitas (id_tipe_kamar, id_fasilitas)
  SELECT t.id_tipe_kamar, f.id_fasilitas FROM tipe_kamar t JOIN fasilitas f
   WHERE f.nama_fasilitas IN ('WiFi','Kamar Mandi Dalam','AC');

-- Rating contoh: trigger otomatis memperbarui kos.rata_rating
INSERT INTO rating (id_kos, id_pencari_kos, nilai_rating, ulasan)
VALUES (1, 3, 5, 'Kosnya bersih dan pemiliknya ramah.');
