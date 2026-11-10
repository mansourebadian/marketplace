import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).transform(value => value || null);
const date = z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)), 'تاریخ معتبر نیست.').transform(value => value ? new Date(`${value}T00:00:00Z`) : null);
export const teamMemberSchema = z.object({
  firstName: z.string().trim().min(1, 'نام را وارد کنید.').max(100), lastName: optionalText(100), email: z.string().trim().email('ایمیل معتبر وارد کنید.').max(320),
  phone: optionalText(32), additionalPhone: optionalText(32), country: optionalText(100), birthday: date, gender: optionalText(64), pronouns: optionalText(64),
  color: z.string().regex(/^#[0-9a-f]{6}$/i), jobTitle: optionalText(255), startDate: date, endDate: date, employmentType: optionalText(64), externalId: optionalText(100), notes: optionalText(1000), photoToken: z.string().max(2048),
}).refine(value => !value.startDate || !value.endDate || value.endDate >= value.startDate, { message: 'تاریخ پایان باید پس از تاریخ شروع باشد.' });

