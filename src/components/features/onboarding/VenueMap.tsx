'use client';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Point = { lat: number; lng: number };
export function VenueMap({ point, onChange }: { point: Point; onChange: (point: Point) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const callback = useRef(onChange);
  useEffect(() => { callback.current = onChange; }, [onChange]);
  useEffect(() => {
    let disposed = false;
    import('leaflet').then((L) => {
      if (disposed || !container.current) return;
      const instance = L.map(container.current).setView([point.lat, point.lng], 14);
      map.current = instance;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(instance);
      const icon = L.divIcon({ html: '<div style="background:#111;border:3px solid white;border-radius:50%;width:24px;height:24px;box-shadow:0 2px 8px #444"></div>', className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
      marker.current = L.marker([point.lat, point.lng], { draggable: true, icon }).addTo(instance);
      instance.on('click', (event) => { marker.current?.setLatLng(event.latlng); callback.current({ lat: event.latlng.lat, lng: event.latlng.lng }); });
      marker.current.on('dragend', () => { const p = marker.current!.getLatLng(); callback.current({ lat: p.lat, lng: p.lng }); });
    });
    return () => { disposed = true; map.current?.remove(); map.current = null; };
    // The map is created once; subsequent coordinates are synchronized below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { marker.current?.setLatLng([point.lat, point.lng]); map.current?.panTo([point.lat, point.lng]); }, [point.lat, point.lng]);
  return <div ref={container} dir="ltr" className="relative z-0 h-80 w-full" aria-label="برای انتخاب موقعیت روی نقشه کلیک کنید" />;
}
