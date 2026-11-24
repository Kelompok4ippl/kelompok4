import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../api/auth.js";
import { useApi } from "../hooks/useApi.js";
import { LineIcon } from "./Icon.jsx";

const MENU = [
  { to: "/pemilik/kos", label: "Daftar Kos", icon: "building" },
  { to: "/pemilik/kamar", label: "Daftar Kamar", icon: "door" },
  { to: "/pemilik/notifikasi", label: "Notifikasi", icon: "bell", badge: "booking" },
];

const initials = (name = "") =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

// Kerangka halaman pemilik kos (frame Figma "Pemilik – Daftar Kos/Kamar (redesign)"):
// sidebar biru tua di kiri, isi di tengah, dan panel form putih di kanan (opsional).
// Di layar kecil sidebar jadi bilah menu di atas dan panel turun ke bawah isi.
// menu/menuLabel/roleLabel diganti untuk halaman admin (AdminLayout di bawah)
export default function OwnerLayout({
  title,
  panel,
  className = "",
  menu = MENU,
  menuLabel = "Menu pemilik kos",
  roleLabel = "Panel Pemilik Kos",
  children,
}) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  // Jumlah booking menunggu untuk badge menu Notifikasi (hanya kalau menunya punya badge)
  const needsBadge = menu.some((m) => m.badge === "booking");
  const booking = useApi(needsBadge ? "/pemilik/booking" : null);
  const pending = (booking.data || []).filter((b) => b.status === "menunggu").length;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-steel-bg font-poppins text-steel-ink lg:flex">
      <aside className="flex flex-col gap-3 bg-gradient-to-b from-steel-side to-steel-side-2 px-4 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[248px] lg:shrink-0 lg:gap-0 lg:px-4 lg:pb-5 lg:pt-7">
        <div className="flex items-center justify-between gap-3 lg:px-2.5">
          <p className="font-serif4 text-[28px] font-bold leading-none">
            KeKos
            <span className="mt-1.5 hidden font-poppins text-xs font-normal text-white/70 lg:block">{roleLabel}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 px-3 text-sm text-white/90 hover:bg-white/10 lg:hidden"
          >
            <LineIcon name="logout" />
            Log Out
          </button>
        </div>

        <p className="mt-7 hidden px-3 text-[11px] font-semibold tracking-[.08em] text-white/60 lg:block">MENU</p>
        <nav aria-label={menuLabel} className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:mt-2 lg:flex-col lg:px-0">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                  isActive
                    ? "bg-white font-semibold text-steel-strong shadow-[0_4px_14px_-6px_rgba(0,0,0,.35)]"
                    : "font-medium text-white/80 hover:bg-white/10"
                }`
              }
            >
              {m.icon && <LineIcon name={m.icon} />}
              {m.label}
              {m.badge === "booking" && pending > 0 && (
                <span className="ml-auto rounded-full bg-amber px-2 text-[11px] font-semibold text-[#2b2310]">
                  {pending}
                  <span className="sr-only"> booking menunggu</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden lg:block">
          {user && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
              <span aria-hidden="true" className="grid h-[38px] w-[38px] place-items-center rounded-full bg-amber-soft text-[13px] font-semibold text-amber-ink">
                {initials(user.name || user.nama)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{user.name || user.nama}</span>
                <span className="block text-[11px] text-white/70">{roleLabel.replace("Panel ", "")}</span>
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-white/25 px-3 text-sm text-white/90 hover:bg-white/10"
          >
            <LineIcon name="logout" />
            Log Out
          </button>
        </div>
      </aside>

      <main className={`flex min-w-0 flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-8 lg:pt-7 ${className}`}>
        {title && <h1 className="font-serif4 text-[32px] font-bold leading-tight text-steel-ink">{title}</h1>}
        {children}
      </main>

      {panel && (
        <aside className="border-t border-steel-line bg-white px-5 pb-8 pt-7 sm:px-7 lg:sticky lg:top-0 lg:h-screen lg:w-[380px] lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
          {panel}
        </aside>
      )}
    </div>
  );
}

const ADMIN_MENU = [
  { to: "/admin/verifikasi", label: "Verifikasi Listing", icon: "check" },
  { to: "/admin/akun", label: "Kelola Akun", icon: "door" },
  { to: "/admin/notifikasi", label: "Notifikasi & Log", icon: "bell" },
];

export function AdminLayout(props) {
  return <OwnerLayout menu={ADMIN_MENU} menuLabel="Menu admin" roleLabel="Panel Admin" {...props} />;
}
