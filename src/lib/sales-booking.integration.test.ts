import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mock, test } from 'node:test';
import { prisma } from './prisma';
import { createTestBookingRecord } from './test-booking';

test('a pay-at-venue booking is not a sale until payment is recorded', { skip: process.env.BOOKING_DB_TEST !== '1' }, async () => {
  const marker = randomUUID();
  let ownerId = '';
  let customerId = '';
  let businessId = '';
  try {
    const owner = await prisma.user.create({ data: { email: `${marker}-owner@booking-test.invalid`, role: 'OWNER' } });
    ownerId = owner.id;
    const customer = await prisma.user.create({ data: { email: `${marker}-customer@booking-test.invalid`, role: 'CUSTOMER' } });
    customerId = customer.id;
    const business = await prisma.business.create({ data: { ownerId, name: 'Isolated sales test', businessAddress: '{}' } });
    businessId = business.id;
    const service = await prisma.businessService.create({ data: { businessId, categoryKey: 'test', name: 'Isolated test service', durationMin: 60, price: 100000 } });
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 3 * 86400000));
    await prisma.businessShift.create({ data: { businessId, memberKey: 'owner', date, startTime: '09:00', endTime: '17:00' } });
    // This gateway exists only in the test; the application has no gateway integration yet.
    const gateway = mock.fn(async (outcome: 'success' | 'failed' | 'cancelled') => outcome);
    const simulatedCheckout = async (outcome: 'success' | 'failed' | 'cancelled') => {
      if (await gateway(outcome) !== 'success') return null;
      return createTestBookingRecord({ businessId, requestId: mockRequestId, start: Date.parse(`${date}T11:00:00+03:30`), firstVisit: true, note: 'mock gateway test', services: [{ id: service.id, memberKey: 'owner' }] }, customerId, 'TEST_CONFIRMED');
    };
    const mockRequestId = randomUUID();
    assert.equal(await simulatedCheckout('failed'), null);
    assert.equal(await simulatedCheckout('cancelled'), null);
    assert.equal(await prisma.businessReservation.count({ where: { businessId } }), 0);
    const mockSuccess = await simulatedCheckout('success');
    assert.ok(mockSuccess?.id, mockSuccess?.error);
    assert.equal((await simulatedCheckout('success'))?.id, mockSuccess.id);
    assert.equal(gateway.mock.callCount(), 4);
    assert.equal((await prisma.businessReservation.findUniqueOrThrow({ where: { id: mockSuccess.id } })).status, 'TEST_CONFIRMED');
    assert.equal(await prisma.businessSale.count({ where: { businessId } }), 0);
    const requestId = randomUUID();
    const booking = { businessId, requestId, start: Date.parse(`${date}T10:00:00+03:30`), firstVisit: true, note: '', services: [{ id: service.id, memberKey: 'owner' }] };
    const result = await createTestBookingRecord(booking, customerId, 'CONFIRMED');
    assert.ok(result.id, result.error);
    const retry = await createTestBookingRecord(booking, customerId, 'CONFIRMED');
    assert.equal(retry.id, result.id);
    const reservation = await prisma.businessReservation.findUniqueOrThrow({ where: { id: result.id }, include: { items: true } });
    assert.equal(reservation.status, 'CONFIRMED');
    assert.equal(reservation.total, 100000);
    assert.equal(reservation.items[0].price, 100000);
    assert.equal(await prisma.businessSale.count({ where: { businessId, date } }), 0);

    await prisma.businessSale.create({ data: { businessId, date, kind: 'SALE', category: 'SERVICE', paymentType: 'CASH', quantity: 1, amount: 100000 } });
    await prisma.businessSale.create({ data: { businessId, date, kind: 'REFUND', category: 'SERVICE', paymentType: 'CASH', quantity: 1, amount: 20000 } });
    const sales = await prisma.businessSale.findMany({ where: { businessId, date } });
    assert.equal(sales.filter(item => item.kind === 'SALE').reduce((sum, item) => sum + item.amount, 0), 100000);
    assert.equal(sales.filter(item => item.kind === 'REFUND').reduce((sum, item) => sum + item.amount, 0), 20000);
    assert.equal(await prisma.businessSale.count({ where: { businessId, date: '2000-01-01' } }), 0);
  } finally {
    if (businessId) {
      await prisma.businessSale.deleteMany({ where: { businessId } });
      await prisma.businessReservation.deleteMany({ where: { businessId } });
      await prisma.business.delete({ where: { id: businessId } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, customerId].filter(Boolean) } } });
    await prisma.$disconnect();
  }
});
