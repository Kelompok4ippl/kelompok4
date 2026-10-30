import jwt from "jsonwebtoken";

// Cek header "Authorization: Bearer <token>" lalu simpan data sesi di req.user
// (id, email, peran yang dipilih saat login: "pencariKos" / "pemilikKos", atau role "admin")
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Silakan login dulu" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Sesi habis, silakan login lagi" });
  }
}

// Dipakai setelah requireAuth: hanya peran sesi tertentu yang boleh lewat
export function requirePeran(...peran) {
  return (req, res, next) => {
    if (!peran.includes(req.user.peran)) {
      return res.status(403).json({ message: "Kamu tidak punya akses ke halaman ini" });
    }
    next();
  };
}

// Kirim error dengan format yang sama di semua route
export function sendError(res, status, kode, pesan) {
  return res.status(status).json({ message: pesan, code: kode, error: { kode, pesan } });
}
