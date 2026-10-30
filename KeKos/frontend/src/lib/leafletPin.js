import L from "leaflet";

// Penanda bulat ala KeKos untuk peta OpenStreetMap (Leaflet)
export function pinIcon(color) {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
    html: `<svg viewBox="0 0 24 24" width="28" height="28"><path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.6" fill="#fff"/></svg>`,
  });
}
