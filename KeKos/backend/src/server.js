import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import kosRoutes from "./routes/kos.js";
import bookingRoutes from "./routes/booking.js";
import notifikasiRoutes from "./routes/notifikasi.js";
import { sendError } from "./middleware/auth.js";
import { pool } from "./db.js";
import { KOS_SELECT, toKos } from "./format.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET belum diisi. Salin .env.example menjadi .env dulu.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
// GET /api/preview-kos  kartu kos di panel kiri halaman login (FR-02); hanya kos terverifikasi
app.get("/api/preview-kos", async (req, res) => {
  const [rows] = await pool.query(
    `${KOS_SELECT} WHERE k.status_verifikasi = 'terverifikasi' ORDER BY k.rata_rating DESC, k.id_kos LIMIT 8`
  );
  res.json(rows.map(toKos));
});
app.use("/api/auth", authRoutes);
app.use("/api/kos", kosRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/notifikasi", notifikasiRoutes);

// Error yang tidak tertangkap (misalnya database mati)
app.use((err, req, res, next) => {
  console.error(err);
  sendError(res, 500, "SERVER_ERROR", "Terjadi kesalahan di server");
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`KeKos backend jalan di http://localhost:${port}`));
