import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../api/auth.js";
import Icon from "./Icon.jsx";
import logoutIcon from "../assets/arrow-out-right-square-half.svg";

const MENU = [
  { to: "/pemilik/kos", label: "Daftar Kos" },
  { to: "/pemilik/kamar", label: "Daftar Kamar" },
  { to: "/pemilik/notifikasi", label: "Notifikasi Booking Masuk" },
];

// Kerangka halaman pemilik kos (frame Figma "KeKos - Daftar Kos/Kamar"):
// sidebar hitam di kiri, isi di tengah, dan panel form hitam di kanan (opsional).
// Di layar kecil sidebar jadi bilah menu di atas dan panel turun ke bawah isi.
export default function OwnerLayout({ title, panel, className = "bg-white", children }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  return (
    <div className="min-h-screen bg-black lg:flex">
      <aside className="flex flex-col gap-4 px-4 py-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[243px] lg:shrink-0 lg:gap-0 lg:px-6 lg:py-8">
        <div className="flex items-center justify-between">
          <p className="font-serif4 text-2xl font-bold">KeKos</p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#ededed] px-5 font-poppins text-sm font-semibold text-black hover:bg-white lg:hidden"
          >
            Log Out
            <Icon src={logoutIcon} className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Menu pemilik kos" className="-mx-1 flex gap-2 overflow-x-auto px-1 lg:mx-0 lg:mt-8 lg:flex-col lg:gap-4 lg:px-0">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                `flex h-11 shrink-0 items-center rounded-[10px] px-4 font-serif4 text-sm ${
                  isActive ? "bg-[#ededed] font-bold text-black" : "text-white hover:bg-white/10"
                }`
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mx-auto mt-auto hidden h-11 items-center gap-3 rounded-full bg-[#ededed] px-7 font-poppins text-base font-semibold text-black hover:bg-white lg:inline-flex"
        >
          Log Out
          <Icon src={logoutIcon} className="h-5 w-5" />
        </button>
      </aside>

      <main className={`min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-8 ${className}`}>
        {title && <h1 className="text-center font-serif4 text-2xl font-bold text-black">{title}</h1>}
        {children}
      </main>

      {panel && (
        <aside className="bg-black px-4 pb-12 pt-8 text-white sm:px-8 lg:sticky lg:top-0 lg:h-screen lg:w-[440px] lg:shrink-0 lg:overflow-y-auto xl:w-[560px] xl:px-24">
          {panel}
        </aside>
      )}
    </div>
  );
}
