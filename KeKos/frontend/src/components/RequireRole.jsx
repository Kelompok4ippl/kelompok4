import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, homeFor } from "../api/auth.js";
import { getToken } from "../api/client.js";

// Halaman yang perlu login dengan peran tertentu
export default function RequireRole({ role, children }) {
  const location = useLocation();
  const user = getCurrentUser();
  // Simpan halaman tujuan supaya setelah login pengguna kembali ke sana (FR-05)
  if (!user || !getToken()) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
