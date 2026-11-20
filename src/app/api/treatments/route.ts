import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isServiceOffered } from '@/lib/offered-services';

export type TreatmentService = {
  id: string;
  name: string;
  price?: number;
  durationMin?: number;
};

export type TreatmentCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  servicesCount: number;
  services: TreatmentService[];
};

// حداکثر تعداد سرویس نمایش‌داده‌شده زیر هر دسته‌بندی در دراپ‌داون
export async function GET() {
  try {
    const [categories, businessServices, uncategorizedServices] = await Promise.all([prisma.serviceCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        order: true,
        services: {
          where: { salon: { teamMembers: { some: {} } } },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
            durationMin: true,
          },
        },
      },
    }),
      prisma.businessService.findMany({ where: { business: { businessAddress: { not: null } } }, select: { id: true, name: true, price: true, durationMin: true, treatmentType: { select: { id: true, name: true, groupName: true, groupSlug: true } }, business: { select: { teamMembers: { select: { id: true } }, memberServices: { select: { memberKey: true, serviceIds: true } } } } }, orderBy: { name: 'asc' } }),
      prisma.service.findMany({ where: { categoryId: null, salon: { teamMembers: { some: {} } } }, select: { id: true, name: true, price: true, durationMin: true }, orderBy: { name: 'asc' } }),
    ]);

    const data: TreatmentCategory[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      order: category.order,
      servicesCount: category.services.length,
      services: category.services,
    }));

    const registeredGroups = new Map<string, TreatmentCategory>();
    for (const service of businessServices) {
      if (!isServiceOffered(service.id, ['owner', ...service.business.teamMembers.map(member => member.id)], service.business.memberServices)) continue;
      const groupName = service.treatmentType?.groupName || 'سایر خدمات';
      const groupKey = service.treatmentType?.groupSlug || 'other';
      let group = registeredGroups.get(groupKey);
      if (!group) {
        group = data.find(category => category.slug === groupKey) || { id: `business-${groupKey}`, name: groupName, slug: groupKey, icon: '', order: 0, servicesCount: 0, services: [] };
        registeredGroups.set(groupKey, group);
        if (!data.includes(group)) data.push(group);
      }
      if (service.treatmentType && !group.services.some(item => item.name === service.treatmentType!.name)) group.services.push({ id: service.treatmentType.id, name: service.treatmentType.name });
      if (!group.services.some(item => item.name === service.name)) group.services.push({ id: service.id, name: service.name, price: service.price, durationMin: service.durationMin });
    }
    if (uncategorizedServices.length) data.push({ id: 'uncategorized-salons', name: 'سایر خدمات سالن‌ها', slug: 'other-salons', icon: '', order: 0, servicesCount: uncategorizedServices.length, services: uncategorizedServices });
    for (const group of registeredGroups.values()) {
      group.servicesCount = group.services.length;
    }

    return NextResponse.json(
      { data: data.filter(group => group.services.length > 0) },
      {
        headers: {
          // دسته‌بندی‌ها کم‌تغییر هستند؛ کش لبه‌ای فشار روی SQL Server را کم می‌کند
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/treatments]", error);
    return NextResponse.json(
      { error: "خطا در دریافت دسته‌بندی خدمات" },
      { status: 500 }
    );
  }
}
