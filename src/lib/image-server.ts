// src/lib/image-server.ts
// هلپر متمرکز ساخت آدرس تصاویر از سرور تصویر مستقل
// آدرس پایه با متغیر محیطی NEXT_PUBLIC_IMAGE_SERVER_URL قابل تغییر است

const IMAGE_SERVER_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_SERVER_URL ?? 'http://localhost:4000';

export function imageUrl(fileName: string): string {
  return `${IMAGE_SERVER_BASE_URL}/images/${encodeURIComponent(fileName)}`;
}
