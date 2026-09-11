'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Sparkles, Scissors, Hand, Footprints, Eye, Brush, Waves,
  Flower2, Smile, Dumbbell, HeartPulse, Stethoscope, Syringe,
  Palette, Baby, Loader2, type LucideIcon,
} from 'lucide-react';

/* ================= انواع داده ================= */

export interface TreatmentService {
  id: string;
  name: string;
  slug?: string | null;
}

export interface TreatmentCategory {
  id: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
  serviceCount: number;
  services: TreatmentService[];
}

/* ================= نگاشت آیکون ================= */

const ICON_MAP: Record<string, LucideIcon> = {
  hair: Scissors,
  'hair-salon': Scissors,
  barber: Scissors,
  scissors: Scissors,
  nails: Hand,
  manicure: Hand,
  pedicure: Footprints,
  eyebrows: Eye,
  lashes: Eye,
  'eyebrows-lashes': Eye,
  makeup: Brush,
  'make-up': Brush,
  massage: Waves,
  spa: Flower2,
  waxing: Sparkles,
  'hair-removal': Sparkles,
  facial: Smile,
  skincare: Smile,
  'skin-care': Smile,
  fitness: Dumbbell,
  gym: Dumbbell,
  wellness: HeartPulse,
  health: Stethoscope,
  injectables: Syringe,
  'medical-aesthetics': Syringe,
  tattoo: Palette,
  piercing: Palette,
  kids: Baby,
};

function resolveIcon(cat: TreatmentCategory): LucideIcon {
  const keys = [cat.icon, cat.slug].filter(Boolean) as string[];
  for (const key of keys) {
    const hit = ICON_MAP[key.trim().toLowerCase()];
    if (hit) return hit;
  }
  return Sparkles;
}

/* ================= نرمال‌سازی پاسخ API =================
 * پشتیبانی از سه فرمت:
 *  1) آرایه مستقیم:            [...]
 *  2) { data: [...] }          (فرمت فعلی API)
 *  3) { categories: [...] }    (فرمت قدیمی)
 */

function normalize(payload: unknown): TreatmentCategory[] {
  let raw: unknown[] = [];

  if (Array.isArray(payload)) {
    raw = payload;
  } else if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj.data)) {
      raw = obj.data;
    } else if (Array.isArray(obj.categories)) {
      raw = obj.categories;
    }
  }

  const out: TreatmentCategory[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const c = item as Record<string, unknown>;
    if (!c.id || !c.name) continue;

    // خدمات
    const services: TreatmentService[] = [];
    if (Array.isArray(c.services)) {
      for (const entry of c.services) {
        if (!entry || typeof entry !== 'object') continue;
        const sv = entry as Record<string, unknown>;
        if (!sv.id || !sv.name) continue;
        services.push({
          id: String(sv.id),
          name: String(sv.name),
          slug: sv.slug == null ? null : String(sv.slug),
        });
      }
    }

    // شمارنده خدمات — مقاوم در برابر نام‌های مختلف فیلد
    let count = services.length;
    if (typeof c.serviceCount === 'number') {
      count = c.serviceCount;
    } else if (typeof c.servicesCount === 'number') {
      count = c.servicesCount;
    } else if (c._count && typeof c._count === 'object') {
      const nested = (c._count as { services?: unknown }).services;
      if (typeof nested === 'number') count = nested;
    }

    out.push({
      id: String(c.id),
      name: String(c.name),
      slug: c.slug == null ? null : String(c.slug),
      icon: c.icon == null ? null : String(c.icon),
      serviceCount: count,
      services,
    });
  }

  return out;
}

/* ================= استایل واریانت‌ها ================= */

type Variant = 'hero' | 'compact';

interface VariantStyle {
  root: string;
  trigger: string;
  input: string;
  icon: string;
}

const STYLES: Record<Variant, VariantStyle> = {
  hero: {
    root: 'relative w-full lg:flex-1',
    trigger:
      'flex items-center w-full px-4 py-3 lg:py-2 bg-white lg:bg-transparent border border-gray-200 lg:border-none lg:border-l lg:border-gray-100 rounded-xl lg:rounded-none cursor-text transition-all hover:border-gray-400 lg:hover:border-transparent',
    input:
      'w-full bg-transparent border-none outline-none text-[15px] font-medium text-gray-900 placeholder:text-gray-500',
    icon: 'w-5 h-5 text-gray-500 ml-3 shrink-0',
  },
  compact: {
    root: 'relative flex-1 h-full',
    trigger:
      'flex items-center w-full h-full px-4 border-l border-gray-200 hover:bg-gray-50 rounded-r-full cursor-text transition-colors',
    input:
      'w-full bg-transparent border-none outline-none text-[14px] text-gray-900 placeholder:text-gray-500',
    icon: 'w-4 h-4 text-gray-500 ml-2 shrink-0',
  },
};

/* ================= کامپوننت اصلی ================= */

interface TreatmentsDropdownProps {
  variant?: Variant;
  placeholder?: string;
  onSelectCategory?: (category: TreatmentCategory) => void;
  onSelectService?: (service: TreatmentService, category: TreatmentCategory) => void;
}

export default function TreatmentsDropdown({
  variant = 'hero',
  placeholder = 'همه خدمات',
  onSelectCategory,
  onSelectService,
}: TreatmentsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<TreatmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const styles = STYLES[variant];

  /* ---------- محاسبه موقعیت Panel (راه‌حل Floating) ---------- */
  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const triggerEl = triggerRef.current;
      if (!triggerEl) return;

      const rect = triggerEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const maxWidth = Math.min(520, viewportWidth - 40);

      setPanelPosition({
        top: rect.bottom + 8,          // دقیقاً زیر input (8px فاصله)
        left: rect.left,               // هم‌تراز لبه راست input
        width: maxWidth,               // حداکثر 520px، سازگار با موبایل
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, query]);

  /* ---------- واکشی تنبل داده‌ها (فقط بار اول باز شدن) ---------- */
  useEffect(() => {
    if (!open || loadedRef.current) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/treatments', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: unknown = await res.json();
        if (controller.signal.aborted) return;

        const normalized = normalize(json);
        console.log('[TreatmentsDropdown] Categories loaded:', normalized.length, normalized);

        setCategories(normalized);
        loadedRef.current = true;
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error('[TreatmentsDropdown] Fetch error:', err);
        setError('دریافت خدمات ناموفق بود.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      controller.abort();
    };
  }, [open, reloadKey]);

  /* ---------- بستن با کلیک بیرون و کلید Escape ---------- */
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  /* ---------- فیلتر سمت کلاینت (دسته + خدمات) ---------- */
  const results = useMemo<TreatmentCategory[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    const filtered: TreatmentCategory[] = [];

    for (const cat of categories) {
      const catMatch = cat.name.toLowerCase().includes(q);
      const matchedServices = cat.services.filter((sv) =>
        sv.name.toLowerCase().includes(q),
      );

      if (catMatch || matchedServices.length > 0) {
        filtered.push({
          ...cat,
          services: catMatch ? cat.services : matchedServices,
        });
      }
    }

    return filtered;
  }, [categories, query]);

  const isSearching = query.trim().length > 0;

  /* ---------- هندلرها ---------- */
  const retry = useCallback(() => {
    loadedRef.current = false;
    setReloadKey((prev) => prev + 1);
  }, []);

  const pickCategory = useCallback(
    (cat: TreatmentCategory) => {
      setQuery(cat.name);
      setOpen(false);
      onSelectCategory?.(cat);
    },
    [onSelectCategory],
  );

  const pickService = useCallback(
    (sv: TreatmentService, cat: TreatmentCategory) => {
      setQuery(sv.name);
      setOpen(false);
      onSelectService?.(sv, cat);
    },
    [onSelectService],
  );

  /* ---------- رندر ---------- */
  return (
    <div ref={containerRef} className={styles.root}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        <Search className={styles.icon} strokeWidth={1.5} />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="treatments-panel"
          aria-autocomplete="list"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={styles.input}
        />
      </div>

      {/* Panel — position: fixed برای جلوگیری از push شدن محتوا */}
      {open && (
        <div
          id="treatments-panel"
          role="listbox"
          aria-label="دسته‌بندی خدمات"
          style={{
            position: 'fixed',
            top: panelPosition.top,
            left: panelPosition.left,
            width: panelPosition.width,
            zIndex: 9999,
          }}
          className="max-h-[70vh] overflow-y-auto overscroll-contain rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        >
          {/* لودینگ */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>در حال بارگذاری…</span>
            </div>
          )}

          {/* خطا + دکمه تلاش مجدد */}
          {!loading && error && (
            <div className="py-6 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 w-full rounded-lg bg-gray-900 py-2 text-sm text-white transition-opacity hover:opacity-90"
              >
                تلاش مجدد
              </button>
            </div>
          )}

          {/* نتیجه خالی */}
          {!loading && !error && results.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">
              {isSearching
                ? 'موردی یافت نشد.'
                : 'دسته‌بندی‌ای برای نمایش وجود ندارد.'}
            </p>
          )}

          {/* حالت پیش‌فرض: نمایش دسته‌ها */}
          {!loading && !error && results.length > 0 && !isSearching && (
            <div>
              <p className="px-2 pb-2 pt-1 text-[12px] font-semibold text-gray-500">
                دسته‌بندی خدمات
              </p>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {results.map((cat) => {
                  const Icon = resolveIcon(cat);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => pickCategory(cat)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-gray-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Icon className="h-4 w-4 text-gray-700" strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-gray-900">
                          {cat.name}
                        </span>
                        <span className="block text-[12px] text-gray-500">
                          {cat.serviceCount} خدمت
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* حالت جستجو: نمایش خدمات منطبق */}
          {!loading && !error && results.length > 0 && isSearching && (
            <div className="space-y-3">
              {results.map((cat) => (
                <div key={cat.id}>
                  <p className="px-2 pb-1 text-[12px] font-semibold text-gray-500">
                    {cat.name}
                  </p>
                  <div className="space-y-0.5">
                    {cat.services.slice(0, 6).map((sv) => (
                      <button
                        key={sv.id}
                        type="button"
                        onClick={() => pickService(sv, cat)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-[14px] text-gray-800 transition-colors hover:bg-gray-50"
                      >
                        <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{sv.name}</span>
                      </button>
                    ))}
                    {cat.services.length === 0 && (
                      <p className="px-3 py-2 text-[13px] text-gray-400">
                        خدمتی ثبت نشده است.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
