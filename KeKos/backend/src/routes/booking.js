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
  // Ikut dikirim: data ringkas kos & kamar (untuk halaman Riwayat Kos) dan rating terakhir pencari di kos itu
  let sql = `SELECT b.*, t.id_kos, t.nama_tipe, t.harga, k.nama_kos, k.alamat, k.jenis_kos,
                    p.no_hp AS pemilik_hp, p.nama AS pemilik_nama,
                    (SELECT f.file_foto FROM foto_kos f WHERE f.id_kos = k.id_kos ORDER BY f.id_foto LIMIT 1) AS foto,
                    (SELECT r.nilai_rating FROM rating r WHERE r.id_kos = k.id_kos AND r.id_pencari_kos = b.id_pencari_kos
                     ORDER BY r.id_rating DESC LIMIT 1) AS rating_saya
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
    kosName: b.nama_kos,
    address: b.alamat,
    kosType: b.jenis_kos,
    roomType: b.nama_tipe,
    price: Number(b.harga),
    image: b.foto || null,
    ownerName: b.pemilik_nama,
    myRating: b.rating_saya == null ? null : Number(b.rating_saya),
    moveInDate: b.tanggal_masuk,
    duration: b.durasi_sewa,
  })));
});

// POST /api/booking  { kamar_id }  (kamar_id = id_tipe_kamar)
// Booking hanya lewat sp_buat_booking: prosedur itu mengunci baris dan mencegah booking ganda.
router.post("/", async (req, res) => {
  const idTipe = Number(req.body.kamar_id ?? req.body.id_tipe_kamar);
  if (!Number.isInteger(idTipe)) return sendError(res, 400, "DATA_TIDAK_VALID", "Pilih tipe kamar dulu");

  // Tanggal masuk (YYYY-MM-DD, mulai hari ini sampai 6 bulan ke depan) dan durasi sewa 1-12 bulan
  const tanggalMasuk = String(req.body.tanggal_masuk || "");
  const durasi = Number(req.body.durasi_bulan);
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  const batas = new Date(hariIni);
  batas.setMonth(batas.getMonth() + 6);
  const masuk = /^\d{4}-\d{2}-\d{2}$/.test(tanggalMasuk) ? new Date(`${tanggalMasuk}T00:00:00`) : null;
  if (!masuk || Number.isNaN(masuk.getTime()) || masuk < hariIni || masuk > batas) {
    return sendError(res, 400, "TANGGAL_TIDAK_VALID", "Pilih tanggal masuk antara hari ini dan 6 bulan ke depan");
  }
  if (!Number.isInteger(durasi) || durasi < 1 || durasi > 12) {
    return sendError(res, 400, "DURASI_TIDAK_VALID", "Pilih durasi sewa 1 sampai 12 bulan");
  }

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
    // Prosedur tetap satu-satunya jalur membuat booking; rencana tanggal masuk & durasi dilengkapi setelahnya
    await conn.query(
      "UPDATE booking SET tanggal_masuk = ?, durasi_sewa = ? WHERE id_booking = ? AND id_pencari_kos = ?",
      [tanggalMasuk, durasi, out.id, req.user.id]
    );
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
