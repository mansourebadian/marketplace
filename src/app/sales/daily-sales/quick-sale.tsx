'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { CalendarClock, CalendarCheck, ChevronLeft, CreditCard, Gift, IdCard, Layers, Minus, Package, PersonStanding, Plus, Search, ShoppingCart, UserRoundPlus, X } from 'lucide-react';
import { createQuickSale } from '@/actions/sales.actions';
import styles from './quick-sale.module.css';

export type QuickSaleService = { id: string; name: string; price: number; priceType: string };
export type QuickSaleCustomer = { id: string; name: string | null; firstName: string | null; lastName: string | null; email: string; phone: string | null };
type CartItem = QuickSaleService & { quantity: number };
const sections = [{ label: 'نوبت‌ها', icon: CalendarClock }, { label: 'خدمات', icon: CalendarCheck, enabled: true }, { label: 'محصولات', icon: Package }, { label: 'بسته‌ها', icon: Layers }, { label: 'عضویت‌ها', icon: IdCard }, { label: 'کارت هدیه', icon: Gift }];
const format = (amount: number) => new Intl.NumberFormat('fa-IR').format(amount);

export function QuickSale({ date, services, customers, onClose, onManual, onSaved }: { date: string; services: QuickSaleService[]; customers: QuickSaleCustomer[]; onClose: () => void; onManual: () => void; onSaved: () => void }) {
  const [query, setQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectingCustomer, setSelectingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<QuickSaleCustomer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<'CASH' | 'OTHER'>('CASH');
  const [step, setStep] = useState<'cart' | 'payment'>('cart');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { const handle = (event: KeyboardEvent) => { if (event.key === 'Escape' && !pending) { if (selectingCustomer) setSelectingCustomer(false); else onClose(); } }; document.addEventListener('keydown', handle); return () => document.removeEventListener('keydown', handle); }, [onClose, pending, selectingCustomer]);
  const filtered = services.filter(item => item.name.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa')));
  const customerName = (customer: QuickSaleCustomer) => customer.name || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.phone || (customer.email.endsWith('@phone.invalid') ? 'مشتری' : customer.email);
  const contact = (customer: QuickSaleCustomer) => customer.phone || (customer.email.endsWith('@phone.invalid') ? '' : customer.email);
  const filteredCustomers = customers.filter(customer => [customerName(customer), customer.phone || '', customer.email.endsWith('@phone.invalid') ? '' : customer.email].some(value => value.toLocaleLowerCase('fa').includes(customerQuery.trim().toLocaleLowerCase('fa'))));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const addItem = (service: QuickSaleService) => { const price = service.priceType === 'FREE' ? 0 : service.price; setCart(current => { const found = current.find(item => item.id === service.id); return found ? current.map(item => item.id === service.id ? { ...item, quantity: Math.min(100, item.quantity + 1) } : item) : [...current, { ...service, price, quantity: 1 }]; }); };
  const changeQuantity = (id: string, delta: number) => setCart(current => current.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0));
  const save = () => { setError(''); startTransition(async () => { const result = await createQuickSale({ date, paymentType: payment, customerId: selectedCustomer?.id || null, items: cart.map(item => ({ id: item.id, quantity: item.quantity, price: item.price })) }); if (result.error) { setError(result.error); return; } onSaved(); }); };
  return <div className={styles.backdrop}>
    <div className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="quick-sale-title" dir="rtl">
      <button ref={closeRef} type="button" className={styles.close} onClick={onClose} disabled={pending} aria-label="بستن فروش سریع"><X size={22} /></button>
      <div className={styles.main}>
        <div className={styles.breadcrumb}><span className={step === 'cart' ? styles.current : ''}>سبد خرید</span><ChevronLeft size={16} /><span className={step === 'payment' ? styles.current : ''}>پرداخت</span></div>
        {step === 'cart' ? <><h2 id="quick-sale-title">افزودن به سبد خرید</h2><label className={styles.search}><Search size={19} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجوی خدمات" aria-label="جست‌وجوی خدمات" /></label>
          <div className={styles.categories}>{sections.map(({ label, icon: Icon, enabled }) => <button type="button" key={label} disabled={!enabled} title={!enabled ? 'این بخش هنوز در فروش سریع فعال نیست' : undefined} className={styles.category}><Icon size={20} /><span>{label}</span></button>)}</div>
          <div className={styles.listHeading}><h3>فروش سریع</h3><button type="button" onClick={onManual}>ثبت دستی تراکنش</button></div>
          <div className={styles.serviceGrid}>{filtered.map(service => <button type="button" key={service.id} className={styles.service} onClick={() => addItem(service)} disabled={!['FIXED', 'FREE'].includes(service.priceType)} title={service.priceType === 'STARTS_AT' ? 'برای این خدمت قیمت ثابت تعریف نشده است' : undefined}><strong>{service.name}</strong><span>{service.priceType === 'FREE' ? 'رایگان' : `${service.priceType === 'STARTS_AT' ? 'از ' : ''}${format(service.price)} تومان`}</span></button>)}</div>
          {!filtered.length && <p className={styles.emptyServices}>{query ? 'خدمتی با این نام پیدا نشد.' : 'هنوز خدمتی به فهرست کسب‌وکار اضافه نشده است.'}</p>}
        </> : <><h2 id="quick-sale-title">پرداخت</h2><p className={styles.paymentHint}>پس از دریافت وجه، روش پرداخت را انتخاب و فروش را ثبت کنید.</p><div className={styles.paymentChoices}><label><input type="radio" checked={payment === 'CASH'} onChange={() => setPayment('CASH')} /> نقدی</label><label><input type="radio" checked={payment === 'OTHER'} onChange={() => setPayment('OTHER')} /> کارت یا سایر روش‌ها</label></div><p className={styles.paymentHint}>تاریخ ثبت: <bdi>{date}</bdi></p><button type="button" className={styles.backButton} onClick={() => setStep('cart')}>بازگشت به سبد خرید</button></>}
      </div>
      <aside className={`${styles.cart} ${selectingCustomer ? styles.cartSelecting : ''}`}>{selectingCustomer ? <div className={styles.customerPicker}>
        <label className={styles.search}><Search size={19} /><input autoFocus value={customerQuery} onChange={event => setCustomerQuery(event.target.value)} placeholder="جست‌وجوی مشتری" aria-label="جست‌وجوی مشتری" /></label>
        <div className={styles.customerList}><button type="button" className={styles.customerChoice} disabled title="افزودن مشتری جدید هنوز در دسترس نیست"><span className={styles.customerIcon}><Plus size={24} /></span><strong>افزودن مشتری جدید <small>به‌زودی</small></strong></button>
          <button type="button" className={styles.customerChoice} onClick={() => { setSelectedCustomer(null); setSelectingCustomer(false); }}><span className={styles.customerIcon}><PersonStanding size={24} /></span><strong>مشتری حضوری</strong></button>
          <div className={styles.customerDivider} />
          {filteredCustomers.map(customer => <button type="button" className={styles.customerChoice} key={customer.id} onClick={() => { setSelectedCustomer(customer); setSelectingCustomer(false); }}><span className={styles.customerIcon}>{customerName(customer).trim().charAt(0).toUpperCase()}</span><span className={styles.customerDetails}><strong>{customerName(customer)}</strong>{contact(customer) && <span dir="auto">{contact(customer)}</span>}</span></button>)}
          {!filteredCustomers.length && <p className={styles.emptyServices}>{customerQuery ? 'مشتری با این مشخصات پیدا نشد.' : 'هنوز مشتری‌ای با سابقه نوبت در این کسب‌وکار وجود ندارد.'}</p>}
        </div><button type="button" className={styles.customerBack} onClick={() => setSelectingCustomer(false)}>بازگشت به سبد خرید</button>
      </div> : <><button type="button" className={styles.customer} onClick={() => { setCustomerQuery(''); setSelectingCustomer(true); }}><div><strong>{selectedCustomer ? customerName(selectedCustomer) : 'افزودن مشتری'}</strong><span>{selectedCustomer ? (contact(selectedCustomer) || 'تغییر مشتری') : 'برای مشتری حضوری خالی بگذارید'}</span></div><span className={styles.customerIcon}><UserRoundPlus size={23} /></span></button>
        {cart.length === 0 ? <div className={styles.emptyCart}><span><ShoppingCart size={38} /></span><strong>سبد خرید شما خالی است</strong><p>برای افزودن به سبد، یکی از خدمات را انتخاب کنید.</p></div> : <><div className={styles.cartItems}>{cart.map(item => <div className={styles.cartItem} key={item.id}><div><strong>{item.name}</strong><span>{format(item.price)} تومان</span></div><div className={styles.quantity}><button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label={`کم کردن ${item.name}`}><Minus size={15} /></button><span>{format(item.quantity)}</span><button type="button" disabled={item.quantity >= 100} onClick={() => changeQuantity(item.id, 1)} aria-label={`افزودن ${item.name}`}><Plus size={15} /></button></div></div>)}</div><div className={styles.cartFooter}><div><span>مجموع</span><strong>{format(total)} تومان</strong></div>{error && <p role="alert" className={styles.error}>{error}</p>}<button type="button" disabled={pending} onClick={step === 'cart' ? () => setStep('payment') : save}>{pending ? 'در حال ثبت…' : step === 'cart' ? 'ادامه به پرداخت' : 'تأیید دریافت وجه و ثبت فروش'} <CreditCard size={18} /></button></div></>}
      </> }</aside>
    </div>
  </div>;
}
