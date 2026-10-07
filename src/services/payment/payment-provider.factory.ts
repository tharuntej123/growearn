// Factory for resolving the active and alternate PaymentProviders.

import { IPaymentProvider, PaymentProviderName } from './provider.interface';
import { CashfreePaymentProvider } from './cashfree.provider';
import { RazorpayPaymentProvider } from './razorpay.provider';

export class PaymentProviderFactory {
  private static providers: Map<PaymentProviderName, IPaymentProvider> = new Map();

  public static getProvider(name?: PaymentProviderName): IPaymentProvider {
    const targetName: PaymentProviderName = (
      name ||
      (process.env.PAYMENT_PROVIDER as PaymentProviderName) ||
      'CASHFREE'
    ).toUpperCase() as PaymentProviderName;

    if (!this.providers.has(targetName)) {
      if (targetName === 'RAZORPAY') {
        this.providers.set('RAZORPAY', new RazorpayPaymentProvider());
      } else {
        this.providers.set('CASHFREE', new CashfreePaymentProvider());
      }
    }

    return this.providers.get(targetName)!;
  }

  public static getCashfreeProvider(): CashfreePaymentProvider {
    return this.getProvider('CASHFREE') as CashfreePaymentProvider;
  }

  public static getRazorpayProvider(): RazorpayPaymentProvider {
    return this.getProvider('RAZORPAY') as RazorpayPaymentProvider;
  }
}
