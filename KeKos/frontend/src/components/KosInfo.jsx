import Facility from "./Facility.jsx";
import accountIcon from "../assets/account.svg";
import doorOpenIcon from "../assets/door-open.svg";
import doorAddIcon from "../assets/door-add-16-regular.svg";
import houseIcon from "../assets/house-door.svg";
import facilityIcon from "../assets/social-facility.svg";

function Row({ icon, iconClass = "h-5 w-5", label, value, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex w-[31px] shrink-0 justify-center pt-1">
        <img src={icon} alt="" className={iconClass} />
      </span>
      <div className="min-w-0 flex-1 border-b border-[#9b9b9b] pb-1">
        {children || (
          <div className="flex items-end justify-between gap-2 font-roboto text-xs text-[#333]">
            <span>{label}</span>
            {value != null && <span className="text-black">{value}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// Daftar "Informasi" kos: pemilik, jumlah kamar, kamar tersedia, tipe kamar, fasilitas.
// Dipakai di halaman detail kos dan booking cepat.
export default function KosInfo({ ownerName, totalRooms, roomsLeft, roomType, facilities }) {
  return (
    <div className="flex flex-col gap-3">
      <Row icon={accountIcon} iconClass="h-[26px] w-[26px]">
        <p className="font-roboto text-[11px] text-[#555]">Pemilik</p>
        <p className="font-roboto text-xs text-black">{ownerName || "-"}</p>
      </Row>
      {totalRooms != null && (
        <Row icon={doorOpenIcon} iconClass="h-[26px] w-[26px]" label="Jumlah Kamar" value={totalRooms} />
      )}
      <Row icon={doorAddIcon} label="Kamar Tersedia" value={roomsLeft} />
      <Row icon={houseIcon} label="Tipe Kamar" value={roomType} />
      <div className="flex items-start gap-3">
        <span className="flex w-[31px] shrink-0 justify-center pt-1">
          <img src={facilityIcon} alt="" className="h-6 w-6" />
        </span>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="mr-1 font-roboto text-xs text-[#333]">Fasilitas</span>
          {facilities.map((f) => (
            <Facility key={f} name={f} boxed />
          ))}
        </div>
      </div>
    </div>
  );
}
