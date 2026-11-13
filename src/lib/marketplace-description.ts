import { prisma } from '@/lib/prisma';

// Older installations may not yet have run the marketplace description migration.
export async function hasMarketplaceDescriptionColumn(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ available: number }[]>`
    SELECT CASE WHEN COL_LENGTH('dbo.Business', 'marketplaceDescription') IS NULL THEN 0 ELSE 1 END AS available
  `;
  return rows[0]?.available === 1;
}

export async function getMarketplaceDescription(businessId: string): Promise<string | null> {
  if (!(await hasMarketplaceDescriptionColumn())) return null;
  const rows = await prisma.$queryRaw<{ description: string | null }[]>`
    SELECT [marketplaceDescription] AS [description] FROM [dbo].[Business] WHERE [id] = ${businessId}
  `;
  return rows[0]?.description ?? null;
}
