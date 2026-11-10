import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { BookingOptions } from '@/components/features/BookingOptions';

export default async function BookingPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { id } = await params;
  const { source } = await searchParams;
  const salonHref = `/salon/${encodeURIComponent(id)}${source === 'business' ? '?source=business' : ''}`;

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 pb-16 text-gray-950 sm:px-6">
      <nav aria-label="بازگشت به سالن" className="mx-auto flex max-w-[1376px] items-center justify-between pt-4">
        <Link href={salonHref} aria-label="بازگشت به سالن" className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link href={salonHref} aria-label="بستن" className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
          <X className="h-5 w-5" />
        </Link>
      </nav>
      <BookingOptions servicesHref={`/salon/${encodeURIComponent(id)}/book/services${source === 'business' ? '?source=business' : ''}`} />
    </main>
  );
}

