// Titik pusat peta: Telkom University Surabaya (Jl. Ketintang)
export const CAMPUS = { lat: -7.3117, lng: 112.7275, name: "Telkom University Surabaya" };
export const RADIUS_METERS = 1500;

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const hasGoogleKey = Boolean(GOOGLE_KEY);

// Jarak dua titik dalam meter (rumus haversine)
export function distanceMeters(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}

export function hasLocation(kos) {
  return kos.lat != null && kos.lng != null;
}

// Script Google Maps cukup dimuat sekali untuk seluruh aplikasi.
// Gagal (tanpa internet / API key salah) → promise ditolak, komponen peta pindah ke OpenStreetMap.
let googlePromise;
let authFailed = false;
const authListeners = new Set();

// Google baru memberi tahu API key ditolak SETELAH peta tampil, jadi komponen peta perlu mendengarkan ini
export function onGoogleAuthFailure(callback) {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

export function loadGoogleMaps() {
  if (!GOOGLE_KEY) return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY belum diisi"));
  if (authFailed) return Promise.reject(new Error("API key Google Maps ditolak"));
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!googlePromise) {
    googlePromise = new Promise((resolve, reject) => {
      window.__kekosMapsReady = () => resolve(window.google.maps);
      // Google memanggil fungsi ini kalau API key ditolak (salah, belum aktif, atau billing mati)
      window.gm_authFailure = () => {
        authFailed = true;
        reject(new Error("API key Google Maps ditolak"));
        authListeners.forEach((callback) => callback());
      };
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&callback=__kekosMapsReady&loading=async&language=id&region=ID`;
      script.async = true;
      script.onerror = () => reject(new Error("Script Google Maps gagal dimuat"));
      document.head.appendChild(script);
    }).catch((err) => {
      googlePromise = null;
      throw err;
    });
  }
  return googlePromise;
}
