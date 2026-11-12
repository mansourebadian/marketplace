import { Header } from '@/components/shared/Header';
import { Hero } from '@/components/features/Hero';
import { SalonSections } from '@/components/features/SalonSections';
import prisma from '@/lib/prisma';
import { customerCountLabel } from '@/lib/customer-count-label';
import styles from './home.module.css';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let bookingCount: number | null = null;
  let customerLabel: string | null = null;
  try {
    const [salonBookings, businessBookings, customers] = await Promise.all([
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.businessReservation.count({ where: { status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } } }),
      prisma.user.count({ where: { OR: [
        { bookings: { some: { status: 'CONFIRMED' } } },
        { businessReservations: { some: { status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } } } },
      ] } }),
    ]);
    bookingCount = salonBookings + businessBookings;
    customerLabel = customerCountLabel(customers);
  } catch (error) {
    console.error('Error counting confirmed bookings:', error);
  }

  return (
    <main className="min-h-screen relative">
      <Header />
      <div className={styles.homeContent}>
        <Hero bookingCount={bookingCount === null ? null : bookingCount.toLocaleString('fa-IR')} customerLabel={customerLabel} />
        <SalonSections />
      </div>
    </main>
  );
}

