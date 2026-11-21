import { Router } from "express";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { pool } from "../db.js";
import { requireAuth, requirePeran, sendError } from "../middleware/auth.js";
import { KOS_SELECT, toKos } from "../format.js";
import { UPLOAD_DIR } from "./pemilik.js";

// Halaman admin: verifikasi listing kos, monitoring kos tidak diperbarui, dan kelola akun pengguna.
// Setiap tindakan admin dicatat sebagai notifikasi jenis 'log' untuk admin tersebut.
const router = Router();
router.use(requireAuth, requirePeran("admin"));

const STATUS_VERIFIKASI = ["terverifikasi", "ditolak"];

async function catatLog(conn, idAdmin, pesan) {
  await conn.query("INSERT INTO notifikasi (id_penerima, jenis_notifikasi, pesan) VALUES (?, 'log', ?)", [idAdmin, pesan]);
}

async function cariKos(id) {
  const [rows] = await pool.query("SELECT id_kos, id_pemilik, nama_kos FROM kos WHERE id_kos = ?", [id]);
  return rows[0] || null;
}

// GET /api/admin/ringkasan  angka-angka untuk kartu di atas halaman admin
router.get("/ringkasan", async (req, res) => {
  const [[r]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM kos WHERE status_verifikasi = 'menunggu')       AS kos_menunggu,
      (SELECT COUNT(*) FROM kos WHERE status_verifikasi = 'terverifikasi')  AS kos_terverifikasi,
      (SELECT COUNT(*) FROM v_kos_tidak_diperbarui)                         AS kos_tidak_diperbarui,
      (SELECT COUNT(*) FROM pengguna WHERE \`role\` = 'pengguna')           AS jumlah_pengguna,
      (SELECT COUNT(*) FROM booking WHERE status_booking = 'menunggu')      AS booking_menunggu`);
  res.json({
    kosMenunggu: r.kos_menunggu,
    kosTerverifikasi: r.kos_terverifikasi,
    kosTidakDiperbarui: r.kos_tidak_diperbarui,
    jumlahPengguna: r.jumlah_pengguna,
    bookingMenunggu: r.booking_menunggu,
  });
});

// GET /api/admin/kos?status=menunggu|terverifikasi|ditolak  (tanpa status = semua)
router.get("/kos", async (req, res) => {
  const { status } = req.query;
  const [rows] = status
    ? await pool.query(`${KOS_SELECT} WHERE k.status_verifikasi = ? ORDER BY k.id_kos DESC`, [status])
    : await pool.query(`${KOS_SELECT} ORDER BY k.status_verifikasi = 'menunggu' DESC, k.id_kos DESC`);
  res.json(rows.map(toKos));
});

// PATCH /api/admin/kos/:id/verifikasi  { status: "terverifikasi" | "ditolak", catatan? }
// Hasil dicatat di tabel verifikasi; kalau ditolak, pemilik mendapat peringatan berisi catatan admin.
router.patch("/kos/:id/verifikasi", async (req, res) => {
  const { status } = req.body;
  const catatan = String(req.body.catatan || "").trim() || null;
  if (!STATUS_VERIFIKASI.includes(status)) return sendError(res, 400, "DATA_TIDAK_VALID", "Status verifikasi tidak valid");
  if (status === "ditolak" && !catatan) return sendError(res, 400, "DATA_TIDAK_VALID", "Tulis alasan penolakan");
  const kos = await cariKos(req.params.id);
  if (!kos) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE kos SET status_verifikasi = ? WHERE id_kos = ?", [status, kos.id_kos]);
    await conn.query(
      `INSERT INTO verifikasi (id_admin, id_pemilik, id_kos, jenis_verifikasi, status_verifikasi, catatan)
       VALUES (?, ?, ?, 'listing', ?, ?)`,
      [req.user.id, kos.id_pemilik, kos.id_kos, status, catatan]
    );
    if (status === "ditolak") {
      await conn.query(
        "INSERT INTO notifikasi (id_penerima, jenis_notifikasi, pesan) VALUES (?, 'peringatan', ?)",
        [kos.id_pemilik, `Listing ${kos.nama_kos} ditolak admin: ${catatan}`]
      );
    }
    await catatLog(conn, req.user.id, `${status === "ditolak" ? "Menolak" : "Memverifikasi"} listing ${kos.nama_kos}`);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  res.json({ status });
});

// GET /api/admin/monitoring  kos yang tidak diperbarui >= 2 bulan (view v_kos_tidak_diperbarui)
router.get("/monitoring", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM v_kos_tidak_diperbarui ORDER BY bulan_tidak_diperbarui DESC");
  res.json(rows.map((r) => ({
    id: r.id_kos,
    name: r.nama_kos,
    address: r.alamat,
    owner: { id: r.id_pemilik, name: r.nama_pemilik },
    updatedAt: r.terakhir_diperbarui,
    months: r.bulan_tidak_diperbarui,
    action: r.status_tindakan, // "perlu_peringatan" / "rekomendasi_hapus"
  })));
});

// POST /api/admin/kos/:id/peringatan  kirim peringatan ke pemilik supaya memperbarui listing
router.post("/kos/:id/peringatan", async (req, res) => {
  const kos = await cariKos(req.params.id);
  if (!kos) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");
  await pool.query(
    "INSERT INTO notifikasi (id_penerima, jenis_notifikasi, pesan) VALUES (?, 'peringatan', ?)",
    [kos.id_pemilik, `Listing ${kos.nama_kos} sudah lama tidak diperbarui. Perbarui info kos agar tidak dihapus admin.`]
  );
  await catatLog(pool, req.user.id, `Mengirim peringatan ke pemilik ${kos.nama_kos}`);
  res.status(201).json({ ok: true });
});

// DELETE /api/admin/kos/:id  hapus listing beserta tipe kamar, booking, ulasan, dan fotonya (cascade di database)
router.delete("/kos/:id", async (req, res) => {
  const kos = await cariKos(req.params.id);
  if (!kos) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");
  const [foto] = await pool.query("SELECT file_foto FROM foto_kos WHERE id_kos = ?", [kos.id_kos]);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM kos WHERE id_kos = ?", [kos.id_kos]);
    await conn.query(
      "INSERT INTO notifikasi (id_penerima, jenis_notifikasi, pesan) VALUES (?, 'listing_dihapus', ?)",
      [kos.id_pemilik, `Listing ${kos.nama_kos} dihapus admin karena tidak diperbarui.`]
    );
    await catatLog(conn, req.user.id, `Menghapus listing ${kos.nama_kos}`);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  // Hanya file hasil upload pemilik yang ada di disk server (lihat pemilik.js)
  for (const f of foto) {
    if (f.file_foto.startsWith("/api/uploads/")) {
      await unlink(path.join(UPLOAD_DIR, path.basename(f.file_foto))).catch(() => {});
    }
  }
  res.json({ ok: true });
});

// GET /api/admin/akun  semua akun pengguna (bukan admin), yang paling lama tidak login di atas
router.get("/akun", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT id_pengguna, nama, email, no_hp, status_akun, terakhir_aktif,
           TIMESTAMPDIFF(MONTH, terakhir_aktif, NOW()) AS bulan_tidak_login,
           (SELECT COUNT(*) FROM kos k WHERE k.id_pemilik = p.id_pengguna) AS jumlah_kos
    FROM pengguna p WHERE \`role\` = 'pengguna'
    ORDER BY terakhir_aktif IS NOT NULL, terakhir_aktif, id_pengguna`);
  res.json(rows.map((r) => ({
    id: r.id_pengguna,
    name: r.nama,
    email: r.email,
    phone: r.no_hp,
    active: r.status_akun === "aktif",
    lastActive: r.terakhir_aktif,
    monthsInactive: r.bulan_tidak_login,
    kosCount: r.jumlah_kos,
  })));
});

// PATCH /api/admin/akun/:id  { aktif: true/false }  akun admin tidak bisa diubah lewat sini
router.patch("/akun/:id", async (req, res) => {
  const status = req.body.aktif ? "aktif" : "nonaktif";
  const [rows] = await pool.query("SELECT nama FROM pengguna WHERE id_pengguna = ? AND `role` = 'pengguna'", [req.params.id]);
  if (!rows[0]) return sendError(res, 404, "TIDAK_DITEMUKAN", "Akun tidak ditemukan");
  await pool.query("UPDATE pengguna SET status_akun = ? WHERE id_pengguna = ?", [status, req.params.id]);
  await catatLog(pool, req.user.id, `${status === "aktif" ? "Mengaktifkan" : "Menonaktifkan"} akun ${rows[0].nama}`);
  res.json({ status });
});

export default router;
