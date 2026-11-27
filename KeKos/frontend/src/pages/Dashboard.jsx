import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "../components/Navbar.jsx";
import KosCard from "../components/KosCard.jsx";
import KosMap from "../components/KosMap.jsx";
import RekomendasiKos from "../components/RekomendasiKos.jsx";
import TextRotate from "../components/ui/TextRotate.jsx";
import { LineIcon } from "../components/Icon.jsx";
import { useApi } from "../hooks/useApi.js";
import { CAMPUS, RADIUS_METERS, distanceMeters, hasLocation } from "../lib/maps.js";
import { rupiah } from "../lib/format.js";

import heroImg from "../assets/sunlit-mediterranean-hilltop-town-and-church-1.png";

const TYPES = [
  { value: "", label: "Semua" },
  { value: "putra", label: "Putra" },
  { value: "putri", label: "Putri" },
  { value: "campur", label: "Campur" },
];

// label = teks di tombol, value = nama_fasilitas di tabel fasilitas (harus sama persis)
const FACILITIES = [
  { label: "AC", value: "AC" },
  { label: "Kamar Mandi Dalam", value: "Kamar Mandi Dalam" },
  { label: "Dapur Bersama", value: "Dapur Bersama" },
  { label: "WiFi 100Mbps", value: "WiFi" },
  { label: "Water Heater", value: "Water Heater" },
  { label: "Parkir Mobil", value: "Parkir Mobil" },
];

// Pilihan budget cepat di kotak pencarian hero (batas atas harga per bulan)
const BUDGETS = [
  { value: 1000000, label: "Sampai Rp1 jt" },
  { value: 1500000, label: "Sampai Rp1,5 jt" },
  { value: 2000000, label: "Sampai Rp2 jt" },
  { value: 3000000, label: "Semua harga" },
];

// Kata yang bergantian di judul hero: "Temukan kos yang ___ untukmu"
const HERO_WORDS = ["cocok", "nyaman", "aman", "terjangkau"];

const MIN_PRICE = 500000;
const MAX_PRICE = 3000000;

function buildQuery({ type, maxPrice, facilities, q }) {
  const params = new URLSearchParams();
  if (type) params.set("tipe", type);
  params.set("min", MIN_PRICE);
  // Slider di ujung kanan berarti "3 juta ke atas", jadi tanpa batas atas
  if (maxPrice < MAX_PRICE) params.set("max", maxPrice);
  if (facilities.length) params.set("fasilitas", facilities.join(","));
  if (q.trim()) params.set("q", q.trim());
  return `/kos?${params}`;
}

const labelClass = "text-[11px] font-semibold uppercase tracking-[.06em] text-steel-muted";

export default function Dashboard({ notifOpenInitially = false }) {
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const zoomButtonRef = useRef(null);

  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e) => e.key === "Escape" && setMapOpen(false);
    document.addEventListener("keydown", onKey);
    const opener = zoomButtonRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [mapOpen]);
  // Filter baru dipakai setelah tombol "Cari kos" / "Terapkan filter" diklik; pencarian teks langsung (dengan jeda)
  const [applied, setApplied] = useState({ type: "", maxPrice: MAX_PRICE, facilities: [] });
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQ(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const listPath = useMemo(() => buildQuery({ ...applied, q }), [applied, q]);
  const isFiltered = type !== "" || maxPrice < MAX_PRICE || facilities.length > 0;
  const resetFilters = () => {
    setType("");
    setMaxPrice(MAX_PRICE);
    setFacilities([]);
    setApplied({ type: "", maxPrice: MAX_PRICE, facilities: [] });
  };
  const runSearch = (e) => {
    e.preventDefault();
    setApplied({ type, maxPrice, facilities });
    setQ(search); // tanpa menunggu jeda ketik
    document.getElementById("hasil-kos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const kosList = useApi(listPath);
  const allKos = useApi("/kos");
  const nearby = useMemo(
    () => (allKos.data || []).filter((kos) => hasLocation(kos) && distanceMeters(CAMPUS, kos) <= RADIUS_METERS).length,
    [allKos.data]
  );
  // Rata-rata rating dari kos yang sudah punya ulasan
  const avgRating = useMemo(() => {
    const rated = (allKos.data || []).filter((k) => k.reviews > 0);
    return rated.length ? rated.reduce((n, k) => n + k.rating, 0) / rated.length : null;
  }, [allKos.data]);

  const toggleFacility = (value) =>
    setFacilities((list) => (list.includes(value) ? list.filter((f) => f !== value) : [...list, value]));

  const fill = ((maxPrice - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  const radiusText = `${String(RADIUS_METERS / 1000).replace(".", ",")} km`;

  return (
    <div className="min-h-screen overflow-x-clip bg-steel-bg font-poppins text-steel-ink">
      <Navbar notifOpenInitially={notifOpenInitially} />

      <main>
        {/* ---------- Hero: foto kota + lapisan biru redup + garis zigzag ---------- */}
        <section className="relative overflow-hidden">
          <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(100deg,rgba(29,58,92,.94)_0%,rgba(41,82,124,.86)_45%,rgba(85,130,173,.55)_100%)]" />
          <svg aria-hidden="true" viewBox="0 0 400 160" preserveAspectRatio="none" className="pointer-events-none absolute right-0 top-10 hidden h-[45%] w-[50%] opacity-20 md:block">
            <polyline points="0,130 55,60 110,115 180,25 240,95 310,40 400,120" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          </svg>

          <div className="relative mx-auto max-w-[1240px] px-4 pb-12 pt-12 text-white sm:px-6 sm:pt-16">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs">
              <LineIcon name="check" className="h-3.5 w-3.5" />
              Kos terverifikasi di sekitar kampus
            </p>
            <h1 className="mt-5 max-w-[640px] font-serif4 text-[38px] font-bold leading-[1.1] sm:text-[54px]">
              Temukan kos yang <TextRotate texts={HERO_WORDS} className="text-[#cfe0f2]" /> untukmu
            </h1>
            <p className="mt-4 max-w-[520px] text-[15px] text-white/85">
              Nyaman, dekat kampus, dan sesuai budget. Bandingkan harga, fasilitas, dan lokasi dalam satu tempat.
            </p>

            {/* Kotak pencarian */}
            <form
              id="cari-kos"
              onSubmit={runSearch}
              aria-label="Cari kos"
              className="mt-8 grid scroll-mt-24 gap-1 rounded-2xl bg-white p-2 text-steel-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,.5)] md:grid-cols-[1.4fr_1fr_1fr_auto] md:gap-0"
            >
              <label className="flex items-center gap-3 rounded-xl px-4 py-2.5 focus-within:bg-steel-tint-2 md:border-r md:border-steel-line md:rounded-none">
                <LineIcon name="search" className="h-5 w-5 text-steel" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-steel-muted">Nama kos atau daerah</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Mis. Ketintang"
                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-steel-muted focus:placeholder:text-transparent"
                  />
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-xl px-4 py-2.5 focus-within:bg-steel-tint-2 md:border-r md:border-steel-line md:rounded-none">
                <LineIcon name="building" className="h-5 w-5 text-steel" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-steel-muted">Tipe kos</span>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full cursor-pointer bg-transparent text-sm font-medium outline-none">
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.value ? t.label : "Semua tipe"}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-xl px-4 py-2.5 focus-within:bg-steel-tint-2">
                <LineIcon name="tag" className="h-5 w-5 text-steel" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] text-steel-muted">Budget per bulan</span>
                  <select
                    value={BUDGETS.some((b) => b.value === maxPrice) ? maxPrice : ""}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full cursor-pointer bg-transparent text-sm font-medium outline-none"
                  >
                    {!BUDGETS.some((b) => b.value === maxPrice) && <option value="">Sampai {rupiah(maxPrice, { short: true })}</option>}
                    {BUDGETS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <button type="submit" className="m-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-steel px-6 text-sm font-semibold text-white hover:bg-steel-strong">
                <LineIcon name="search" className="h-4 w-4" />
                Cari kos
              </button>
            </form>

            <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
              {[
                [allKos.data ? allKos.data.length : "…", "kos terverifikasi"],
                [avgRating ? avgRating.toFixed(1).replace(".", ",") : "–", "rata-rata rating"],
                [allKos.data ? nearby : "…", `kos dalam radius ${radiusText}`],
              ].map(([v, l]) => (
                <div key={l} className="flex flex-col-reverse">
                  <dt className="text-xs text-white/75">{l}</dt>
                  <dd className="text-2xl font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <RekomendasiKos />

        {/* ---------- Peta persebaran ---------- */}
        <section id="peta" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 pt-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif4 text-[28px] font-bold sm:text-[34px]">Peta persebaran kos</h2>
              <p className="mt-1 text-sm text-steel-muted">Lihat kos di sekitar kampus dan pilih yang paling dekat dengan aktivitasmu.</p>
            </div>
            <button
              ref={zoomButtonRef}
              type="button"
              onClick={() => setMapOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-steel-line bg-white px-4 text-sm font-semibold text-steel hover:bg-steel-tint-2"
            >
              <LineIcon name="pin" className="h-4 w-4" />
              Buka peta penuh
            </button>
          </div>
          <div className="relative isolate mt-5 overflow-hidden rounded-[20px] border border-steel-line bg-white shadow-steel">
            <KosMap kos={allKos.data || []} className="aspect-[1087/440] min-h-[300px] w-full" />
            <p className="absolute bottom-4 left-4 z-[500] flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm shadow-steel">
              <LineIcon name="pin" className="h-4 w-4 text-steel" />
              <span>
                <span className="font-semibold">{allKos.data ? nearby : "…"} kos</span> ditemukan dalam radius {radiusText}
              </span>
            </p>
          </div>
        </section>

        {/* ---------- Daftar kos + filter ---------- */}
        <section id="hasil-kos" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 pb-20 pt-14 sm:px-6">
          <h2 className="font-serif4 text-[28px] font-bold sm:text-[34px]">Kos pilihan di sekitar kampus</h2>
          <p className="mt-1 text-sm text-steel-muted">Bandingkan harga, tipe kos, fasilitas, dan jarak sebelum kamu booking.</p>

          <form
            onSubmit={runSearch}
            aria-label="Filter kos"
            className="mt-6 flex flex-col gap-6 rounded-2xl border border-steel-line bg-white p-5 shadow-steel lg:flex-row lg:items-end"
          >
            <div>
              <p className={labelClass}>Tipe kos</p>
              <div role="group" aria-label="Tipe kos" className="mt-2 inline-flex rounded-xl bg-[#e3e9f0] p-[3px]">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={type === t.value}
                    onClick={() => setType(t.value)}
                    className={`relative min-h-9 rounded-[9px] px-3.5 text-[13px] ${type === t.value ? "font-semibold text-steel-strong" : "font-medium text-steel-body"}`}
                  >
                    {type === t.value && (
                      <motion.span
                        layoutId="tipe-kos-aktif"
                        className="absolute inset-0 rounded-[9px] bg-white shadow-[0_1px_3px_rgba(29,58,92,.15)]"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-[220px] flex-1">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="budget" className={labelClass}>
                  Budget per bulan
                </label>
                <span className="text-xs font-semibold">
                  {rupiah(MIN_PRICE, { short: true })} – {rupiah(maxPrice, { short: true })}
                  {maxPrice >= MAX_PRICE ? "+" : ""}
                </span>
              </div>
              <input
                id="budget"
                type="range"
                min={MIN_PRICE}
                max={MAX_PRICE}
                step={100000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="kekos-range mt-4 w-full"
                style={{ "--fill": `${fill}%` }}
              />
            </div>

            <div className="lg:max-w-[420px]">
              <p className={labelClass}>Fasilitas</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FACILITIES.map((f) => {
                  const on = facilities.includes(f.value);
                  return (
                    <button
                      key={f.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleFacility(f.value)}
                      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                        on ? "border-steel bg-steel text-white" : "border-steel-line bg-white text-steel-body hover:border-steel"
                      }`}
                    >
                      {on && <LineIcon name="check" className="h-3.5 w-3.5" />}
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-steel px-5 text-sm font-semibold text-white hover:bg-steel-strong">
                <LineIcon name="search" className="h-4 w-4" />
                Terapkan filter
              </button>
              <AnimatePresence>
                {isFiltered && (
                  <motion.button
                    type="button"
                    onClick={resetFilters}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-9 rounded-xl px-3 text-xs font-semibold text-steel hover:bg-steel-tint-2"
                  >
                    Reset filter
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </form>

          <p aria-live="polite" className="mt-6 text-sm font-medium text-steel-body">
            {kosList.data ? `${kosList.data.length} kos ditemukan` : ""}
          </p>

          <div className="mt-4">
            {kosList.loading && <p className="text-sm text-steel-muted">Memuat kos...</p>}
            {kosList.error && (
              <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
                {kosList.error}
              </p>
            )}
            {kosList.data?.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-steel-line bg-white p-8 text-center">
                <p className="text-sm text-steel-muted">Kos tidak ditemukan. Coba ubah filter atau kata kunci.</p>
                {(isFiltered || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      resetFilters();
                      setSearch("");
                    }}
                    className="min-h-11 rounded-xl border border-steel-line px-5 text-sm font-semibold text-steel hover:bg-steel-tint-2"
                  >
                    Reset filter &amp; pencarian
                  </button>
                )}
              </div>
            )}
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {/* Saat hasil filter berubah: kartu yang hilang mengecil & memudar, sisanya meluncur ke posisi baru */}
              <AnimatePresence mode="popLayout">
                {kosList.data?.map((kos) => (
                  <motion.div
                    key={kos.id}
                    layout
                    initial={false}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <KosCard kos={kos}>
                      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#edf1f5] pt-3">
                        <Link
                          to={`/kos/${kos.id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-steel-line text-sm font-semibold text-steel-body hover:border-steel hover:text-steel"
                        >
                          Detail
                        </Link>
                        {kos.roomsLeft > 0 ? (
                          <Link
                            to={`/kos/${kos.id}/booking`}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-steel text-sm font-semibold text-white hover:bg-steel-strong"
                          >
                            Booking cepat
                          </Link>
                        ) : (
                          <span aria-disabled="true" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#c6d0db] text-sm font-semibold text-white">
                            Penuh
                          </span>
                        )}
                      </div>
                    </KosCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-steel-side text-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-8 px-4 py-12 sm:px-6">
          <div>
            <p className="font-serif4 text-2xl font-bold">KeKos</p>
            <p className="mt-2 max-w-[260px] text-sm text-white/75">Cari dan booking kos impian di sekitar kampus jadi lebih mudah.</p>
            <p className="mt-6 text-xs text-white/60">© {new Date().getFullYear()} KeKos</p>
          </div>
          <nav aria-label="Tautan bawah" className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Jelajahi</p>
              <a href="#cari-kos" className="text-white/75 hover:text-white">Cari kos</a>
              <a href="#peta" className="text-white/75 hover:text-white">Peta kos</a>
              <Link to="/riwayat" className="text-white/75 hover:text-white">Riwayat kos</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Pemilik</p>
              <Link to="/" className="text-white/75 hover:text-white">Masuk sebagai pemilik</Link>
            </div>
          </nav>
        </div>
      </footer>

      {/* Peta layar penuh: latar memudar, peta membesar dari tengah */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Peta persebaran kos"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,43,63,.7)] p-4"
            onClick={() => setMapOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="h-full max-h-[860px] w-full max-w-[1400px] overflow-hidden rounded-2xl"
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <KosMap kos={allKos.data || []} interactive className="h-full w-full" />
            </motion.div>
            <button
              type="button"
              autoFocus
              onClick={() => setMapOpen(false)}
              className="absolute right-6 top-6 z-[1000] min-h-11 rounded-xl bg-white px-5 text-sm font-semibold text-steel shadow"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
