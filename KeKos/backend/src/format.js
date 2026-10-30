// Mengubah baris database (kekos_database.sql) menjadi objek JSON yang dipakai frontend

const list = (text) => (text ? text.split(",").map((s) => s.trim()).filter(Boolean) : []);

// Titik kampus untuk menghitung jarak kos (sama dengan CAMPUS di frontend/src/lib/maps.js).
// Jarak tidak disimpan di database dan tidak diisi pemilik, selalu dihitung dari koordinat.
const KAMPUS = { lat: -7.3117, lng: 112.7275, nama: "Telkom University Surabaya" };

function jarakMeter(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function teksJarak(lat, lng) {
  if (lat == null || lng == null) return null;
  const m = jarakMeter(KAMPUS, { lat, lng });
  const angka = m < 1000 ? `${Math.round(m / 50) * 50} meter` : `${(m / 1000).toFixed(1).replace(".", ",")} km`;
  return `${angka} dari ${KAMPUS.nama}`;
}

// SELECT kos lengkap: pemilik, harga termurah per tipe kamar, sisa kamar, jumlah ulasan, fasilitas, foto
export const KOS_SELECT = `
  SELECT k.*, p.nama AS pemilik_nama, p.no_hp AS pemilik_hp,
    (SELECT MIN(t.harga) FROM tipe_kamar t WHERE t.id_kos = k.id_kos) AS harga_min,
    (SELECT COALESCE(SUM(t.jumlah_tersedia), 0) FROM tipe_kamar t
      WHERE t.id_kos = k.id_kos AND t.status_ketersediaan = 'tersedia') AS sisa_kamar,
    (SELECT COUNT(*) FROM rating r WHERE r.id_kos = k.id_kos) AS jumlah_ulasan,
    (SELECT GROUP_CONCAT(f.nama_fasilitas ORDER BY f.id_fasilitas SEPARATOR ',')
       FROM kos_fasilitas kf JOIN fasilitas f ON f.id_fasilitas = kf.id_fasilitas
      WHERE kf.id_kos = k.id_kos) AS fasilitas,
    (SELECT GROUP_CONCAT(fk.file_foto ORDER BY fk.id_foto SEPARATOR ',')
       FROM foto_kos fk WHERE fk.id_kos = k.id_kos) AS foto
  FROM kos k JOIN pengguna p ON p.id_pengguna = k.id_pemilik`;

export function toKos(row) {
  const photos = list(row.foto);
  const lat = row.latitude == null ? null : Number(row.latitude);
  const lng = row.longitude == null ? null : Number(row.longitude);
  return {
    id: row.id_kos,
    name: row.nama_kos,
    type: row.jenis_kos,
    distance: teksJarak(lat, lng),
    address: row.alamat,
    lat,
    lng,
    description: row.deskripsi,
    totalRooms: row.banyak_kamar,
    facilities: list(row.fasilitas),
    photos,
    image: photos[0] || null,
    status: row.status_verifikasi,
    price: row.harga_min == null ? null : Number(row.harga_min),
    roomsLeft: Number(row.sisa_kamar || 0),
    rating: Number(row.rata_rating || 0),
    reviews: Number(row.jumlah_ulasan || 0),
    owner: { id: row.id_pemilik, name: row.pemilik_nama },
    updatedAt: row.terakhir_diperbarui,
  };
}

// SELECT tipe kamar beserta fasilitas dan fotonya
export const TIPE_KAMAR_SELECT = `
  SELECT t.*,
    (SELECT GROUP_CONCAT(f.nama_fasilitas ORDER BY f.id_fasilitas SEPARATOR ',')
       FROM tipe_kamar_fasilitas tf JOIN fasilitas f ON f.id_fasilitas = tf.id_fasilitas
      WHERE tf.id_tipe_kamar = t.id_tipe_kamar) AS fasilitas,
    (SELECT GROUP_CONCAT(fk.file_foto ORDER BY fk.id_foto_kamar SEPARATOR ',')
       FROM foto_kamar fk WHERE fk.id_tipe_kamar = t.id_tipe_kamar) AS foto
  FROM tipe_kamar t`;

export function toTipeKamar(row) {
  const photos = list(row.foto);
  return {
    id: row.id_tipe_kamar,
    kosId: row.id_kos,
    type: row.nama_tipe,
    price: Number(row.harga),
    totalRooms: row.jumlah_kamar,
    // Tipe yang ditandai "penuh" oleh pemilik dianggap tidak tersedia
    available: row.status_ketersediaan === "tersedia" ? row.jumlah_tersedia : 0,
    status: row.status_ketersediaan,
    facilities: list(row.fasilitas),
    description: row.deskripsi,
    photos,
    image: photos[0] || null,
  };
}

// Jenis notifikasi di database → tampilan di dropdown notifikasi pencari
const JENIS_NOTIFIKASI = {
  booking_dikirim: { type: "info", title: "Booking Terkirim" },
  booking_diterima: { type: "sukses", title: "Booking Diterima!" },
  booking_ditolak: { type: "error", title: "Booking Ditolak" },
  booking_baru: { type: "info", title: "Booking Baru" },
  peringatan: { type: "peringatan", title: "Peringatan" },
  listing_dihapus: { type: "error", title: "Listing Dihapus" },
  log: { type: "info", title: "Log Aktivitas" },
};

export function toNotifikasi(row) {
  const jenis = JENIS_NOTIFIKASI[row.jenis_notifikasi] || { type: "info", title: "Notifikasi" };
  return {
    id: row.id_notifikasi,
    type: jenis.type,
    title: jenis.title,
    message: row.pesan,
    bookingId: row.id_booking,
    read: Boolean(row.sudah_dibaca),
    createdAt: row.waktu_kirim,
  };
}
