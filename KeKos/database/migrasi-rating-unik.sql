-- Migrasi untuk database KeKos yang SUDAH ADA (jalankan sekali).
-- Satu pencari hanya boleh punya satu rating per kos. Rating ganda yang sudah ada
-- dihapus, yang tersisa hanya rating terbaru (id_rating terbesar) milik tiap pencari.
-- Trigger trg_rating_ad menghitung ulang rata_rating kos setelah penghapusan.
-- Database baru cukup memakai schema.sql (index ini sudah ada di sana).
USE kekos;

DELETE r FROM rating r
JOIN rating baru
  ON baru.id_kos = r.id_kos
 AND baru.id_pencari_kos = r.id_pencari_kos
 AND baru.id_rating > r.id_rating;

ALTER TABLE rating ADD UNIQUE KEY uq_rating_pencari (id_kos, id_pencari_kos);
