import { redirect } from 'next/navigation';

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/salon/${encodeURIComponent(id)}?source=business`);
}
