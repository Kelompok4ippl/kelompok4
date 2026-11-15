import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requirePeran, sendError } from "../middleware/auth.js";
import { KOS_SELECT, TIPE_KAMAR_SELECT, toKos, toTipeKamar } from "../format.js";

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

// POST /api/kos/:id/ulasan  { rating, isi }
// Hanya pencari kos yang booking-nya sudah diterima di kos ini. Rata-rata dihitung trigger.
router.post("/:id/ulasan", requireAuth, requirePeran("pencariKos"), async (req, res) => {
  const rating = Number(req.body.rating);
  const isi = String(req.body.isi || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !isi) {
    return sendError(res, 400, "DATA_TIDAK_VALID", "Rating (1-5) dan isi ulasan wajib diisi");
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
  await pool.query(
    "INSERT INTO rating (id_kos, id_pencari_kos, nilai_rating, ulasan) VALUES (?, ?, ?, ?)",
    [req.params.id, req.user.id, rating, isi]
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
