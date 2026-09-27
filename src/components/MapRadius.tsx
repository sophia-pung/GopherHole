import { useEffect, useRef } from "react";

// Leaflet + OpenStreetMap loaded from CDN at runtime (browser only).
type L = any; // eslint-disable-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    L?: L;
  }
}

function loadLeaflet(): Promise<L> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve(window.L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function MapRadius({
  center,
  radiusMi,
  onCenter,
}: {
  center: [number, number];
  radiusMi: number;
  onCenter: (c: [number, number]) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L>(null);
  const circle = useRef<L>(null);
  const marker = useRef<L>(null);
  const cb = useRef(onCenter);
  cb.current = onCenter;

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((Lf) => {
      if (cancelled || !el.current || map.current) return;
      const m = Lf.map(el.current, { zoomControl: false, attributionControl: false }).setView(center, 14);
      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(m);
      circle.current = Lf.circle(center, {
        radius: radiusMi * 1609,
        color: "#7a0019",
        fillColor: "#ffcc33",
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(m);
      marker.current = Lf.circleMarker(center, { radius: 7, color: "#7a0019", fillColor: "#7a0019", fillOpacity: 1 }).addTo(m);
      m.on("click", (e: { latlng: { lat: number; lng: number } }) => cb.current([e.latlng.lat, e.latlng.lng]));
      map.current = m;
      m.fitBounds(circle.current.getBounds(), { padding: [10, 10] });
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current) return;
    circle.current.setLatLng(center).setRadius(radiusMi * 1609);
    marker.current.setLatLng(center);
    map.current.fitBounds(circle.current.getBounds(), { padding: [10, 10] });
  }, [center, radiusMi]);

  return <div ref={el} className="h-56 w-full overflow-hidden rounded-xl border border-input bg-secondary" />;
}
