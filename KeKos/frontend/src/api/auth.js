import { api } from "./client.js";

function saveSession({ token, user }) {
  localStorage.setItem("kekos_token", token);
  localStorage.setItem("kekos_user", JSON.stringify(user));
}

export async function login({ email, password }) {
  const data = await api("/auth/login", { method: "POST", body: { email, password } });
  saveSession(data);
  return data.user;
}

// Setelah daftar, user diarahkan ke halaman login (tidak langsung masuk)
export async function register({ nama, email, telepon, password }) {
  const data = await api("/auth/register", { method: "POST", body: { nama, email, telepon, password } });
  return data.user;
}

export function logout() {
  localStorage.removeItem("kekos_token");
  localStorage.removeItem("kekos_user");
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("kekos_user"));
  } catch {
    return null;
  }
}

// Halaman awal setelah login (Sprint 2: hanya pencari kos)
export function homeFor() {
  return "/dashboard";
}
