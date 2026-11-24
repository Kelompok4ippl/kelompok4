// Gambar bawaan di src/assets bisa dipanggil dengan nama filenya saja (seperti yang disimpan di database).
// Nama yang diawali "/" atau "http" dipakai apa adanya.
const ASSETS = import.meta.glob("../assets/*.{png,jpg,jpeg,svg,webp}", { eager: true, import: "default" });
const BY_NAME = Object.fromEntries(Object.entries(ASSETS).map(([path, url]) => [path.split("/").pop(), url]));

export function imageUrl(name) {
  if (!name) return BY_NAME["image.png"];
  if (name.startsWith("/") || name.startsWith("http") || name.startsWith("blob:")) return name;
  return BY_NAME[name] || BY_NAME["image.png"];
}

export function rupiah(n, { short = false } = {}) {
  if (n == null) return "-";
  const text = Number(n).toLocaleString("id-ID");
  return short ? `Rp${text}` : `Rp ${text}`;
}

export function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "Baru saja";
  const units = [
    [60 * 60 * 24 * 30, "bulan"],
    [60 * 60 * 24 * 7, "minggu"],
    [60 * 60 * 24, "hari"],
    [60 * 60, "jam"],
    [60, "menit"],
  ];
  for (const [sec, label] of units) {
    if (diff >= sec) return `${Math.floor(diff / sec)} ${label} yang lalu`;
  }
  return "Baru saja";
}

export const KOS_TYPE_LABEL = { putra: "Putra", putri: "Putri", campur: "Campur" };

// Nama tampilan & nama ikon garis (LineIcon) untuk fasilitas dari database (panel pemilik)
export function facilityLabel(name) {
  return name.toLowerCase().includes("mandi dalam") ? "K.mandi dalam" : name;
}

export function facilityIcon(name) {
  const key = name.toLowerCase();
  if (key === "wifi") return "wifi";
  if (key === "ac") return "snow";
  if (key.includes("mandi")) return "shower";
  return "tag";
}

// Tanggal lokal "YYYY-MM-DD" (untuk input type=date); addMonths opsional
export function isoDate(date = new Date(), addMonths = 0) {
  const d = new Date(date);
  if (addMonths) d.setMonth(d.getMonth() + addMonths);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "29 November 2026"
export function tanggalPanjang(date) {
  if (!date) return "-";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Tanggal selesai sewa = tanggal masuk + durasi (bulan)
export function tanggalSelesai(date, months) {
  if (!date || !months) return null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date);
  d.setMonth(d.getMonth() + Number(months));
  return d;
}
