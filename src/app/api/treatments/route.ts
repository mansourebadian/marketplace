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
const SERVICES_PREVIEW_LIMIT = 6;

export async function GET() {
  try {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        order: true,
        _count: { select: { services: true } },
        services: {
          take: SERVICES_PREVIEW_LIMIT,
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            price: true,
            durationMin: true,
          },
        },
      },
    });

    const data: TreatmentCategory[] = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      order: category.order,
      servicesCount: category._count.services,
      services: category.services,
    }));

    return NextResponse.json(
      { data },
      {
        headers: {
          // دسته‌بندی‌ها کم‌تغییر هستند؛ کش لبه‌ای فشار روی SQL Server را کم می‌کند
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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
