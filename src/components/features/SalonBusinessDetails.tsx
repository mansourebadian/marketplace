import { Accessibility, Baby, Bath, BusFront, CarFront, CheckCircle2, Dog, LockKeyhole, Mars, ShowerHead, Users, Venus, Waves } from 'lucide-react';

type OpeningHour = { day: number; enabled: boolean; opensAt: string; closesAt: string; secondOpensAt: string | null; secondClosesAt: string | null };
type Feature = { id: string; label: string };

const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const icons: Record<string, typeof CarFront> = {
  parking: CarFront, transport: BusFront, showers: ShowerHead, lockers: LockKeyhole,
  towels: Bath, pool: Waves, sauna: Waves, pets: Dog, adults: Users, kids: Baby,
  accessible: Accessibility, men: Mars, women: Venus,
};

export default function SalonBusinessDetails({ hours, features }: { hours: OpeningHour[]; features: Feature[] }) {
  if (!hours.length && !features.length) return null;
  return <div dir="rtl" className="mt-10 grid gap-10 md:grid-cols-2">
    {hours.length > 0 && <section aria-labelledby="opening-hours-title">
      <h3 id="opening-hours-title" className="mb-5 text-xl font-bold text-gray-900">ساعت‌های کاری</h3>
      <ul className="space-y-3">
        {hours.filter(hour => hour.day >= 0 && hour.day < days.length).map(hour => <li key={hour.day} className="flex justify-between gap-4 text-sm">
          <span className="flex items-center gap-2"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${hour.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />{days[hour.day]}</span>
          {hour.enabled ? <span dir="ltr" className="text-left tabular-nums"><span className="block">{hour.opensAt} - {hour.closesAt}</span>{hour.secondOpensAt && hour.secondClosesAt && <span className="block">{hour.secondOpensAt} - {hour.secondClosesAt}</span>}</span> : <span className="text-gray-500">تعطیل</span>}
        </li>)}
      </ul>
    </section>}
    {features.length > 0 && <section aria-labelledby="business-features-title">
      <h3 id="business-features-title" className="mb-5 text-xl font-bold text-gray-900">اطلاعات تکمیلی</h3>
      <ul className="space-y-3">{features.map(feature => {
        const Icon = icons[feature.id] ?? CheckCircle2;
        return <li key={feature.id} className="flex items-center gap-2 text-sm text-gray-800"><Icon size={18} strokeWidth={1.7} aria-hidden="true" />{feature.label}</li>;
      })}</ul>
    </section>}
  </div>;
}
