import type { Metadata } from 'next';
import { LegalDocument } from '@/components/shared/LegalDocument';
import { termsSections } from './terms-content';

export const metadata: Metadata = {
  title: 'شرایط استفاده از خدمات | آرینو',
  description: 'شرایط استفاده از خدمات آرینو؛ رزرو نوبت، خرید محصولات، پرداخت، لغو، بازپرداخت و مسئولیت‌ها.',
};

export default function TermsOfServicePage() {
  return <LegalDocument title="شرایط استفاده از خدمات آرینو" documentId="terms-content" currentPath="/terms-of-service" sections={termsSections} variant="terms" />;
}
