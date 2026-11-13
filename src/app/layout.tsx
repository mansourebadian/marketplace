import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import InstallPrompt from "@/components/shared/InstallPrompt";
const iranSans = localFont({
  src: [
    {
      path: "../../public/fonts/iransans/Iranian Sans.ttf",
      weight: "400",
      style: "normal",
    },
    // اگر فایل‌های وزن دیگر (مثل Medium یا Light) هم دارید، می‌توانید آن‌ها را اینجا اضافه کنید
  ],
  variable: "--font-iransans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نوبت دهی آرایشگاه",
  description: "جستجو و رزرو خدمات زیبایی در آرینو",
  appleWebApp: { capable: true, title: "آرینو", statusBarStyle: "default" },
  icons: { apple: "/pwa/icon-180.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa" dir="rtl"
      className={`${iranSans.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<InstallPrompt /></body>
    </html>
  );
}
