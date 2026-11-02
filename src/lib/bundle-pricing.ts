/** Distribute an integer bundle price proportionally, preserving the exact total. */
export function allocateBundlePrice(prices: number[], bundlePrice: number): number[] {
  const total = prices.reduce((sum, price) => sum + price, 0);
  if (!Number.isSafeInteger(bundlePrice) || bundlePrice < 0 || !Number.isSafeInteger(total) || total <= 0 || prices.some(price => !Number.isSafeInteger(price) || price < 0)) return prices.map(() => 0);
  const totalUnits = BigInt(total);
  const target = BigInt(bundlePrice);
  const shares = prices.map((price, index) => {
    const product = BigInt(price) * target;
    return { index, amount: Number(product / totalUnits), remainder: product % totalUnits };
  });
  const remainder = bundlePrice - shares.reduce((sum, share) => sum + share.amount, 0);
  const ranked = [...shares].sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1);
  for (let index = 0; index < remainder; index++) ranked[index].amount++;
  return shares.map(share => share.amount);
}
