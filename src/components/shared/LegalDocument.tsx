import Link from 'next/link';
import { Globe2, Menu, Search } from 'lucide-react';
import styles from './LegalDocument.module.css';

const legalLinks = [
  ['مرور کلی', 'https://terms.fresha.com/'],
  ['شرایط استفاده', 'https://terms.fresha.com/terms-of-use'],
  ['سیاست حفظ حریم خصوصی', '/privacy-policy'],
  ['شرایط خدمات', '/terms-of-service'],
  ['شرایط شرکا', 'https://terms.fresha.com/partner-terms'],
  ['کارت‌های هدیهٔ فرشا', 'https://terms.fresha.com/gift-cards'],
  ['حفاظت از داده‌ها', '/privacy-policy#security'],
  ['کوکی‌ها', '/privacy-policy#cookies'],
  ['برنامهٔ معرفی شرکا', 'https://terms.fresha.com/partner-referral-program'],
] as const;

function SocialIcon({ name }: { name: 'facebook' | 'twitter' | 'linkedin' | 'instagram' }) {
  const paths = {
    facebook: 'M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.8v8z',
    twitter: 'M22 5.9a8.2 8.2 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.3 8.3 0 0 1-2.7 1 4.2 4.2 0 0 0-7.2 3.8 11.9 11.9 0 0 1-8.6-4.4 4.2 4.2 0 0 0 1.3 5.6 4.1 4.1 0 0 1-1.9-.5 4.2 4.2 0 0 0 3.4 4.2 4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9A8.4 8.4 0 0 1 2 18.7a11.8 11.8 0 0 0 18.2-10c0-.2 0-.4-.1-.5A8.5 8.5 0 0 0 22 5.9z',
    linkedin: 'M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3.3 9v12h3.4V9zM9 9v12h3.4v-6.7c0-1.8.4-2.9 2-2.9s1.8 1.3 1.8 3V21h3.4v-7.5c0-3.3-.8-4.9-3.7-4.9-1.4 0-2.7.7-3.3 1.8V9z',
    instagram: '',
  };
  return <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">{name === 'instagram' ? <g fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".7" fill="currentColor" /></g> : <path d={paths[name]} />}</svg>;
}

// Render plain translated text without injecting HTML; email and web addresses
// remain isolated left-to-right in the Persian document.
function PlainText({ text }: { text: string }) {
  const parts = text.split(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|(?:www\.)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?:com|org|uk|eu|au|id|ca|gov)(?:\/[A-Za-z0-9_./-]*)?)/g);
  return parts.map((part, index) => {
    if (index % 2 === 0) return part;
    return <a key={index} href={part.includes('@') ? `mailto:${part}` : `https://${part}`}><bdi dir="ltr">{part}</bdi></a>;
  });
}

function InlineText({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\((?:https:\/\/[^\s)]+|\/[^\s)]+)\))/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}><PlainText text={part.slice(2, -2)} /></strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={index} href={link[2]}>{link[1]}</a>;
    return <PlainText key={index} text={part} />;
  });
}

function PolicyBody({ body }: { body: string }) {
  if (!body.trim()) return null;
  return body.trim().split(/\n\s*\n/).map((block, index) => {
    if (block.startsWith('### ')) return <h3 key={index}>{block.slice(4)}</h3>;
    if (block.startsWith('- ')) {
      const items: { text: string; children: string[] }[] = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('  - ') && items.length) items[items.length - 1].children.push(line.slice(4));
        else items.push({ text: line.replace(/^- /, ''), children: [] });
      }
      return <ul key={index}>{items.map((item, i) => <li key={i}><InlineText text={item.text} />{item.children.length > 0 && <ul>{item.children.map((child, j) => <li key={j}><InlineText text={child} /></li>)}</ul>}</li>)}</ul>;
    }
    return <p key={index}><InlineText text={block} /></p>;
  });
}

interface LegalDocumentProps {
  title: string;
  documentId: string;
  currentPath: string;
  sections: readonly { id: string; title: string; body: string }[];
  variant?: 'privacy' | 'terms';
  moreInfo?: boolean;
}

export function LegalDocument({ title, documentId, currentPath, sections, variant = 'privacy', moreInfo = false }: LegalDocumentProps) {
  return (
    <div className={`${styles.page} ${variant === 'terms' ? styles.terms : ''}`} dir="rtl">
      <a className={styles.skipLink} href={`#${documentId}`}>رفتن به متن سند</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo} aria-label="فرشا، صفحهٔ اصلی" dir="ltr">fresha</Link>
          <Link href="/" className={styles.search}><Search size={20} aria-hidden="true" />جست‌وجوی خدمات یا مراکز</Link>
          <nav aria-label="منوی اصلی" className={styles.headerLinks}>
            <Link href="/auth/business">برای متخصصان</Link>
            <Link href="/auth">ثبت‌نام</Link>
            <Link href="/auth">ورود</Link>
          </nav>
          <details className={styles.menu}>
            <summary aria-label="باز کردن منو"><Menu size={28} aria-hidden="true" /></summary>
            <nav aria-label="دسترسی سریع">
              <Link href="/">صفحهٔ اصلی</Link>
              <Link href="/auth/business">برای متخصصان</Link>
              <Link href="/auth">ورود / ثبت‌نام</Link>
              <a href="/privacy-policy#contact">تماس با ما</a>
              <a href="/privacy-policy#cookies">اطلاعیهٔ کوکی</a>
            </nav>
          </details>
        </div>
      </header>
      <nav aria-label="اسناد حقوقی" className={styles.legalNav}>
        <div>{legalLinks.map(([label, href]) => <a key={label} href={href} aria-current={href === currentPath ? 'page' : undefined}>{label}</a>)}</div>
      </nav>
      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <nav aria-label="فهرست بخش‌های سند">
            {sections.map(({ id, title }) => <a key={id} href={`#${id}`}>{title}</a>)}
          </nav>
        </aside>
        <article id={documentId} className={styles.article}>
          {variant === 'privacy' && <h1>{title}</h1>}
          {sections.map(({ id, title: sectionTitle, body }, index) => (
            <section key={id} id={id} aria-labelledby={`${id}-title`}>
              {variant === 'terms' && index === 0 ? <h1 id={`${id}-title`}>{sectionTitle}</h1> : <h2 id={`${id}-title`}>{sectionTitle}</h2>}
              <PolicyBody body={body} />
            </section>
          ))}
          {moreInfo && <a href="mailto:dpo@fresha.com" className={styles.moreInfo}>اطلاعات بیشتر</a>}
        </article>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerColumns}>
          <div>
            <Link href="/" className={styles.footerLogo} aria-label="فرشا، صفحهٔ اصلی"><span aria-hidden="true" /> <b dir="ltr">fresha</b></Link>
            <div className={styles.socials}>
              <a href="https://www.facebook.com/fresha" aria-label="فیسبوک فرشا"><SocialIcon name="facebook" /></a>
              <a href="https://twitter.com/fresha" aria-label="توییتر فرشا"><SocialIcon name="twitter" /></a>
              <a href="https://www.linkedin.com/company/fresha" aria-label="لینکدین فرشا"><SocialIcon name="linkedin" /></a>
              <a href="https://www.instagram.com/fresha" aria-label="اینستاگرام فرشا"><SocialIcon name="instagram" /></a>
            </div>
          </div>
          <nav aria-label="دربارهٔ فرشا"><h2>دربارهٔ فرشا</h2><a href="https://www.fresha.com/careers">فرصت‌های شغلی در فرشا</a><a href="mailto:hello@fresha.com">پشتیبانی مشتریان</a></nav>
          <nav aria-label="برای کسب‌وکارها"><h2>برای کسب‌وکارها</h2><Link href="/auth/business">برای متخصصان</Link><a href="https://www.fresha.com/pricing">قیمت‌گذاری</a><a href="mailto:hello@fresha.com">پشتیبانی شرکا</a></nav>
          <nav aria-label="اطلاعات حقوقی"><h2>حقوقی</h2><Link href="/privacy-policy">سیاست حفظ حریم خصوصی</Link><a href="/terms-of-service">شرایط خدمات</a><a href="https://terms.fresha.com/terms-of-use">شرایط استفاده</a></nav>
          <div className={styles.mobileApp}><h2>اپلیکیشن رایگان موبایل</h2></div>
        </div>
        <div className={styles.footerBottom}><span><Globe2 size={16} aria-hidden="true" /> فارسی</span><span dir="ltr">© {new Date().getFullYear()} Fresha.com SV Ltd</span></div>
      </footer>
    </div>
  );
}
