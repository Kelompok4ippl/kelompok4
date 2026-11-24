import { useRef, useState } from "react";
import OwnerLayout from "../components/OwnerLayout.jsx";
import { LineIcon } from "../components/Icon.jsx";
import {
  AvailabilityTag,
  FacilityChip,
  FacilityPicker,
  Field,
  FormPanel,
  PageBanner,
  PhotoPicker,
  StatCard,
} from "../components/OwnerForm.jsx";
import { api } from "../api/client.js";
import { getCurrentUser } from "../api/auth.js";
import { useApi } from "../hooks/useApi.js";
import { imageUrl, rupiah, KOS_TYPE_LABEL } from "../lib/format.js";

// Status verifikasi listing dari admin
const STATUS = {
  terverifikasi: { label: "Terverifikasi", className: "bg-ok-soft text-ok" },
  menunggu: { label: "Menunggu verifikasi", className: "bg-amber-soft text-amber-ink" },
  ditolak: { label: "Ditolak admin", className: "bg-bad-soft text-bad" },
};

// Warna label tipe kos di pojok foto
const TYPE_TAG = {
  putra: "bg-[#e3ecf6] text-steel",
  putri: "bg-[#f6e6ee] text-[#9a4069]",
  campur: "bg-[#ece8f5] text-[#5f4c95]",
};

const FILTERS = ["semua", "putra", "putri", "campur"];

const MAKS_FOTO = 10;
const MAKS_UKURAN = 5 * 1024 * 1024;
const JENIS_FOTO = ["image/jpeg", "image/png", "image/webp"];

const EMPTY = { nama: "", jenis: "", banyakKamar: "", alamat: "", deskripsi: "", fasilitas: [] };

// Frame Figma "Pemilik – Daftar Kos (redesign)": banner, ringkasan, kartu kos milik pemilik,
// dan form tambah/edit kos di panel kanan
export default function PemilikKos() {
  const list = useApi("/pemilik/kos");
  const fasilitas = useApi("/pemilik/fasilitas");
  const booking = useApi("/pemilik/booking");
  const user = getCurrentUser();
  // null = tambah kos baru, objek kos = sedang mengedit kos itu
  const [editing, setEditing] = useState(null);
  // { text, warn }: pesan setelah simpan (warn = kos tersimpan tapi ada foto yang gagal)
  const [notice, setNotice] = useState(null);
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);

  const kosList = list.data || [];
  const shown = kosList.filter(
    (k) => (filter === "semua" || k.type === filter) && k.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const totalKamar = kosList.reduce((n, k) => n + (k.totalRooms || 0), 0);
  const sisaKamar = kosList.reduce((n, k) => n + k.roomsLeft, 0);
  const menunggu = (booking.data || []).filter((b) => b.status === "menunggu").length;
  const terverifikasi = kosList.filter((k) => k.status === "terverifikasi").length;

  // Di layar kecil panel form ada di bawah daftar, jadi digulir ke sana lalu kolom pertama difokus
  const focusPanel = () => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => panelRef.current?.querySelector("input")?.focus({ preventScroll: true }), 50);
  };

  const startEdit = (kos) => {
    setEditing(kos);
    setNotice(null);
    focusPanel();
  };

  const startNew = () => {
    setEditing(null);
    setNotice(null);
    focusPanel();
  };

  const onSaved = (notice) => {
    setEditing(null);
    setNotice(notice);
    list.reload();
  };

  return (
    <OwnerLayout
      panel={
        <div ref={panelRef} className="h-full">
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
      <PageBanner
        name={user?.name || user?.nama}
        title="Daftar Kos"
        description="Kelola kos, ketersediaan kamar, dan status listing kamu."
        actionLabel="Tambah Kos"
        onAction={startNew}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon="building" label="Total kos" value={kosList.length} note={`${terverifikasi} terverifikasi`} />
        <StatCard icon="door" label="Kamar tersedia" value={sisaKamar} note={`dari ${totalKamar} kamar`} />
        <StatCard icon="bell" label="Booking menunggu" value={menunggu} note="perlu dikonfirmasi" tone="amber" />
      </div>

      <section aria-labelledby="judul-kos-saya" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="judul-kos-saya" className="flex-1 text-[17px] font-semibold text-steel-ink">
            Kos saya ({shown.length})
          </h2>
          <label className="flex h-[42px] items-center gap-2 rounded-xl border border-steel-line bg-white px-3 text-steel-muted focus-within:border-steel">
            <LineIcon name="search" className="h-[18px] w-[18px]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama kos"
              aria-label="Cari nama kos"
              className="w-[150px] bg-transparent text-sm text-steel-ink outline-none placeholder:text-steel-muted"
            />
          </label>
          <div role="group" aria-label="Filter tipe kos" className="flex rounded-xl bg-[#e3e9f0] p-[3px]">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-9 rounded-[9px] px-3.5 text-[13px] ${
                  filter === f ? "bg-white font-semibold text-steel-strong shadow-[0_1px_3px_rgba(29,58,92,.15)]" : "font-medium text-steel-body"
                }`}
              >
                {f === "semua" ? "Semua" : KOS_TYPE_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {list.loading && <p className="text-sm text-steel-muted">Memuat kos...</p>}
        {list.error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
            {list.error}
          </p>
        )}
        {list.data && kosList.length === 0 && (
          <p className="rounded-2xl border border-dashed border-steel-line bg-white p-7 text-center text-sm text-steel-muted">
            Belum ada kos. Tambahkan kos pertamamu lewat form di samping.
          </p>
        )}
        {kosList.length > 0 && shown.length === 0 && (
          <p className="rounded-2xl border border-dashed border-steel-line bg-white p-7 text-center text-sm text-steel-muted">
            Tidak ada kos yang cocok dengan pencarian.
          </p>
        )}

        <ul className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {shown.map((kos) => (
            <li key={kos.id}>
              <OwnerKosCard kos={kos} selected={editing?.id === kos.id} onEdit={() => startEdit(kos)} />
            </li>
          ))}
        </ul>
      </section>
    </OwnerLayout>
  );
}

// Kartu kos di panel pemilik: foto, tipe, sisa kamar, alamat, fasilitas, bar keterisian, harga, status
function OwnerKosCard({ kos, selected, onEdit }) {
  const total = kos.totalRooms || 0;
  const terisi = Math.max(0, total - kos.roomsLeft);
  const pct = total ? Math.min(100, Math.round((terisi / total) * 100)) : 0;
  const penuh = kos.roomsLeft <= 0;
  const status = STATUS[kos.status];
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-[18px] border border-steel-line bg-white shadow-steel transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-steel-lg motion-reduce:transition-none ${
        selected ? "outline outline-2 -outline-offset-2 outline-steel" : ""
      }`}
    >
      <div className="relative aspect-video bg-steel-tint">
        <img src={imageUrl(kos.image)} alt={`Foto ${kos.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[rgba(15,30,50,.28)] to-transparent to-40%" />
        <div className="absolute inset-x-3 top-3 flex justify-between gap-2">
          <span className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold tracking-[.02em] ${TYPE_TAG[kos.type] || TYPE_TAG.campur}`}>
            {(KOS_TYPE_LABEL[kos.type] || kos.type || "").toUpperCase()}
          </span>
          <AvailabilityTag ok={!penuh}>{penuh ? "Penuh" : `Tersisa ${kos.roomsLeft} kamar`}</AvailabilityTag>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center gap-2.5">
          <h3 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-steel-ink">{kos.name}</h3>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${kos.name}`}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-[10px] border border-steel-line bg-white px-3 text-xs font-medium text-steel-body hover:border-steel hover:text-steel"
          >
            <LineIcon name="pencil" className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        {(kos.address || kos.distance) && (
          <p className="flex items-start gap-1.5 text-xs text-steel-muted">
            <LineIcon name="pin" className="mt-px h-3.5 w-3.5" />
            {[kos.address, kos.distance].filter(Boolean).join(" • ")}
          </p>
        )}
        {kos.facilities.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {kos.facilities.map((f) => (
              <li key={f}>
                <FacilityChip name={f} />
              </li>
            ))}
          </ul>
        )}
        {total > 0 && (
          <div className="text-xs text-steel-muted">
            Terisi {terisi} dari {total} kamar
            <div
              role="progressbar"
              aria-label={`Keterisian ${kos.name}`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-steel-tint"
            >
              <div className={`h-full rounded-full ${penuh ? "bg-bad" : "bg-steel"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2.5 border-t border-[#edf1f5] pt-3">
          <p className="flex-1 whitespace-nowrap">
            {kos.price ? (
              <>
                <span className="text-lg font-semibold tabular-nums text-steel-ink">{rupiah(kos.price, { short: true })}</span>
                <span className="text-xs text-steel-muted"> /bln</span>
              </>
            ) : (
              <span className="text-xs text-steel-muted">Harga belum diatur</span>
            )}
          </p>
          {status && <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span>}
        </div>
      </div>
    </article>
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
      title={kos ? `Edit ${kos.name}` : "Tambah Kos Baru"}
      description={kos ? "Perbarui informasi kos kamu." : "Lengkapi informasi agar kos kamu mudah ditemukan pencari."}
      subtitle="Informasi Kos"
      onSubmit={submit}
      saving={saving}
      error={error || (notice?.warn ? notice.text : "")}
      success={notice?.warn ? "" : notice?.text}
      submitLabel={kos ? "Simpan Perubahan" : "Simpan Kos"}
      onCancel={onCancel}
    >
      <Field label="Nama kos" value={form.nama} onChange={set("nama")} placeholder="Masukkan nama kos" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipe kos" as="select" value={form.jenis} onChange={set("jenis")} required>
          <option value="" disabled>
            Pilih tipe
          </option>
          <option value="putra">Putra</option>
          <option value="putri">Putri</option>
          <option value="campur">Campur</option>
        </Field>
        <Field label="Jumlah kamar" type="number" min="1" inputMode="numeric" suffix="kamar" value={form.banyakKamar} onChange={set("banyakKamar")} placeholder="Contoh: 12" required />
      </div>
      <Field label="Alamat" icon="pin" value={form.alamat} onChange={set("alamat")} placeholder="Masukkan alamat lengkap kos" required />
      <Field
        label="Deskripsi"
        as="textarea"
        value={form.deskripsi}
        onChange={set("deskripsi")}
        placeholder="Ceritakan keunggulan kos kamu, mis. dekat kampus"
      />
      <FacilityPicker
        label="Fasilitas"
        options={options}
        value={form.fasilitas}
        onChange={(fasilitas) => setForm((f) => ({ ...f, fasilitas }))}
      />
      <PhotoPicker label="Foto kos" photos={photos} onAdd={addFiles} onRemove={removePhoto} max={MAKS_FOTO} />
    </FormPanel>
  );
}
