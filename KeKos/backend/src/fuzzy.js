// FR-08 Rekomendasi kos: logika fuzzy metode Sugeno (orde nol).
// Input  : jarak kos dari pengguna (km) dan rata-rata rating kos (0-5, 0 = belum ada ulasan).
// Output : skor rekomendasi 0-100. Makin tinggi, makin direkomendasikan.

// Fungsi keanggotaan trapesium: naik dari a ke b, bernilai 1 dari b ke c, turun dari c ke d.
// a = b = -Infinity berarti bahu kiri (langsung 1), c = d = Infinity berarti bahu kanan.
function trapesium(x, a, b, c, d) {
  if (x < a || x > d) return 0;
  if (x < b) return (x - a) / (b - a);
  if (x <= c) return 1;
  return (d - x) / (d - c);
}
// Segitiga = trapesium yang puncaknya satu titik
const segitiga = (x, a, b, c) => trapesium(x, a, b, b, c);

// 1. Fuzzifikasi: nilai tegas → derajat keanggotaan tiap himpunan (0-1)
export function fuzzifikasiJarak(km) {
  return {
    dekat: trapesium(km, -Infinity, -Infinity, 0.5, 1.5),
    sedang: segitiga(km, 0.5, 1.5, 3),
    jauh: trapesium(km, 1.5, 3, Infinity, Infinity),
  };
}

export function fuzzifikasiRating(nilai) {
  return {
    rendah: trapesium(nilai, -Infinity, -Infinity, 2, 3.5),
    sedang: segitiga(nilai, 2, 3.5, 4.5),
    tinggi: trapesium(nilai, 3.5, 4.5, Infinity, Infinity),
  };
}

// Output Sugeno orde nol: setiap himpunan output adalah satu konstanta skor
const OUTPUT = { rendah: 25, sedang: 50, tinggi: 75, sangatTinggi: 100 };

// 2. Basis aturan: JIKA jarak = ... DAN rating = ... MAKA rekomendasi = ...
export const ATURAN = [
  ["dekat", "rendah", "sedang"],
  ["dekat", "sedang", "tinggi"],
  ["dekat", "tinggi", "sangatTinggi"],
  ["sedang", "rendah", "rendah"],
  ["sedang", "sedang", "sedang"],
  ["sedang", "tinggi", "tinggi"],
  ["jauh", "rendah", "rendah"],
  ["jauh", "sedang", "rendah"],
  ["jauh", "tinggi", "sedang"],
];

// 3. Inferensi (operator DAN = MIN) dan 4. defuzzifikasi rata-rata berbobot:
//    skor = Σ(α_i × z_i) / Σ α_i
export function skorFuzzy(km, rating) {
  const jarak = fuzzifikasiJarak(km);
  const nilai = fuzzifikasiRating(rating);
  let atas = 0;
  let bawah = 0;
  for (const [j, r, hasil] of ATURAN) {
    const alpha = Math.min(jarak[j], nilai[r]);
    atas += alpha * OUTPUT[hasil];
    bawah += alpha;
  }
  // Himpunan menutupi seluruh domain, jadi bawah selalu > 0; penjagaan tetap ada untuk input aneh (NaN)
  return bawah ? Math.round((atas / bawah) * 10) / 10 : 0;
}
