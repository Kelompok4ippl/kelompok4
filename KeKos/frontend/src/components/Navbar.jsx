import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../api/auth.js";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import NotificationList from "./NotificationList.jsx";
import { LineIcon } from "./Icon.jsx";

const initials = (name = "") =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

// Navbar pencari kos (redesign): bilah putih menempel di atas, sama di semua halaman pencari.
// Lonceng membuka pop-up notifikasi. Tamu (belum login) hanya melihat tombol Masuk.
// Prop overlay dari versi lama masih diterima supaya pemanggil lama tidak rusak (tidak dipakai lagi).
// eslint-disable-next-line no-unused-vars
export default function Navbar({ notifOpenInitially = false, overlay = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const loggedIn = Boolean(user);
  const name = user?.nama || user?.name || "";
  const [open, setOpen] = useState(notifOpenInitially);
  const notif = useApi(user ? "/notifikasi" : null);
  const ref = useRef(null);
  const unreadCount = notif.data?.filter((n) => !n.read).length || 0;
  const unread = unreadCount > 0;
  const { reload } = notif;

  // Arsitektur §11: ambil ulang notifikasi setiap 30 detik selama tab aktif (tanpa WebSocket)
  useEffect(() => {
    if (!loggedIn) return;
    const id = setInterval(() => document.visibilityState === "visible" && reload(), 30000);
    return () => clearInterval(id);
  }, [reload, loggedIn]);

  // Tutup pop-up kalau klik di luar atau tekan Esc
  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = () =>
    api("/notifikasi/baca", { method: "PATCH" })
      .then(reload)
      .catch(() => {});

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const link = "inline-flex h-11 items-center px-1 text-sm font-medium transition-colors";
  const onDashboard = location.pathname === "/dashboard";
  const sectionHref = (id) => (onDashboard ? `#${id}` : `/dashboard#${id}`);

  return (
    <header className="sticky top-0 z-40 border-b border-steel-line bg-white/95 font-poppins backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <Link to="/dashboard" className="font-serif4 text-2xl font-bold text-steel-side">
          KeKos
        </Link>

        <nav aria-label="Menu utama" className="mx-auto hidden items-center gap-7 md:flex">
          <NavLink to="/dashboard" end className={({ isActive }) => `${link} ${isActive ? "text-steel" : "text-steel-body hover:text-steel"}`}>
            Beranda
          </NavLink>
          <a href={sectionHref("cari-kos")} className={`${link} text-steel-body hover:text-steel`}>
            Cari kos
          </a>
          <a href={sectionHref("peta")} className={`${link} text-steel-body hover:text-steel`}>
            Peta
          </a>
          {user && (
            <NavLink to="/riwayat" className={({ isActive }) => `${link} ${isActive ? "text-steel" : "text-steel-body hover:text-steel"}`}>
              Riwayat kos
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {user ? (
            <>
              <div ref={ref} className="relative">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={unread ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
                  onClick={() => setOpen((v) => !v)}
                  className={`relative grid h-11 w-11 place-items-center rounded-xl border text-steel-body transition-colors ${
                    open ? "border-steel bg-steel-tint text-steel" : "border-steel-line hover:bg-steel-tint-2"
                  }`}
                >
                  <LineIcon name="bell" />
                  {unread && (
                    <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {open && (
                  <div
                    role="dialog"
                    aria-label="Notifikasi"
                    className="absolute right-0 top-[52px] w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-steel-line bg-white shadow-[0_20px_50px_-20px_rgba(29,58,92,.45)]"
                  >
                    <div className="flex items-center gap-2 border-b border-[#edf1f5] px-4 py-3">
                      <p className="font-semibold text-steel-ink">Notifikasi</p>
                      {unread && <span className="rounded-full bg-steel-tint px-2 text-[11px] font-semibold text-steel">{unreadCount} baru</span>}
                      {unread && (
                        <button type="button" onClick={markRead} className="ml-auto min-h-9 px-1 text-xs font-semibold text-steel hover:underline">
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                    <NotificationList items={notif.data} loading={notif.loading} error={notif.error} />
                  </div>
                )}
              </div>
              <span className="hidden items-center gap-2 pl-1 sm:flex" title={name}>
                <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-steel-tint text-xs font-semibold text-steel">
                  {initials(name) || "?"}
                </span>
                <span className="max-w-[120px] truncate text-sm font-medium text-steel-ink">{name}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Keluar"
                className="grid h-11 w-11 place-items-center rounded-xl text-steel-body hover:bg-steel-tint-2 hover:text-bad"
              >
                <LineIcon name="logout" />
              </button>
            </>
          ) : (
            <Link to="/" state={{ from: location.pathname }} className="inline-flex h-11 items-center rounded-xl bg-steel px-5 text-sm font-semibold text-white hover:bg-steel-strong">
              Masuk
            </Link>
          )}
        </div>
      </div>
      {/* Menu di layar kecil */}
      <nav aria-label="Menu utama (ponsel)" className="flex gap-5 overflow-x-auto border-t border-[#edf1f5] px-4 md:hidden">
        <NavLink to="/dashboard" end className={({ isActive }) => `${link} shrink-0 ${isActive ? "text-steel" : "text-steel-body"}`}>
          Beranda
        </NavLink>
        <a href={sectionHref("cari-kos")} className={`${link} shrink-0 text-steel-body`}>
          Cari kos
        </a>
        <a href={sectionHref("peta")} className={`${link} shrink-0 text-steel-body`}>
          Peta
        </a>
        {user && (
          <NavLink to="/riwayat" className={({ isActive }) => `${link} shrink-0 ${isActive ? "text-steel" : "text-steel-body"}`}>
            Riwayat kos
          </NavLink>
        )}
      </nav>
    </header>
  );
}
