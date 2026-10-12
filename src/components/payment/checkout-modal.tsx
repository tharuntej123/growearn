'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'COURSE' | 'MENTORSHIP';
  itemId: string; // courseId or mentorProfileId
  title: string;
  price: number; // in INR
  instructorOrMentorName?: string;
  metadata?: {
    topic?: string;
    scheduledAt?: string;
    message?: string;
    durationMinutes?: number;
  };
  onSuccess: (paymentResult: any) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  itemType,
  itemId,
  title,
  price,
  instructorOrMentorName,
  metadata,
  onSuccess,
}: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Dynamically load official Cashfree Web JS SDK v3
  const loadCashfreeSdk = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Cashfree) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order on the server
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload: any = {
        itemType,
        idempotencyKey,
      };

      if (itemType === 'COURSE') {
        payload.courseId = itemId;
      } else {
        payload.mentorProfileId = itemId;
        payload.topic = metadata?.topic || '1-on-1 Mentorship Session';
        payload.message = metadata?.message || '';
        payload.scheduledAt = metadata?.scheduledAt || new Date(Date.now() + 86400000).toISOString();
        payload.durationMinutes = metadata?.durationMinutes || 60;
      }

      const orderRes = await fetch('/api/payments/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        throw new Error(orderJson.error?.message || orderJson.message || 'Failed to create payment order');
      }

      const orderData = orderJson.data;
      const orderId = orderData.providerOrderId || orderData.orderId;
      setCreatedOrderId(orderId);

      const paymentSessionId = orderData.paymentSessionId || orderData.checkoutData?.paymentSessionId;
      if (!paymentSessionId) {
        throw new Error('Cashfree payment session ID not returned by server');
      }

      // 2. Load Cashfree SDK
      const sdkLoaded = await loadCashfreeSdk();
      if (!sdkLoaded || !(window as any).Cashfree) {
        throw new Error('Failed to load Cashfree Payment SDK. Please verify your internet connection.');
      }

      const isProduction = orderData.checkoutData?.environment === 'production';
      const cashfree = (window as any).Cashfree({
        mode: isProduction ? 'production' : 'sandbox',
      });

      // 3. Launch Cashfree hosted checkout modal
      try {
        await cashfree.checkout({
          paymentSessionId,
          redirectTarget: '_modal',
        });
      } catch (sdkError: any) {
        console.warn('Cashfree checkout modal interaction closed/dismissed:', sdkError);
      }

      // 4. Server-side payment reconciliation: Ask server to verify with Cashfree API
      await verifyOrderOnServer(orderId);
    } catch (err: any) {
      console.error('[CashfreeCheckout:Error]', err);
      setErrorMessage(err.message || 'Payment initiation failed. Please try again.');
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reconcile and verify payment with server
  const verifyOrderOnServer = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson.success) {
        throw new Error(verifyJson.error?.message || verifyJson.message || 'Payment verification failed');
      }

      setIsSuccess(true);
      toast.success('🎉 Payment confirmed! Your enrollment has been activated.');
      onSuccess(verifyJson.data);

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment was not confirmed by Cashfree. If you paid, it will be automatically reconciled.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cashfree Secure Checkout</h3>
              <p className="text-xs text-slate-500">256-bit Encrypted Transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
                <p className="text-xs text-slate-500">
                  You now have full access to <strong className="text-slate-700">&ldquo;{title}&rdquo;</strong>.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                      {itemType === 'COURSE' ? 'Course Enrollment' : 'Mentorship Booking'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{title}</h4>
                    {instructorOrMentorName && (
                      <p className="text-xs text-slate-500 mt-0.5">Instructor: {instructorOrMentorName}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-slate-900">₹{price}</span>
                    <p className="text-[10px] text-slate-400">INR (All taxes incl.)</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>Platform Fee & Gateway Charges</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Transaction Notice</p>
                    <p className="mt-0.5 text-rose-700">{errorMessage}</p>
                    {createdOrderId && (
                      <button
                        type="button"
                        onClick={() => verifyOrderOnServer(createdOrderId)}
                        className="mt-2 text-xs font-bold text-emerald-700 underline flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Re-check Payment Status
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Supported Payment Gateways */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700">Supported Payment Methods on Cashfree:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                    <span className="font-bold text-emerald-700">UPI</span>
                    <span className="text-[10px] text-slate-500">GPay, PhonePe, Paytm, BHIM</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
                    <span className="font-bold text-emerald-700">Cards</span>
                    <span className="text-[10px] text-slate-500">Debit / Credit, NetBanking</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleInitiatePayment}
                  disabled={isProcessing}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting to Cashfree...
                    </span>
                  ) : (
                    `Proceed to Pay ₹${price}`
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span>Powered by Cashfree Payments Gateway</span>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
