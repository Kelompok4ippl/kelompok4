import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout.jsx";
import { LineIcon } from "../components/Icon.jsx";
import {
  AvailabilityTag,
  FacilityChip,
  FacilityPicker,
  Field,
  FormPanel,
  PageBanner,
  Stepper,
  Toggle,
} from "../components/OwnerForm.jsx";
import { api } from "../api/client.js";
import { getCurrentUser } from "../api/auth.js";
import { useApi } from "../hooks/useApi.js";
import { imageUrl, rupiah } from "../lib/format.js";

// Frame Figma "Pemilik – Daftar Kamar (redesign)": tipe kamar dikelompokkan per kos
// + form kelola kamar di panel kanan
export default function PemilikKamar() {
  const list = useApi("/pemilik/kos");
  const fasilitas = useApi("/pemilik/fasilitas");
  const user = getCurrentUser();
  // { kosId, room }: room null = tambah tipe kamar baru di kos itu
  const [target, setTarget] = useState(null);
  const [notice, setNotice] = useState("");
  const [toggling, setToggling] = useState(null);
  const [toggleError, setToggleError] = useState("");
  // 0 = semua kos, selain itu id kos yang dipilih di filter
  const [kosFilter, setKosFilter] = useState(0);
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);

  const kosList = list.data || [];
  const current = target || (kosList[0] ? { kosId: kosList[0].id, room: null } : null);
  const q = query.trim().toLowerCase();
  const groups = kosList
    .filter((k) => !kosFilter || k.id === kosFilter)
    .map((k) => ({ kos: k, rooms: k.rooms.filter((r) => r.type.toLowerCase().includes(q)) }))
    .filter((g) => !q || g.rooms.length);

  const open = (next) => {
    setTarget(next);
    setNotice("");
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => panelRef.current?.querySelector("input")?.focus({ preventScroll: true }), 50);
  };

  const toggle = async (room, tersedia) => {
    setToggling(room.id);
    setToggleError("");
    try {
      await api(`/pemilik/kamar/${room.id}/status`, { method: "PATCH", body: { tersedia } });
      list.reload();
    } catch (err) {
      setToggleError(err.message);
    } finally {
      setToggling(null);
    }
  };

  return (
    <OwnerLayout
      panel={
        <div ref={panelRef} className="h-full">
          {current ? (
            <RoomForm
              key={`${current.kosId}-${current.room?.id ?? "baru"}`}
              kosList={kosList}
              target={current}
              options={fasilitas.data}
              notice={notice}
              onKosChange={(kosId) => setTarget({ kosId, room: null })}
              onCancel={current.room ? () => setTarget({ kosId: current.kosId, room: null }) : undefined}
              onSaved={(message) => {
                setTarget({ kosId: current.kosId, room: null });
                setNotice(message);
                list.reload();
              }}
            />
          ) : (
            <p className="text-sm text-steel-muted">
              {list.loading ? "Memuat..." : "Tambahkan kos dulu di menu Daftar Kos sebelum mengelola kamar."}
            </p>
          )}
        </div>
      }
    >
      <PageBanner
        name={user?.name || user?.nama}
        title="Daftar Kamar"
        description="Atur tipe kamar, harga, dan ketersediaan di setiap kos."
        actionLabel={kosList.length ? "Tambah Tipe Kamar" : undefined}
        onAction={() => open({ kosId: kosFilter || kosList[0]?.id, room: null })}
      />

      {kosList.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Pilih kos" className="flex flex-1 flex-wrap gap-2">
            {[{ id: 0, name: "Semua kos" }, ...kosList].map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={kosFilter === k.id}
                onClick={() => setKosFilter(k.id)}
                className={`min-h-9 rounded-full border px-3.5 text-[13px] font-medium ${
                  kosFilter === k.id ? "border-steel bg-steel text-white" : "border-steel-line bg-white text-steel-body hover:border-steel"
                }`}
              >
                {k.name}
              </button>
            ))}
          </div>
          <label className="flex h-[42px] items-center gap-2 rounded-xl border border-steel-line bg-white px-3 text-steel-muted focus-within:border-steel">
            <LineIcon name="search" className="h-[18px] w-[18px]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tipe kamar..."
              aria-label="Cari tipe kamar"
              className="w-[150px] bg-transparent text-sm text-steel-ink outline-none placeholder:text-steel-muted"
            />
          </label>
        </div>
      )}

      {list.loading && <p className="text-sm text-steel-muted">Memuat kamar...</p>}
      {list.error && (
        <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          {list.error}
        </p>
      )}
      {toggleError && (
        <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          {toggleError}
        </p>
      )}
      {list.data?.length === 0 && (
        <p className="rounded-2xl border border-dashed border-steel-line bg-white p-7 text-center text-sm text-steel-muted">
          Belum ada kos. Tambahkan kos dulu di menu Daftar Kos.
        </p>
      )}
      {kosList.length > 0 && groups.length === 0 && (
        <p className="rounded-2xl border border-dashed border-steel-line bg-white p-7 text-center text-sm text-steel-muted">
          Tidak ada tipe kamar yang cocok dengan pencarian.
        </p>
      )}

      <div className="flex flex-col gap-7">
        {groups.map(({ kos, rooms }) => {
          const totalKamar = kos.rooms.reduce((n, r) => n + (r.totalRooms || 0), 0);
          const tersedia = kos.rooms.reduce((n, r) => n + r.available, 0);
          return (
            <section key={kos.id} aria-labelledby={`kos-${kos.id}`} className="flex flex-col gap-3.5">
              <div className="flex flex-wrap items-center gap-3">
                <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-steel text-white">
                  <LineIcon name="building" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id={`kos-${kos.id}`} className="text-[17px] font-semibold text-steel-ink">
                    {kos.name}
                  </h2>
                  <p className="text-xs text-steel-muted">
                    {kos.rooms.length} tipe kamar • {totalKamar} kamar • {tersedia} tersedia
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => open({ kosId: kos.id, room: null })}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[13px] font-medium text-steel hover:bg-steel-tint-2"
                >
                  <LineIcon name="plus" className="h-4 w-4" />
                  Tipe kamar
                </button>
                <Link to="/pemilik/kos" className="inline-flex min-h-11 items-center gap-1.5 px-2 text-[13px] font-medium text-steel hover:underline">
                  Kelola kos
                  <LineIcon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
              {rooms.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-steel-line bg-white p-5 text-sm text-steel-muted">
                  Belum ada tipe kamar di kos ini.
                </p>
              ) : (
                <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                  {rooms.map((room) => (
                    <li key={room.id}>
                      <OwnerRoomCard
                        room={room}
                        kosName={kos.name}
                        selected={current?.room?.id === room.id}
                        onEdit={() => open({ kosId: kos.id, room })}
                        toggleDisabled={toggling === room.id}
                        onToggle={(on) => toggle(room, on)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </OwnerLayout>
  );
}

// Kartu tipe kamar: foto + jumlah tersedia, nama, deskripsi, fasilitas, harga, dan saklar ketersediaan
function OwnerRoomCard({ room, kosName, selected, onEdit, toggleDisabled, onToggle }) {
  const ada = room.available > 0;
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-[18px] border border-steel-line bg-white shadow-steel transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-steel-lg motion-reduce:transition-none ${
        selected ? "outline outline-2 -outline-offset-2 outline-steel" : ""
      }`}
    >
      <div className="relative aspect-[3/2] bg-steel-tint">
        <img src={imageUrl(room.image)} alt={`Foto ${room.type} di ${kosName}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[rgba(15,30,50,.28)] to-transparent to-40%" />
        <div className="absolute left-3 top-3">
          <AvailabilityTag ok={ada}>{ada ? `${room.available} tersedia` : "Penuh"}</AvailabilityTag>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-center gap-2">
          <LineIcon name="door" className="h-[18px] w-[18px] text-steel" />
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-steel-ink">{room.type}</h3>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${room.type} di ${kosName}`}
            className="grid h-11 w-11 place-items-center rounded-[10px] text-steel-body hover:bg-steel-tint-2 hover:text-steel"
          >
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-steel-line">
              <LineIcon name="pencil" className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>
        {room.description && <p className="text-xs text-steel-muted">{room.description}</p>}
        {room.facilities.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {room.facilities.map((f) => (
              <li key={f}>
                <FacilityChip name={f} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-center gap-2.5 border-t border-[#edf1f5] pt-3">
          <p className="flex-1 whitespace-nowrap">
            <span className="block text-[11px] text-steel-muted">Mulai dari</span>
            <span className="text-[15px] font-semibold tabular-nums text-steel-ink">{rupiah(room.price, { short: true })}</span>
            <span className="text-xs text-steel-muted"> /bln</span>
          </p>
          <Toggle
            checked={room.status === "tersedia"}
            disabled={toggleDisabled}
            label={`${room.type} ${kosName} bisa dibooking`}
            onChange={onToggle}
          />
        </div>
      </div>
    </article>
  );
}

function RoomForm({ kosList, target, options, notice, onKosChange, onCancel, onSaved }) {
  const { room } = target;
  const kos = kosList.find((k) => k.id === target.kosId);
  const [form, setForm] = useState({
    tipe: room?.type || "",
    harga: room ? String(room.price) : "",
    jumlahKamar: room ? String(room.totalRooms) : "1",
    deskripsi: room?.description || "",
    fasilitas: room?.facilities || [],
    // Hanya saat edit: kamar kosong sekarang (dinaikkan pemilik kalau ada penyewa keluar)
    kamarTersedia: room ? String(room.vacant ?? room.available) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      ...form,
      harga: Number(form.harga),
      jumlahKamar: Number(form.jumlahKamar),
      kamarTersedia: room ? Number(form.kamarTersedia) : undefined,
    };
    try {
      if (room) {
        await api(`/pemilik/kamar/${room.id}`, { method: "PUT", body });
        onSaved(`${form.tipe} di ${kos?.name} berhasil diperbarui.`);
      } else {
        await api(`/pemilik/kos/${target.kosId}/kamar`, { method: "POST", body });
        onSaved(`${form.tipe} ditambahkan ke ${kos?.name}.`);
      }
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <FormPanel
      title={room ? "Kelola Kamar" : "Tambah Tipe Kamar"}
      description={room ? `${kos?.name} • ${room.type}` : "Tambahkan tipe kamar baru beserta harganya."}
      subtitle="Informasi Kamar"
      onSubmit={submit}
      saving={saving}
      error={error}
      success={notice}
      submitLabel={room ? "Simpan Perubahan" : "Simpan Tipe Kamar"}
      onCancel={onCancel}
    >
      {!room && (
        <Field label="Kos" as="select" value={target.kosId} onChange={(e) => onKosChange(Number(e.target.value))}>
          {kosList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </Field>
      )}
      <Field label="Tipe kamar" value={form.tipe} onChange={set("tipe")} placeholder="Masukkan nama tipe, mis. Tipe A" required />
      <div className="grid grid-cols-[1.3fr_1fr] gap-3">
        <Field label="Harga per bulan" type="number" min="1" inputMode="numeric" prefix="Rp" value={form.harga} onChange={set("harga")} placeholder="Contoh: 1500000" required />
        <Stepper label="Jumlah kamar" value={form.jumlahKamar} onChange={(v) => setForm((f) => ({ ...f, jumlahKamar: v }))} />
      </div>
      {room && (
        <div className="flex flex-col gap-1.5">
          <Stepper
            label="Kamar kosong"
            min={0}
            max={Number(form.jumlahKamar) || 0}
            value={form.kamarTersedia}
            onChange={(v) => setForm((f) => ({ ...f, kamarTersedia: v }))}
          />
          <p className="text-xs text-steel-muted">
            Terisi {Math.max(0, (Number(form.jumlahKamar) || 0) - (Number(form.kamarTersedia) || 0))} dari {form.jumlahKamar || 0} kamar.
          </p>
        </div>
      )}
      <FacilityPicker
        label="Fasilitas kamar"
        options={options}
        value={form.fasilitas}
        onChange={(fasilitas) => setForm((f) => ({ ...f, fasilitas }))}
      />
      <Field
        label="Deskripsi kamar"
        as="textarea"
        value={form.deskripsi}
        onChange={set("deskripsi")}
        placeholder="Ceritakan isi dan kelebihan kamar"
      />
    </FormPanel>
  );
}
