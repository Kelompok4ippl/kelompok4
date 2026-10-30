import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { toNotifikasi } from "../format.js";

const router = Router();
router.use(requireAuth);

// GET /api/notifikasi  notifikasi milik pengguna yang login
router.get("/", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM notifikasi WHERE id_penerima = ? ORDER BY waktu_kirim DESC, id_notifikasi DESC LIMIT 50",
    [req.user.id]
  );
  res.json(rows.map(toNotifikasi));
});

// PATCH /api/notifikasi/baca  tandai semua sudah dibaca
router.patch("/baca", async (req, res) => {
  await pool.query("UPDATE notifikasi SET sudah_dibaca = TRUE WHERE id_penerima = ?", [req.user.id]);
  res.json({ ok: true });
});

export default router;
