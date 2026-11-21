import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth, sendError } from "../middleware/auth.js";

const router = Router();
const PERAN = ["pencariKos", "pemilikKos"];

// Token menyimpan peran yang dipilih saat login (bukan kolom di database)
function makeToken(user, peran) {
  return jwt.sign({ id: user.id_pengguna, email: user.email, peran }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// role "pencari" / "pemilik" dipakai frontend untuk penjaga halaman (RequireRole)
function publicUser(user, peran) {
  return {
    id: user.id_pengguna,
    nama: user.nama,
    email: user.email,
    telepon: user.no_hp ?? null,
    peran,
    role: { pencariKos: "pencari", pemilikKos: "pemilik", admin: "admin" }[peran],
  };
}

// POST /api/auth/register  { nama, email, telepon, password }  (semua wajib, FR-01)
// Registrasi tanpa peran; peran dipilih saat login.
router.post("/register", async (req, res) => {
  const nama = String(req.body.nama || "").trim();
  const email = String(req.body.email || "").trim();
  const password = String(req.body.password || "");
  const noHp = req.body.telepon ? String(req.body.telepon).replace(/[\s-]/g, "") : null;
  if (!nama || !email || !password || !noHp) {
    return sendError(res, 400, "DATA_TIDAK_LENGKAP", "Semua kolom wajib diisi");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return sendError(res, 400, "EMAIL_TIDAK_VALID", "Format email tidak valid");
  if (email !== email.toLowerCase()) {
    return sendError(res, 400, "EMAIL_HURUF_BESAR", "Email harus memakai huruf kecil semua");
  }
  if (password.length < 6) return sendError(res, 400, "PASSWORD_PENDEK", "Password minimal 6 karakter");
  if (!/^\+?[0-9]{9,15}$/.test(noHp)) return sendError(res, 400, "NO_HP_TIDAK_VALID", "Nomor telepon tidak valid");

  const [existing] = await pool.query("SELECT id_pengguna FROM pengguna WHERE email = ?", [email]);
  if (existing.length) return sendError(res, 409, "EMAIL_TERDAFTAR", "Email sudah terdaftar. Silakan login.");

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO pengguna (nama, email, password, no_hp) VALUES (?, ?, ?, ?)",
    [nama, email, hash, noHp]
  );
  res.status(201).json({ user: { id: result.insertId, nama, email, telepon: noHp } });
});

// POST /api/auth/login  { email, password, peran? }  peran: "pencariKos" (default) / "pemilikKos"; akun admin -> "admin"
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const peran = req.body.peran || "pencariKos";
  if (!email || !password) return sendError(res, 400, "DATA_TIDAK_LENGKAP", "Email dan password wajib diisi");
  if (!PERAN.includes(peran)) return sendError(res, 400, "PERAN_TIDAK_VALID", "Peran tidak valid");

  const [rows] = await pool.query("SELECT * FROM pengguna WHERE email = ?", [email]);
  const user = rows[0];
  // Pesan sengaja sama untuk email & password, supaya orang tidak bisa menebak email yang terdaftar
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return sendError(res, 401, "LOGIN_GAGAL", "Email atau password salah");
  }
  if (user.status_akun === "nonaktif") return sendError(res, 403, "AKUN_NONAKTIF", "Akun Anda dinonaktifkan");
  // Akun admin selalu masuk sebagai admin, apa pun peran yang dipilih di form login
  const sesi = user.role === "admin" ? "admin" : peran;

  await pool.query("CALL sp_catat_login(?)", [user.id_pengguna]);
  res.json({ token: makeToken(user, sesi), user: publicUser(user, sesi) });
});

// GET /api/auth/me  (perlu token)
router.get("/me", requireAuth, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM pengguna WHERE id_pengguna = ?", [req.user.id]);
  if (!rows[0]) return sendError(res, 404, "TIDAK_DITEMUKAN", "Pengguna tidak ditemukan");
  res.json({ user: publicUser(rows[0], req.user.peran) });
});

export default router;
