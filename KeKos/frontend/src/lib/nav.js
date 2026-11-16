// Tombol "kembali": mundur satu halaman kalau ada riwayat di dalam KeKos,
// kalau halaman dibuka langsung dari link, ke beranda (supaya tidak keluar dari situs)
export function goBack(navigate, fallback = "/dashboard") {
  if (window.history.state?.idx > 0) navigate(-1);
  else navigate(fallback);
}
