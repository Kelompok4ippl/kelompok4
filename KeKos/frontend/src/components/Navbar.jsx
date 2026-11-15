import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth.js";
import { api } from "../api/client.js";
import { useApi } from "../hooks/useApi.js";
import NotificationList from "./NotificationList.jsx";
import globeIcon from "../assets/emoji-web.svg";
import logoutIcon from "../assets/arrow-out-right-square-half.svg";

// Navbar transparan di atas foto hero dashboard pencari kos
export default function Navbar({ notifOpenInitially = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(notifOpenInitially);
  const notif = useApi(open ? "/notifikasi" : null);
  const ref = useRef(null);
  const unread = notif.data?.some((n) => !n.read);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    if (!open) return;
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Tandai sudah dibaca setelah dropdown dibuka
  useEffect(() => {
    if (open && unread) api("/notifikasi/baca", { method: "PATCH" }).catch(() => {});
  }, [open, unread]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-4 pt-6 text-white sm:px-[72px] sm:pt-[46px]">
      <nav className="flex items-center gap-4 font-serif4 text-base sm:gap-10 sm:text-lg" aria-label="Menu utama">
        <div ref={ref} className="relative">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`relative z-[2] rounded-t-[14px] px-3 py-2 sm:-mx-3 ${open ? "bg-white text-black" : ""}`}
          >
            notifikasi
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
