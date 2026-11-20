import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpLeft, ChevronRight, CircleHelp, FileText, Plus } from 'lucide-react';
import styles from './register-help.module.css';

export const metadata: Metadata = { title: 'راهنمای صندوق | مرکز راهنمای آرینو' };

const questions = [
  ['آیا می‌توانم دسترسی اعضای تیم به صندوق را مشخص کنم؟', 'تنظیم دسترسی اعضای تیم به صندوق هنوز در آرینو پیاده‌سازی نشده است.'],
  ['موجودی اولیه صندوق چیست؟', 'مبلغی است که در آغاز کار در صندوق قرار می‌گیرد تا بتوانید پرداخت‌های نقدی و باقی‌مانده پول مشتریان را مدیریت کنید.'],
  ['آیا می‌توانم در طول روز موجودی صندوق را شمارش کنم؟', 'قابلیت شمارش موجودی صندوق در طول روز هنوز در آرینو در دسترس نیست.'],
  ['اگر بستن صندوق را فراموش کنم چه می‌شود؟', 'باز و بسته کردن صندوق و یادآوری بستن آن هنوز در آرینو در دسترس نیست.'],
  ['آیا می‌توانم صندوق را حذف کنم؟', 'ایجاد و حذف صندوق هنوز در آرینو در دسترس نیست.'],
];

export default function RegisterHelpPage() {
  return <main dir="rtl" className={styles.page}>
    <header className={styles.header}><div className={styles.headerInner}>
      <Link href="/" className={styles.brand}><strong>آرینو</strong><span className={styles.brandMark} aria-hidden="true" /><span>مرکز راهنما</span></Link>
      <nav aria-label="پیوندهای راهنما"><Link href="/">صفحهٔ اصلی</Link><a href="#article" aria-current="page">راهنمای صندوق</a></nav>
      <Link href="/sales/register" className={styles.workspaceLink}>بازگشت به صندوق <ArrowUpLeft size={16} /></Link>
    </div></header>
    <div className={styles.layout}>
      <article id="article" className={styles.article}>
        <div className={styles.breadcrumb}><Link href="/sales/register" className={styles.back}><ChevronRight size={18} /> بازگشت</Link><span>مرکز راهنما</span><span>›</span><span>فروش و پرداخت</span><span>›</span><span>راه‌اندازی صندوق</span></div>
        <h1>راه‌اندازی صندوق</h1>
        <p className={styles.lead}>با نحوهٔ راه‌اندازی صندوق برای پیگیری گردش وجه نقد، انعام، تنخواه و موجودی اولیه آشنا شوید و عملیات کسب‌وکار خود را یکجا مدیریت کنید.</p>
        <div className={styles.toc}><strong>در این مقاله</strong><a href="#about">آشنایی با صندوق</a><a href="#setup">افزودن صندوق</a><a href="#questions">پرسش‌های متداول</a></div>
        <section id="about" className={styles.section}>
          <h2>آشنایی با صندوق</h2>
          <p>صندوق به نظم‌دهی و بررسی فعالیت‌های نقدی روزانه در هر موقعیت کسب‌وکار کمک می‌کند. روز را با ثبت موجودی اولیه آغاز کنید و سپس ورود و خروج وجه نقد را همراه با یادداشت‌ها و رسیدها ثبت کنید تا سوابق روشنی از هر گردش داشته باشید.</p>
          <p>می‌توانید برای یک موقعیت چند صندوق در نظر بگیرید و در صورت نیاز بین آن‌ها جابه‌جا شوید. برای اینکه اعضای تیم صندوق موردنظر را به‌راحتی تشخیص دهند، نام مشخصی برای هر صندوق انتخاب کنید؛ برای مثال «پذیرش» یا «دفتر کارکنان».</p>
        </section>
        <section id="setup" className={styles.section}>
          <h2>افزودن صندوق</h2>
          <div className={styles.notice}><CircleHelp size={20} /><p>مراحل زیر ترجمهٔ راهنمای نمونه هستند؛ ساخت و مدیریت صندوق هنوز در آرینو فعال نشده است. در حال حاضر می‌توانید تراکنش‌های دریافت‌شده را در <Link href="/sales/daily-sales">خلاصه فروش روزانه</Link> ثبت و بررسی کنید.</p></div>
          <ol className={styles.steps}>
            <li>از منوی اصلی، به بخش <strong>فروش</strong> بروید و <strong>صندوق</strong> را باز کنید.</li>
            <li>برای ساخت صندوق جدید، روی <strong>افزودن صندوق</strong> کلیک کنید. اگر چند موقعیت دارید، موقعیتی را که صندوق به آن تعلق دارد انتخاب کنید.</li>
            <li>نامی مشخص برای صندوق وارد کنید، مانند «پذیرش» یا «میز پذیرش»، تا به‌آسانی قابل شناسایی باشد.</li>
            <li>برای فعال‌سازی تنظیمات پیشرفتهٔ موردنظر، گزینه‌های مربوط را انتخاب کنید:
              <ul>
                <li>الزام باز بودن صندوق برای شروع ثبت فروش</li>
                <li>تعیین حداقل موجودی اولیه؛ مقدار حداقل و زمان الزام آن را از فهرست انتخاب کنید.</li>
                <li>اجازهٔ شمارش صندوق در طول روز</li>
                <li>یادآوری در صورت باز ماندن صندوق</li>
                <li>چاپ خودکار گزارش هنگام شمارش صندوق</li>
                <li>ارسال خودکار گزارش شمارش صندوق از طریق ایمیل؛ اعضای تیم دریافت‌کنندهٔ گزارش را انتخاب کنید.</li>
              </ul>
            </li>
            <li>برای ذخیرهٔ تغییرات، روی دکمهٔ <strong>ادامه</strong> در بالای صفحه کلیک کنید.</li>
          </ol>
          <p>پس از ذخیره، صندوق به‌صورت پیش‌فرض با وضعیت بسته در فهرست نمایش داده می‌شود و می‌توان آن را برای ثبت فعالیت‌ها باز کرد.</p>
          <div className={styles.notice}><CircleHelp size={20} /><p>اگر چند صندوق دارید، هنگام تسویهٔ نوبت مشخص کنید از کدام صندوق استفاده می‌شود. در نمونهٔ راهنما، این انتخاب از طریق ابزار صندوق در بالای تقویم انجام می‌شود.</p></div>
        </section>
        <section id="questions" className={styles.section}><h2>پرسش‌های متداول</h2><div className={styles.faq}>{questions.map(([question, answer]) => <details key={question}><summary><span>{question}</span><Plus size={19} /></summary><p>{answer}</p></details>)}</div></section>
      </article>
      <aside className={styles.sidebar} aria-label="راهنمای صندوق"><strong>صندوق</strong><a className={styles.current} href="#article"><FileText size={17} /> راه‌اندازی صندوق</a><a href="#questions"><FileText size={17} /> پرسش‌های متداول</a><hr /><strong>مطالب این مقاله</strong><a href="#about">آشنایی با صندوق</a><a href="#setup">راه‌اندازی صندوق</a></aside>
    </div>
  </main>;
}
