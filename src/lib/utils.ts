import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ApiResponseSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  messageOrCode: string,
  codeOrMessage = 'BAD_REQUEST',
  status = 400,
  details?: unknown
) {
  let code = codeOrMessage;
  let message = messageOrCode;

  if (
    /^[A-Z_0-9]+$/.test(messageOrCode) &&
    codeOrMessage &&
    !/^[A-Z_0-9]+$/.test(codeOrMessage)
  ) {
    code = messageOrCode;
    message = codeOrMessage;
  } else if (/^[A-Z_0-9]+$/.test(codeOrMessage)) {
    code = codeOrMessage;
    message = messageOrCode;
  }

  // Sanitize internal server errors in production and attach diagnostic requestId
  const requestId = crypto.randomUUID();
  let sanitizedMessage = message;
  if (status >= 500 && process.env.NODE_ENV === 'production') {
    sanitizedMessage = 'An unexpected internal error occurred. Please try again later.';
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: sanitizedMessage,
        requestId,
        ...(details !== undefined && process.env.NODE_ENV !== 'production' ? { details } : {}),
      },
    },
    { status }
  );
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
