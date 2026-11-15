import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CAMPUS, RADIUS_METERS, hasGoogleKey, hasLocation, loadGoogleMaps, onGoogleAuthFailure } from "../lib/maps.js";
import { rupiah } from "../lib/format.js";
import { pinIcon } from "../lib/leafletPin.js";

const escape = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Isi popup saat penanda kos diklik. Link ditangani onClick di bawah supaya tidak reload halaman.
function popupHtml(kos) {
  return `<div style="font-family:Poppins,sans-serif;min-width:170px">
    <strong style="font-size:14px">${escape(kos.name)}</strong>
    <div style="font-size:12px;color:#555;margin-top:2px">${escape(kos.address || kos.area || "")}</div>
    <div style="font-size:12px;margin-top:4px">${kos.price == null ? "" : `Mulai ${rupiah(kos.price)}/bulan`}</div>
    <a href="/kos/${kos.id}" data-kos-link style="display:inline-block;margin-top:6px;padding:3px 12px;border-radius:999px;background:#000;color:#fff;font-size:12px;text-decoration:none">Lihat Detail</a>
  </div>`;
}

function createLeafletMap(el, { interactive }) {
  const map = L.map(el, { scrollWheelZoom: interactive }).setView([CAMPUS.lat, CAMPUS.lng], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.circle([CAMPUS.lat, CAMPUS.lng], { radius: RADIUS_METERS, color: "#000", weight: 1.5, fillOpacity: 0.06 }).addTo(map);
  L.marker([CAMPUS.lat, CAMPUS.lng], { icon: pinIcon("#d62828"), title: CAMPUS.name }).addTo(map).bindPopup(`<strong>${CAMPUS.name}</strong>`);
  const layer = L.layerGroup().addTo(map);
  return {
    setKos(list) {
      layer.clearLayers();
      list.filter(hasLocation).forEach((kos) => {
        L.marker([kos.lat, kos.lng], { icon: pinIcon("#000"), title: kos.name }).addTo(layer).bindPopup(popupHtml(kos));
      });
    },
    destroy: () => map.remove(),
  };
}

function createGoogleMap(el, maps, { interactive }) {
  const map = new maps.Map(el, {
    center: CAMPUS,
    zoom: 15,
    gestureHandling: interactive ? "greedy" : "cooperative",
    mapTypeControl: false,
    streetViewControl: false,
  });
  new maps.Circle({ map, center: CAMPUS, radius: RADIUS_METERS, strokeColor: "#000", strokeWeight: 1.5, fillOpacity: 0.06 });
  new maps.Marker({ map, position: CAMPUS, title: CAMPUS.name, label: { text: "🎓", fontSize: "14px" } });
  const info = new maps.InfoWindow();
  let markers = [];
  return {
    setKos(list) {
      markers.forEach((m) => m.setMap(null));
      markers = list.filter(hasLocation).map((kos) => {
        const marker = new maps.Marker({ map, position: { lat: kos.lat, lng: kos.lng }, title: kos.name });
        marker.addListener("click", () => {
          info.setContent(popupHtml(kos));
          info.open({ map, anchor: marker });
        });
        return marker;
      });
    },
    destroy() {
      markers.forEach((m) => m.setMap(null));
      maps.event.clearInstanceListeners(map);
    },
  };
}

// Peta persebaran kos. Pakai Google Maps kalau VITE_GOOGLE_MAPS_API_KEY diisi,
// kalau tidak (atau gagal dimuat) otomatis memakai OpenStreetMap.
export default function KosMap({ kos = [], interactive = false, className = "" }) {
  const el = useRef(null);
  const mapRef = useRef(null);
  const kosRef = useRef(kos);
  const navigate = useNavigate();
  const [engine, setEngine] = useState(hasGoogleKey ? "google" : "leaflet");

  useEffect(() => {
    let cancelled = false;
    const mount = (instance) => {
      if (cancelled) return instance.destroy();
      mapRef.current = instance;
      instance.setKos(kosRef.current);
    };
    if (engine === "google") {
      loadGoogleMaps()
        .then((maps) => mount(createGoogleMap(el.current, maps, { interactive })))
        .catch((err) => {
          console.warn(`${err.message}, peta memakai OpenStreetMap.`);
          if (!cancelled) setEngine("leaflet");
        });
    } else {
      mount(createLeafletMap(el.current, { interactive }));
    }
    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [engine, interactive]);

  useEffect(
    () =>
      onGoogleAuthFailure(() => {
        console.warn("API key Google Maps ditolak, peta memakai OpenStreetMap.");
        setEngine("leaflet");
      }),
    []
  );

  useEffect(() => {
    kosRef.current = kos;
    mapRef.current?.setKos(kos);
  }, [kos]);

  const onClick = (e) => {
    const link = e.target.closest("a[data-kos-link]");
    if (!link) return;
    e.preventDefault();
    navigate(link.getAttribute("href"));
  };

  // key: div peta dibuat ulang saat ganti mesin peta (Google → OpenStreetMap)
  return <div key={engine} ref={el} onClick={onClick} className={`z-0 ${className}`} />;
}
