import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { readClientPhoto } from '@/lib/client-photo';

export const runtime = 'nodejs';
const text = (max: number) => z.string().trim().max(max);
const optionalEmail = text(320).refine(value => !value || z.email().safeParse(value).success);
const addressSchema = z.object({ name: text(100).min(1), address: text(300).min(1), apartment: text(100), district: text(100), city: text(100), region: text(100), postalCode: text(20) });
const fields = z.object({
  firstName: text(100).min(1), lastName: text(100), email: optionalEmail, phone: text(32),
  birthday: text(10).refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10))),
  gender: z.enum(['', 'female', 'male', 'other', 'undisclosed']), pronouns: z.enum(['', 'she', 'he', 'they', 'other']),
  source: z.enum(['walk-in', 'referral', 'online', 'other']), referralId: text(1000), language: z.enum(['', 'fa', 'en']), occupation: text(255), country: z.enum(['', 'IR']), additionalEmail: optionalEmail, additionalPhone: text(32),
  primaryContactName: text(200), primaryContactRelationship: text(100), primaryContactEmail: optionalEmail, primaryContactPhone: text(32), primaryContactCountryCode: z.literal('+98'),
  secondaryContactName: text(200), secondaryContactRelationship: text(100), secondaryContactEmail: optionalEmail, secondaryContactPhone: text(32), secondaryContactCountryCode: z.literal('+98'),
});
const keys = Object.keys(fields.shape) as (keyof typeof fields.shape)[];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'برای ثبت مشتری وارد حساب کسب‌وکار شوید.' }, { status: 401 });
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: 'اطلاعات ارسالی معتبر نیست.' }, { status: 400 }); }
  const values = fields.safeParse(Object.fromEntries(keys.map(key => [key, typeof form.get(key) === 'string' ? form.get(key) : ''])));
  if (!values.success) return Response.json({ error: 'نام و اطلاعات واردشده را بررسی کنید؛ تاریخ تولد نباید در آینده باشد.' }, { status: 400 });
  let rawAddresses: unknown;
  try { const value = form.get('addresses'); if (typeof value !== 'string' || value.length > 30000) throw new Error(); rawAddresses = JSON.parse(value); } catch { return Response.json({ error: 'اطلاعات آدرس معتبر نیست.' }, { status: 400 }); }
  const addresses = z.array(addressSchema).max(20).safeParse(rawAddresses);
  if (!addresses.success) return Response.json({ error: 'اطلاعات آدرس معتبر نیست.' }, { status: 400 });
  const file = form.get('photo');
  let photo: Buffer | null = null;
  let photoType: string | null = null;
  if (file instanceof File && file.size) {
    const parsed = await readClientPhoto(file);
    if (!parsed) return Response.json({ error: 'تصویر باید PNG، JPEG یا WebP معتبر و حداکثر ۵ مگابایت باشد.' }, { status: 400 });
    photo = parsed.bytes; photoType = parsed.type;
  }
  try {
    const data = values.data;
    if (data.referralId) {
      const [reservation, client] = await Promise.all([prisma.businessReservation.findFirst({ where: { businessId: business.id, customerId: data.referralId }, select: { id: true } }), prisma.businessClient.findFirst({ where: { businessId: business.id, id: data.referralId }, select: { id: true } })]);
      if (!reservation && !client) return Response.json({ error: 'مشتری معرف معتبر نیست.' }, { status: 400 });
    }
    const settings = Object.fromEntries(['notificationEmail', 'notificationSms', 'notificationBale', 'marketingEmail', 'marketingSms', 'marketingBale'].map(key => [key, form.get(key) === 'on']));
    const { firstName, lastName, email, phone, birthday, gender, ...additional } = data;
    const client = await prisma.businessClient.create({ data: { businessId: business.id, firstName, lastName: lastName || null, email: email || null, phone: phone || null, birthday: birthday ? new Date(`${birthday}T00:00:00Z`) : null, gender: gender || null, details: JSON.stringify({ ...additional, addresses: addresses.data, settings }), photo: photo ? new Uint8Array(photo) : null, photoType }, select: { id: true } });
    return Response.json({ id: client.id }, { status: 201 });
  } catch (error) { console.error('Creating business client failed', error); return Response.json({ error: 'ثبت مشتری انجام نشد. دوباره تلاش کنید.' }, { status: 500 }); }
}
