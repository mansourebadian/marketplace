export const featureGroups = [
  { title: 'امکانات', options: [
    { id: 'parking', label: 'پارکینگ', icon: 'car' },
    { id: 'transport', label: 'نزدیک به حمل‌ونقل عمومی', icon: 'bus' },
    { id: 'showers', label: 'دوش', icon: 'shower' },
    { id: 'lockers', label: 'کمد', icon: 'lock' },
    { id: 'towels', label: 'حوله', icon: 'bath' },
    { id: 'pool', label: 'استخر', icon: 'waves' },
    { id: 'sauna', label: 'سونا', icon: 'waves' },
  ] },
  { title: 'ویژگی‌ها', options: [
    { id: 'pets', label: 'پذیرش حیوانات خانگی', icon: 'dog' },
    { id: 'adults', label: 'فقط بزرگسالان', icon: 'users' },
    { id: 'kids', label: 'مناسب کودکان', icon: 'baby' },
    { id: 'accessible', label: 'دسترسی با ویلچر', icon: 'accessibility' },
    { id: 'men', label: 'فقط آقایان', icon: 'mars' },
    { id: 'women', label: 'فقط بانوان', icon: 'venus' },
  ] },
  { title: 'ارزش‌ها', options: [
    { id: 'organic', label: 'فقط محصولات ارگانیک' },
    { id: 'vegan', label: 'فقط محصولات گیاهی' },
    { id: 'environment', label: 'دوستدار محیط زیست' },
    { id: 'lgbtq', label: 'LGBTQ+' },
    { id: 'black', label: 'متعلق به سیاه‌پوستان' },
    { id: 'woman-owned', label: 'متعلق به زنان' },
    { id: 'asian', label: 'متعلق به آسیایی‌ها' },
    { id: 'hispanic', label: 'متعلق به اسپانیایی‌تبارها' },
    { id: 'indigenous', label: 'متعلق به بومیان' },
  ] },
] as const;

export const featureIds: readonly string[] = featureGroups.flatMap(group => group.options.map(option => option.id));
