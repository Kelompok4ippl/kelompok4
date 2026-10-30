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
    const error = new Error(data.message || "Terjadi kesalahan");
    error.code = data.code; // kode khusus dari backend, contoh: "ROLE_MISSING"
    throw error;
  }
  return data;
}
