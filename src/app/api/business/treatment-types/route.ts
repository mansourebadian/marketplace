import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  try {
    const data = await prisma.treatmentType.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, groupSlug: true, groupName: true, name: true } });
    return Response.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Failed to load treatment types', error);
    return Response.json({ error: 'دریافت انواع خدمت انجام نشد.' }, { status: 500 });
  }
}
