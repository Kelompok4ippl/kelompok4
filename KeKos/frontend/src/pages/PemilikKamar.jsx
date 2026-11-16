import { useRef, useState } from "react";
import OwnerLayout from "../components/OwnerLayout.jsx";
import RoomCard from "../components/RoomCard.jsx";
import Icon from "../components/Icon.jsx";
import { FacilityPicker, Field, FormPanel, Toggle } from "../components/OwnerForm.jsx";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import buildingIcon from "../assets/building-icon.svg";

// Frame Figma "KeKos - Daftar Kamar": tipe kamar dikelompokkan per kos + form kelola kamar di panel kanan
export default function PemilikKamar() {
  const list = useApi("/pemilik/kos");
  const fasilitas = useApi("/pemilik/fasilitas");
  // { kosId, room }: room null = tambah tipe kamar baru di kos itu
  const [target, setTarget] = useState(null);
  const [notice, setNotice] = useState("");
  const [toggling, setToggling] = useState(null);
  const [toggleError, setToggleError] = useState("");
  const panelRef = useRef(null);

  const kosList = list.data || [];
  const current = target || (kosList[0] ? { kosId: kosList[0].id, room: null } : null);

  const open = (next) => {
    setTarget(next);
    setNotice("");
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      title="Tipe Kamar & Inventaris"
      panel={
        <div ref={panelRef}>
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
            <p className="font-serif4 text-base">Tambahkan kos dulu di menu Daftar Kos sebelum mengelola kamar.</p>
          )}
        </div>
      }
    >
      {list.loading && <p className="mt-10 text-center font-inter text-sm text-muted">Memuat kamar...</p>}
      {list.error && <p role="alert" className="mt-10 text-center font-inter text-sm text-danger">{list.error}</p>}
      {toggleError && <p role="alert" className="mt-6 text-center font-inter text-sm text-danger">{toggleError}</p>}
      {list.data?.length === 0 && <p className="mt-10 text-center font-inter text-sm text-muted">Belum ada kos.</p>}

      <div className="mt-8 flex flex-col gap-4">
        {kosList.map((kos) => (
          <section key={kos.id} aria-labelledby={`kos-${kos.id}`} className="rounded-md border border-[#9a9aa5] bg-[#e1e1e1] p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`kos-${kos.id}`} className="flex items-center gap-3 font-serif4 text-2xl font-bold text-[#333]">
                {kos.name}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                  <Icon src={buildingIcon} className="h-4 w-4" />
                </span>
              </h2>
              <button
                type="button"
                onClick={() => open({ kosId: kos.id, room: null })}
                className="h-11 rounded-lg bg-black px-4 font-poppins text-sm font-semibold text-white hover:bg-[#333]"
              >
                + Tambah tipe kamar
              </button>
            </div>
            {kos.rooms.length === 0 ? (
              <p className="mt-3 font-inter text-sm text-muted">Belum ada tipe kamar di kos ini.</p>
            ) : (
              <ul className="mt-3 grid gap-6 md:grid-cols-2">
                {kos.rooms.map((room) => {
                  const active = current?.room?.id === room.id;
                  return (
                    <li key={room.id} className={active ? "rounded-[14px] ring-4 ring-primary" : ""}>
                      <RoomCard
                        room={room}
                        framed
                        headerAction={
                          <button
                            type="button"
                            onClick={() => open({ kosId: kos.id, room })}
                            aria-label={`Edit ${room.type} di ${kos.name}`}
                            className="-my-2 inline-flex h-11 items-center"
                          >
                            <span className="rounded-md bg-black px-4 py-0.5 font-roboto text-sm font-semibold text-white">Edit</span>
                          </button>
                        }
                        footerAction={
                          <div className="flex items-center gap-3">
                            <span className="rounded-full border border-muted px-3 py-0.5 font-poppins text-xs">
                              {room.available > 0 ? `${room.available} Tersedia` : "Tidak tersedia"}
                            </span>
                            <Toggle
                              checked={room.status === "tersedia"}
                              disabled={toggling === room.id}
                              label={`${room.type} ${kos.name} bisa dibooking`}
                              onChange={(on) => toggle(room, on)}
                            />
                          </div>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </OwnerLayout>
  );
}

function RoomForm({ kosList, target, options, notice, onKosChange, onCancel, onSaved }) {
  const { room } = target;
  const kos = kosList.find((k) => k.id === target.kosId);
  const [form, setForm] = useState({
    tipe: room?.type || "",
    harga: room ? String(room.price) : "",
    jumlahKamar: room ? String(room.totalRooms) : "",
    deskripsi: room?.description || "",
    fasilitas: room?.facilities || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = { ...form, harga: Number(form.harga), jumlahKamar: Number(form.jumlahKamar) };
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
      title={room ? "Kelola kamar" : "Tambah tipe kamar"}
      subtitle="Informasi Kamar"
      onSubmit={submit}
      saving={saving}
      error={error}
      success={notice}
      onCancel={onCancel}
    >
      {room ? (
        <p className="font-serif4 text-sm">
          Kos: <span className="font-bold">{kos?.name}</span>
        </p>
      ) : (
        <Field label="Kos" as="select" value={target.kosId} onChange={(e) => onKosChange(Number(e.target.value))}>
          {kosList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </Field>
      )}
      <Field label="Tipe Kamar" value={form.tipe} onChange={set("tipe")} placeholder="Tipe A" required />
      <Field label="Harga Kamar" type="number" min="1" inputMode="numeric" suffix="/bulan" value={form.harga} onChange={set("harga")} placeholder="1800000" required />
      <Field
        label={room ? "Ubah/tambah Jumlah Kamar" : "Jumlah Kamar"}
        type="number"
        min="1"
        inputMode="numeric"
        value={form.jumlahKamar}
        onChange={set("jumlahKamar")}
        placeholder="2"
        required
      />
      <FacilityPicker
        label={room ? "Ubah fasilitas" : "Fasilitas"}
        options={options}
        value={form.fasilitas}
        onChange={(fasilitas) => setForm((f) => ({ ...f, fasilitas }))}
      />
      <Field
        label="Deskripsi Kamar"
        as="textarea"
        value={form.deskripsi}
        onChange={set("deskripsi")}
        placeholder="pemandangan indah kota langsung dari jendela kamar Anda."
      />
    </FormPanel>
  );
}
