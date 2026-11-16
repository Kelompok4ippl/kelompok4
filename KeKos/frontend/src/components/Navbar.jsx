import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../api/auth.js";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import NotificationList from "./NotificationList.jsx";
import logoutIcon from "../assets/arrow-out-right-square-half.svg";
import globeIcon from "../assets/emoji-web.svg";

// Navbar pencari kos, sama di semua halaman.
// overlay: transparan di atas foto hero (dashboard); tanpa overlay: bilah hitam di atas halaman (detail, booking).
// Tamu (belum login) hanya melihat tombol Masuk.
export default function Navbar({ notifOpenInitially = false, overlay = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const loggedIn = Boolean(user);
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

  // Tutup dropdown kalau klik di luar atau tekan Esc
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

  // Tandai sudah dibaca setelah dropdown dibuka
  useEffect(() => {
    if (open && unread) api("/notifikasi/baca", { method: "PATCH" }).catch(() => {});
  }, [open, unread]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Beranda: navbar transparan di atas foto hero, sesuai desain Figma
  if (overlay) {
    return (
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-4 pt-6 text-white sm:px-[72px] sm:pt-[46px]">
        <nav className="flex items-center gap-4 font-serif4 text-base sm:gap-10 sm:text-lg" aria-label="Menu utama">
          <div ref={ref} className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-label={unread ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
              onClick={() => setOpen((v) => !v)}
              className={`relative z-[2] inline-flex items-center gap-2 rounded-t-[14px] px-3 py-2 sm:-mx-3 ${open ? "bg-white text-black" : ""}`}
            >
              Notifikasi
              {unread && !open && (
                <span aria-hidden="true" className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e5484d] px-1.5 font-inter text-[11px] font-semibold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute left-0 top-[38px] z-[1] w-[min(390px,calc(100vw-32px))] rounded-[14px] rounded-tl-none bg-white text-black shadow-[0_8px_24px_#00000040] sm:-left-3">
                <NotificationList items={notif.data} loading={notif.loading} error={notif.error} />
              </div>
            )}
          </div>
          <a href="#cari-kos" className="hidden sm:inline">Review</a>
          <a href="#peta" className="hidden sm:inline">Contacts</a>
        </nav>

        <Link to="/dashboard" className="font-serif4 text-[28px] sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:text-[34px]">
          Kekos
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden font-roboto text-xs sm:inline">Kekos.com</span>
          <img src={globeIcon} alt="" className="hidden h-6 w-6 sm:block" />
          <span className="flex h-[27px] w-[27px] items-center justify-center rounded-full bg-white font-serif4 text-sm font-semibold text-[#1b6fdc]">
            ID
          </span>
          <button type="button" onClick={handleLogout} aria-label="Keluar" className="ml-2 sm:ml-6">
            <img src={logoutIcon} alt="" className="h-6 w-6" />
          </button>
        </div>
      </header>
    );
  }

  // Halaman lain: bilah hitam. Menu beranda dari halaman lain pindah ke beranda lalu ke bagiannya
  const sectionLink = "hidden h-11 items-center rounded-lg px-2 hover:underline sm:inline-flex";

  return (
    <header
      className={`z-20 flex items-center justify-between gap-4 px-4 text-white sm:px-[72px] ${
        "relative bg-ink py-2"
      }`}
    >
      <nav className="flex items-center gap-2 font-poppins text-base sm:gap-6 sm:text-lg" aria-label="Menu utama">
        <NavLink to="/dashboard" end className={({ isActive }) => `${sectionLink} ${isActive ? "font-semibold" : ""}`}>
          Beranda
        </NavLink>
        <a href="/dashboard#cari-kos" className={sectionLink}>
          Cari Kos
        </a>
        <a href="/dashboard#peta" className={sectionLink}>
          Peta
        </a>
        {user && (
          <div ref={ref} className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-label={unread ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
              onClick={() => setOpen((v) => !v)}
              className={`relative z-[2] inline-flex h-11 items-center gap-2 rounded-t-[14px] px-3 ${open ? "bg-white text-black" : ""}`}
            >
              Notifikasi
              {unread && !open && (
                <span aria-hidden="true" className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e5484d] px-1.5 font-inter text-xs font-semibold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute left-0 top-[44px] z-[1] w-[min(390px,calc(100vw-32px))] rounded-[14px] rounded-tl-none bg-white text-black shadow-[0_8px_24px_#00000040]">
                <NotificationList items={notif.data} loading={notif.loading} error={notif.error} />
              </div>
            )}
          </div>
        )}
      </nav>

      <Link
        to="/dashboard"
        className={`font-poppins font-semibold sm:absolute sm:left-1/2 sm:-translate-x-1/2 ${
          overlay ? "text-[28px] sm:text-[34px]" : "text-2xl"
        }`}
      >
        KeKos
      </Link>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            {/* Inisial pengguna yang sedang login (bukan tombol) */}
            <span
              title={user.nama}
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-white font-poppins text-sm font-semibold text-ink sm:flex"
            >
              <span aria-hidden="true">{user.nama?.[0]?.toUpperCase() || "?"}</span>
              <span className="sr-only">Login sebagai {user.nama}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-11 items-center gap-2 rounded-lg px-2 font-poppins text-sm hover:bg-[#ffffff1f]"
            >
              <img src={logoutIcon} alt="" className="h-6 w-6" />
              <span className="hidden sm:inline">Keluar</span>
              <span className="sr-only sm:hidden">Keluar</span>
            </button>
          </>
        ) : (
          <Link to="/" state={{ from: location.pathname }} className="flex h-11 items-center rounded-lg bg-white px-4 font-poppins text-sm font-semibold text-ink hover:bg-surface">
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
