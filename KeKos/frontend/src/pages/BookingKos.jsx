import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import Gallery from "../components/Gallery.jsx";
import KosInfo from "../components/KosInfo.jsx";
import RoomCard from "../components/RoomCard.jsx";
import { rupiah } from "../lib/format.js";
import backIcon from "../assets/arrow-back-2.svg";

// Booking cepat: pilih tipe kamar di kiri, lalu "Booking Sekarang".
// Tombol berubah sesuai status: Booking Sekarang → Proses Booking (menunggu pemilik) → Telah Terbooking.
export default function BookingKos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const kos = useApi(`/kos/${id}`);
  const bookings = useApi(`/booking?kos_id=${id}`);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (kos.loading || bookings.loading) return <p className="p-10 font-poppins">Memuat...</p>;
  if (kos.error) return <p className="p-10 font-poppins text-[#c00]">{kos.error}</p>;

  const data = kos.data;
  // Booking aktif terakhir (menunggu / diterima); booking yang ditolak boleh diulang
  const active = bookings.data?.find((b) => b.status !== "ditolak");
  const rejected = !active && bookings.data?.some((b) => b.status === "ditolak");
  const firstAvailable = data.rooms.find((r) => r.available > 0);
  const selected =
    data.rooms.find((r) => r.id === (active?.roomId ?? selectedId)) || firstAvailable || data.rooms[0];

  const book = async () => {
    if (!selected || selected.available <= 0) return;
    setSaving(true);
    setError("");
    try {
      await api("/booking", { method: "POST", body: { kamar_id: selected.id } });
      bookings.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const status = active?.status;
  const buttonText = status === "diterima" ? "Telah Terbooking" : status === "menunggu" ? "Proses Booking" : "Booking Sekarang";
  const roomLetter = selected?.type.replace(/^Tipe\s*/i, "") || "Standar";
  const waNumber = active?.ownerPhone?.replace(/\D/g, "").replace(/^0/, "62");

  return (
    <main className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* Kiri: daftar tipe kamar */}
      <aside className="bg-black px-4 pb-10 pt-8 lg:sticky lg:top-0 lg:h-screen lg:w-[600px] lg:shrink-0 lg:overflow-y-auto lg:px-[123px] lg:pt-9">
        <div className="relative flex items-center justify-center lg:-mx-[94px]">
          <button type="button" onClick={() => navigate(-1)} aria-label="Kembali" className="absolute left-0">
            <img src={backIcon} alt="" className="h-6 w-6" />
          </button>
          <h1 className="font-serif4 text-2xl font-bold text-white">Tipe Kamar</h1>
        </div>
        <div className="mx-auto mt-10 flex max-w-[355px] flex-col gap-[13px] lg:mt-[85px]">
          {data.rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              selected={room.id === selected?.id && !active}
              onSelect={active ? undefined : () => setSelectedId(room.id)}
              note={active?.roomId === room.id && status === "menunggu" ? "Menunggu Konfirmasi Pemilik" : null}
            />
          ))}
          {!data.rooms.length && <p className="font-poppins text-sm text-white">Belum ada tipe kamar.</p>}
        </div>
      </aside>

      {/* Kanan: ringkasan dan tombol booking */}
      <section className="flex-1 px-4 pb-16 pt-6 sm:px-14 lg:max-w-[840px]">
        <h2 className="text-center font-poppins text-2xl font-semibold text-black">Booking Cepat</h2>
        <Gallery photos={data.photos} max={2} className="mt-5 sm:p-4" />

        <div className="mt-12 grid gap-10 md:grid-cols-[331px_1fr] md:gap-[53px]">
          <div>
            <p className="font-inter text-[30px] font-semibold leading-[39px] text-black">
              {selected?.available > 0 || status ? "Kos tersedia" : "Kamar penuh"}
              <br />
              {selected?.available > 0 || status ? "Siap dibooking" : "Pilih tipe lain"}
            </p>
            <p className="mt-1 font-inter text-base font-semibold leading-[23px] text-[#8a8a8a]">
              Kamar masih tersedia untuk anda booking
            </p>
            <button
              type="button"
              onClick={book}
              disabled={Boolean(status) || saving || !selected || selected.available <= 0}
              className="mt-[50px] h-[42px] w-full rounded-lg bg-black font-roboto text-lg font-medium text-white enabled:hover:bg-[#222] disabled:cursor-default"
            >
              {saving ? "Memproses..." : buttonText}
            </button>
            <p className="mt-4 font-inter text-[11px] font-bold leading-[15px] text-black">
              Booking gratis, tanpa pembayaran!
              <br />
              Pesan kos sekarang tanpa perlu membayar.
            </p>
            {error && <p className="mt-3 font-inter text-xs text-[#c00]">{error}</p>}
            {rejected && <p className="mt-3 font-inter text-xs text-[#a43016]">Booking sebelumnya ditolak pemilik. Kamu bisa memilih kamar lain.</p>}
            {status === "diterima" && (
              <div className="mx-auto mt-[60px] w-[240px] rounded-lg bg-black px-4 py-3 text-center text-white shadow-[0_0_12px_#00000080]">
                <p className="font-roboto text-[10px] leading-[12px]">
                  Silahkan hubungi contact di bawah ini untuk melanjutakan pembayaran
                </p>
                {waNumber ? (
                  <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="mt-2 block font-roboto text-sm hover:underline">
                    wa.me/+{waNumber}
                  </a>
                ) : (
                  <p className="mt-2 font-roboto text-sm">Nomor pemilik belum diisi</p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-poppins text-xl font-semibold text-black">{data.name}</h3>
            <p className="mt-2 font-poppins text-xl text-black">
              <span className="font-semibold">{rupiah(selected?.price ?? data.price)}</span> / bulan
            </p>
            <p className="mt-1 max-w-[200px] font-serif4 text-[11px] leading-[15px] text-[#777]">{selected?.description}</p>
            <h4 className="mt-6 border-l-[3px] border-black pl-3 font-poppins text-lg font-semibold text-black">Informasi</h4>
            <div className="mt-5">
              <KosInfo
                ownerName={data.owner.name}
                roomsLeft={selected?.available ?? data.roomsLeft}
                roomType={status ? roomLetter : "Standar"}
                facilities={selected?.facilities ?? data.facilities}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
