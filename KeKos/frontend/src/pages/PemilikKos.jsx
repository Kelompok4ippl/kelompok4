import { useRef, useState } from "react";
import OwnerLayout from "../components/OwnerLayout.jsx";
import KosCard from "../components/KosCard.jsx";
import { FacilityPicker, Field, FormPanel, PhotoPicker } from "../components/OwnerForm.jsx";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import { imageUrl } from "../lib/format.js";

const STATUS = {
  menunggu: { label: "Menunggu verifikasi admin", className: "bg-[#fff4e5] text-[#8a5a00]" },
  ditolak: { label: "Ditolak admin", className: "bg-danger-soft text-danger" },
};

const MAKS_FOTO = 10;
const MAKS_UKURAN = 5 * 1024 * 1024;
const JENIS_FOTO = ["image/jpeg", "image/png", "image/webp"];

const EMPTY = { nama: "", jenis: "", banyakKamar: "", alamat: "", deskripsi: "", fasilitas: [] };

// Frame Figma "KeKos - Daftar Kos": daftar kos milik pemilik + form tambah/edit kos di panel kanan
export default function PemilikKos() {
  const list = useApi("/pemilik/kos");
  const fasilitas = useApi("/pemilik/fasilitas");
  // null = tambah kos baru, objek kos = sedang mengedit kos itu
  const [editing, setEditing] = useState(null);
  // { text, warn }: pesan setelah simpan (warn = kos tersimpan tapi ada foto yang gagal)
  const [notice, setNotice] = useState(null);
  const panelRef = useRef(null);

  const startEdit = (kos) => {
    setEditing(kos);
    setNotice(null);
    // Di layar kecil panel form ada di bawah daftar
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSaved = (notice) => {
    setEditing(null);
    setNotice(notice);
    list.reload();
  };

  return (
    <OwnerLayout
      title="Tipe Kos & Inventaris"
      panel={
        <div ref={panelRef}>
          <KosForm
            key={editing?.id ?? "baru"}
            kos={editing}
            options={fasilitas.data}
            notice={notice}
            onCancel={editing ? () => setEditing(null) : undefined}
            onSaved={onSaved}
          />
        </div>
      }
    >
      {list.loading && <p className="mt-10 text-center font-inter text-sm text-muted">Memuat kos...</p>}
      {list.error && <p role="alert" className="mt-10 text-center font-inter text-sm text-danger">{list.error}</p>}
      {list.data?.length === 0 && (
        <p className="mt-10 text-center font-inter text-sm text-muted">Belum ada kos. Tambahkan kos pertamamu lewat form di samping.</p>
      )}
      <ul className="mt-10 flex flex-col items-center gap-10">
        {list.data?.map((kos) => (
          <li key={kos.id}>
            <KosCard
              kos={kos}
              showBadge={false}
              showRating={false}
              headerAction={
                <button
                  type="button"
                  onClick={() => startEdit(kos)}
                  aria-label={`Edit ${kos.name}`}
                  className="-my-2 inline-flex h-11 items-center rounded-md px-1"
                >
                  <span className={`rounded-md px-4 py-0.5 font-roboto text-sm font-semibold text-white ${editing?.id === kos.id ? "bg-primary-strong" : "bg-black"}`}>
                    Edit
                  </span>
                </button>
              }
            >
              <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
                <span className="rounded-full border border-muted px-2 py-0.5 font-roboto text-xs">
                  {kos.roomsLeft > 0 ? `Tersisa ${kos.roomsLeft} kamar` : "Kamar penuh"}
                </span>
                {STATUS[kos.status] && (
                  <span className={`rounded-full px-2 py-0.5 font-roboto text-xs font-medium ${STATUS[kos.status].className}`}>
                    {STATUS[kos.status].label}
                  </span>
                )}
              </div>
            </KosCard>
          </li>
        ))}
      </ul>
    </OwnerLayout>
  );
}

function KosForm({ kos, options, notice, onCancel, onSaved }) {
  const [form, setForm] = useState(
    kos
      ? {
          nama: kos.name,
          jenis: kos.type,
          banyakKamar: String(kos.totalRooms),
          alamat: kos.address,
          deskripsi: kos.description || "",
          fasilitas: kos.facilities,
        }
      : EMPTY
  );
  // Foto lama yang masih dipakai, id foto lama yang dihapus, dan file baru (belum diupload sampai Simpan)
  const [kept, setKept] = useState(kos?.photoList || []);
  const [removed, setRemoved] = useState([]);
  const [added, setAdded] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const photos = [
    ...kept.map((p) => ({ key: `lama-${p.id}`, src: imageUrl(p.file) })),
    ...added.map((a) => ({ key: a.key, src: a.url })),
  ];

  const addFiles = (files) => {
    const ok = [...files].filter((f) => JENIS_FOTO.includes(f.type) && f.size <= MAKS_UKURAN);
    const room = MAKS_FOTO - photos.length;
    if (ok.length < files.length) setError("Sebagian file dilewati: hanya JPG, PNG, atau WebP maks 5 MB.");
    else if (ok.length > room) setError(`Maksimal ${MAKS_FOTO} foto per kos.`);
    else setError("");
    const next = ok.slice(0, room).map((file) => ({ key: `baru-${Date.now()}-${Math.random()}`, file, url: URL.createObjectURL(file) }));
    setAdded((list) => [...list, ...next]);
  };

  const removePhoto = (key) => {
    if (key.startsWith("lama-")) {
      const id = Number(key.slice(5));
      setKept((list) => list.filter((p) => p.id !== id));
      setRemoved((list) => [...list, id]);
    } else {
      setAdded((list) => {
        const gone = list.find((a) => a.key === key);
        if (gone) URL.revokeObjectURL(gone.url);
        return list.filter((a) => a.key !== key);
      });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    let id = kos?.id;
    try {
      const body = { ...form, banyakKamar: Number(form.banyakKamar) };
      if (kos) await api(`/pemilik/kos/${id}`, { method: "PUT", body });
      else id = (await api("/pemilik/kos", { method: "POST", body })).id;
    } catch (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    // Data kos sudah tersimpan; foto diproses satu per satu dan kegagalannya dilaporkan
    const gagal = [];
    for (const fotoId of removed) {
      await api(`/pemilik/kos/${id}/foto/${fotoId}`, { method: "DELETE" }).catch((err) => gagal.push(err.message));
    }
    for (const a of added) {
      await api(`/pemilik/kos/${id}/foto`, { method: "POST", body: a.file }).catch((err) => gagal.push(`${a.file.name}: ${err.message}`));
    }
    const text = kos ? `${form.nama} berhasil diperbarui.` : `${form.nama} ditambahkan dan menunggu verifikasi admin.`;
    onSaved(gagal.length ? { text: `${text} Tapi ${gagal.length} foto gagal diproses (${gagal.join("; ")}).`, warn: true } : { text });
  };

  return (
    <FormPanel
      title={kos ? `Edit ${kos.name}` : "Tambah Kos baru"}
      subtitle="Informasi Kos"
      onSubmit={submit}
      saving={saving}
      error={error || (notice?.warn ? notice.text : "")}
      success={notice?.warn ? "" : notice?.text}
      onCancel={onCancel}
    >
      <Field label="Nama kos" value={form.nama} onChange={set("nama")} placeholder="Cozy kos" required />
      <Field label="Tipe Kos" as="select" value={form.jenis} onChange={set("jenis")} required>
        <option value="" disabled>
          Pilih tipe kos
        </option>
        <option value="putra">Putra</option>
        <option value="putri">Putri</option>
        <option value="campur">Campur</option>
      </Field>
      <Field label="Banyak kamar" type="number" min="1" inputMode="numeric" value={form.banyakKamar} onChange={set("banyakKamar")} placeholder="16" required />
      <Field label="Alamat" value={form.alamat} onChange={set("alamat")} placeholder="Surabaya ketintang" required />
      <Field
        label="Deskripsi Kos"
        as="textarea"
        value={form.deskripsi}
        onChange={set("deskripsi")}
        placeholder="Sangat strategis untuk mencari makan dan juga dekat dengan kampus"
      />
      <FacilityPicker
        label="Tambah fasilitas"
        options={options}
        value={form.fasilitas}
        onChange={(fasilitas) => setForm((f) => ({ ...f, fasilitas }))}
      />
      <PhotoPicker label="Foto Kos" photos={photos} onAdd={addFiles} onRemove={removePhoto} max={MAKS_FOTO} />
    </FormPanel>
  );
}
