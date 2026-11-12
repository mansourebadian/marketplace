export function customerCountLabel(count: number): string | null {
  if (count < 100) return 'ده‌ها نفر';
  const scales = [
    { threshold: 1_000_000_000_000, label: 'تریلیون' },
    { threshold: 1_000_000_000, label: 'میلیارد' },
    { threshold: 1_000_000, label: 'میلیون' },
    { threshold: 1_000, label: 'هزار' },
    { threshold: 1, label: '' },
  ];
  const scale = scales.find(({ threshold }) => count >= threshold)!;
  const amount = count / scale.threshold;
  const prefix = amount >= 100 ? 'صدها' : amount >= 10 ? 'ده‌ها' : '';
  const plural = scale.label === 'هزار' ? 'هزاران' : `${scale.label}‌ها`;
  return [prefix || plural, prefix && scale.label].filter(Boolean).join(' ') + ' نفر';
}
