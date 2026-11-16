import { useApi } from "../hooks/useApi.js";
import { useAutoSlide } from "../hooks/useAutoSlide.js";
import { imageUrl, rupiah } from "../lib/format.js";
import heroBg from "../assets/moody-blue-twilight-bedroom-office-1.png";

const PropertyCard = ({ kos }) => (
  <article className="relative flex w-[308px] shrink-0 flex-col gap-[3px] rounded-[15px] bg-white px-2 pb-3.5 pt-2 text-ink shadow-[0px_15px_18px_#00000022]">
    <img
      draggable={false}
      className="aspect-[1.79] w-full rounded-lg object-cover"
      alt={kos.name}
      src={imageUrl(kos.image)}
    />
    <div className="flex items-start justify-between gap-2 px-1 pt-2">
      <h3 className="font-inter text-base">{kos.name}</h3>
      <p className="whitespace-nowrap font-inter text-[13px]">
        {kos.reviews > 0 ? (
          <>
            {kos.rating.toFixed(1)} <span className="text-star">★</span>{" "}
            <span className="text-muted">({kos.reviews})</span>
          </>
        ) : (
          <span className="text-muted">Belum ada ulasan</span>
        )}
      </p>
    </div>
    <p className="px-1 font-inter text-base">
      {kos.price ? `Mulai ${rupiah(kos.price, { short: true })}/bln` : "Harga belum diatur"}
    </p>
    <ul className="flex flex-wrap gap-3 px-1 pt-[7px] font-inter text-sm">
      {kos.facilities.map((facility) => (
        <li key={facility}>{facility}</li>
      ))}
    </ul>
    <span className="absolute right-3 top-[138px] rounded-lg bg-badge-soft px-[7px] py-1 font-inter text-[13px] text-badge">
      {kos.roomsLeft > 0 ? `Sisa ${kos.roomsLeft} Kamar!` : "Penuh"}
    </span>
  </article>
);

// Bagian kiri halaman login/daftar (versi Tailwind): foto kamar, judul kaca, dan kartu kos.
// showTagline: tampilkan kalimat "Temukan kos favorit..." di bawah judul (halaman login punya, register tidak).
export default function KosHero({ showTagline = true }) {
  const sliderRef = useAutoSlide(40);
  // FR-02: preview kos terverifikasi dari database; kalau belum ada data, deretan kartu disembunyikan
  const preview = useApi("/preview-kos");
  const kosList = preview.data || [];

  return (
    <section
      aria-label="Informasi kos"
      className="relative min-w-0 flex-1 overflow-hidden bg-[#0e1c51] pb-10 pt-[62px] text-white min-[1100px]:max-w-[857px] min-[1100px]:rounded-l-[11px]"
    >
      <img className="absolute inset-0 h-full w-full object-cover" alt="" src={heroBg} />
      <div className="relative mx-auto flex min-h-[180px] w-[min(534px,calc(100%-32px))] items-center justify-center rounded-[25px] bg-[#d9d9d933] px-1.5 py-6 backdrop-blur-[2px] shadow-[inset_0_1px_0_rgba(255,255,255,0.40),inset_1px_0_0_rgba(255,255,255,0.32),inset_0_-1px_1px_rgba(0,0,0,0.13),inset_-1px_0_1px_rgba(0,0,0,0.11)]">
        <h2 className="text-center font-inter text-[28px] leading-[34px] tracking-[-0.3px] sm:text-[40px] sm:leading-[46.4px]">
          Cari &amp; Kelola Hunian Impian
          <br />
          Jadi Lebih Mudah.
        </h2>
      </div>
      {showTagline && (
        <p className="relative mx-auto mt-[18px] w-[min(545px,calc(100%-32px))] pl-3 font-inter text-lg leading-[21px]">
          Temukan kos favorit atau kelola properti Anda dalam
          <br />
          satu platform cerdas.
        </p>
      )}
      {/* Kartu kos bergeser ke kanan sendiri dan bisa digeser manual (lihat hooks/useAutoSlide.js).
          Daftar kartu ditulis 2x supaya putarannya menyambung tanpa jeda. */}
      <div
        ref={sliderRef}
        className={`relative mt-16 flex cursor-grab select-none overflow-x-auto pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          kosList.length ? "" : "hidden"
        } ${
          showTagline ? "min-[1100px]:mt-40" : "min-[1100px]:mt-[206px]"
        }`}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-[38px] pr-[38px]" aria-hidden={copy === 1}>
            {kosList.map((kos) => (
              <PropertyCard key={kos.id} kos={kos} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
