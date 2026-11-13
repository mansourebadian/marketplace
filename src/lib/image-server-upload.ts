// This module is used only by server-side upload routes.
export function uploadImage(file: File): Promise<Response> {
  const token = process.env.IMAGE_SERVER_TOKEN;
  if (!token) throw new Error('IMAGE_SERVER_TOKEN is required for image uploads');
  const base = process.env.IMAGE_SERVER_URL || process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://localhost:4001';
  return fetch(`${base.replace(/\/$/, '')}/images`, {
    method: 'POST',
    headers: { 'Content-Type': file.type, Authorization: `Bearer ${token}` },
    body: file,
    cache: 'no-store',
  });
}
