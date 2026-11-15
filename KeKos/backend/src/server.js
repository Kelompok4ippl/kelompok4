import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import kosRoutes from "./routes/kos.js";
import bookingRoutes from "./routes/booking.js";
import notifikasiRoutes from "./routes/notifikasi.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET belum diisi. Salin .env.example menjadi .env dulu.");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/kos", kosRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/notifikasi", notifikasiRoutes);

// Error yang tidak tertangkap (misalnya database mati)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan di server" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`KeKos backend jalan di http://localhost:${port}`));
