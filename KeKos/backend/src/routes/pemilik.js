import express, { Router } from "express";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";
import { requireAuth, requirePeran, sendError } from "../middleware/auth.js";
import { KOS_SELECT, TIPE_KAMAR_SELECT, toKos, toTipeKamar } from "../format.js";

// Halaman pemilik kos: kelola kos, tipe kamar, dan verifikasi booking masuk.
// Semua data dibatasi ke kos milik pemilik yang sedang login.
const router = Router();
router.use(requireAuth, requirePeran("pemilikKos"));

const JENIS = ["putra", "putri", "campur"];

// Foto kos disimpan di backend/uploads dan disajikan server.js di /api/uploads
export const UPLOAD_DIR = fileURLToPath(new URL("../../uploads", import.meta.url));
const UPLOAD_URL = "/api/uploads/";
const MAKS_FOTO = 10;

// Jenis gambar dikenali dari isi file (bukan nama/header yang bisa dipalsukan)
function jenisGambar(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

// Jalankan fn(conn) dalam satu transaksi
async function withTx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Ganti isi tabel penghubung fasilitas (kos_fasilitas / tipe_kamar_fasilitas) dengan daftar nama baru
async function setFasilitas(conn, table, column, id, names) {
  await conn.query(`DELETE FROM ${table} WHERE ${column} = ?`, [id]);
  if (names.length) {
    await conn.query(
      `INSERT INTO ${table} (${column}, id_fasilitas) SELECT ?, id_fasilitas FROM fasilitas WHERE nama_fasilitas IN (?)`,
      [id, names]
    );
  }
}

const fasilitasDari = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
const angka = (v) => (v === "" || v == null ? NaN : Number(v));

function bacaKos(body) {
  const data = {
    nama: String(body.nama || "").trim(),
    jenis: body.jenis,
    banyakKamar: angka(body.banyakKamar),
    alamat: String(body.alamat || "").trim(),
    deskripsi: String(body.deskripsi || "").trim() || null,
    fasilitas: fasilitasDari(body.fasilitas),
  };
  if (!data.nama || !data.alamat) return { error: "Nama kos dan alamat wajib diisi" };
  if (!JENIS.includes(data.jenis)) return { error: "Pilih tipe kos: putra, putri, atau campur" };
  if (!Number.isInteger(data.banyakKamar) || data.banyakKamar < 1) return { error: "Banyak kamar minimal 1" };
  return { data };
}

function bacaKamar(body) {
  const data = {
    tipe: String(body.tipe || "").trim(),
    harga: angka(body.harga),
    jumlahKamar: angka(body.jumlahKamar),
    deskripsi: String(body.deskripsi || "").trim() || null,
    fasilitas: fasilitasDari(body.fasilitas),
  };
  if (!data.tipe) return { error: "Nama tipe kamar wajib diisi" };
  if (!Number.isFinite(data.harga) || data.harga <= 0) return { error: "Harga kamar harus lebih dari 0" };
  if (!Number.isInteger(data.jumlahKamar) || data.jumlahKamar < 1) return { error: "Jumlah kamar minimal 1" };
  return { data };
}

// Kos milik pemilik ini, atau null
async function kosMilik(req, idKos) {
  const [rows] = await pool.query("SELECT id_kos FROM kos WHERE id_kos = ? AND id_pemilik = ?", [idKos, req.user.id]);
  return rows[0] || null;
}

// Tipe kamar di kos milik pemilik ini, atau null
async function kamarMilik(req, idTipe) {
  const [rows] = await pool.query(
    `SELECT t.* FROM tipe_kamar t JOIN kos k ON k.id_kos = t.id_kos
     WHERE t.id_tipe_kamar = ? AND k.id_pemilik = ?`,
    [idTipe, req.user.id]
  );
  return rows[0] || null;
}

// Nama tipe kamar unik per kos (uq_tipe_per_kos)
function errorDuplikat(res, err) {
  if (err.code !== "ER_DUP_ENTRY") throw err;
  sendError(res, 409, "TIPE_SUDAH_ADA", "Nama tipe kamar sudah dipakai di kos ini");
}

// GET /api/pemilik/fasilitas  daftar nama fasilitas (master)
router.get("/fasilitas", async (req, res) => {
  const [rows] = await pool.query("SELECT nama_fasilitas FROM fasilitas ORDER BY id_fasilitas");
  res.json(rows.map((r) => r.nama_fasilitas));
});

// GET /api/pemilik/kos  semua kos milik sendiri (termasuk yang belum terverifikasi) + tipe kamarnya
router.get("/kos", async (req, res) => {
  const [rows] = await pool.query(`${KOS_SELECT} WHERE k.id_pemilik = ? ORDER BY k.id_kos`, [req.user.id]);
  const ids = rows.map((r) => r.id_kos);
  const [tipe] = ids.length
    ? await pool.query(`${TIPE_KAMAR_SELECT} WHERE t.id_kos IN (?) ORDER BY t.nama_tipe`, [ids])
    : [[]];
  const [foto] = ids.length
    ? await pool.query("SELECT id_foto, id_kos, file_foto FROM foto_kos WHERE id_kos IN (?) ORDER BY id_foto", [ids])
    : [[]];
  res.json(rows.map((r) => ({
    ...toKos(r),
    rooms: tipe.filter((t) => t.id_kos === r.id_kos).map(toTipeKamar),
    photoList: foto.filter((f) => f.id_kos === r.id_kos).map((f) => ({ id: f.id_foto, file: f.file_foto })),
  })));
});

// POST /api/pemilik/kos  { nama, jenis, banyakKamar, alamat, deskripsi?, fasilitas[] }
// Kos baru berstatus "menunggu" sampai diverifikasi admin
router.post("/kos", async (req, res) => {
  const { data, error } = bacaKos(req.body);
  if (error) return sendError(res, 400, "DATA_TIDAK_VALID", error);
  const id = await withTx(async (conn) => {
    const [r] = await conn.query(
      "INSERT INTO kos (id_pemilik, nama_kos, banyak_kamar, alamat, deskripsi, jenis_kos) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, data.nama, data.banyakKamar, data.alamat, data.deskripsi, data.jenis]
    );
    await setFasilitas(conn, "kos_fasilitas", "id_kos", r.insertId, data.fasilitas);
    return r.insertId;
  });
  res.status(201).json({ id, status: "menunggu" });
});

// PUT /api/pemilik/kos/:id  data sama dengan POST
router.put("/kos/:id", async (req, res) => {
  if (!(await kosMilik(req, req.params.id))) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");
  const { data, error } = bacaKos(req.body);
  if (error) return sendError(res, 400, "DATA_TIDAK_VALID", error);
  await withTx(async (conn) => {
    await conn.query(
      "UPDATE kos SET nama_kos = ?, banyak_kamar = ?, alamat = ?, deskripsi = ?, jenis_kos = ? WHERE id_kos = ?",
      [data.nama, data.banyakKamar, data.alamat, data.deskripsi, data.jenis, req.params.id]
    );
    await setFasilitas(conn, "kos_fasilitas", "id_kos", req.params.id, data.fasilitas);
    await conn.query("CALL sp_perbarui_terakhir_diperbarui(?)", [req.params.id]);
  });
  res.json({ ok: true });
});

// POST /api/pemilik/kos/:id/foto  isi request = file gambar mentah (JPG/PNG/WebP, maks 5 MB)
router.post("/kos/:id/foto", express.raw({ type: "image/*", limit: "5mb" }), async (req, res) => {
  if (!(await kosMilik(req, req.params.id))) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");
  const ext = Buffer.isBuffer(req.body) ? jenisGambar(req.body) : null;
  if (!ext) return sendError(res, 400, "FOTO_TIDAK_VALID", "Foto harus berupa gambar JPG, PNG, atau WebP");
  const [[{ jumlah }]] = await pool.query("SELECT COUNT(*) AS jumlah FROM foto_kos WHERE id_kos = ?", [req.params.id]);
  if (jumlah >= MAKS_FOTO) return sendError(res, 400, "FOTO_PENUH", `Maksimal ${MAKS_FOTO} foto per kos`);

  const nama = `kos${req.params.id}-${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, nama), req.body);
  const [r] = await pool.query("INSERT INTO foto_kos (id_kos, file_foto) VALUES (?, ?)", [req.params.id, UPLOAD_URL + nama]);
  await pool.query("CALL sp_perbarui_terakhir_diperbarui(?)", [req.params.id]);
  res.status(201).json({ id: r.insertId, file: UPLOAD_URL + nama });
});

// DELETE /api/pemilik/kos/:id/foto/:fotoId  file hasil upload ikut dihapus dari disk
router.delete("/kos/:id/foto/:fotoId", async (req, res) => {
  if (!(await kosMilik(req, req.params.id))) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");
  const [rows] = await pool.query("SELECT file_foto FROM foto_kos WHERE id_foto = ? AND id_kos = ?", [req.params.fotoId, req.params.id]);
  if (!rows[0]) return sendError(res, 404, "TIDAK_DITEMUKAN", "Foto tidak ditemukan");
  await pool.query("DELETE FROM foto_kos WHERE id_foto = ?", [req.params.fotoId]);
  await pool.query("CALL sp_perbarui_terakhir_diperbarui(?)", [req.params.id]);
  // Foto bawaan (nama file di frontend/src/assets) tidak ada di disk server
  if (rows[0].file_foto.startsWith(UPLOAD_URL)) {
    await unlink(path.join(UPLOAD_DIR, path.basename(rows[0].file_foto))).catch(() => {});
  }
  res.json({ ok: true });
});

// POST /api/pemilik/kos/:id/kamar  { tipe, harga, jumlahKamar, deskripsi?, fasilitas[] }
router.post("/kos/:id/kamar", async (req, res) => {
  if (!(await kosMilik(req, req.params.id))) return sendError(res, 404, "TIDAK_DITEMUKAN", "Kos tidak ditemukan");
  const { data, error } = bacaKamar(req.body);
  if (error) return sendError(res, 400, "DATA_TIDAK_VALID", error);
  try {
    const id = await withTx(async (conn) => {
      const [r] = await conn.query(
        `INSERT INTO tipe_kamar (id_kos, nama_tipe, harga, jumlah_kamar, jumlah_tersedia, deskripsi)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, data.tipe, data.harga, data.jumlahKamar, data.jumlahKamar, data.deskripsi]
      );
      await setFasilitas(conn, "tipe_kamar_fasilitas", "id_tipe_kamar", r.insertId, data.fasilitas);
      await conn.query("CALL sp_perbarui_terakhir_diperbarui(?)", [req.params.id]);
      return r.insertId;
    });
    res.status(201).json({ id });
  } catch (err) {
    errorDuplikat(res, err);
  }
});

// PUT /api/pemilik/kamar/:id  data sama dengan POST kamar.
// Kamar yang sudah terisi (jumlah_kamar - jumlah_tersedia) tetap terisi; jumlah baru tidak boleh di bawahnya.
router.put("/kamar/:id", async (req, res) => {
  const kamar = await kamarMilik(req, req.params.id);
  if (!kamar) return sendError(res, 404, "TIDAK_DITEMUKAN", "Tipe kamar tidak ditemukan");
  const { data, error } = bacaKamar(req.body);
  if (error) return sendError(res, 400, "DATA_TIDAK_VALID", error);
  const terisi = kamar.jumlah_kamar - kamar.jumlah_tersedia;
  if (data.jumlahKamar < terisi) {
    return sendError(res, 400, "DATA_TIDAK_VALID", `Sudah ada ${terisi} kamar terisi, jumlah kamar minimal ${terisi}`);
  }
  try {
    await withTx(async (conn) => {
      await conn.query(
        `UPDATE tipe_kamar SET nama_tipe = ?, harga = ?, jumlah_kamar = ?, jumlah_tersedia = ?, deskripsi = ?
         WHERE id_tipe_kamar = ?`,
        [data.tipe, data.harga, data.jumlahKamar, data.jumlahKamar - terisi, data.deskripsi, req.params.id]
      );
      await setFasilitas(conn, "tipe_kamar_fasilitas", "id_tipe_kamar", req.params.id, data.fasilitas);
      await conn.query("CALL sp_perbarui_terakhir_diperbarui(?)", [kamar.id_kos]);
    });
    res.json({ ok: true });
  } catch (err) {
    errorDuplikat(res, err);
  }
});

// PATCH /api/pemilik/kamar/:id/status  { tersedia: true/false }  toggle ketersediaan tipe kamar
router.patch("/kamar/:id/status", async (req, res) => {
  const kamar = await kamarMilik(req, req.params.id);
  if (!kamar) return sendError(res, 404, "TIDAK_DITEMUKAN", "Tipe kamar tidak ditemukan");
  const status = req.body.tersedia ? "tersedia" : "penuh";
  await pool.query("UPDATE tipe_kamar SET status_ketersediaan = ? WHERE id_tipe_kamar = ?", [status, req.params.id]);
  await pool.query("CALL sp_perbarui_terakhir_diperbarui(?)", [kamar.id_kos]);
  res.json({ status });
});

// GET /api/pemilik/booking  booking masuk ke kos milik sendiri (terbaru dulu)
router.get("/booking", async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.id_booking, b.status_booking, b.tanggal_booking, p.nama AS pencari_nama,
            t.nama_tipe, k.id_kos, k.nama_kos
     FROM booking b
     JOIN tipe_kamar t ON t.id_tipe_kamar = b.id_tipe_kamar
     JOIN kos k ON k.id_kos = t.id_kos
     JOIN pengguna p ON p.id_pengguna = b.id_pencari_kos
     WHERE k.id_pemilik = ?
     ORDER BY b.status_booking = 'menunggu' DESC, b.id_booking DESC`,
    [req.user.id]
  );
  res.json(rows.map((b) => ({
    id: b.id_booking,
    status: b.status_booking,
    createdAt: b.tanggal_booking,
    seekerName: b.pencari_nama,
    roomType: b.nama_tipe,
    kosId: b.id_kos,
    kosName: b.nama_kos,
  })));
});

const ERROR_PROSEDUR = {
  "Booking sudah diproses": ["SUDAH_DIPROSES", 409],
  "Kamar tidak tersedia": ["KAMAR_PENUH", 409],
  "Booking tidak ditemukan": ["TIDAK_DITEMUKAN", 404],
};

// PATCH /api/pemilik/booking/:id  { aksi: "terima" | "tolak" }  lewat sp_terima_booking / sp_tolak_booking
router.patch("/booking/:id", async (req, res) => {
  const { aksi } = req.body;
  if (!["terima", "tolak"].includes(aksi)) return sendError(res, 400, "DATA_TIDAK_VALID", "Aksi tidak valid");
  const [rows] = await pool.query(
    `SELECT 1 FROM booking b JOIN tipe_kamar t ON t.id_tipe_kamar = b.id_tipe_kamar
     JOIN kos k ON k.id_kos = t.id_kos WHERE b.id_booking = ? AND k.id_pemilik = ?`,
    [req.params.id, req.user.id]
  );
  if (!rows.length) return sendError(res, 404, "TIDAK_DITEMUKAN", "Booking tidak ditemukan");
  try {
    await pool.query(`CALL ${aksi === "terima" ? "sp_terima_booking" : "sp_tolak_booking"}(?)`, [req.params.id]);
    res.json({ status: aksi === "terima" ? "diterima" : "ditolak" });
  } catch (err) {
    const mapped = ERROR_PROSEDUR[err.sqlMessage];
    if (!mapped) throw err;
    sendError(res, mapped[1], mapped[0], err.sqlMessage);
  }
});

export default router;
