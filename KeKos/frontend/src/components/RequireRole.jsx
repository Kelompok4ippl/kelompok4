import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, homeFor } from "../api/auth.js";
import { getToken } from "../api/client.js";

// Halaman yang perlu login dengan peran tertentu
export default function RequireRole({ role, children }) {
  const location = useLocation();
  const user = getCurrentUser();
  // from: halaman tujuan, dipakai Login untuk kembali ke sini setelah berhasil masuk
  if (!user || !getToken()) return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
