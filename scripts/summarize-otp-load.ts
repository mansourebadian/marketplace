import { readdir, readFile, writeFile } from 'node:fs/promises';

async function main() {
  const reports = [];
  for (const name of await readdir('reports')) {
    if (!/^otp-load-.*\.json$/.test(name)) continue;
    const data = JSON.parse(await readFile(`reports/${name}`, 'utf8'));
    reports.push({ ...data, file: name });
  }
  reports.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const mainRun = reports.findLast(report => report.requested === 500000 && report.mode === 'swapped');
  const rows = reports.map(report => `| ${report.mode} | ${report.configuredConcurrency} | ${report.completed}/${report.requested} | ${report.authenticated} | ${report.expectedRejections} | ${report.exceptions + report.wrongResult} | ${report.p95Ms} | ${report.outcome} | [JSON](${report.file}) |`).join('\n');
  const text = `# نتیجهٔ آزمون ورود و OTP — ۱۷ اکتبر ۲۰۲۶

آزمون روی Windows محلی، Node.js 24، SQL Server و سرور Next.js در حالت توسعه انجام شده است. تولیدکنندهٔ بار، برنامه و پایگاه داده روی همان دستگاه ۸ پردازندهٔ منطقی / حدود ۱۶ گیگابایت حافظه اجرا شدند. این اعداد ظرفیت محیط production یا تضمین بار پایدار نیستند.

محیط ایزوله نبود؛ ویرایش فایل‌های تست و بررسی‌های TypeScript/lint هم در همین محیط انجام شدند. زمان‌های گزارش‌شده اندازه‌گیری همین اجرای محلی‌اند و نباید به ظرفیت سرور اختصاصی تعمیم داده شوند.

## نتایج خام

| نوع | هم‌زمانی تنظیم‌شده | اجراشده/درخواستی | ورود موفق | رد دقیق OTP نادرست | خطا یا نتیجهٔ غیرمنتظره | p95 میلی‌ثانیه | وضعیت | جزئیات |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
${rows}

در حالت HTTP، کدها صحیح‌اند؛ هر شکست ورود، شکست تست ظرفیت است. در حالت swapped، کد معتبر درخواست دیگر که با کد مقصد متفاوت است ارائه می‌شود؛ ورود موفق نشانهٔ نقص امنیتی است. خطاهای تراکنش یا انقضا به عنوان رد صحیح کد حساب نشده‌اند.

## آزمون ۵۰۰هزار کد جابه‌جا‌شده

${mainRun ? `آخرین اجرا: ${mainRun.completed} از ${mainRun.requested}، هم‌زمانی ${mainRun.configuredConcurrency}، رد دقیق کد نادرست ${mainRun.expectedRejections}، ورود ${mainRun.authenticated}، خطای اجرایی ${mainRun.exceptions}، نتیجهٔ غیرمنتظره ${mainRun.wrongResult}.\n\nتعداد حساب/نشست ساخته‌شده: ${mainRun.userRows}/${mainRun.sessionRows}. تعداد تلاش‌های تأییدشده از روی دادهٔ پایگاه: ${mainRun.persistedAttemptRows}. مدت اجرا ${mainRun.durationSeconds.toFixed(2)} ثانیه. وضعیت: **${mainRun.outcome}**. پاک‌سازی دادهٔ مصنوعی: ${mainRun.cleanedUp ? 'انجام شد' : 'هنوز کامل نشده'}.\n\nخطاهای طبقه‌بندی‌شده: \`${JSON.stringify(mainRun.exceptionCodes)}\`.` : 'هنوز اجرا نشده است.'}

این آزمون از تابع واقعی تأیید و تراکنش واقعی SQL Server استفاده می‌کند؛ HTTP، ارسال پیامک و مسیر صدور اولیهٔ OTP را شامل نمی‌شود. کل ۵۰۰هزار عملیات هم‌زمان اجرا نشده‌اند.

## هدف یک‌میلیون ورود هم‌زمان

**اجرا نشده و ظرفیت آن تأیید نشده است.** آزمون تدریجی HTTP محلی پس از اشباع در هم‌زمانی ۲۵۶ متوقف شد. ۶۴ درخواست در انتظار/اجرا در یک اجرای کوتاه بدون خطا گذشت؛ این عدد سقف قطعی ظرفیت یا نتیجهٔ تست طولانی‌مدت نیست. شمارش یک‌میلیون عملیات صف‌شده را نمی‌توان معادل یک‌میلیون کاربر هم‌زمان دانست.

## خطاهایی که تست پیدا کرد و اصلاح شدند

۱. انقضای OTP با زمان شروع درخواست بررسی می‌شد؛ انتظار در صف می‌توانست باعث پذیرش کد منقضی شود. اکنون زمان بعد از دریافت اتصال و قفل هم بررسی می‌شود. تست بازتولید ابتدا شکست خورد و پس از اصلاح گذشت.

۲. تأیید از تراکنش Serializable و الگوی خواندن سپس نوشتن استفاده می‌کرد. اکنون شمارندهٔ تلاش با UPDATE شرطی اتمیک روی همان درخواست افزایش می‌یابد و قفل تا پایان تراکنش حفظ می‌شود؛ ساخت حساب و نشست همچنان در همان تراکنش است. در سناریوی ۱۶ هم‌زمان، نتیجه از ۶ موفق / ۲۶ ناموفق به ۳۲ موفق / صفر ناموفق رسید.

## محدودهٔ تضمین امنیتی

کد شش‌رقمی یکتای جهانی نیست. دو درخواست ممکن است عدد یکسان داشته باشند؛ در تست جداگانه، عدد یکسان هر دو درخواست را تأیید کرد، ولی هر نشست به شمارهٔ درخواست خودش متصل شد. تست ۵۰۰هزارتایی مشخصاً کدهای **متفاوت** را جابه‌جا می‌کند و تضمین جلوگیری از هم‌عددشدن تصادفی کدها نمی‌دهد.

هیچ پیامکی در این تست‌ها ارسال نشد. شماره‌ها و داده‌ها مصنوعی بودند. فایل‌های JSON هیچ OTP، کوکی نشست، شمارهٔ واقعی یا کلید محرمانه‌ای ندارند.

بررسی نهایی: ۲۳ تست رگرسیون موفق، TypeScript و lint فایل‌های تغییرکرده بدون خطا، و صفر رکورد باقی‌مانده از درخواست‌های بار و کاربران مصنوعی در پایگاه داده.

راهنمای تکرار: [otp-load-testing.md](../docs/otp-load-testing.md).
`;
  await writeFile('reports/otp-load-summary.md', text, 'utf8');
  console.log('Wrote reports/otp-load-summary.md');
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Summary failed'); process.exitCode = 1; });
