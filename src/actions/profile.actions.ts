'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export type ProfileField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'dateOfBirth'
  | 'gender';

export interface ProfileActionState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<ProfileField, string>>;
}

export interface AddressActionState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Partial<
    Record<'addressLine' | 'city' | 'province' | 'postalCode', string>
  >;
}

const ALLOWED_GENDERS = new Set([
  '',
  'FEMALE',
  'MALE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
]);

const ALLOWED_ADDRESS_LABELS = new Set(['HOME', 'WORK']);

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function hasControlCharacters(value: string) {
  return /[\u0000-\u001f\u007f]/.test(value);
}

async function getAuthenticatedCustomerId() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  return user?.role === 'CUSTOMER' ? user.id : null;
}

export async function updateCustomerProfile(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const userId = await getAuthenticatedCustomerId();

  if (!userId) {
    return {
      status: 'error',
      message: 'نشست شما معتبر نیست. لطفاً دوباره وارد حساب شوید.',
    };
  }

  const firstName = textValue(formData, 'firstName');
  const lastName = textValue(formData, 'lastName');
  const email = textValue(formData, 'email').toLocaleLowerCase('en-US');
  const rawPhone = textValue(formData, 'phone');
  const phone = rawPhone.replace(/[\s()-]/g, '');
  const dateOfBirth = textValue(formData, 'dateOfBirth');
  const gender = textValue(formData, 'gender');
  const fieldErrors: ProfileActionState['fieldErrors'] = {};

  if (!firstName) {
    fieldErrors.firstName = 'نام را وارد کنید.';
  } else if (firstName.length > 100 || hasControlCharacters(firstName)) {
    fieldErrors.firstName = 'نام واردشده معتبر نیست.';
  }

  if (lastName.length > 100 || hasControlCharacters(lastName)) {
    fieldErrors.lastName = 'نام خانوادگی واردشده معتبر نیست.';
  }

  if (!email) {
    fieldErrors.email = 'ایمیل را وارد کنید.';
  } else if (
    email.length > 320 ||
    hasControlCharacters(email) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    fieldErrors.email = 'یک ایمیل معتبر وارد کنید.';
  }

  if (phone && !/^\+?\d{7,15}$/.test(phone)) {
    fieldErrors.phone = 'شماره تلفن باید بین ۷ تا ۱۵ رقم باشد.';
  }

  let parsedDateOfBirth: Date | null = null;
  if (dateOfBirth) {
    parsedDateOfBirth = new Date(`${dateOfBirth}T00:00:00.000Z`);
    const today = new Date().toISOString().slice(0, 10);

    if (
      Number.isNaN(parsedDateOfBirth.getTime()) ||
      parsedDateOfBirth.toISOString().slice(0, 10) !== dateOfBirth ||
      dateOfBirth < '1900-01-01' ||
      dateOfBirth > today
    ) {
      fieldErrors.dateOfBirth = 'تاریخ تولد معتبر وارد کنید.';
    }
  }

  if (!ALLOWED_GENDERS.has(gender)) {
    fieldErrors.gender = 'گزینه انتخاب‌شده معتبر نیست.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'لطفاً خطاهای فرم را برطرف کنید.',
      fieldErrors,
    };
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!currentUser) {
      return {
        status: 'error',
        message: 'حساب کاربری پیدا نشد.',
      };
    }

    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { email: true, phone: true },
    });

    if (duplicate?.email.toLocaleLowerCase('en-US') === email) {
      return {
        status: 'error',
        message: 'این ایمیل قبلاً برای حساب دیگری ثبت شده است.',
        fieldErrors: { email: 'این ایمیل قبلاً استفاده شده است.' },
      };
    }

    if (phone && duplicate?.phone === phone) {
      return {
        status: 'error',
        message: 'این شماره تلفن قبلاً برای حساب دیگری ثبت شده است.',
        fieldErrors: { phone: 'این شماره تلفن قبلاً استفاده شده است.' },
      };
    }

    const displayName = [firstName, lastName].filter(Boolean).join(' ');

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName: lastName || null,
        name: displayName,
        email,
        emailVerified:
          currentUser.email.toLocaleLowerCase('en-US') === email
            ? undefined
            : null,
        phone: phone || null,
        dateOfBirth: parsedDateOfBirth,
        gender: gender || null,
      },
    });

    revalidatePath('/profile');

    return {
      status: 'success',
      message: 'اطلاعات پروفایل با موفقیت ذخیره شد.',
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        status: 'error',
        message: 'ایمیل یا شماره تلفن واردشده قبلاً استفاده شده است.',
      };
    }

    console.error('Failed to update customer profile:', error);
    return {
      status: 'error',
      message: 'ذخیره اطلاعات انجام نشد. لطفاً دوباره تلاش کنید.',
    };
  }
}

export async function saveCustomerAddress(
  _previousState: AddressActionState,
  formData: FormData
): Promise<AddressActionState> {
  const userId = await getAuthenticatedCustomerId();

  if (!userId) {
    return {
      status: 'error',
      message: 'نشست شما معتبر نیست. لطفاً دوباره وارد حساب شوید.',
    };
  }

  const label = textValue(formData, 'label');
  const intent = textValue(formData, 'intent') || 'save';

  if (!ALLOWED_ADDRESS_LABELS.has(label)) {
    return {
      status: 'error',
      message: 'نوع آدرس معتبر نیست.',
    };
  }

  if (intent === 'delete') {
    try {
      await prisma.customerAddress.deleteMany({
        where: { userId, label },
      });
      revalidatePath('/profile');

      return {
        status: 'success',
        message: 'آدرس حذف شد.',
      };
    } catch (error) {
      console.error('Failed to delete customer address:', error);
      return {
        status: 'error',
        message: 'حذف آدرس انجام نشد. لطفاً دوباره تلاش کنید.',
      };
    }
  }

  const addressLine = textValue(formData, 'addressLine');
  const city = textValue(formData, 'city');
  const province = textValue(formData, 'province');
  const postalCode = textValue(formData, 'postalCode');
  const fieldErrors: AddressActionState['fieldErrors'] = {};

  if (!addressLine) {
    fieldErrors.addressLine = 'نشانی را وارد کنید.';
  } else if (addressLine.length > 300 || hasControlCharacters(addressLine)) {
    fieldErrors.addressLine = 'نشانی واردشده معتبر نیست.';
  }

  if (city.length > 100 || hasControlCharacters(city)) {
    fieldErrors.city = 'نام شهر واردشده معتبر نیست.';
  }

  if (province.length > 100 || hasControlCharacters(province)) {
    fieldErrors.province = 'نام استان واردشده معتبر نیست.';
  }

  if (postalCode.length > 20 || hasControlCharacters(postalCode)) {
    fieldErrors.postalCode = 'کد پستی واردشده معتبر نیست.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'لطفاً خطاهای فرم را برطرف کنید.',
      fieldErrors,
    };
  }

  try {
    await prisma.customerAddress.upsert({
      where: {
        userId_label: { userId, label },
      },
      create: {
        userId,
        label,
        addressLine,
        city: city || null,
        province: province || null,
        postalCode: postalCode || null,
      },
      update: {
        addressLine,
        city: city || null,
        province: province || null,
        postalCode: postalCode || null,
      },
    });

    revalidatePath('/profile');

    return {
      status: 'success',
      message: 'آدرس با موفقیت ذخیره شد.',
    };
  } catch (error) {
    console.error('Failed to save customer address:', error);
    return {
      status: 'error',
      message: 'ذخیره آدرس انجام نشد. لطفاً دوباره تلاش کنید.',
    };
  }
}
