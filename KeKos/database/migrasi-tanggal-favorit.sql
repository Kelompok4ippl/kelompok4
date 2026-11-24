-- Migrasi untuk database KeKos yang SUDAH ADA (jalankan sekali).
-- Menambah tanggal masuk & durasi sewa pada booking, dan tabel favorit (tombol "Simpan").
-- Database baru cukup memakai schema.sql (kolom & tabel ini sudah ada di sana).
USE kekos;


ALTER TABLE booking
  ADD COLUMN tanggal_masuk DATE NULL AFTER status_booking,
  ADD COLUMN durasi_sewa TINYINT UNSIGNED NULL AFTER tanggal_masuk,
  ADD CONSTRAINT chk_booking_durasi CHECK (durasi_sewa IS NULL OR durasi_sewa BETWEEN 1 AND 12);

-- Kos yang disimpan (favorit) oleh pencari kos
CREATE TABLE IF NOT EXISTS favorit (
  id_pencari_kos INT UNSIGNED NOT NULL,
  id_kos         INT UNSIGNED NOT NULL,
  waktu_simpan   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pencari_kos, id_kos),
  KEY idx_favorit_kos (id_kos),
  CONSTRAINT fk_favorit_pencari FOREIGN KEY (id_pencari_kos) REFERENCES pengguna (id_pengguna)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_favorit_kos     FOREIGN KEY (id_kos)         REFERENCES kos (id_kos)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
