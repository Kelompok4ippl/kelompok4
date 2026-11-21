import { useState } from "react";
import { AdminLayout } from "../components/OwnerLayout.jsx";
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

  const ubah = async (akun) => {
    if (akun.active && !window.confirm(`Nonaktifkan akun ${akun.name}? Pengguna ini tidak bisa login lagi.`)) return;
    setBusy(akun.id);
    setError("");
    try {
      await api(`/admin/akun/${akun.id}`, { method: "PATCH", body: { aktif: !akun.active } });
      list.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminLayout title="Kelola Akun" className="bg-[#ededed]">
      <div className="mx-auto mt-6 max-w-[900px]">
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3 py-2 font-inter text-sm text-danger">
            {error}
          </p>
        )}
        {list.loading && <p className="font-inter text-sm text-muted">Memuat akun...</p>}
        {list.error && <p role="alert" className="font-inter text-sm text-danger">{list.error}</p>}

        {list.data && (
          <ul className="flex flex-col divide-y divide-line rounded-[20px] bg-white px-5">
            {list.data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-inter text-sm font-semibold text-ink">
                    {a.name}
                    {!a.active && (
                      <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">Nonaktif</span>
                    )}
                  </p>
                  <p className="break-all font-inter text-xs text-muted">
                    {a.email}
                    {a.phone && ` · ${a.phone}`}
                    {a.kosCount > 0 && ` · ${a.kosCount} kos`}
                  </p>
                  <p className="font-inter text-xs text-muted">Login terakhir: {terakhirLogin(a)}</p>
                </div>
                <button
                  type="button"
                  disabled={busy === a.id}
                  onClick={() => ubah(a)}
                  className={`h-10 rounded-lg px-4 font-inter text-sm font-semibold disabled:opacity-60 ${
                    a.active
                      ? "border border-[#e5484d] bg-white text-[#c62828] hover:bg-danger-soft"
                      : "bg-black text-white hover:bg-[#333]"
                  }`}
                >
                  {a.active ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
