import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import { ClientsList } from './clients-list';

export const metadata: Metadata = { title: 'فهرست مشتریان | آرینو' };

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, name: true, businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  const [users, manualClients, clientPhotos, sales] = await Promise.all([
    prisma.user.findMany({
      where: { businessReservations: { some: { businessId: business.id } } },
      select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true, businessReservations: { where: { businessId: business.id }, orderBy: { createdAt: 'asc' }, take: 1, select: { createdAt: true } } },
    }),
    prisma.businessClient.findMany({ where: { businessId: business.id }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true, photoType: true } }),
    prisma.businessClientPhoto.findMany({ where: { businessId: business.id }, select: { customerId: true } }),
    prisma.businessSale.groupBy({ by: ['customerId'], where: { businessId: business.id, customerId: { not: null }, kind: 'SALE' }, _sum: { amount: true } }),
  ]);
  const salesByCustomer = new Map(sales.map(sale => [sale.customerId, sale._sum.amount || 0]));
  const customersWithPhoto = new Set(clientPhotos.map(photo => photo.customerId));
  const clients = [...users.map(user => ({
    id: user.id,
    name: user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.phone || (user.email.endsWith('@phone.invalid') ? 'مشتری' : user.email),
    email: user.email.endsWith('@phone.invalid') ? '' : user.email,
    phone: user.phone,
    createdAt: user.businessReservations[0].createdAt.toISOString(),
    sales: salesByCustomer.get(user.id) || 0,
    hasPhoto: customersWithPhoto.has(user.id),
    isManual: true,
  })), ...manualClients.map(client => ({ id: client.id, name: [client.firstName, client.lastName].filter(Boolean).join(' '), email: client.email || '', phone: client.phone, createdAt: client.createdAt.toISOString(), sales: salesByCustomer.get(client.id) || 0, hasPhoto: !!client.photoType, isManual: true }))];

  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/clients/list" label="فهرست مشتریان"><ClientsList clients={clients} /></BusinessWorkspace>;
}
