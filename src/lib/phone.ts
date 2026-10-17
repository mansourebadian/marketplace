export function latinDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => String(digit.charCodeAt(0) - (digit >= '۰' ? 1776 : 1632)));
}

export function normalizePhone(value: string, dialCode: string) {
  const cleaned = latinDigits(value).replace(/[\s()-]/g, '');
  if (!/^\+[1-9]\d{0,3}$/.test(dialCode)) return null;
  const phone = cleaned.startsWith('+') ? cleaned : cleaned.startsWith('00')
    ? `+${cleaned.slice(2)}` : `${dialCode}${cleaned.replace(/^0/, '')}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) return null;
  if (phone.startsWith('+98') && !/^\+989\d{9}$/.test(phone)) return null;
  return phone;
}

export function safePhoneCallback(value: string) {
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/profile';
  try {
    const url = new URL(value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid' || url.pathname.startsWith('/auth') || url.pathname.startsWith('/api')) return '/profile';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return '/profile'; }
}
