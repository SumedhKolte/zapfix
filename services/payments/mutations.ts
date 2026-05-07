import { createRazorpayOrder, confirmRazorpayPayment } from '@/lib/razorpay';

export const startPayment = async () => {
  return createRazorpayOrder();
};

export const finalizePayment = async () => {
  return confirmRazorpayPayment();
};
