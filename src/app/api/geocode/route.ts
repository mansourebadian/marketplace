import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'OWNER') return NextResponse.json({}, { status: 401 });
  const q = request.nextUrl.searchParams;
  const reverse = q.has('lat') && q.has('lng');
  const lat = Number(q.get('lat')), lng = Number(q.get('lng'));
  if (reverse && (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) return NextResponse.json({}, { status: 400 });
  const city = q.get('city')?.trim();
  if (!reverse && (!city || city.length > 100)) return NextResponse.json({}, { status: 400 });
  const endpoint = reverse ? `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}` : `https://photon.komoot.io/api/?q=${encodeURIComponent(city! + ', Iran')}&limit=1`;
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Geocoding unavailable');
    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature) return NextResponse.json({}, { status: 404 });
    const p = feature.properties;
    return NextResponse.json({ point: { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] }, details: { address: [p.street, p.housenumber].filter(Boolean).join(' '), district: p.district || p.locality || '', postalCode: p.postcode || '', city: p.city || '', province: p.state || '', country: p.country || 'ایران' } });
  } catch { return NextResponse.json({ message: 'دریافت آدرس از نقشه ممکن نشد؛ جزئیات را دستی وارد کنید.' }, { status: 502 }); }
}
