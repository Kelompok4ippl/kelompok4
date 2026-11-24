import { useState } from "react";
import { AdminLayout } from "../components/OwnerLayout.jsx";
import { ConfirmDialog } from "../components/Modal.jsx";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";

const terakhirLogin = (a) =>
  a.lastActive
    ? `${new Date(a.lastActive).toLocaleDateString("id-ID", { dateStyle: "medium" })}${a.monthsInactive ? ` (${a.monthsInactive} bulan lalu)` : ""}`
    : "Belum pernah login";

// Kelola akun pengguna: lihat siapa yang lama tidak login, lalu nonaktifkan / aktifkan lagi
export default function AdminAkun() {
  const list = useApi("/admin/akun");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  // Akun yang sedang dikonfirmasi untuk dinonaktifkan (pop-up)
  const [nonaktif, setNonaktif] = useState(null);

  const ubah = async (akun) => {
    setBusy(akun.id);
    setError("");
    try {
      await api(`/admin/akun/${akun.id}`, { method: "PATCH", body: { aktif: !akun.active } });
      setNonaktif(null);
      list.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout title="Kelola Akun">
      <div className="w-full max-w-[900px]">
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 font-poppins text-sm text-bad">
            {error}
          </p>
        )}
        {list.loading && <p className="font-poppins text-sm text-steel-muted">Memuat akun...</p>}
        {list.error && <p role="alert" className="font-poppins text-sm text-bad">{list.error}</p>}

        {list.data && (
          <ul className="flex flex-col divide-y divide-[#edf1f5] rounded-2xl border border-steel-line bg-white shadow-steel px-5">
            {list.data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-poppins text-sm font-semibold text-steel-ink">
                    {a.name}
                    {!a.active && (
                      <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-bad">Nonaktif</span>
                    )}
                  </p>
                  <p className="break-all font-poppins text-xs text-steel-muted">
                    {a.email}
                    {a.phone && ` · ${a.phone}`}
                    {a.kosCount > 0 && ` · ${a.kosCount} kos`}
                  </p>
                  <p className="font-poppins text-xs text-steel-muted">Login terakhir: {terakhirLogin(a)}</p>
                </div>
                <button
                  type="button"
                  disabled={busy === a.id}
                  onClick={() => (a.active ? (setError(""), setNonaktif(a)) : ubah(a))}
                  className={`h-10 rounded-lg px-4 font-poppins text-sm font-semibold disabled:opacity-60 ${
                    a.active
                      ? "border border-steel-line bg-white text-bad hover:bg-bad-soft"
                      : "bg-steel text-white hover:bg-steel-strong"
                  }`}
                >
                  {a.active ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {nonaktif && (
        <ConfirmDialog
          title="Nonaktifkan akun?"
          message={`Akun ${nonaktif.name} (${nonaktif.email}) tidak akan bisa login lagi sampai diaktifkan kembali.${
            nonaktif.kosCount > 0 ? ` Akun ini memiliki ${nonaktif.kosCount} kos.` : ""
          }`}
          confirmLabel="Ya, nonaktifkan"
          busy={busy === nonaktif.id}
          error={error}
          onConfirm={() => ubah(nonaktif)}
          onClose={() => setNonaktif(null)}
        />
      )}
    </AdminLayout>
  );
}
