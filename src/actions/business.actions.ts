'use server';

import { randomBytes, scryptSync } from 'node:crypto';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { COUNTRIES } from '@/components/features/auth/countries';

export type BusinessSignUpField =
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'country'
  | 'password'
  | 'agreement';

export interface BusinessSignUpState {
  status: 'idle' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<BusinessSignUpField, string>>;
}

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function hasControlCharacters(value: string) {
  return /[\u0000-\u001f\u007f]/.test(value);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export async function completeBusinessSignUp(
  _previousState: BusinessSignUpState,
  formData: FormData
): Promise<BusinessSignUpState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      status: 'error',
      message: 'Your session is no longer valid. Please sign in again.',
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'CUSTOMER') {
    return {
      status: 'error',
      message: 'This account cannot complete professional sign-up.',
    };
  }

  const firstName = textValue(formData, 'firstName');
  const lastName = textValue(formData, 'lastName');
  const localPhone = textValue(formData, 'phone').replace(/[\s()-]/g, '');
  const countryCode = textValue(formData, 'country');
  const password = formData.get('password');
  const passwordValue = typeof password === 'string' ? password : '';
  const agreement = textValue(formData, 'agreement');
  const country = COUNTRIES.find((item) => item.code === countryCode);

  const fieldErrors: BusinessSignUpState['fieldErrors'] = {};

  if (!firstName) {
    fieldErrors.firstName = 'Enter your first name.';
  } else if (firstName.length > 100 || hasControlCharacters(firstName)) {
    fieldErrors.firstName = 'The first name you entered is invalid.';
  }

  if (lastName.length > 100 || hasControlCharacters(lastName)) {
    fieldErrors.lastName = 'The last name you entered is invalid.';
  }

  if (!country) {
    fieldErrors.country = 'Select your country.';
  }

  const dialCode = country?.dialCode.replace('+', '') ?? '';
  const fullPhone = country ? `+${dialCode}${localPhone}` : localPhone;

  if (!localPhone) {
    fieldErrors.phone = 'Enter your mobile number.';
  } else if (!/^\+?\d{7,15}$/.test(fullPhone)) {
    fieldErrors.phone = 'Enter a valid mobile number.';
  }

  if (!passwordValue) {
    fieldErrors.password = 'Create a password.';
  } else if (
    passwordValue.length < 8 ||
    passwordValue.length > 72 ||
    hasControlCharacters(passwordValue)
  ) {
    fieldErrors.password = 'Password must be between 8 and 72 characters.';
  }

  if (agreement !== 'on') {
    fieldErrors.agreement = 'You must agree to continue.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Please fix the errors in the form.',
      fieldErrors,
    };
  }

  try {
    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: session.user.id },
        phone: fullPhone,
      },
      select: { id: true },
    });

    if (duplicate) {
      return {
        status: 'error',
        message: 'This mobile number is already in use.',
        fieldErrors: { phone: 'This mobile number is already in use.' },
      };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName: lastName || null,
        name: [firstName, lastName].filter(Boolean).join(' '),
        phone: fullPhone,
        country: countryCode,
        passwordHash: hashPassword(passwordValue),
        role: 'OWNER',
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        status: 'error',
        message: 'This mobile number is already in use.',
        fieldErrors: { phone: 'This mobile number is already in use.' },
      };
    }

    console.error('Failed to complete business sign up:', error);
    return {
      status: 'error',
      message: 'Something went wrong. Please try again.',
    };
  }

  redirect('/');
}
