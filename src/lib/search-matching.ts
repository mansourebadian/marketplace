export function normalizeSearchText(text: string): string {
  return text.normalize('NFKC').toLocaleLowerCase('fa').replace(/[\u064a\u0649]/g, '\u06cc').replace(/\u0643/g, '\u06a9').replace(/[\u064b-\u065f\u0670\u0640]/g, '').replace(/[\s\u200c]+/g, ' ').trim();
}

export function matchesSearch(query: string, fields: (string | null | undefined)[]): boolean {
  const term = normalizeSearchText(query);
  return !term || fields.some(field => !!field && normalizeSearchText(field).includes(term));
}

export function businessAddressFields(address: string | null, city: string | null): string[] {
  if (!address) return city ? [city] : [];
  try {
    const parsed: unknown = JSON.parse(address);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const details = parsed as Record<string, unknown>;
      return [city, details.address, details.district, details.province].filter((item): item is string => typeof item === 'string');
    }
  } catch { return [address, ...(city ? [city] : [])]; }
  return city ? [city] : [];
}
