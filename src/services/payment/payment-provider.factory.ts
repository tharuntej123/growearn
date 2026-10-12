// Factory for resolving the official Cashfree PaymentProvider.

import { IPaymentProvider, PaymentProviderName } from './provider.interface';
import { CashfreePaymentProvider } from './cashfree.provider';

export class PaymentProviderFactory {
  private static instance: CashfreePaymentProvider | null = null;

  public static getProvider(name?: PaymentProviderName | string): IPaymentProvider {
    if (name && name !== 'CASHFREE') {
      throw new Error(`Unsupported payment provider: "${name}". Cashfree is the sole supported payment gateway.`);
    }
    return this.getCashfreeProvider();
  }

  public static getCashfreeProvider(): CashfreePaymentProvider {
    if (!this.instance) {
      this.instance = new CashfreePaymentProvider();
    }
    return this.instance;
  }
}
