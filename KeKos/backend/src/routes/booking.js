import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, requirePeran, sendError } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requirePeran("pencariKos"));

// Pesan SIGNAL dari prosedur → kode & status HTTP
const ERROR_PROSEDUR = {
  "Kamar tidak tersedia": ["KAMAR_PENUH", 409],
  "Kos ini sudah dibooking (Telah Terbooking)": ["SUDAH_BOOKING", 409],
  "Tipe kamar tidak ditemukan": ["TIDAK_DITEMUKAN", 404],
};

// GET /api/booking?kos_id=4  booking milik pencari yang sedang login
router.get("/", async (req, res) => {
  const params = [req.user.id];
  let sql = `SELECT b.*, t.id_kos, p.no_hp AS pemilik_hp
             FROM booking b
             JOIN tipe_kamar t ON t.id_tipe_kamar = b.id_tipe_kamar
             JOIN kos k ON k.id_kos = t.id_kos
             JOIN pengguna p ON p.id_pengguna = k.id_pemilik
             WHERE b.id_pencari_kos = ?`;
  if (req.query.kos_id) {
    sql += " AND t.id_kos = ?";
    params.push(req.query.kos_id);
  }
  const [rows] = await pool.query(`${sql} ORDER BY b.id_booking DESC`, params);
  res.json(rows.map((b) => ({
    id: b.id_booking,
    kosId: b.id_kos,
    roomId: b.id_tipe_kamar,
    status: b.status_booking,
    // Nomor WhatsApp pemilik baru dibuka setelah booking diterima (pembayaran lewat WhatsApp)
    ownerPhone: b.status_booking === "diterima" ? b.pemilik_hp : null,
    createdAt: b.tanggal_booking,
  })));
});

// POST /api/booking  { kamar_id }  (kamar_id = id_tipe_kamar)
// Booking hanya lewat sp_buat_booking: prosedur itu mengunci baris dan mencegah booking ganda.
router.post("/", async (req, res) => {
  const idTipe = Number(req.body.kamar_id ?? req.body.id_tipe_kamar);
  if (!Number.isInteger(idTipe)) return sendError(res, 400, "DATA_TIDAK_VALID", "Pilih tipe kamar dulu");

  const [rows] = await pool.query(
    `SELECT k.id_pemilik, k.status_verifikasi FROM tipe_kamar t JOIN kos k ON k.id_kos = t.id_kos
     WHERE t.id_tipe_kamar = ?`,
    [idTipe]
  );
  if (!rows[0]) return sendError(res, 404, "TIDAK_DITEMUKAN", "Tipe kamar tidak ditemukan");
  if (rows[0].status_verifikasi !== "terverifikasi") {
    return sendError(res, 409, "KOS_BELUM_TERVERIFIKASI", "Kos belum terverifikasi");
  }
  if (rows[0].id_pemilik === req.user.id) {
    return sendError(res, 403, "BOOKING_KOS_SENDIRI", "Tidak dapat booking kos milik sendiri");
  }

  // OUT parameter prosedur hanya bisa dibaca di koneksi yang sama
  const conn = await pool.getConnection();
  try {
    await conn.query("CALL sp_buat_booking(?, ?, @id_booking)", [req.user.id, idTipe]);
    const [[out]] = await conn.query("SELECT @id_booking AS id");
    res.status(201).json({ id: out.id, status: "menunggu" });
  } catch (err) {
    const mapped = ERROR_PROSEDUR[err.sqlMessage];
    if (!mapped) throw err;
    sendError(res, mapped[1], mapped[0], err.sqlMessage);
  } finally {
    conn.release();
  }
});

export default router;
