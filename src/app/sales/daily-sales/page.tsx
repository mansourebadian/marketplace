import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import { DailySales } from './daily-sales';

export const metadata: Metadata = { title: 'فروش روزانه | آرینو' };

export default async function DailySalesPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, name: true, businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const requested = (await searchParams).date;
  const validDate = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && !Number.isNaN(new Date(`${requested}T12:00:00Z`).getTime()) && new Date(`${requested}T12:00:00Z`).toISOString().slice(0, 10) === requested;
  const date = validDate ? requested : today;
  let sales: { kind: string; category: string; paymentType: string; quantity: number; amount: number }[] = [];
  let unavailable = false;
  try {
    sales = await prisma.businessSale.findMany({ where: { businessId: business.id, date }, select: { kind: true, category: true, paymentType: true, quantity: true, amount: true } });
  } catch (error) {
    console.error('Loading daily sales failed', error);
    unavailable = true;
  }
  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/sales/daily-sales" label="فروش روزانه"><DailySales today={today} date={date} sales={sales} unavailable={unavailable} /></BusinessWorkspace>;
}
