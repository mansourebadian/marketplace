import type { Metadata } from 'next';
import { LegalDocument } from '@/components/shared/LegalDocument';
import { privacySections } from './privacy-content';

export const metadata: Metadata = {
  title: 'سیاست حفظ حریم خصوصی | فرشا',
  description: 'اطلاعیهٔ حریم خصوصی فرشا؛ نحوهٔ جمع‌آوری، استفاده و حفاظت از داده‌های شخصی و حقوق شما.',
};

export default function PrivacyPolicyPage() {
  return <LegalDocument title="اطلاعیهٔ حریم خصوصی فرشا" documentId="privacy-content" currentPath="/privacy-policy" sections={privacySections} moreInfo />;
}
