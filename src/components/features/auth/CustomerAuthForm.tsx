'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ChevronDown, Mail, Search } from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY, flagUrl, type Country } from './countries';

interface LocationResponse {
  success: boolean;
  data?: {
    country?: string;
    countryCode?: string;
    callingCode?: string | number;
  };
}

export const CustomerAuthForm = () => {
  const [selectedCountry, setSelectedCountry] =
    useState<Country>(DEFAULT_COUNTRY);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [phone, setPhone] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function detectCountry() {
      try {
        const response = await fetch('/api/location', { cache: 'no-store' });
        const payload = (await response.json()) as LocationResponse;

        if (cancelled || !payload.success || !payload.data?.countryCode) {
          return;
        }

        const { countryCode, country, callingCode } = payload.data;
        const match = COUNTRIES.find(
          (countryItem) =>
            countryItem.code.toLowerCase() === countryCode.toLowerCase()
        );

        if (match) {
          setSelectedCountry(match);
          return;
        }

        setSelectedCountry({
          code: countryCode,
          nameFa: country || countryCode,
          nameEn: country || countryCode,
          dialCode: `+${String(callingCode ?? '').replace(/^\+/, '')}`,
        });
      } catch (error) {
        console.error('خطا در تشخیص کشور از IP:', error);
      }
    }

    detectCountry();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsCountryOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isCountryOpen) {
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [isCountryOpen]);

  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return COUNTRIES;
    }

    return COUNTRIES.filter((country) => {
      const dialCode = country.dialCode.replace('+', '');

      return (
        country.nameFa.toLowerCase().includes(query) ||
        country.nameEn.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query) ||
        dialCode.includes(query)
      );
    });
  }, [searchQuery]);

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setIsCountryOpen(false);
    setSearchQuery('');
  };

  const handleToggleCountry = () => {
    const nextOpen = !isCountryOpen;
    setIsCountryOpen(nextOpen);
    if (nextOpen) {
      setSearchQuery('');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="customer-phone"
          className="block text-[15px] font-medium text-gray-900"
        >
          تلفن
        </label>

        <div ref={containerRef} className="relative">
          <div className="flex items-stretch rounded-2xl border border-gray-300 bg-white transition-colors focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100">
            <button
              type="button"
              onClick={handleToggleCountry}
              aria-haspopup="listbox"
              aria-expanded={isCountryOpen}
              className="flex shrink-0 items-center gap-2 ps-4 py-4 pe-3 text-[15px] font-medium text-gray-900 hover:bg-gray-50 rounded-r-2xl"
            >
              <img
                src={flagUrl(selectedCountry.code)}
                alt={selectedCountry.code}
                width={24}
                height={16}
                loading="lazy"
                className="h-4 w-6 rounded-sm object-cover shadow-sm"
              />
              <span dir="ltr">{selectedCountry.dialCode}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            <div className="my-3 w-px shrink-0 bg-gray-200" />

            <input
              id="customer-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              dir="ltr"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0912 345 6789"
              className="min-w-0 flex-1 rounded-l-2xl px-4 py-4 text-left text-[15px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>

          {isCountryOpen && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="جستجوی کشور..."
                  className="w-full bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <ul
                role="listbox"
                aria-label="انتخاب کشور"
                className="max-h-72 overflow-y-auto py-2"
              >
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <li key={country.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={country.code === selectedCountry.code}
                        onClick={() => handleSelectCountry(country)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-right transition-colors hover:bg-gray-50"
                      >
                        <img
                          src={flagUrl(country.code)}
                          alt={country.code}
                          width={24}
                          height={16}
                          loading="lazy"
                          className="h-4 w-6 rounded-sm object-cover shadow-sm"
                        />
                        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-gray-900">
                          {country.nameFa}
                        </span>
                        <span className="shrink-0 text-sm text-gray-400" dir="ltr">
                          {country.dialCode}
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-8 text-center text-sm text-gray-400">
                    کشوری پیدا نشد
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <p className="text-[13px] leading-6 text-gray-500">
          برای شما کد تأیید ارسال می‌کنیم. تعرفه‌های استاندارد ممکن است اعمال شود.
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-2xl bg-indigo-600 py-4 text-[15px] font-bold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        ادامه
      </button>

      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-sm text-gray-400">یا</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white py-4 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
      >
        <Mail className="h-5 w-5 text-gray-500" />
        ادامه با ایمیل
      </button>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white py-4 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29A7.16 7.16 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
          />
        </svg>
        ادامه با گوگل
      </button>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white py-4 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-gray-900">
          <path d="M17.05 12.54c-.03-1.73 1.42-2.56 1.49-2.6-.81-1.18-2.07-1.35-2.52-1.37-1.07-.11-2.1.63-2.64.63-.55 0-1.4-.61-2.3-.6-1.18.02-2.27.69-2.88 1.75-1.23 2.13-.32 5.28.88 7.01.58.85 1.28 1.8 2.19 1.77.88-.04 1.21-.57 2.28-.57 1.07 0 1.37.57 2.31.55.95-.02 1.56-.87 2.14-1.72.67-.98.95-1.93.96-1.98-.02-.01-1.83-.7-1.85-2.77ZM14.5 5.34c.49-.59.82-1.4.73-2.21-.7.03-1.56.47-2.07 1.06-.45.52-.85 1.35-.75 2.14.78.06 1.58-.4 2.09-.99Z" />
        </svg>
        ادامه با اپل
      </button>

      <p className="text-center text-sm text-gray-500">
        حساب کسب‌وکار دارید؟{' '}
        <Link
          href="/auth/business"
          className="font-semibold text-indigo-600 hover:text-indigo-800"
        >
          به فرشا برای متخصصان بروید
        </Link>
      </p>
    </form>
  );
};
