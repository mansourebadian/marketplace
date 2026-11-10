import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';

async function context(id: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return null;
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, categories: true, serviceCategories: true } });
  if (!business) return null;
  if (id !== 'owner' && !await prisma.businessTeamMember.findFirst({ where: { id, businessId: business.id }, select: { id: true } })) return null;
  return business;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await context(id);
  if (!business) return Response.json({ error: 'عضو تیم پیدا نشد یا دسترسی مجاز نیست.' }, { status: 404 });
  try {
    const [services, assignment] = await Promise.all([
      prisma.businessService.findMany({ where: { businessId: business.id }, select: { id: true, categoryKey: true, name: true, price: true, priceType: true, durationMin: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] }),
      prisma.businessMemberServices.findUnique({ where: { businessId_memberKey: { businessId: business.id, memberKey: id } } }),
    ]);
    const names: Record<string, string> = {};
    for (const category of business.categories) names['default:' + category.slug] = category.displayName || category.customName || BUSINESS_CATEGORIES.find(item => item.slug === category.slug)?.label || category.slug;
    for (const category of business.serviceCategories) names['custom:' + category.id] = category.name;
    let selected: string[] = services.map(service => service.id);
    if (assignment) { const value: unknown = JSON.parse(assignment.serviceIds); selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
    const availableIds = new Set(services.map(service => service.id));
    selected = selected.filter(serviceId => availableIds.has(serviceId));
    return Response.json({ services, names, selected });
  } catch (error) { console.error('Loading member services failed', error); return Response.json({ error: 'دریافت خدمات انجام نشد.' }, { status: 500 }); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await context(id);
  if (!business) return Response.json({ error: 'عضو تیم پیدا نشد یا دسترسی مجاز نیست.' }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'اطلاعات معتبر نیست.' }, { status: 400 }); }
  const parsed = z.object({ serviceIds: z.array(z.string().min(1).max(36)).max(10000) }).safeParse(body);
  if (!parsed.success || new Set(parsed.data.serviceIds).size !== parsed.data.serviceIds.length) return Response.json({ error: 'انتخاب خدمات معتبر نیست.' }, { status: 400 });
  try {
    const count = await prisma.businessService.count({ where: { businessId: business.id, id: { in: parsed.data.serviceIds } } });
    if (count !== parsed.data.serviceIds.length) return Response.json({ error: 'برخی خدمات انتخاب‌شده در فهرست کسب‌وکار وجود ندارند.' }, { status: 400 });
    await prisma.businessMemberServices.upsert({ where: { businessId_memberKey: { businessId: business.id, memberKey: id } }, create: { businessId: business.id, memberKey: id, serviceIds: JSON.stringify(parsed.data.serviceIds) }, update: { serviceIds: JSON.stringify(parsed.data.serviceIds) } });
    return Response.json({ success: true });
  } catch (error) { console.error('Saving member services failed', error); return Response.json({ error: 'ذخیره خدمات انجام نشد.' }, { status: 500 }); }
}
