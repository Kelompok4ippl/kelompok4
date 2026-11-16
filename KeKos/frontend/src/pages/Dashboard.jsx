import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "../components/Navbar.jsx";
import KosCard from "../components/KosCard.jsx";
import KosMap from "../components/KosMap.jsx";
import TextRotate from "../components/ui/TextRotate.jsx";
import InteractiveHoverButton from "../components/ui/InteractiveHoverButton.jsx";
import { useApi } from "../hooks/useApi.js";
import { useScrollEffects } from "../hooks/useScrollEffects.js";
import { CAMPUS, RADIUS_METERS, distanceMeters, hasLocation } from "../lib/maps.js";
import { rupiah } from "../lib/format.js";

import heroImg from "../assets/sunlit-mediterranean-hilltop-town-and-church-1.png";
// Foto yang sama tanpa langit (hanya gedung), ditumpuk di atas garis supaya garis lewat di belakang rumah
import heroBuildingsImg from "../assets/hero-gedung.webp";
import dripImg from "../assets/black-dripping-paint-silhouette-1.png";
import distanceIcon from "../assets/distance-rounded.svg";
import zoomIcon from "../assets/sharp-zoom-out-map.svg";
import searchIcon from "../assets/search.svg";
import checkIcon from "../assets/check.svg";

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

// Kata yang bergantian di judul hero: "Temukan kos yang ___ untukmu."
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
  // Filter baru dipakai setelah tombol "Cari" diklik; pencarian teks langsung (dengan jeda)
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

  const toggleFacility = (value) =>
    setFacilities((list) => (list.includes(value) ? list.filter((f) => f !== value) : [...list, value]));

  const pageRef = useRef(null);
  useScrollEffects(pageRef);

  const fill = ((maxPrice - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <main ref={pageRef} className="overflow-x-clip bg-[#f4f4f4]">
      {/* Bar tipis di atas yang terisi sesuai posisi scroll */}
      <div data-scroll-progress aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1 origin-left scale-x-0 bg-[#7d7fff]" />
      {/* ---------- Hero ---------- */}
      <section className="relative h-[min(820px,56vw)] min-h-[560px] overflow-hidden">
        {/* Urutan lapisan (skala & posisi sama): foto → garis zig-zag putih → foto gedung tanpa langit.
            Jadi garis berjalan di langit tapi lewat di BELAKANG rumah & gereja, termasuk saat parallax.
            data-parallax-anchor="top" = foto baru bergeser setelah halaman di-scroll. */}
        <div data-parallax="0.4" data-parallax-anchor="top" className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 1024"
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
          >
            <polyline
              className="kekos-draw"
              pathLength="1"
              points="0,540 270,450 455,548 629,379 739,488 965,264 1189,488 1445,236"
              fill="none"
              stroke="#fff"
              strokeWidth="7"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <img src={heroBuildingsImg} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
        </div>
        <Navbar notifOpenInitially={notifOpenInitially} overlay />
        <div data-scroll-fade className="relative z-10 px-6 pt-[130px] sm:pl-[16%] sm:pt-[170px]">
          <h1 data-reveal="left" className="font-poppins text-[34px] font-bold leading-tight text-white sm:text-[48px]">Halo, Sobat KeKos!</h1>
          <p data-reveal="left" style={{ "--reveal-delay": "120ms" }} className="font-poppins text-[22px] text-white sm:text-[32px]">
            Temukan kos yang{" "}
            <TextRotate texts={HERO_WORDS} className="rounded-lg bg-[#7d7fff] px-2 font-semibold" /> untukmu.
          </p>
          <p data-reveal="left" style={{ "--reveal-delay": "240ms" }} className="font-poppins text-base text-white sm:text-xl">Nyaman, dekat kampus, dan sesuai budget.</p>
          <div data-reveal="up" style={{ "--reveal-delay": "400ms" }} className="mt-4">
            <InteractiveHoverButton
              as="a"
              href="#cari-kos"
              className="border-white px-5 py-1.5 font-poppins text-[13px] shadow-[0_4px_4px_#00000040]"
            >
              Cari Kos!
            </InteractiveHoverButton>
          </div>
        </div>
      </section>

      {/* ---------- Panel pencarian (menumpuk di bawah hero, seperti widget pencarian Traveloka) ---------- */}
      <section id="cari-kos" aria-label="Cari kos" className="relative z-20 -mt-28 scroll-mt-6 px-4 sm:-mt-36">
        <form
          onSubmit={runSearch}
          className="mx-auto max-w-[1100px] rounded-2xl border border-[#e4e4ea] bg-white p-5 shadow-[0_16px_40px_#00000026] sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex h-[52px] flex-1 items-center gap-3 rounded-xl border border-[#dcdce2] bg-white px-4 transition-colors focus-within:border-[#7d7fff] sm:h-[56px]">
              <img src={searchIcon} alt="" className="h-6 w-6" />
              <span className="sr-only">Cari kos</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama kos atau daerah dekat kampus"
                className="min-w-0 flex-1 bg-transparent font-poppins text-base text-black outline-none placeholder:text-[#555] sm:text-lg"
              />
            </label>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="h-[52px] rounded-xl bg-black px-8 font-poppins text-base font-semibold text-white hover:bg-[#222] sm:h-[56px]"
            >
              Cari
            </motion.button>
          </div>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:justify-between md:gap-10">
            <div className="md:w-[460px]">
              <p className="font-inter text-xs font-semibold tracking-wider text-[#555]">TIPE KOS</p>
              <div className="mt-3 inline-flex rounded-full bg-[#f1f1f4] p-1" role="group" aria-label="Tipe kos">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={type === t.value}
                    onClick={() => setType(t.value)}
                    className={`relative h-8 w-[72px] rounded-full font-inter text-xs transition-colors ${
                      type === t.value ? "font-semibold text-black" : "text-[#666] hover:text-black"
                    }`}
                  >
                    {/* Satu latar putih yang meluncur ke tombol terpilih (layoutId yang sama) */}
                    {type === t.value && (
                      <motion.span
                        layoutId="tipe-kos-aktif"
                        className="absolute inset-0 rounded-full bg-white shadow-[0_1px_4px_#00000026]"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <label htmlFor="budget" className="font-inter text-xs font-semibold tracking-wider text-[#555]">
                  BUDGET PER BULAN
                </label>
                <span className="font-inter text-xs font-semibold text-black">
                  {rupiah(MIN_PRICE)} - {rupiah(maxPrice)}
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
                className="kekos-range mt-5 w-full"
                style={{ "--fill": `${fill}%` }}
              />
              <div className="mt-1 flex justify-between font-inter text-xs text-[#555]">
                <span>{rupiah(MIN_PRICE)}</span>
                <span>{rupiah(1500000)}</span>
                <span>{rupiah(MAX_PRICE)}+</span>
              </div>
            </div>

            <div className="md:w-[420px]">
              <p className="font-inter text-xs font-semibold tracking-wider text-[#555]">FASILITAS</p>
              <div className="mt-3 flex flex-wrap gap-x-2.5 gap-y-3">
                {FACILITIES.map((f) => {
                  const on = facilities.includes(f.value);
                  return (
                    <motion.button
                      key={f.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleFacility(f.value)}
                      whileTap={{ scale: 0.9 }}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 font-inter text-xs transition-colors ${
                        on
                          ? "border-[#7d7fff] bg-[#7d7fff1a] font-medium text-[#4b4dd6]"
                          : "border-[#dcdce2] bg-white text-[#333] hover:border-[#9a9aa5]"
                      }`}
                    >
                      {on && (
                        <motion.img
                          src={checkIcon}
                          alt=""
                          className="h-[7px] w-[10px]"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        />
                      )}
                      {f.label}
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {isFiltered && (
                  <motion.button
                    type="button"
                    onClick={resetFilters}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="mt-4 rounded-full px-3 py-1 font-inter text-xs font-medium text-[#4b4dd6] hover:bg-[#7d7fff1a]"
                  >
                    Reset filter
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </form>
      </section>

      {/* ---------- Hasil: grid kartu kos ---------- */}
      <section id="hasil-kos" className="mx-auto max-w-[1360px] scroll-mt-6 px-4 pb-24 pt-14">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-serif4 text-[26px] text-black sm:text-[32px]">Kos untukmu</h2>
          <p aria-live="polite" className="font-inter text-sm text-[#555]">
            {kosList.data ? `${kosList.data.length} kos ditemukan` : ""}
          </p>
        </div>

        <div className="mt-6">
          {kosList.loading && <p className="font-roboto text-sm text-[#555]">Memuat kos...</p>}
          {kosList.error && <p className="font-roboto text-sm text-[#c00]">{kosList.error}</p>}
          {kosList.data?.length === 0 && (
            <div className="flex flex-col items-start gap-3">
              <p className="font-roboto text-sm text-[#555]">Kos tidak ditemukan. Coba ubah filter atau kata kunci.</p>
              {(isFiltered || search) && (
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setSearch("");
                  }}
                  className="h-11 rounded-full border border-black px-5 font-poppins text-sm hover:bg-black hover:text-white"
                >
                  Reset filter &amp; pencarian
                </button>
              )}
            </div>
          )}
          {/* KosCard lebarnya tetap 308px, jadi kolom grid mengikuti lebar itu */}
          <div className="grid grid-cols-[repeat(auto-fill,308px)] justify-center gap-8">
            {/* Saat hasil filter berubah: kartu yang hilang mengecil & memudar, sisanya meluncur ke posisi baru */}
            <AnimatePresence mode="popLayout">
              {kosList.data?.map((kos) => (
                <motion.div
                  key={kos.id}
                  layout
                  initial={false}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <KosCard kos={kos}>
                    <div className="mt-3 flex items-center justify-center gap-[18px]">
                      <Link
                        to={`/kos/${kos.id}`}
                        className="rounded-md bg-[#2b2b2b] px-3 py-[7px] font-roboto text-sm text-white hover:bg-black"
                      >
                        Detail
                      </Link>
                      <Link
                        to={`/kos/${kos.id}/booking`}
                        className="w-[95px] rounded-md bg-black py-1 text-center font-roboto text-sm leading-[19px] text-white hover:bg-[#333]"
                      >
                        Booking
                        <br />
                        Cepat
                      </Link>
                    </div>
                  </KosCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ---------- Peta persebaran ---------- */}
      <section id="peta" className="relative bg-black pb-[140px] pt-[100px] sm:pb-[300px] sm:pt-[135px]">
        <h2 data-reveal="up" className="text-center font-spacemono text-[30px] font-bold leading-[1.3] text-white sm:text-[40px]">
          Peta
          <br />
          Persebaran Kos
        </h2>
        <p data-reveal="up" style={{ "--reveal-delay": "120ms" }} className="mx-auto mt-3 max-w-[689px] px-4 text-center font-serif4 text-base text-white sm:text-lg">
          Temukan kos di sekitar kampus dengan mudah melalui peta interaktif KeKos.
        </p>
        <div data-reveal="zoom" className="relative z-10 mx-auto mt-12 w-[min(1087px,calc(100%-32px))] overflow-hidden rounded-[20px] bg-white">
          <KosMap kos={allKos.data || []} className="aspect-[1087/481] min-h-[300px] w-full" />
          <div className="flex items-center gap-3 px-4 py-4 sm:h-[100px] sm:gap-4 sm:px-6">
            <img src={distanceIcon} alt="" className="h-10 w-10 shrink-0 invert sm:h-[60px] sm:w-[60px]" />
            <p className="flex-1 font-poppins text-lg text-black sm:text-[32px]">
              {allKos.data ? nearby : "…"} kos terdeteksi di sekitar radius {RADIUS_METERS / 1000}km
            </p>
            <button ref={zoomButtonRef} type="button" onClick={() => setMapOpen(true)} aria-label="Perbesar peta" className="flex h-11 w-11 shrink-0 items-center justify-center sm:h-auto sm:w-auto">
              <img src={zoomIcon} alt="" className="h-9 w-9 sm:h-[53px] sm:w-[53px]" />
            </button>
          </div>
        </div>
        <img
          src={dripImg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 w-full translate-y-[60%] select-none"
        />
      </section>
      {/* Ruang untuk tetesan cat yang menjuntai ±24vw di bawah peta */}
      <div aria-hidden="true" className="h-[max(120px,26vw)]" />

      {/* Latar memudar, peta membesar dari tengah; saat ditutup keduanya dibalik */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Peta persebaran kos"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000cc] p-4"
            onClick={() => setMapOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="h-full max-h-[860px] w-full max-w-[1400px] overflow-hidden rounded-xl"
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
              className="absolute right-6 top-6 z-[1000] h-11 rounded-full bg-white px-5 font-poppins text-sm shadow"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
