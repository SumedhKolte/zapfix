import {
  createCashfreeOrder,
  launchCashfreeCheckout,
  verifyCashfreeOrder,
  type CreateOrderInput,
} from '@/lib/cashfree';

export type PaymentOutcome = {
  orderId: string;
  paymentId: string;
  amountPaise: number;
};

// One-shot helper: create order → launch checkout → verify settlement.
// Returns settled payment details on success, throws on cancel/failure.
export const collectPayment = async (input: CreateOrderInput): Promise<PaymentOutcome> => {
  const order = await createCashfreeOrder(input);
  await launchCashfreeCheckout({
    paymentSessionId: order.paymentSessionId,
    orderId: order.orderId,
    // Use the same env the server created the order in — prevents the
    // sandbox/production mismatch that surfaces as "token is not present".
    env: order.env,
  });
  const verified = await verifyCashfreeOrder(order.orderId, order.env);
  if (!verified.verified) {
    throw new Error(`Payment not settled (status: ${verified.status}).`);
  }
  return {
    orderId: order.orderId,
    paymentId: verified.cfPaymentId,
    amountPaise: Math.round(verified.amount * 100),
  };
};

export { createCashfreeOrder, launchCashfreeCheckout, verifyCashfreeOrder };
