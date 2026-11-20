'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export default function SalonLocationMap({ lat, lng }: { lat: number; lng: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let disposed = false;
    let map: import('leaflet').Map | undefined;
    import('leaflet').then(L => {
      if (disposed || !container.current) return;
      map = L.map(container.current, { scrollWheelZoom: false }).setView([lat, lng], 15);
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map);
      tiles.on('tileerror', () => setUnavailable(true));
      tiles.on('tileload', () => setUnavailable(false));
      const icon = L.divIcon({ html: '<div style="background:#111;border:3px solid white;border-radius:50%;width:24px;height:24px;box-shadow:0 2px 8px #444"></div>', className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
      L.marker([lat, lng], { icon, title: 'موقعیت سالن' }).addTo(map);
    }).catch(() => { if (!disposed) setUnavailable(true); });
    return () => { disposed = true; map?.remove(); };
  }, [lat, lng]);

  return <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 mb-4">
    <div ref={container} dir="ltr" className="relative z-0 h-full w-full" aria-label="نقشه موقعیت سالن" />
    {unavailable && <p role="status" className="absolute inset-x-3 top-3 z-[500] rounded-lg bg-white p-2 text-center text-sm text-gray-700 shadow">بارگذاری نقشه ممکن نیست؛ از پیوند مسیریابی استفاده کنید.</p>}
  </div>;
}
