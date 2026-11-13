"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "pwa-install-dismissed";
const DISMISS_DURATION = 2 * 24 * 60 * 60 * 1000;

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) return;

    let dismissed = false;
    try {
      dismissed = Date.now() - Number(localStorage.getItem(DISMISSED_KEY) || 0) < DISMISS_DURATION;
    } catch {
      // Installation should still work when browser storage is unavailable.
    }

    const onInstallable = (event: Event) => {
      event.preventDefault();
      if (!dismissed) setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setShowIos(false);
    };
    window.addEventListener("beforeinstallprompt", onInstallable);
    window.addEventListener("appinstalled", onInstalled);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const timer = window.setTimeout(() => {
      if (isIos && !dismissed) setShowIos(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Ignore storage errors and close the prompt for this visit.
    }
    setInstallEvent(null);
    setShowIos(false);
  }

  async function install() {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "dismissed") dismiss();
      else setInstallEvent(null);
    } catch {
      setInstallEvent(null);
    }
  }

  if (!installEvent && !showIos) return null;

  return (
    <aside aria-label="نصب برنامه آرینو" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-xl sm:bottom-6">
      <div className="flex items-start gap-3">
        <Image src="/pwa/icon-192.png" width={48} height={48} alt="" className="h-12 w-12 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">نصب برنامه آرینو</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            {showIos
              ? "برای نصب، دکمه اشتراک‌گذاری مرورگر را بزنید و گزینه Add to Home Screen را انتخاب کنید."
              : "آرینو را به صفحه اصلی اضافه کنید و مانند یک برنامه باز کنید."}
          </p>
          <div className="mt-3 flex items-center gap-3">
            {installEvent && <button type="button" onClick={install} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">نصب برنامه</button>}
            <button type="button" onClick={dismiss} className="rounded-lg px-2 py-2 text-sm text-gray-600">بعداً</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
