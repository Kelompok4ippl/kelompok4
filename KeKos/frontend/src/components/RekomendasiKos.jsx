import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import KosCard from "./KosCard.jsx";
import { LineIcon } from "./Icon.jsx";
import { useApi } from "../hooks/useApi.js";

// FR-08 Rekomendasi berdasarkan lokasi. Skor dihitung backend dengan logika fuzzy (backend/src/fuzzy.js).
//   lokasi diizinkan → skor fuzzy dari jarak + rating
//   GPS mati / gagal  → pesan "Nyalakan GPS..." + tombol Coba Lagi
//   izin ditolak      → rekomendasi berdasarkan rating saja
export default function RekomendasiKos() {
  // Browser tanpa fitur lokasi diperlakukan sama dengan izin ditolak
  const [lokasi, setLokasi] = useState(() => ({ status: navigator.geolocation ? "meminta" : "ditolak" }));

  // State hanya diubah di callback, setelah browser menjawab
  const cariLokasi = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLokasi({ status: "ok", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setLokasi({ status: err.code === err.PERMISSION_DENIED ? "ditolak" : "gpsMati" }),
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);
  useEffect(cariLokasi, [cariLokasi]);
  const cobaLagi = () => {
    setLokasi({ status: "meminta" });
    cariLokasi();
  };

  const path =
    lokasi.status === "ok"
      ? `/kos/rekomendasi?lat=${lokasi.lat}&lng=${lokasi.lng}`
      : lokasi.status === "ditolak"
        ? "/kos/rekomendasi"
        : null;
  const rekom = useApi(path);

  return (
    <section aria-labelledby="judul-rekomendasi" className="mx-auto max-w-[1240px] px-4 pt-14 sm:px-6">
      <h2 id="judul-rekomendasi" className="font-serif4 text-[28px] font-bold sm:text-[34px]">
        Rekomendasi untukmu
      </h2>
      <p className="mt-1 text-sm text-steel-muted">
        {lokasi.status === "ditolak"
          ? "Izin lokasi tidak diberikan, jadi rekomendasi diurutkan berdasarkan rating."
          : "Kos terdekat dari lokasimu dengan rating tinggi, dinilai dengan logika fuzzy."}
      </p>

      <div aria-live="polite" className="mt-5">
        {(lokasi.status === "meminta" || rekom.loading) && <p className="text-sm text-steel-muted">Mencari rekomendasi...</p>}

        {lokasi.status === "gpsMati" && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-steel-line bg-white p-5">
            <LineIcon name="pin" className="h-5 w-5 text-steel" />
            <p className="flex-1 text-sm text-steel-body">Nyalakan GPS untuk rekomendasi terdekat</p>
            <button
              type="button"
              onClick={cobaLagi}
              className="min-h-11 rounded-xl bg-steel px-5 text-sm font-semibold text-white hover:bg-steel-strong"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {rekom.error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
            {rekom.error}
          </p>
        )}
        {rekom.data?.length === 0 && <p className="text-sm text-steel-muted">Belum ada kos untuk direkomendasikan.</p>}

        {rekom.data?.length > 0 && (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {rekom.data.slice(0, 4).map((kos) => (
              <KosCard key={kos.id} kos={kos}>
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#edf1f5] pt-3">
                  <p className="text-xs text-steel-muted">
                    {kos.score != null ? (
                      <>
                        Skor <span className="font-semibold text-steel-ink">{Math.round(kos.score)}</span>/100 •{" "}
                        {kos.distanceKm.toFixed(1).replace(".", ",")} km darimu
                      </>
                    ) : (
                      "Urut berdasarkan rating"
                    )}
                  </p>
                  <Link
                    to={`/kos/${kos.id}`}
                    className="inline-flex min-h-11 items-center rounded-xl border border-steel-line px-4 text-sm font-semibold text-steel-body hover:border-steel hover:text-steel"
                  >
                    Detail
                  </Link>
                </div>
              </KosCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
