export const BUSINESS_CATEGORIES = [
  { slug: 'hair-salon', label: 'سالن مو', icon: 'Scissors' },
  { slug: 'nails', label: 'ناخن', icon: 'Hand' },
  { slug: 'eyebrows-lashes', label: 'ابرو و مژه', icon: 'Eye' },
  { slug: 'beauty-salon', label: 'سالن زیبایی', icon: 'SprayCan' },
  { slug: 'medspa', label: 'زیبایی پزشکی', icon: 'Sparkles' },
  { slug: 'barber', label: 'آرایشگاه مردانه', icon: 'Armchair' },
  { slug: 'massage', label: 'ماساژ', icon: 'Bed' },
  { slug: 'spa-sauna', label: 'اسپا و سونا', icon: 'Bath' },
  { slug: 'waxing-salon', label: 'اپیلاسیون', icon: 'Paintbrush' },
  { slug: 'tattoo-piercing', label: 'تاتو و پیرسینگ', icon: 'Heart' },
  { slug: 'tanning-studio', label: 'سولاریوم', icon: 'Glasses' },
  { slug: 'fitness-recovery', label: 'تناسب اندام و ریکاوری', icon: 'Bike' },
  { slug: 'physical-therapy', label: 'فیزیوتراپی', icon: 'Footprints' },
  { slug: 'health-practice', label: 'خدمات سلامت', icon: 'Cross' },
  { slug: 'pet-grooming', label: 'آرایش حیوانات خانگی', icon: 'Dog' },
  { slug: 'other', label: 'سایر', icon: 'Grid2X2' },
] as const;

export type BusinessCategorySlug = typeof BUSINESS_CATEGORIES[number]['slug'];
