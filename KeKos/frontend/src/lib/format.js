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
