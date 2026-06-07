import { NativeModules, Platform } from 'react-native';
import {
  CFDropCheckoutPayment,
  CFEnvironment,
  CFSession,
  CFThemeBuilder,
  CFPaymentComponentBuilder,
  CFPaymentModes,
} from 'cashfree-pg-api-contract';

import { Config } from '@/constants/config';
import { supabase } from '@/lib/supabase';

export type CreateOrderInput = {
  amountPaise: number;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  note?: string;
};

export type CreateOrderResult = {
  orderId: string;
  paymentSessionId: string;
  amount: number;
  env: 'sandbox' | 'production';
};

export type VerifyResult =
  | { verified: true; cfPaymentId: string; amount: number; completedAt?: string }
  | { verified: false; status: string };

const cfEnvironment = () =>
  Config.cashfreeEnv === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

type CashfreeGatewayService = {
  setCallback: (callbacks: {
    onVerify: (orderId: string) => void;
    onError: (error: { getMessage?: () => string } | string, orderId: string) => void;
  }) => void;
  doPayment: (payment: CFDropCheckoutPayment) => void;
  removeCallback: () => void;
};

let cachedCashfreeGatewayService: CashfreeGatewayService | null | undefined;

const getCashfreeGatewayService = (): CashfreeGatewayService | null => {
  if (cachedCashfreeGatewayService !== undefined) {
    return cachedCashfreeGatewayService;
  }

  const hasNativeModule =
    Boolean(NativeModules.CashfreePgApi) &&
    (Platform.OS !== 'ios' || Boolean(NativeModules.CashfreeEventEmitter));

  if (!hasNativeModule) {
    cachedCashfreeGatewayService = null;
    return null;
  }

  try {
    // The Cashfree SDK constructs a NativeEventEmitter at module load time,
    // so we only require it when the native module is actually available.
    const module = require('react-native-cashfree-pg-sdk') as {
      CFPaymentGatewayService?: CashfreeGatewayService;
    };
    cachedCashfreeGatewayService = module.CFPaymentGatewayService ?? null;
  } catch {
    cachedCashfreeGatewayService = null;
  }

  return cachedCashfreeGatewayService;
};

// Calls the create-order edge function, returns the session_id that
// CFPaymentGatewayService.doPayment needs.
export const createCashfreeOrder = async (input: CreateOrderInput): Promise<CreateOrderResult> => {
  const { data, error } = await supabase.functions.invoke('cashfree-create-order', {
    body: {
      amount_paise: input.amountPaise,
      customer_phone: input.customerPhone,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      note: input.note,
    },
  });

  if (error) throw new Error(error.message ?? 'Could not create payment order.');
  if (!data?.payment_session_id || !data?.order_id) {
    throw new Error('Cashfree did not return a payment session.');
  }

  return {
    orderId: String(data.order_id),
    paymentSessionId: String(data.payment_session_id),
    amount: Number(data.order_amount),
    env: data.env === 'production' ? 'production' : 'sandbox',
  };
};

// Server-side verification of a settled order. Always call this before
// trusting the SDK's onVerify callback — the callback fires when the user
// finishes the flow, not when money actually moves.
export const verifyCashfreeOrder = async (orderId: string): Promise<VerifyResult> => {
  const { data, error } = await supabase.functions.invoke('cashfree-verify-order', {
    body: { order_id: orderId },
  });
  if (error) throw new Error(error.message ?? 'Could not verify payment.');

  if (data?.verified) {
    return {
      verified: true,
      cfPaymentId: String(data.cf_payment_id ?? ''),
      amount: Number(data.payment_amount ?? 0),
      completedAt: data.payment_completion_time,
    };
  }
  return { verified: false, status: String(data?.status ?? 'UNKNOWN') };
};

// Launches the native Cashfree Drop checkout sheet. Resolves with the
// orderId when the user completes the flow; rejects if they cancel or hit
// an error.
//
// IMPORTANT: a resolved promise here only means the SDK signalled verify —
// you MUST still call verifyCashfreeOrder() to confirm settlement before
// fulfilling the order.
export const launchCashfreeCheckout = async (params: {
  paymentSessionId: string;
  orderId: string;
}): Promise<{ orderId: string }> => {
  return new Promise((resolve, reject) => {
    try {
      const cashfreeGatewayService = getCashfreeGatewayService();
      if (!cashfreeGatewayService) {
        reject(
          new Error(
            'Cashfree checkout is unavailable in this app build. Use a native dev client or a production build with the Cashfree native module installed.'
          )
        );
        return;
      }

      const session = new CFSession(
        params.paymentSessionId,
        params.orderId,
        cfEnvironment()
      );

      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#0F2057')
        .setNavigationBarTextColor('#FFFFFF')
        .setButtonBackgroundColor('#F5B800')
        .setButtonTextColor('#0F2057')
        .setPrimaryTextColor('#0A0F1E')
        .setSecondaryTextColor('#4A5578')
        .build();

      const paymentModes = new CFPaymentComponentBuilder()
        .add(CFPaymentModes.CARD)
        .add(CFPaymentModes.UPI)
        .add(CFPaymentModes.NB)
        .add(CFPaymentModes.WALLET)
        .add(CFPaymentModes.PAY_LATER)
        .build();

      const dropPayment = new CFDropCheckoutPayment(session, paymentModes, theme);

      cashfreeGatewayService.setCallback({
        onVerify: (orderId: string) => {
          resolve({ orderId });
        },
        onError: (error: { getMessage?: () => string } | string, orderId: string) => {
          const message =
            typeof error === 'string'
              ? error
              : typeof error?.getMessage === 'function'
                ? error.getMessage()
                : 'Payment failed.';
          reject(new Error(`${message} (order: ${orderId})`));
        },
      });

      cashfreeGatewayService.doPayment(dropPayment);
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Could not launch Cashfree checkout.'));
    }
  });
};

// Best-effort cleanup. Call from a screen unmount if a payment is in flight.
export const removeCashfreeCallbacks = () => {
  try {
    getCashfreeGatewayService()?.removeCallback();
  } catch {
    // SDK throws if no callback is registered — safe to ignore.
  }
};
