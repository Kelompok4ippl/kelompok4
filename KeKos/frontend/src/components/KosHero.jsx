import { useApi } from "../hooks/useApi.js";
import { useAutoSlide } from "../hooks/useAutoSlide.js";
import { imageUrl, rupiah } from "../lib/format.js";
import heroBg from "../assets/moody-blue-twilight-bedroom-office-1.png";

const PropertyCard = ({ kos }) => (
  <article className="flex w-[220px] shrink-0 items-center gap-2.5 rounded-xl bg-white p-2 pr-3 font-poppins text-steel-ink shadow-[0_10px_24px_-12px_rgba(0,0,0,.45)]">
    <img draggable={false} className="h-12 w-12 shrink-0 rounded-lg object-cover" alt="" src={imageUrl(kos.image)} />
    <div className="min-w-0">
      <h3 className="truncate text-[13px] font-semibold">{kos.name}</h3>
      <p className="text-[12px] font-semibold">
        {kos.price ? rupiah(kos.price) : "Harga belum diatur"}
        {kos.price ? <span className="font-normal text-steel-muted"> /bln</span> : null}
      </p>
      <p className="text-[11px] text-steel-muted">
        {kos.reviews > 0 ? (
          <>
            <span className="text-amber">★</span> {kos.rating.toFixed(1).replace(".", ",")} ({kos.reviews})
          </>
        ) : (
          "Belum ada ulasan"
        )}
      </p>
    </div>
  </article>
);

// Panel kiri halaman login/daftar: foto kamar dengan lapisan biru, judul, paragraf, dan kartu kos terverifikasi.
// showTagline: tampilkan paragraf penjelasan di bawah judul.
export default function KosHero({ showTagline = true }) {
  const sliderRef = useAutoSlide(30);
  // FR-02: preview kos terverifikasi dari database; kalau belum ada data, deretan kartu disembunyikan
  const preview = useApi("/preview-kos");
  const kosList = preview.data || [];

  return (
    <section aria-label="Tentang KeKos" className="relative flex min-w-0 flex-1 flex-col overflow-hidden px-6 pb-10 pt-10 text-white sm:px-10 lg:min-h-screen lg:pt-[18vh]">
      <img className="absolute inset-0 h-full w-full object-cover" alt="" src={heroBg} />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,58,92,.8)_0%,rgba(36,74,113,.74)_55%,rgba(29,58,92,.86)_100%)]" />
      <div className="relative">
        <h2 className="max-w-[480px] font-serif4 text-[30px] font-bold leading-[1.15] sm:text-[40px]">Cari &amp; kelola hunian impian jadi lebih mudah.</h2>
        {showTagline && (
          <p className="mt-4 max-w-[440px] font-poppins text-sm leading-relaxed text-[#d6e1ec]">
            Bandingkan harga, fasilitas, dan lokasi kos dalam satu tempat. Pemilik kos juga bisa mengelola kamar dan booking dengan mudah.
          </p>
        )}
      </div>

      {/* Kartu kos bergeser sendiri dan bisa digeser manual (lihat hooks/useAutoSlide.js).
          Daftar kartu ditulis 2x supaya putarannya menyambung tanpa jeda. */}
      <div
        ref={sliderRef}
        className={`relative mt-6 flex cursor-grab select-none overflow-x-auto pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${kosList.length ? "" : "hidden"}`}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-3 pr-3" aria-hidden={copy === 1}>
            {kosList.map((kos) => (
              <PropertyCard key={kos.id} kos={kos} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
