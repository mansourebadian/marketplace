export function formatBusinessAddress(address: string | null, city: string | null): string | null {
  if (!address) return city;
  try {
    const parsed: unknown = JSON.parse(address);
    if (parsed && typeof parsed === 'object' && 'address' in parsed && typeof parsed.address === 'string') {
      return [parsed.address, city].filter(Boolean).join('، ') || null;
    }
    return city;
  } catch {
    return [address, city].filter(Boolean).join('، ');
  }
}
