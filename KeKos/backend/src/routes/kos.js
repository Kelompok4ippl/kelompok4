import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requirePeran, sendError } from "../middleware/auth.js";
import { KOS_SELECT, TIPE_KAMAR_SELECT, jarakMeter, toKos, toTipeKamar } from "../format.js";
import { skorFuzzy } from "../fuzzy.js";

const router = Router();

// GET /api/kos?tipe=putra&min=500000&max=3000000&fasilitas=AC,WiFi&q=ketintang
// Pencari kos hanya melihat kos yang sudah terverifikasi
router.get("/", async (req, res) => {
  const { tipe, min, max, fasilitas, q } = req.query;
  const where = ["k.status_verifikasi = 'terverifikasi'"];
  const params = [];
  if (["putra", "putri", "campur"].includes(tipe)) {
    where.push("k.jenis_kos = ?");
    params.push(tipe);
  }
  if (q) {
    where.push("(k.nama_kos LIKE ? OR k.alamat LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  // Setiap fasilitas yang dipilih harus dimiliki kos
  for (const f of String(fasilitas || "").split(",").map((s) => s.trim()).filter(Boolean)) {
    where.push(`EXISTS (SELECT 1 FROM kos_fasilitas kf JOIN fasilitas fs ON fs.id_fasilitas = kf.id_fasilitas
                        WHERE kf.id_kos = k.id_kos AND fs.nama_fasilitas = ?)`);
    params.push(f);
  }
  const having = [];
  if (min) { having.push("(harga_min IS NULL OR harga_min >= ?)"); params.push(Number(min)); }
  if (max) { having.push("(harga_min IS NULL OR harga_min <= ?)"); params.push(Number(max)); }

  const sql = `${KOS_SELECT} WHERE ${where.join(" AND ")}${having.length ? ` HAVING ${having.join(" AND ")}` : ""} ORDER BY k.id_kos`;
  const [rows] = await pool.query(sql, params);
  res.json(rows.map(toKos));
});

// GET /api/kos/rekomendasi?lat=-7.31&lng=112.72  (FR-08)
// Dengan lokasi: skor fuzzy Sugeno dari jarak ke pengguna dan rating (lihat fuzzy.js).
// Tanpa lokasi (izin ditolak): urut berdasarkan rating saja.
router.get("/rekomendasi", async (req, res) => {
  const adaLokasi = req.query.lat !== undefined || req.query.lng !== undefined;
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (adaLokasi && !(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) {
    return sendError(res, 400, "LOKASI_TIDAK_VALID", "Koordinat lokasi tidak valid");
  }
  const [rows] = await pool.query(`${KOS_SELECT} WHERE k.status_verifikasi = 'terverifikasi'`);
  const hasil = rows.map(toKos).map((kos) => {
    if (!adaLokasi || kos.lat == null) return { ...kos, distanceKm: null, score: null };
    const km = jarakMeter({ lat, lng }, kos) / 1000;
    return { ...kos, distanceKm: Math.round(km * 100) / 100, score: skorFuzzy(km, kos.rating) };
  });
  // Kos tanpa koordinat (score null) di urutan bawah
  hasil.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.rating - a.rating || b.reviews - a.reviews);
  res.json(hasil.slice(0, 8));
});

// ---------- Favorit ("Simpan") pencari kos ----------
// GET /api/kos/favorit  kos terverifikasi yang disimpan pencari yang sedang login (terbaru dulu)
router.get("/favorit", requireAuth, requirePeran("pencariKos"), async (req, res) => {
  const [rows] = await pool.query(
    `${KOS_SELECT} JOIN favorit fv ON fv.id_kos = k.id_kos AND fv.id_pencari_kos = ?
     WHERE k.status_verifikasi = 'terverifikasi' ORDER BY fv.waktu_simpan DESC`,
    [req.user.id]
  );
  res.json(rows.map(toKos));
});

// POST /api/kos/:id/favorit  simpan kos (mengulang tidak membuat data ganda)
router.post("/:id/favorit", requireAuth, requirePeran("pencariKos"), async (req, res) => {
  const [kos] = await pool.query("SELECT id_kos FROM kos WHERE id_kos = ? AND status_verifikasi = 'terverifikasi'", [req.params.id]);
  if (!kos[0]) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");
  await pool.query("INSERT IGNORE INTO favorit (id_pencari_kos, id_kos) VALUES (?, ?)", [req.user.id, req.params.id]);
  res.status(201).json({ saved: true });
});

// DELETE /api/kos/:id/favorit  hapus dari simpanan
router.delete("/:id/favorit", requireAuth, requirePeran("pencariKos"), async (req, res) => {
  await pool.query("DELETE FROM favorit WHERE id_pencari_kos = ? AND id_kos = ?", [req.user.id, req.params.id]);
  res.json({ saved: false });
});

// GET /api/kos/:id  detail kos + tipe kamar + ulasan
router.get("/:id", async (req, res) => {
  const [rows] = await pool.query(`${KOS_SELECT} WHERE k.id_kos = ? AND k.status_verifikasi = 'terverifikasi'`, [req.params.id]);
  if (!rows[0]) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");

  const [tipe] = await pool.query(`${TIPE_KAMAR_SELECT} WHERE t.id_kos = ? ORDER BY t.nama_tipe`, [req.params.id]);
  const [ulasan] = await pool.query(
    "SELECT * FROM v_ulasan_kos WHERE id_kos = ? ORDER BY tanggal_rating DESC, id_rating DESC",
    [req.params.id]
  );
  const [penulis] = await pool.query("SELECT id_rating, id_pencari_kos FROM rating WHERE id_kos = ?", [req.params.id]);
  const penulisOf = Object.fromEntries(penulis.map((r) => [r.id_rating, r.id_pencari_kos]));
  const distribusi = [5, 4, 3, 2, 1].map((bintang) => ({
    stars: bintang,
    count: ulasan.filter((u) => u.nilai_rating === bintang).length,
  }));

  res.json({
    ...toKos(rows[0]),
    rooms: tipe.map(toTipeKamar),
    ratingDistribution: distribusi,
    reviewList: ulasan.map((u) => ({
      id: u.id_rating,
      userId: penulisOf[u.id_rating],
      name: u.nama_pengulas,
      rating: u.nilai_rating,
      text: u.ulasan || "",
      helpful: 0,
      createdAt: u.tanggal_rating,
    })),
  });
});

// POST /api/kos/:id/ulasan  { rating, isi? }  rating wajib, isi ulasan opsional (FR-07)
// Hanya pencari kos yang booking-nya sudah diterima di kos ini. Rata-rata dihitung trigger.
router.post("/:id/ulasan", requireAuth, requirePeran("pencariKos"), async (req, res) => {
  const rating = Number(req.body.rating);
  const isi = String(req.body.isi || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return sendError(res, 400, "DATA_TIDAK_VALID", "Pilih rating 1 sampai 5");
  }
  const [kos] = await pool.query("SELECT id_kos FROM kos WHERE id_kos = ? AND status_verifikasi = 'terverifikasi'", [req.params.id]);
  if (!kos[0]) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");
  const [penyewa] = await pool.query(
    `SELECT 1 FROM booking b JOIN tipe_kamar t ON t.id_tipe_kamar = b.id_tipe_kamar
     WHERE b.id_pencari_kos = ? AND t.id_kos = ? AND b.status_booking = 'diterima' LIMIT 1`,
    [req.user.id, req.params.id]
  );
  if (!penyewa.length) {
    return sendError(res, 403, "BUKAN_PENYEWA", "Hanya penyewa yang dapat memberi rating");
  }
  // Satu rating per pencari per kos (uq_rating_pencari): kirim ulang = ganti rating lama
  await pool.query(
    `INSERT INTO rating (id_kos, id_pencari_kos, nilai_rating, ulasan) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nilai_rating = ?, ulasan = ?, tanggal_rating = CURRENT_DATE`,
    [req.params.id, req.user.id, rating, isi || null, rating, isi || null]
  );
  res.status(201).json({ ok: true });
});

// DELETE /api/kos/:id/ulasan/:ulasanId  (hanya penulis ulasan itu sendiri)
router.delete("/:id/ulasan/:ulasanId", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT id_pencari_kos FROM rating WHERE id_rating = ? AND id_kos = ?", [req.params.ulasanId, req.params.id]);
  if (!rows[0]) return sendError(res, 404, "TIDAK_DITEMUKAN", "Ulasan tidak ditemukan");
  if (rows[0].id_pencari_kos !== req.user.id) {
    return sendError(res, 403, "BUKAN_PENULIS", "Kamu hanya bisa menghapus ulasanmu sendiri");
  }
  await pool.query("DELETE FROM rating WHERE id_rating = ?", [req.params.ulasanId]);
  res.json({ ok: true });
});

export default router;
