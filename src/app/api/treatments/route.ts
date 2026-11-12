import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type TreatmentService = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
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
        _count: { select: { services: true } },
        services: {
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
      prisma.businessService.findMany({ select: { id: true, name: true, price: true, durationMin: true, treatmentType: { select: { groupName: true, groupSlug: true } } }, orderBy: { name: 'asc' } }),
      prisma.service.findMany({ where: { categoryId: null }, select: { id: true, name: true, price: true, durationMin: true }, orderBy: { name: 'asc' } }),
    ]);

    const data: TreatmentCategory[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      order: category.order,
      servicesCount: category._count.services,
      services: category.services,
    }));

    const registeredGroups = new Map<string, TreatmentCategory>();
    for (const service of businessServices) {
      const groupName = service.treatmentType?.groupName || 'سایر خدمات';
      const groupKey = service.treatmentType?.groupSlug || 'other';
      let group = registeredGroups.get(groupKey);
      if (!group) {
        group = { id: `business-${groupKey}`, name: groupName, slug: groupKey, icon: '', order: 0, servicesCount: 0, services: [] };
        registeredGroups.set(groupKey, group);
      }
      if (!group.services.some(item => item.name === service.name)) group.services.push(service);
    }
    if (uncategorizedServices.length) registeredGroups.set('uncategorized-salons', { id: 'uncategorized-salons', name: 'سایر خدمات سالن‌ها', slug: 'other-salons', icon: '', order: 0, servicesCount: uncategorizedServices.length, services: uncategorizedServices });
    for (const group of registeredGroups.values()) {
      group.servicesCount = group.services.length;
      data.push(group);
    }

    return NextResponse.json(
      { data },
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
