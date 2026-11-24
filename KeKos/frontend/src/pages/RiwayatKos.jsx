import { useState } from "react";
import { api } from "../api/client.js";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi.js";
import { getCurrentUser } from "../api/auth.js";
import Navbar from "../components/Navbar.jsx";
import PageState from "../components/PageState.jsx";
import { RatingDialog } from "../components/Modal.jsx";
import KosCard from "../components/KosCard.jsx";
import { LineIcon } from "../components/Icon.jsx";
import { imageUrl, rupiah, KOS_TYPE_LABEL, tanggalPanjang, tanggalSelesai } from "../lib/format.js";

const STATUS = {
  menunggu: { label: "Menunggu konfirmasi", tone: "bg-amber-soft text-amber-ink" },
  diterima: { label: "Diterima", tone: "bg-ok-soft text-ok" },
  ditolak: { label: "Ditolak", tone: "bg-bad-soft text-bad" },
};

const TABS = [
  ["semua", "Semua"],
  ["menunggu", "Menunggu"],
  ["diterima", "Diterima"],
  ["ditolak", "Ditolak"],
  ["tersimpan", "Tersimpan"],
];

function tanggal(d) {
  return d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
}

function waLink(phone) {
  const n = phone?.replace(/\D/g, "").replace(/^0/, "62");
  return n ? `https://wa.me/${n}` : null;
}

// Riwayat kos pencari: semua booking yang pernah diajukan beserta statusnya.
// Booking yang sudah diterima bisa diberi rating (FR-07) lewat pop-up "Beri rating".
export default function RiwayatKos() {
  const user = getCurrentUser();
  const { data, error, loading, reload } = useApi("/booking");
  const [tab, setTab] = useState("semua");
  const [rateFor, setRateFor] = useState(null);
  const [thanks, setThanks] = useState("");
  // Kos yang disimpan lewat tombol "Simpan" di halaman detail
  const favorit = useApi("/kos/favorit");
  const unsave = async (kosId) => {
    try {
      await api(`/kos/${kosId}/favorit`, { method: "DELETE" });
    } finally {
      favorit.reload();
    }
  };

  if (loading) return <PageState loading />;
  if (error) return <PageState message={error} />;

  const list = data || [];
  const count = (s) => list.filter((b) => b.status === s).length;
  // Satu kos cukup dinilai sekali: rating diambil per kos, bukan per booking
  const rated = new Set(list.filter((b) => b.myRating != null).map((b) => b.kosId));
  const toRate = list.find((b) => b.status === "diterima" && !rated.has(b.kosId));
  const shown = tab === "semua" ? list : list.filter((b) => b.status === tab);

  const stats = [
    ["building", "Total booking", list.length, "bg-steel-tint text-steel"],
    ["bell", "Menunggu", count("menunggu"), "bg-amber-soft text-[#9a6b12]"],
    ["check", "Diterima", count("diterima"), "bg-ok-soft text-ok"],
    ["x", "Ditolak", count("ditolak"), "bg-bad-soft text-bad"],
  ];

  return (
    <div className="min-h-screen bg-steel-bg font-poppins text-steel-ink">
      <Navbar />
      <main className="mx-auto max-w-[1240px] px-4 pb-16 pt-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-steel-muted">Halo, {user?.nama?.split(" ")[0] || "kamu"}</p>
            <h1 className="font-serif4 text-[32px] font-bold leading-tight">Riwayat kos</h1>
            <p className="mt-1 text-sm text-steel-muted">Pantau status booking dan beri rating kos yang pernah kamu tempati.</p>
          </div>
          <Link to="/dashboard#cari-kos" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-steel px-4 text-sm font-semibold text-white hover:bg-steel-strong">
            <LineIcon name="search" className="h-4 w-4" />
            Cari kos lagi
          </Link>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(([icon, label, value, tone]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-steel-line bg-white p-4 shadow-steel">
              <span aria-hidden="true" className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                <LineIcon name={icon} />
              </span>
              <div>
                <dt className="text-xs text-steel-muted">{label}</dt>
                <dd className="text-2xl font-semibold leading-tight">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        {thanks && (
          <p role="status" className="mt-5 rounded-xl bg-ok-soft px-4 py-3 text-sm font-medium text-ok">
            {thanks}
          </p>
        )}

        {/* Ajakan memberi rating untuk kos yang sudah diterima tetapi belum dinilai */}
        {toRate && (
          <section className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-steel-side to-steel-side-2 p-5 text-white shadow-steel-lg">
            <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 text-2xl text-amber">
              ★
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">Bagaimana pengalamanmu di {toRate.kosName}?</h2>
              <p className="text-sm text-[#c9d6e4]">Rating kamu membantu pencari kos lain memilih kos yang tepat.</p>
            </div>
            <button
              type="button"
              onClick={() => setRateFor(toRate)}
              className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-steel-side hover:bg-steel-tint"
            >
              Beri rating sekarang
            </button>
          </section>
        )}

        <section aria-labelledby="judul-riwayat" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="judul-riwayat" className="text-lg font-semibold">
              {tab === "tersimpan" ? "Kos tersimpan" : "Daftar booking"}
            </h2>
            <div role="tablist" aria-label="Filter status" className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-steel-line">
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${tab === key ? "bg-steel text-white" : "text-steel-body hover:bg-steel-tint-2"}`}
                >
                  {label}
                  {key === "tersimpan" ? ` (${favorit.data?.length ?? 0})` : key !== "semua" && ` (${count(key)})`}
                </button>
              ))}
            </div>
          </div>

          {tab === "tersimpan" ? (
            favorit.data?.length ? (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favorit.data.map((kos) => (
                  <li key={kos.id}>
                    <KosCard kos={kos}>
                      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#edf1f5] pt-3">
                        <button
                          type="button"
                          onClick={() => unsave(kos.id)}
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-steel-line text-sm font-semibold text-steel-body hover:border-bad hover:text-bad"
                        >
                          <LineIcon name="heart" className="h-4 w-4" />
                          Hapus
                        </button>
                        <Link
                          to={`/kos/${kos.id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-steel text-sm font-semibold text-white hover:bg-steel-strong"
                        >
                          Lihat kos
                        </Link>
                      </div>
                    </KosCard>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-steel-dash bg-white px-6 py-12 text-center">
                <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#fbeef1] text-[#b4415e]">
                  <LineIcon name="heart" />
                </span>
                <p className="mt-3 font-semibold">{favorit.loading ? "Memuat kos tersimpan..." : "Belum ada kos tersimpan"}</p>
                <p className="mt-1 text-sm text-steel-muted">Tekan tombol Simpan di halaman detail kos untuk menyimpannya di sini.</p>
              </div>
            )
          ) : shown.length ? (
            <ul className="mt-4 flex flex-col gap-3">
              {shown.map((b) => {
                const st = STATUS[b.status] || STATUS.menunggu;
                const wa = b.status === "diterima" ? waLink(b.ownerPhone) : null;
                return (
                  <li key={b.id} className="flex flex-col gap-4 rounded-2xl border border-steel-line bg-white p-3 shadow-steel sm:flex-row sm:items-center sm:p-4">
                    <img src={imageUrl(b.image)} alt="" className="h-40 w-full shrink-0 rounded-xl object-cover sm:h-[104px] sm:w-[140px]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.tone}`}>{st.label}</span>
                        {b.kosType && <span className="text-[11px] font-semibold text-steel-muted">{(KOS_TYPE_LABEL[b.kosType] || b.kosType).toUpperCase()}</span>}
                      </div>
                      <h3 className="mt-1 truncate text-base font-semibold">{b.kosName || `Kos #${b.kosId}`}</h3>
                      {b.address && (
                        <p className="flex items-center gap-1 truncate text-xs text-steel-muted">
                          <LineIcon name="pin" className="h-3.5 w-3.5 shrink-0" /> {b.address}
                        </p>
                      )}
                      <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-steel-body">
                        <span>
                          Kamar <strong className="font-semibold">{b.roomType || "-"}</strong>
                        </span>
                        {b.price ? (
                          <span>
                            <strong className="font-semibold">{rupiah(b.price, { short: true })}</strong>/bulan
                          </span>
                        ) : null}
                        <span>Diajukan {tanggal(b.createdAt)}</span>
                      </p>
                      {b.moveInDate && (
                        <p className="mt-1 text-xs text-steel-body">
                          Masuk <strong className="font-semibold">{tanggalPanjang(b.moveInDate)}</strong>
                          {b.duration ? (
                            <>
                              {" "}
                              • {b.duration} bulan (s/d {tanggalPanjang(tanggalSelesai(b.moveInDate, b.duration))})
                            </>
                          ) : null}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                      {b.status === "diterima" &&
                        (rated.has(b.kosId) ? (
                          <span className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-amber-soft px-3 text-xs font-semibold text-amber-ink">
                            Rating kamu <span className="text-amber">★</span> {list.find((x) => x.kosId === b.kosId && x.myRating != null)?.myRating}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRateFor(b)}
                            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-steel px-3.5 text-xs font-semibold text-white hover:bg-steel-strong"
                          >
                            <span className="text-amber">★</span> Beri rating
                          </button>
                        ))}
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-ok-soft px-3.5 text-xs font-semibold text-ok hover:bg-[#d4eadd]"
                        >
                          Hubungi pemilik
                        </a>
                      )}
                      <Link
                        to={b.status === "ditolak" ? `/kos/${b.kosId}/booking` : `/kos/${b.kosId}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-steel-line px-3.5 text-xs font-semibold text-steel hover:bg-steel-tint-2"
                      >
                        {b.status === "ditolak" ? "Pilih kamar lain" : "Lihat kos"}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-steel-dash bg-white px-6 py-12 text-center">
              <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-tint text-steel">
                <LineIcon name="building" />
              </span>
              <p className="mt-3 font-semibold">{list.length ? "Tidak ada booking dengan status ini" : "Belum ada riwayat booking"}</p>
              <p className="mt-1 text-sm text-steel-muted">Booking kos yang kamu ajukan akan muncul di sini.</p>
              {!list.length && (
                <Link to="/dashboard" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-steel px-4 text-sm font-semibold text-white hover:bg-steel-strong">
                  Cari kos
                </Link>
              )}
            </div>
          )}
        </section>
      </main>

      {rateFor && (
        <RatingDialog
          kos={{ id: rateFor.kosId, name: rateFor.kosName || `Kos #${rateFor.kosId}`, image: rateFor.image, subtitle: rateFor.roomType && `Kamar ${rateFor.roomType}` }}
          onClose={() => setRateFor(null)}
          onDone={() => {
            setThanks(`Terima kasih! Rating untuk ${rateFor.kosName || "kos ini"} sudah tersimpan.`);
            setRateFor(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
