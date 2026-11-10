// Semua request ke backend lewat "/api/...". Saat development, Vite meneruskannya
// ke http://localhost:3000 (lihat vite.config.js).

export function getToken() {
  return localStorage.getItem("kekos_token");
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // FormData (upload foto) dikirim apa adanya, selain itu sebagai JSON
  const isForm = body instanceof FormData;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke server");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // FR-16: token kedaluwarsa / tidak valid → hapus sesi lokal dan langsung ke halaman login
    if (token && res.status === 401 && ["SESI_BERAKHIR", "BELUM_LOGIN"].includes(data.code)) {
      localStorage.removeItem("kekos_token");
      localStorage.removeItem("kekos_user");
      window.location.assign("/");
    }
    const error = new Error(data.error?.pesan || data.message || "Terjadi kesalahan");
    error.code = data.code; // kode khusus dari backend, contoh: "KAMAR_PENUH"
    throw error;
  }
  return data;
}
