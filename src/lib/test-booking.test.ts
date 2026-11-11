import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { prisma } from './prisma';
import { createTestBookingRecord } from './test-booking';
import { sessionCookie } from './session-cookie';

test('simulated bookings serialize conflicting requests and retry idempotently', { skip: process.env.BOOKING_DB_TEST !== '1' }, async () => {
  const marker = randomUUID();
  const owner = await prisma.user.create({ data: { email: `${marker}-owner@booking-test.invalid`, role: 'OWNER' } });
  const customer = await prisma.user.create({ data: { email: `${marker}-customer@booking-test.invalid`, role: 'CUSTOMER' } });
  const outsider = await prisma.user.create({ data: { email: `${marker}-outsider@booking-test.invalid`, role: 'OWNER' } });
  let businessId = '';
  try {
    const business = await prisma.business.create({ data: { ownerId: owner.id, name: 'Isolated booking test', businessAddress: '{}' } });
    businessId = business.id;
    const member = await prisma.businessTeamMember.create({ data: { businessId, firstName: 'Test', email: `${marker}-team@booking-test.invalid`, color: '#112233' } });
    const service = await prisma.businessService.create({ data: { businessId, categoryKey: 'test', name: 'Test service', durationMin: 60, price: 100 } });
    const day = new Date(Date.now() + 3 * 86_400_000);
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(day);
    const part = (name: string) => parts.find(item => item.type === name)?.value;
    const date = `${part('year')}-${part('month')}-${part('day')}`;
    await prisma.businessShift.create({ data: { businessId, memberKey: 'owner', date, startTime: '09:00', endTime: '17:00' } });
    await prisma.businessShift.create({ data: { businessId, memberKey: member.id, date, startTime: '12:00', endTime: '14:00' } });
    const base = { businessId, start: Date.parse(`${date}T10:00:00+03:30`), firstVisit: true, note: 'isolated test', services: [{ id: service.id, memberKey: '__any__' }] };
    const inputs = [{ ...base, requestId: randomUUID() }, { ...base, requestId: randomUUID() }];
    const outcomes = await Promise.all(inputs.map(input => createTestBookingRecord(input, customer.id)));
    assert.equal(outcomes.filter(item => item.id).length, 1);
    assert.equal(outcomes.filter(item => item.error).length, 1);
    const winner = outcomes.findIndex(item => item.id);
    const retry = await createTestBookingRecord(inputs[winner], customer.id);
    assert.equal(retry.id, outcomes[winner].id);
    const reservations = await prisma.businessReservation.findMany({ where: { businessId }, include: { items: true } });
    assert.equal(reservations.length, 1);
    assert.equal(reservations[0].status, 'TEST_CONFIRMED');
    assert.equal(reservations[0].items.length, 1);
    assert.equal(reservations[0].items[0].memberKey, 'owner');
    const memberBooking = await createTestBookingRecord({ ...base, start: Date.parse(`${date}T12:00:00+03:30`), requestId: randomUUID(), services: [{ id: service.id, memberKey: member.id }] }, customer.id);
    assert.ok(memberBooking.id);
    if (process.env.BOOKING_HTTP_TEST === '1') {
      const origin = 'http://localhost:3000';
      const availability = await fetch(`${origin}/api/business/${businessId}/availability?${new URLSearchParams({ date, services: service.id })}`);
      assert.equal(availability.status, 200);
      const availabilityData = await availability.json();
      assert.ok(!availabilityData.slots.includes(base.start));
      const nextDay = new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
      const calendarUrl = `${origin}/api/business/calendar/appointments?${new URLSearchParams({ from: date, to: nextDay })}`;
      assert.equal((await fetch(calendarUrl)).status, 401);
      const token = randomUUID();
      await prisma.session.create({ data: { sessionToken: token, userId: owner.id, expires: new Date(Date.now() + 60_000) } });
      const response = await fetch(calendarUrl, { headers: { cookie: `${sessionCookie().name}=${token}` } });
      assert.equal(response.status, 200);
      const calendar = await response.json();
      assert.equal(calendar.appointments.length, 2);
      assert.equal(calendar.appointments[0].memberKey, 'owner');
      assert.equal(calendar.appointments[0].isTest, true);
      assert.equal(calendar.appointments[0].note, 'isolated test');
      assert.equal(calendar.appointments[1].memberKey, member.id);
      const outsiderToken = randomUUID();
      await prisma.session.create({ data: { sessionToken: outsiderToken, userId: outsider.id, expires: new Date(Date.now() + 60_000) } });
      const otherResponse = await fetch(calendarUrl, { headers: { cookie: `${sessionCookie().name}=${outsiderToken}` } });
      assert.equal(otherResponse.status, 200);
      assert.deepEqual((await otherResponse.json()).appointments, []);
    }
  } finally {
    if (businessId) {
      await prisma.businessReservation.deleteMany({ where: { businessId } });
      await prisma.business.delete({ where: { id: businessId } });
    }
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, customer.id, outsider.id] } } });
    await prisma.$disconnect();
  }
});
