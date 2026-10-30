import { Navigate } from "react-router-dom";
import { getCurrentUser, homeFor } from "../api/auth.js";
import { getToken } from "../api/client.js";

// Halaman yang perlu login dengan peran tertentu
export default function RequireRole({ role, children }) {
  const user = getCurrentUser();
  if (!user || !getToken()) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
