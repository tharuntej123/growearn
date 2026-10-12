'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('orderId');

  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'FAILED'>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus('FAILED');
      setErrorMessage('Missing order ID in callback URL');
      return;
    }

    verifyPayment(orderId);
  }, [orderId]);

  const verifyPayment = async (oid: string) => {
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: oid }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatus('SUCCESS');
      } else {
        setStatus('FAILED');
        setErrorMessage(json.error?.message || json.message || 'Payment could not be verified with Cashfree');
      }
    } catch (err: any) {
      setStatus('FAILED');
      setErrorMessage(err.message || 'Network error reconciling payment');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl text-center space-y-6">
        {status === 'LOADING' && (
          <div className="py-8 space-y-4">
            <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Reconciling with Cashfree...</h2>
              <p className="text-xs text-slate-500">Please wait while we verify your transaction status.</p>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="py-6 space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Payment Confirmed!</h2>
              <p className="text-sm text-slate-600">
                Your payment was successfully captured on Cashfree. Your course or mentorship access is now active!
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/learner/dashboard" className="w-full">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl">
                  Go to Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="py-6 space-y-5">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Payment Verification Notice</h2>
              <p className="text-sm text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {errorMessage}
              </p>
              <p className="text-xs text-slate-500">
                If your bank account was debited, your enrollment will be automatically activated via Cashfree webhook.
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              {orderId && (
                <Button
                  onClick={() => {
                    setStatus('LOADING');
                    verifyPayment(orderId);
                  }}
                  variant="outline"
                  className="w-full font-bold h-11 rounded-xl"
                >
                  Retry Verification
                </Button>
              )}
              <Link href="/courses" className="w-full">
                <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 rounded-xl">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl text-center">
            <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-900 mt-4">Loading verification...</h2>
          </Card>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
