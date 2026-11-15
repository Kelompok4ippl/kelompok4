import wifiIcon from "../assets/wifi.svg";
import snowIcon from "../assets/snow.svg";
import showerIcon from "../assets/shower.svg";

// Kunci = nama_fasilitas dari database (huruf kecil)
const ICONS = { wifi: wifiIcon, ac: snowIcon, "kamar mandi dalam": showerIcon, "k. mandi dalam": showerIcon };
const LABELS = { "kamar mandi dalam": "K.mandi dalam", "k. mandi dalam": "K.mandi dalam" };

// Satu fasilitas dengan ikon, contoh: Wifi, AC, K.mandi dalam
// boxed = versi kotak bergaris (halaman detail & daftar kamar)
export default function Facility({ name, boxed = false }) {
  const key = name.toLowerCase();
  const icon = ICONS[key];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap font-roboto text-sm text-[#080808] ${
        boxed ? "rounded-lg border border-[#9b9b9b] px-2.5 py-1" : ""
      }`}
    >
      {icon && <img src={icon} alt="" className={key === "wifi" ? "h-5 w-5" : "h-4 w-4"} />}
      {LABELS[key] || name}
    </span>
  );
}
