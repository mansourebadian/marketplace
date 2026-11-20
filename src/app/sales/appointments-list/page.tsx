import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import { AppointmentsList } from './appointments-list';

export const metadata: Metadata = { title: 'نوبت‌ها | آرینو' };

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, name: true, businessAddress: true, owner: { select: { name: true } }, teamMembers: { select: { id: true, firstName: true, lastName: true } } } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  const members = new Map(business.teamMembers.map(member => [member.id, [member.firstName, member.lastName].filter(Boolean).join(' ')]));
  let unavailable = false;
  let rows: { id: string; reference: string; client: string; email: string; phone: string; customerCreatedAt: string; note: string; total: number; service: string; createdAt: string; startsAt: string; duration: number; member: string; price: number; status: string }[] = [];
  try {
    const items = await prisma.businessReservationItem.findMany({ where: { reservation: { businessId: business.id } }, select: { id: true, serviceName: true, startsAt: true, endsAt: true, memberKey: true, price: true, reservation: { select: { id: true, createdAt: true, status: true, appointmentStatus: true, total: true, note: true, customer: { select: { name: true, firstName: true, lastName: true, phone: true, email: true, createdAt: true } } } } }, orderBy: { startsAt: 'desc' } });
    rows = items.map(item => ({ id: item.id, reference: item.reservation.id, client: item.reservation.customer.name || [item.reservation.customer.firstName, item.reservation.customer.lastName].filter(Boolean).join(' ') || item.reservation.customer.phone || 'مشتری', email: item.reservation.customer.email.endsWith('@phone.invalid') ? '' : item.reservation.customer.email, phone: item.reservation.customer.phone || '', customerCreatedAt: item.reservation.customer.createdAt.toISOString(), note: item.reservation.note || '', total: item.reservation.total, service: item.serviceName, createdAt: item.reservation.createdAt.toISOString(), startsAt: item.startsAt.toISOString(), duration: Math.round((item.endsAt.getTime() - item.startsAt.getTime()) / 60000), member: item.memberKey === 'owner' ? (business.owner.name || business.name) : (members.get(item.memberKey) || 'نامشخص'), price: item.price, status: ['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(item.reservation.status) ? item.reservation.status : item.reservation.appointmentStatus }));
  } catch (error) { console.error('Loading sales appointments failed', error); unavailable = true; }
  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/sales/appointments-list" label="نوبت‌ها"><AppointmentsList rows={rows} unavailable={unavailable} /></BusinessWorkspace>;
}
